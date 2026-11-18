import json
import random
from django.conf import settings
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .battle_engine import (
    create_pokemon_instance,
    create_default_party,
    execute_turn,
    choose_ai_move,
)
from .pbs_loader import generate_random_teams
from .models import BattleRoom

# In-memory storage for active room turn actions to ensure instant synchronization
ACTIVE_ROOM_ACTIONS = {}

class BattleConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_code = self.scope['url_route']['kwargs']['room_code']
        self.room_group_name = f"battle_{self.room_code}"

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            payload = json.loads(text_data)
        except Exception:
            return

        action_type = payload.get("type")

        if action_type == "JOIN_ROOM":
            await self.handle_join_room(payload)
        elif action_type == "SUBMIT_ACTION":
            await self.handle_submit_action(payload)
        elif action_type == "SWITCH_FAINTED":
            await self.handle_switch_fainted(payload)
        elif action_type == "REMATCH":
            await self.handle_rematch(payload)

    async def handle_join_room(self, payload):
        player_name = payload.get("player_name", "Trainer")
        player_role = payload.get("player_role", "p1")  # 'p1' or 'p2'
        is_ai = payload.get("is_ai", False)
        custom_team = payload.get("team", None)

        room, created = await self.get_or_create_room(self.room_code, player_name, is_ai)

        if not room.state_data or payload.get("force_reset", False):
            # Both AI battles and 1v1 PvP Versus use random fully-evolved, non-legendary teams
            p1_species, p2_species = generate_random_teams(
                team_size=6,
                sprites_dir=settings.SPRITES_DIR,
            )

            initial_state = {
                "turn": 1,
                "is_game_over": False,
                "winner": None,
                "p1": {
                    "name": room.player1_name,
                    "active_index": 0,
                    "team": create_default_party(p1_species)
                },
                "p2": {
                    "name": room.player2_name or ("Bot Entrenador" if is_ai else "Entrenador 2"),
                    "active_index": 0,
                    "team": create_default_party(p2_species)
                }
            }
            await self.save_room_state(room, initial_state)
            state = initial_state
        else:
            state = room.state_data

        ACTIVE_ROOM_ACTIONS[self.room_code] = {"p1": None, "p2": None}

        # Broadcast battle state to everyone in room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "broadcast_event",
                "event": {
                    "type": "BATTLE_INIT",
                    "state": state,
                    "is_ai": room.is_ai_match,
                    "room_code": self.room_code
                }
            }
        )

    async def handle_submit_action(self, payload):
        player = payload.get("player", "p1")
        action = payload.get("action")  # {'type': 'MOVE', 'move_index': 0} or {'type': 'SWITCH', 'target_index': 1}

        if self.room_code not in ACTIVE_ROOM_ACTIONS:
            ACTIVE_ROOM_ACTIONS[self.room_code] = {"p1": None, "p2": None}

        ACTIVE_ROOM_ACTIONS[self.room_code][player] = action
        room = await self.get_room(self.room_code)
        if not room:
            return

        state = room.state_data

        # If playing against AI, generate smart AI action immediately
        if room.is_ai_match and player == "p1":
            ACTIVE_ROOM_ACTIONS[self.room_code]["p2"] = choose_ai_move(state)

        # Check if both players have submitted actions
        p1_act = ACTIVE_ROOM_ACTIONS[self.room_code].get("p1")
        p2_act = ACTIVE_ROOM_ACTIONS[self.room_code].get("p2")

        if p1_act and p2_act:
            # Execute turn
            result = execute_turn(state, p1_act, p2_act, is_ai_match=room.is_ai_match)
            new_state = result["state"]
            events = result["events"]

            # Reset stored actions
            ACTIVE_ROOM_ACTIONS[self.room_code] = {"p1": None, "p2": None}

            await self.save_room_state(room, new_state)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "broadcast_event",
                    "event": {
                        "type": "TURN_RESOLVED",
                        "events": events,
                        "state": new_state
                    }
                }
            )

    async def handle_switch_fainted(self, payload):
        player = payload.get("player", "p1")
        target_index = payload.get("target_index", 0)

        room = await self.get_room(self.room_code)
        if not room:
            return

        state = room.state_data
        target_team = state[player]["team"]

        if 0 <= target_index < len(target_team) and not target_team[target_index]["is_fainted"]:
            state[player]["active_index"] = target_index
            new_active = target_team[target_index]
            await self.save_room_state(room, state)

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
                        "message": f"{state[player]['name']} sent out {new_active['name']}!"
                    }
                }
            )

    async def handle_rematch(self, payload):
        room = await self.get_room(self.room_code)
        if not room:
            return

        # Generate fresh random fully-evolved, non-legendary teams for both players
        p1_species, p2_species = generate_random_teams(
            team_size=6,
            sprites_dir=settings.SPRITES_DIR,
        )
        state = {
            "turn": 1,
            "is_game_over": False,
            "winner": None,
            "p1": {
                "name": room.player1_name,
                "active_index": 0,
                "team": create_default_party(p1_species),
            },
            "p2": {
                "name": room.player2_name or ("Bot Entrenador" if room.is_ai_match else "Entrenador 2"),
                "active_index": 0,
                "team": create_default_party(p2_species),
            },
        }

        ACTIVE_ROOM_ACTIONS[self.room_code] = {"p1": None, "p2": None}
        await self.save_room_state(room, state)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "broadcast_event",
                "event": {
                    "type": "BATTLE_INIT",
                    "state": state,
                    "is_ai": room.is_ai_match,
                    "room_code": self.room_code
                }
            }
        )

    async def broadcast_event(self, event):
        await self.send(text_data=json.dumps(event["event"]))

    @sync_to_async
    def get_or_create_room(self, room_code, player_name, is_ai):
        room, created = BattleRoom.objects.get_or_create(
            room_code=room_code,
            defaults={
                "player1_name": player_name,
                "is_ai_match": is_ai,
                "status": "WAITING"
            }
        )
        if not created and not room.player2_name and not room.is_ai_match and room.player1_name != player_name:
            room.player2_name = player_name
            room.status = "ACTIVE"
            room.save()
        return room, created

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

