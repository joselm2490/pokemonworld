import json
import time
import traceback
import logging
from django.conf import settings
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .battle_engine import (
    create_default_party,
    execute_turn,
    choose_ai_move,
)
from .pbs_loader import generate_random_teams
from .models import BattleRoom

logger = logging.getLogger(__name__)

# In-memory storage for active room turn actions to ensure instant synchronization
ACTIVE_ROOM_ACTIONS = {}


class BattleConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_code = self.scope['url_route']['kwargs']['room_code']
        self.room_group_name = f"battle_{self.room_code}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name,
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name,
        )

    async def receive(self, text_data):
        action_type = "UNKNOWN"
        try:
            payload = json.loads(text_data)
            action_type = payload.get("type", "UNKNOWN")

            if action_type == "JOIN_ROOM":
                await self.handle_join_room(payload)
            elif action_type == "SUBMIT_ACTION":
                await self.handle_submit_action(payload)
            elif action_type == "SWITCH_FAINTED":
                await self.handle_switch_fainted(payload)
            elif action_type == "REMATCH":
                await self.handle_rematch(payload)
            elif action_type == "CHAT_MESSAGE":
                await self.handle_chat_message(payload)
            else:
                await self.send(text_data=json.dumps({
                    "type": "BATTLE_ERROR",
                    "action": action_type,
                    "error": f"Unknown action type: {action_type}",
                }))
        except Exception as exc:
            logger.exception("BattleConsumer error on action=%s room=%s", action_type, self.room_code)
            tb_lines = traceback.format_exc().splitlines()
            await self.send(text_data=json.dumps({
                "type": "BATTLE_ERROR",
                "action": action_type,
                "error": f"{type(exc).__name__}: {exc}",
                "trace": tb_lines[-6:],
            }))

    async def handle_join_room(self, payload):
        t0 = time.perf_counter()
        player_name = payload.get("player_name", "Entrenador")
        is_ai = bool(payload.get("is_ai", False))
        force_reset = bool(payload.get("force_reset", False))

        room, state = await self.init_room_and_state(
            self.room_code, player_name, is_ai, force_reset
        )

        ACTIVE_ROOM_ACTIONS[self.room_code] = {"p1": None, "p2": None}
        elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "broadcast_event",
                "event": {
                    "type": "BATTLE_INIT",
                    "state": state,
                    "is_ai": room.is_ai_match,
                    "room_code": self.room_code,
                    "server_ms": elapsed_ms,
                },
            },
        )

    async def handle_submit_action(self, payload):
        t0 = time.perf_counter()
        player = payload.get("player", "p1")
        action = payload.get("action")

        if self.room_code not in ACTIVE_ROOM_ACTIONS:
            ACTIVE_ROOM_ACTIONS[self.room_code] = {"p1": None, "p2": None}

        ACTIVE_ROOM_ACTIONS[self.room_code][player] = action
        room = await self.get_room(self.room_code)
        if not room or not room.state_data:
            await self.send(text_data=json.dumps({
                "type": "BATTLE_ERROR",
                "action": "SUBMIT_ACTION",
                "error": f"Room '{self.room_code}' not found or uninitialized.",
            }))
            return

        state = room.state_data

        # If playing against AI, generate smart AI move immediately
        if room.is_ai_match and player == "p1":
            p1_active = state["p1"]["team"][state["p1"]["active_index"]]
            p2_active = state["p2"]["team"][state["p2"]["active_index"]]
            ACTIVE_ROOM_ACTIONS[self.room_code]["p2"] = choose_ai_move(p2_active, p1_active)

        p1_act = ACTIVE_ROOM_ACTIONS[self.room_code].get("p1")
        p2_act = ACTIVE_ROOM_ACTIONS[self.room_code].get("p2")

        if p1_act and p2_act:
            result = execute_turn(state, p1_act, p2_act, is_ai_match=room.is_ai_match)
            new_state = result["state"]
            events = result["events"]

            ACTIVE_ROOM_ACTIONS[self.room_code] = {"p1": None, "p2": None}
            await self.save_room_state(room, new_state)
            elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "broadcast_event",
                    "event": {
                        "type": "TURN_RESOLVED",
                        "events": events,
                        "state": new_state,
                        "server_ms": elapsed_ms,
                    },
                },
            )
        else:
            # Acknowledge receipt in 1v1 PvP while waiting for opponent
            await self.send(text_data=json.dumps({
                "type": "ACTION_ACK",
                "player": player,
                "waiting_for": "p2" if player == "p1" else "p1",
            }))

    async def handle_switch_fainted(self, payload):
        t0 = time.perf_counter()
        player = payload.get("player", "p1")
        target_index = payload.get("target_index", 0)

        room = await self.get_room(self.room_code)
        if not room or not room.state_data:
            return

        state = room.state_data
        target_team = state[player]["team"]

        if 0 <= target_index < len(target_team) and not target_team[target_index]["is_fainted"]:
            state[player]["active_index"] = target_index
            new_active = target_team[target_index]
            await self.save_room_state(room, state)
            elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "broadcast_event",
                    "event": {
                        "type": "FAINT_SWITCH_RESOLVED",
                        "player": player,
                        "new_index": target_index,
                        "pokemon": new_active["name"],
                        "state": state,
                        "server_ms": elapsed_ms,
                        "message": f"¡{state[player]['name']} envió a {new_active['name']}!",
                    },
                },
            )

    async def handle_rematch(self, payload):
        t0 = time.perf_counter()
        room, state = await self.reset_room_rematch(self.room_code)
        if not room:
            return

        ACTIVE_ROOM_ACTIONS[self.room_code] = {"p1": None, "p2": None}
        elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "broadcast_event",
                "event": {
                    "type": "BATTLE_INIT",
                    "state": state,
                    "is_ai": room.is_ai_match,
                    "room_code": self.room_code,
                    "server_ms": elapsed_ms,
                },
            },
        )

    async def handle_chat_message(self, payload):
        sender = str(payload.get("sender", "Entrenador")).strip() or "Entrenador"
        message = str(payload.get("message", "")).strip()
        player_role = payload.get("player_role", "p1")
        if not message:
            return

        now_str = time.strftime("%I:%M %p").lower()
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "broadcast_event",
                "event": {
                    "type": "CHAT_MESSAGE",
                    "sender": sender,
                    "message": message,
                    "player_role": player_role,
                    "timestamp": now_str,
                },
            },
        )

    async def broadcast_event(self, event):
        await self.send(text_data=json.dumps(event["event"]))

    @sync_to_async
    def init_room_and_state(self, room_code, player_name, is_ai, force_reset=False):
        is_ai_match = is_ai or room_code.startswith("AI-")
        room, created = BattleRoom.objects.get_or_create(
            room_code=room_code,
            defaults={
                "player1_name": player_name,
                "is_ai_match": is_ai_match,
                "pokemon_per_player": 6,
                "status": "ACTIVE" if is_ai_match else "WAITING",
            },
        )
        if is_ai_match and (not room.is_ai_match or room.pokemon_per_player != 6):
            room.is_ai_match = True
            room.pokemon_per_player = 6
            room.status = "ACTIVE"
            room.save()

        if not created and not room.player2_name and not room.is_ai_match and room.player1_name != player_name:
            room.player2_name = player_name
            room.status = "ACTIVE"
            room.save()

        if not room.state_data or force_reset:
            if is_ai_match or room.is_ai_match:
                team_size = 6
                room.pokemon_per_player = 6
            else:
                team_size = max(1, min(6, getattr(room, "pokemon_per_player", 6) or 6))
            p1_species, p2_species = generate_random_teams(
                team_size=team_size,
                sprites_dir=settings.SPRITES_DIR,
            )
            # Build both parties in one batched DB call
            combined = create_default_party(p1_species + p2_species)
            p1_team = combined[:len(p1_species)]
            p2_team = combined[len(p1_species):]

            state = {
                "turn": 1,
                "is_game_over": False,
                "winner": None,
                "p1": {
                    "name": room.player1_name,
                    "active_index": 0,
                    "team": p1_team,
                },
                "p2": {
                    "name": room.player2_name or ("Bot Entrenador" if room.is_ai_match else "Entrenador 2"),
                    "active_index": 0,
                    "team": p2_team,
                },
            }
            room.state_data = state
            room.save()
        else:
            state = room.state_data

        return room, state

    @sync_to_async
    def reset_room_rematch(self, room_code):
        room = BattleRoom.objects.filter(room_code=room_code).first()
        if not room:
            return None, None

        if room.is_ai_match or room_code.startswith("AI-"):
            team_size = 6
            room.pokemon_per_player = 6
        else:
            team_size = max(1, min(6, getattr(room, "pokemon_per_player", 6) or 6))
        p1_species, p2_species = generate_random_teams(
            team_size=team_size,
            sprites_dir=settings.SPRITES_DIR,
        )
        combined = create_default_party(p1_species + p2_species)
        state = {
            "turn": 1,
            "is_game_over": False,
            "winner": None,
            "p1": {
                "name": room.player1_name,
                "active_index": 0,
                "team": combined[:len(p1_species)],
            },
            "p2": {
                "name": room.player2_name or ("Bot Entrenador" if room.is_ai_match else "Entrenador 2"),
                "active_index": 0,
                "team": combined[len(p1_species):],
            },
        }
        room.state_data = state
        room.status = "ACTIVE"
        room.winner = None
        room.save()
        return room, state

    @sync_to_async
    def get_room(self, room_code):
        return BattleRoom.objects.filter(room_code=room_code).first()

    @sync_to_async
    def save_room_state(self, room, state):
        room.state_data = state
        if state.get("is_game_over"):
            room.status = "FINISHED"
            room.winner = state.get("winner")
        room.save()
