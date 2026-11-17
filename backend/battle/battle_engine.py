import math
import random
from .data_roster import POKEMON_ROSTER
from .type_chart import get_type_effectiveness

def calculate_stat(base: int, level: int = 50, is_hp: bool = False, iv: int = 31, ev: int = 85) -> int:
    """Calculates official Pokémon stat value given base, level, IV, and EV."""
    if is_hp:
        return math.floor(((2 * base + iv + math.floor(ev / 4)) * level) / 100) + level + 10
    return math.floor(((2 * base + iv + math.floor(ev / 4)) * level) / 100) + 5

def create_pokemon_instance(species: str, level: int = 50) -> dict:
    species_key = species.upper()
    data = POKEMON_ROSTER.get(species_key, POKEMON_ROSTER["CHARIZARD"])
    base = data["base_stats"]
    
    max_hp = calculate_stat(base["hp"], level, is_hp=True)
    attack = calculate_stat(base["attack"], level)
    defense = calculate_stat(base["defense"], level)
    sp_attack = calculate_stat(base["sp_attack"], level)
    sp_defense = calculate_stat(base["sp_defense"], level)
    speed = calculate_stat(base["speed"], level)
    
    # Deep copy moves
    moves = [dict(m) for m in data["moves"]]
    for m in moves:
        m["current_pp"] = m["pp"]

    return {
        "species": data["species"],
        "name": data["name"],
        "types": data["types"],
        "level": level,
        "max_hp": max_hp,
        "current_hp": max_hp,
        "stats": {
            "hp": max_hp,
            "attack": attack,
            "defense": defense,
            "sp_attack": sp_attack,
            "sp_defense": sp_defense,
            "speed": speed
        },
        "moves": moves,
        "status": None,  # 'BRN', 'PAR', 'SLP', 'PSN', 'FRZ'
        "is_fainted": False
    }

def calculate_damage(attacker: dict, defender: dict, move: dict) -> dict:
    # Accuracy check
    acc = move.get("accuracy", 100)
    if random.randint(1, 100) > acc:
        return {"damage": 0, "is_miss": True, "effectiveness": 1.0, "is_crit": False}

    category = move.get("category", "SPECIAL")
    if category == "PHYSICAL":
        a_stat = attacker["stats"]["attack"]
        d_stat = defender["stats"]["defense"]
        if attacker.get("status") == "BRN":
            a_stat = math.floor(a_stat * 0.5)
    else:
        a_stat = attacker["stats"]["sp_attack"]
        d_stat = defender["stats"]["sp_defense"]

    level = attacker.get("level", 50)
    power = move.get("power", 80)
    
    # Base damage
    base_dmg = ((((2 * level / 5) + 2) * power * (a_stat / max(1, d_stat))) / 50) + 2
    
    # STAB (Same Type Attack Bonus)
    stab = 1.5 if move.get("type") in attacker.get("types", []) else 1.0
    
    # Type effectiveness
    effectiveness = get_type_effectiveness(move.get("type", "NORMAL"), defender.get("types", []))
    
    # Critical hit (6.25% chance)
    is_crit = random.random() < 0.0625
    crit_mult = 1.5 if is_crit else 1.0
    
    # Random variance (0.85 to 1.0)
    rand_variance = random.uniform(0.85, 1.0)
    
    total_damage = math.floor(base_dmg * stab * effectiveness * crit_mult * rand_variance)
    
    if effectiveness == 0:
        total_damage = 0

    return {
        "damage": total_damage,
        "is_miss": False,
        "effectiveness": effectiveness,
        "is_crit": is_crit
    }

def create_default_party(species_list: list[str]) -> list[dict]:
    return [create_pokemon_instance(sp) for sp in species_list]

def execute_turn(state: dict, p1_action: dict, p2_action: dict) -> dict:
    """
    Executes a complete turn between Player 1 and Player 2.
    Action format:
      {'type': 'MOVE', 'move_index': 0}
      {'type': 'SWITCH', 'target_index': 1}
    """
    events = []
    
    p1 = state["p1"]
    p2 = state["p2"]
    
    p1_active = p1["team"][p1["active_index"]]
    p2_active = p2["team"][p2["active_index"]]
    
    # Step 1: Process switches first
    if p1_action.get("type") == "SWITCH":
        new_idx = p1_action.get("target_index", 0)
        p1["active_index"] = new_idx
        p1_active = p1["team"][new_idx]
        events.append({
            "type": "SWITCH",
            "player": "p1",
            "pokemon": p1_active["name"],
            "species": p1_active["species"],
            "message": f"Player 1 withdrew their Pokémon and sent out {p1_active['name']}!"
        })

    if p2_action.get("type") == "SWITCH":
        new_idx = p2_action.get("target_index", 0)
        p2["active_index"] = new_idx
        p2_active = p2["team"][new_idx]
        events.append({
            "type": "SWITCH",
            "player": "p2",
            "pokemon": p2_active["name"],
            "species": p2_active["species"],
            "message": f"Player 2 withdrew their Pokémon and sent out {p2_active['name']}!"
        })

    # Step 2: Determine turn order for MOVE actions
    order = []
    if p1_action.get("type") == "MOVE" and not p1_active["is_fainted"]:
        m1 = p1_active["moves"][p1_action.get("move_index", 0)]
        order.append(("p1", m1, p1_active, p2_active, "p2"))
        
    if p2_action.get("type") == "MOVE" and not p2_active["is_fainted"]:
        m2 = p2_active["moves"][p2_action.get("move_index", 0)]
        order.append(("p2", m2, p2_active, p1_active, "p1"))

    # Sort order by priority, then speed
    if len(order) == 2:
        p1_priority = order[0][1].get("priority", 0)
        p2_priority = order[1][1].get("priority", 0)
        p1_speed = order[0][2]["stats"]["speed"]
        p2_speed = order[1][2]["stats"]["speed"]
        
        # Paralysis speed cut
        if order[0][2].get("status") == "PAR":
            p1_speed = math.floor(p1_speed * 0.5)
        if order[1][2].get("status") == "PAR":
            p2_speed = math.floor(p2_speed * 0.5)

        if p2_priority > p1_priority or (p2_priority == p1_priority and (p2_speed > p1_speed or (p2_speed == p1_speed and random.random() > 0.5))):
            order.reverse()

    # Step 3: Execute attacks in order
    for actor_side, move, attacker, defender, target_side in order:
        if attacker["is_fainted"]:
            continue

        events.append({
            "type": "ATTACK",
            "actor": actor_side,
            "target": target_side,
            "move": move["name"],
            "move_type": move["type"],
            "message": f"{attacker['name']} used {move['name']}!"
        })

        dmg_res = calculate_damage(attacker, defender, move)
        if dmg_res["is_miss"]:
            events.append({
                "type": "MISS",
                "actor": actor_side,
                "message": f"{attacker['name']}'s attack missed!"
            })
            continue

        damage = dmg_res["damage"]
        defender["current_hp"] = max(0, defender["current_hp"] - damage)
        
        events.append({
            "type": "DAMAGE",
            "target": target_side,
            "damage": damage,
            "remaining_hp": defender["current_hp"],
            "max_hp": defender["max_hp"],
            "effectiveness": dmg_res["effectiveness"],
            "is_crit": dmg_res["is_crit"],
            "message": _build_damage_message(dmg_res)
        })

        if defender["current_hp"] == 0:
            defender["is_fainted"] = True
            events.append({
                "type": "FAINT",
                "target": target_side,
                "pokemon": defender["name"],
                "message": f"{defender['name']} fainted!"
            })
            break  # Defending Pokémon cannot attack this turn if fainted

    # Check for match end condition
    p1_defeated = all(pk["is_fainted"] for pk in p1["team"])
    p2_defeated = all(pk["is_fainted"] for pk in p2["team"])

    if p1_defeated or p2_defeated:
        state["is_game_over"] = True
        state["winner"] = "p2" if p1_defeated else "p1"
        events.append({
            "type": "GAME_OVER",
            "winner": state["winner"],
            "message": f"Match ended! {'Player 2' if p1_defeated else 'Player 1'} wins the battle!"
        })

    state["turn"] += 1
    return {"events": events, "state": state}

def _build_damage_message(res: dict) -> str:
    parts = []
    if res.get("is_crit"):
        parts.append("A critical hit!")
    eff = res.get("effectiveness", 1.0)
    if eff > 1.0:
        parts.append("It's super effective!")
    elif eff == 0.0:
        parts.append("It doesn't affect the opposing Pokémon...")
    elif eff < 1.0:
        parts.append("It's not very effective...")
    return " ".join(parts)

