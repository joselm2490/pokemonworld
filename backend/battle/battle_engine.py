import math
import random
from .data_roster import POKEMON_ROSTER
from .pbs_loader import get_all_pokemon, get_all_moves, build_moveset_for_species
from .type_chart import get_type_effectiveness


def calculate_stat(base: int, level: int = 50, is_hp: bool = False, iv: int = 31, ev: int = 85) -> int:
    """Calculates official Pokémon stat value given base, level, IV, and EV."""
    if is_hp:
        return math.floor(((2 * base + iv + math.floor(ev / 4)) * level) / 100) + level + 10
    return math.floor(((2 * base + iv + math.floor(ev / 4)) * level) / 100) + 5


def stage_multiplier(stage: int) -> float:
    stage = max(-6, min(6, stage))
    if stage >= 0:
        return (2 + stage) / 2.0
    return 2.0 / (2 - stage)


def _enrich_move_from_pbs(move_dict: dict) -> dict:
    all_moves = get_all_moves()
    move_id = move_dict.get("id") or move_dict.get("name", "").upper().replace(" ", "").replace("-", "")
    pbs_move = all_moves.get(move_id)
    merged = dict(move_dict)
    if pbs_move:
        merged.setdefault("id", pbs_move["id"])
        merged.setdefault("function_code", pbs_move["function_code"])
        merged.setdefault("effect_chance", pbs_move["effect_chance"])
        merged.setdefault("flags", pbs_move["flags"])
        merged.setdefault("description", pbs_move["description"])
        merged.setdefault("priority", pbs_move["priority"])
    else:
        merged.setdefault("id", move_id)
        merged.setdefault("function_code", "None")
        merged.setdefault("effect_chance", 0)
        merged.setdefault("flags", [])
        merged.setdefault("description", "")
        merged.setdefault("priority", 0)
    merged["current_pp"] = merged.get("pp", 15)
    return merged


def create_pokemon_instance(species: str, level: int = 50) -> dict:
    species_key = species.upper().strip()
    pbs_pokemon = get_all_pokemon()
    pbs_data = pbs_pokemon.get(species_key)
    featured_data = POKEMON_ROSTER.get(species_key)

    if featured_data:
        name = featured_data["name"]
        types = list(featured_data["types"])
        base = dict(featured_data["base_stats"])
        moves = [_enrich_move_from_pbs(m) for m in featured_data["moves"]]
        ability = pbs_data["abilities"][0] if pbs_data and pbs_data.get("abilities") else "PRESSURE"
        gender_ratio = pbs_data.get("gender_ratio", "Female50Percent") if pbs_data else "Female50Percent"
    elif pbs_data:
        name = pbs_data["name"]
        types = list(pbs_data["types"])
        base = dict(pbs_data["base_stats"])
        moves = build_moveset_for_species(pbs_data)
        ability = pbs_data["abilities"][0] if pbs_data.get("abilities") else "PRESSURE"
        gender_ratio = pbs_data.get("gender_ratio", "Female50Percent")
    else:
        # Fallback to Charizard
        return create_pokemon_instance("CHARIZARD", level)

    max_hp = calculate_stat(base["hp"], level, is_hp=True)
    attack = calculate_stat(base["attack"], level)
    defense = calculate_stat(base["defense"], level)
    sp_attack = calculate_stat(base["sp_attack"], level)
    sp_defense = calculate_stat(base["sp_defense"], level)
    speed = calculate_stat(base["speed"], level)

    if gender_ratio == "Genderless":
        gender = None
    elif gender_ratio == "AlwaysFemale":
        gender = "F"
    elif gender_ratio == "AlwaysMale":
        gender = "M"
    else:
        gender = random.choice(["M", "F"])

    return {
        "species": species_key,
        "name": name,
        "types": types,
        "level": level,
        "gender": gender,
        "ability": ability,
        "max_hp": max_hp,
        "current_hp": max_hp,
        "stats": {
            "hp": max_hp,
            "attack": attack,
            "defense": defense,
            "sp_attack": sp_attack,
            "sp_defense": sp_defense,
            "speed": speed,
        },
        "stages": {
            "attack": 0,
            "defense": 0,
            "sp_attack": 0,
            "sp_defense": 0,
            "speed": 0,
        },
        "moves": moves,
        "status": None,  # 'BRN', 'PAR', 'SLP', 'PSN', 'FRZ'
        "sleep_turns": 0,
        "is_fainted": False,
    }


def create_default_party(species_list: list[str], level: int = 50) -> list[dict]:
    return [create_pokemon_instance(sp, level=level) for sp in species_list]


def _can_apply_status(target: dict, status_code: str) -> bool:
    if target.get("status") or target.get("is_fainted"):
        return False
    types = set(target.get("types", []))
    if status_code == "BRN" and "FIRE" in types:
        return False
    if status_code == "PAR" and "ELECTRIC" in types:
        return False
    if status_code == "PSN" and ("POISON" in types or "STEEL" in types):
        return False
    if status_code == "FRZ" and "ICE" in types:
        return False
    return True


def _apply_stat_change(target: dict, stat: str, delta: int, target_side: str, events: list):
    stages = target.setdefault("stages", {"attack": 0, "defense": 0, "sp_attack": 0, "sp_defense": 0, "speed": 0})
    old_val = stages.get(stat, 0)
    new_val = max(-6, min(6, old_val + delta))
    if new_val == old_val:
        events.append({
            "type": "INFO",
            "message": f"{target['name']}'s {stat.replace('_', ' ').title()} won't go any {'higher' if delta > 0 else 'lower'}!"
        })
        return
    stages[stat] = new_val
    label = stat.replace("_", " ").replace("sp ", "Sp. ").title()
    if delta >= 2:
        verb = "rose sharply"
    elif delta == 1:
        verb = "rose"
    elif delta <= -2:
        verb = "fell harshly"
    else:
        verb = "fell"
    events.append({
        "type": "STAT_CHANGE",
        "target": target_side,
        "stat": stat,
        "delta": delta,
        "animation": "burst" if delta > 0 else "normal",
        "message": f"{target['name']}'s {label} {verb}!"
    })


def calculate_damage(attacker: dict, defender: dict, move: dict) -> dict:
    acc = move.get("accuracy", 100)
    # Accuracy 0 in Essentials PBS means never-miss move (e.g. Aura Sphere, Aerial Ace, Swift)
    if acc > 0 and random.randint(1, 100) > acc:
        return {"damage": 0, "is_miss": True, "effectiveness": 1.0, "is_crit": False}

    atk_stages = attacker.get("stages", {})
    def_stages = defender.get("stages", {})

    flags = move.get("flags", [])
    crit_chance = 0.125 if "HighCriticalHitRate" in flags else 0.0625
    is_crit = random.random() < crit_chance

    category = move.get("category", "SPECIAL")
    if category == "PHYSICAL":
        a_stage = max(0, atk_stages.get("attack", 0)) if is_crit else atk_stages.get("attack", 0)
        d_stage = min(0, def_stages.get("defense", 0)) if is_crit else def_stages.get("defense", 0)
        a_stat = math.floor(attacker["stats"]["attack"] * stage_multiplier(a_stage))
        d_stat = math.floor(defender["stats"]["defense"] * stage_multiplier(d_stage))
        if attacker.get("status") == "BRN":
            a_stat = math.floor(a_stat * 0.5)
    else:
        a_stage = max(0, atk_stages.get("sp_attack", 0)) if is_crit else atk_stages.get("sp_attack", 0)
        d_stage = min(0, def_stages.get("sp_defense", 0)) if is_crit else def_stages.get("sp_defense", 0)
        a_stat = math.floor(attacker["stats"]["sp_attack"] * stage_multiplier(a_stage))
        d_stat = math.floor(defender["stats"]["sp_defense"] * stage_multiplier(d_stage))

    level = attacker.get("level", 50)
    power = move.get("power", 80)

    base_dmg = ((((2 * level / 5) + 2) * power * (a_stat / max(1, d_stat))) / 50) + 2
    stab = 1.5 if move.get("type") in attacker.get("types", []) else 1.0
    effectiveness = get_type_effectiveness(move.get("type", "NORMAL"), defender.get("types", []))
    crit_mult = 1.5 if is_crit else 1.0
    rand_variance = random.uniform(0.85, 1.0)

    total_damage = math.floor(base_dmg * stab * effectiveness * crit_mult * rand_variance)
    if effectiveness == 0:
        total_damage = 0
    elif total_damage < 1:
        total_damage = 1

    return {
        "damage": total_damage,
        "is_miss": False,
        "effectiveness": effectiveness,
        "is_crit": is_crit,
    }


def _apply_status_or_secondary(attacker: dict, defender: dict, move: dict, actor_side: str, target_side: str, damage_dealt: int, events: list):
    fc = move.get("function_code", "None")
    chance = move.get("effect_chance", 0)
    is_status_move = move.get("category") == "STATUS"
    triggers = is_status_move or (chance == 0 and any(k in fc for k in ("LowerUser", "RaiseUser", "Recoil", "HealUser"))) or (chance > 0 and random.randint(1, 100) <= chance)

    if not triggers:
        return

    # Status inflictions
    status_map = [
        ("BurnTarget", "BRN", "was burned!"),
        ("ParalyzeTarget", "PAR", "is paralyzed! It may be unable to move!"),
        ("SleepTarget", "SLP", "fell asleep!"),
        ("FreezeTarget", "FRZ", "was frozen solid!"),
        ("BadPoisonTarget", "PSN", "was badly poisoned!"),
        ("PoisonTarget", "PSN", "was poisoned!"),
    ]
    for key, code, msg in status_map:
        if key in fc:
            if _can_apply_status(defender, code):
                defender["status"] = code
                if code == "SLP":
                    defender["sleep_turns"] = random.randint(1, 3)
                events.append({
                    "type": "STATUS",
                    "target": target_side,
                    "status": code,
                    "animation": "poison" if code == "PSN" else ("fire" if code == "BRN" else "burst"),
                    "message": f"{defender['name']} {msg}",
                })
            elif is_status_move:
                events.append({"type": "INFO", "message": "But it failed!"})
            return

    # Healing moves (50% max HP)
    if "HealUserHalfOfTotalHP" in fc or "HealUserDependingOnWeather" in fc:
        heal_amt = max(1, attacker["max_hp"] // 2)
        attacker["current_hp"] = min(attacker["max_hp"], attacker["current_hp"] + heal_amt)
        events.append({
            "type": "HEAL",
            "target": actor_side,
            "remaining_hp": attacker["current_hp"],
            "max_hp": attacker["max_hp"],
            "animation": "heal",
            "message": f"{attacker['name']} regained health!",
        })
        return

    # Drain moves (50% of damage dealt)
    if "HealUserByHalfOfDamageDone" in fc and damage_dealt > 0 and not attacker["is_fainted"]:
        heal_amt = max(1, damage_dealt // 2)
        attacker["current_hp"] = min(attacker["max_hp"], attacker["current_hp"] + heal_amt)
        events.append({
            "type": "HEAL",
            "target": actor_side,
            "remaining_hp": attacker["current_hp"],
            "max_hp": attacker["max_hp"],
            "animation": "heal",
            "message": f"{defender['name']} had its energy drained!",
        })

    # Recoil moves
    if "RecoilThirdOfDamageDealt" in fc and damage_dealt > 0:
        recoil = max(1, damage_dealt // 3)
        attacker["current_hp"] = max(0, attacker["current_hp"] - recoil)
        events.append({
            "type": "DAMAGE",
            "target": actor_side,
            "damage": recoil,
            "remaining_hp": attacker["current_hp"],
            "max_hp": attacker["max_hp"],
            "effectiveness": 1.0,
            "is_crit": False,
            "message": f"{attacker['name']} was damaged by the recoil!",
        })
        if attacker["current_hp"] == 0:
            attacker["is_fainted"] = True
            events.append({"type": "FAINT", "target": actor_side, "pokemon": attacker["name"], "message": f"{attacker['name']} fainted!"})

    # Stat boosts / drops
    if "RaiseUserAttack2" in fc:
        _apply_stat_change(attacker, "attack", 2, actor_side, events)
    elif "RaiseUserAttack1Speed1" in fc:
        _apply_stat_change(attacker, "attack", 1, actor_side, events)
        _apply_stat_change(attacker, "speed", 1, actor_side, events)
    elif "RaiseUserSpAtk2" in fc:
        _apply_stat_change(attacker, "sp_attack", 2, actor_side, events)
    elif "RaiseUserSpAtk1SpDef1" in fc:
        _apply_stat_change(attacker, "sp_attack", 1, actor_side, events)
        _apply_stat_change(attacker, "sp_defense", 1, actor_side, events)
    elif "RaiseUserAttack1Defense1" in fc:
        _apply_stat_change(attacker, "attack", 1, actor_side, events)
        _apply_stat_change(attacker, "defense", 1, actor_side, events)
    elif "RaiseUserSpeed2" in fc:
        _apply_stat_change(attacker, "speed", 2, actor_side, events)
    elif "RaiseUserDefense2" in fc:
        _apply_stat_change(attacker, "defense", 2, actor_side, events)
    elif "RaiseUserAttack1" in fc:
        _apply_stat_change(attacker, "attack", 1, actor_side, events)
    elif "LowerUserDefSpDef1" in fc:
        _apply_stat_change(attacker, "defense", -1, actor_side, events)
        _apply_stat_change(attacker, "sp_defense", -1, actor_side, events)
    elif "LowerUserSpAtk2" in fc:
        _apply_stat_change(attacker, "sp_attack", -2, actor_side, events)
    elif "LowerTargetDefense1" in fc and not defender["is_fainted"]:
        _apply_stat_change(defender, "defense", -1, target_side, events)
    elif "LowerTargetSpDef1" in fc and not defender["is_fainted"]:
        _apply_stat_change(defender, "sp_defense", -1, target_side, events)
    elif "LowerTargetAttack1" in fc and not defender["is_fainted"]:
        _apply_stat_change(defender, "attack", -1, target_side, events)
    elif "LowerTargetSpeed1" in fc and not defender["is_fainted"]:
        _apply_stat_change(defender, "speed", -1, target_side, events)


def _reset_stages(pokemon: dict):
    pokemon["stages"] = {"attack": 0, "defense": 0, "sp_attack": 0, "sp_defense": 0, "speed": 0}


def execute_turn(state: dict, p1_action: dict, p2_action: dict, is_ai_match: bool = False) -> dict:
    """
    Executes a complete GBA/Essentials turn between Player 1 and Player 2.
    Action format:
      {'type': 'MOVE', 'move_index': 0}
      {'type': 'SWITCH', 'target_index': 1}
    """
    events = []
    p1 = state["p1"]
    p2 = state["p2"]

    p1_active = p1["team"][p1["active_index"]]
    p2_active = p2["team"][p2["active_index"]]

    # Step 1: Process voluntary switches first
    if p1_action.get("type") == "SWITCH":
        new_idx = p1_action.get("target_index", 0)
        if 0 <= new_idx < len(p1["team"]) and not p1["team"][new_idx]["is_fainted"]:
            _reset_stages(p1_active)
            old_name = p1_active["name"]
            p1["active_index"] = new_idx
            p1_active = p1["team"][new_idx]
            events.append({
                "type": "SWITCH",
                "player": "p1",
                "pokemon": p1_active["name"],
                "species": p1_active["species"],
                "new_index": new_idx,
                "message": f"{old_name}, come back! Go! {p1_active['name']}!",
            })

    if p2_action.get("type") == "SWITCH":
        new_idx = p2_action.get("target_index", 0)
        if 0 <= new_idx < len(p2["team"]) and not p2["team"][new_idx]["is_fainted"]:
            _reset_stages(p2_active)
            p2["active_index"] = new_idx
            p2_active = p2["team"][new_idx]
            events.append({
                "type": "SWITCH",
                "player": "p2",
                "pokemon": p2_active["name"],
                "species": p2_active["species"],
                "new_index": new_idx,
                "message": f"{p2['name']} sent out {p2_active['name']}!",
            })

    # Step 2: Determine turn order for MOVE actions
    order = []
    if p1_action.get("type") == "MOVE" and not p1_active["is_fainted"]:
        idx1 = min(p1_action.get("move_index", 0), len(p1_active["moves"]) - 1)
        order.append(("p1", p1_active["moves"][idx1], p1_active, p2_active, "p2"))

    if p2_action.get("type") == "MOVE" and not p2_active["is_fainted"]:
        idx2 = min(p2_action.get("move_index", 0), len(p2_active["moves"]) - 1)
        order.append(("p2", p2_active["moves"][idx2], p2_active, p1_active, "p1"))

    if len(order) == 2:
        def eff_speed(pkmn: dict) -> int:
            sp = math.floor(pkmn["stats"]["speed"] * stage_multiplier(pkmn.get("stages", {}).get("speed", 0)))
            if pkmn.get("status") == "PAR":
                sp = math.floor(sp * 0.5)
            return sp

        p1_prio = order[0][1].get("priority", 0)
        p2_prio = order[1][1].get("priority", 0)
        p1_spd = eff_speed(order[0][2])
        p2_spd = eff_speed(order[1][2])

        if p2_prio > p1_prio or (p2_prio == p1_prio and (p2_spd > p1_spd or (p2_spd == p1_spd and random.random() > 0.5))):
            order.reverse()

    # Step 3: Execute attacks in order
    for actor_side, move, attacker, defender, target_side in order:
        if attacker["is_fainted"] or defender["is_fainted"]:
            continue

        # Pre-move status checks
        if attacker.get("status") == "SLP":
            if attacker.get("sleep_turns", 0) > 0:
                attacker["sleep_turns"] -= 1
                events.append({"type": "INFO", "message": f"{attacker['name']} is fast asleep!"})
                continue
            else:
                attacker["status"] = None
                events.append({"type": "INFO", "message": f"{attacker['name']} woke up!"})

        if attacker.get("status") == "FRZ":
            if move.get("type") == "FIRE" or random.random() < 0.20:
                attacker["status"] = None
                events.append({"type": "INFO", "message": f"{attacker['name']} thawed out!"})
            else:
                events.append({"type": "INFO", "message": f"{attacker['name']} is frozen solid!"})
                continue

        if attacker.get("status") == "PAR" and random.random() < 0.25:
            events.append({"type": "INFO", "message": f"{attacker['name']} is paralyzed! It can't move!"})
            continue

        # Deduct PP
        if move.get("current_pp", 1) > 0:
            move["current_pp"] -= 1

        events.append({
            "type": "ATTACK",
            "actor": actor_side,
            "target": target_side,
            "move": move["name"],
            "move_type": move["type"],
            "category": move.get("category", "SPECIAL"),
            "message": f"{attacker['name']} used {move['name']}!",
        })

        # Status moves
        if move.get("category") == "STATUS" or move.get("power", 0) == 0:
            acc = move.get("accuracy", 100)
            if acc > 0 and random.randint(1, 100) > acc:
                events.append({"type": "MISS", "actor": actor_side, "message": f"{attacker['name']}'s attack missed!"})
                continue
            _apply_status_or_secondary(attacker, defender, move, actor_side, target_side, 0, events)
            continue

        # Damaging moves
        dmg_res = calculate_damage(attacker, defender, move)
        if dmg_res["is_miss"]:
            events.append({
                "type": "MISS",
                "actor": actor_side,
                "message": f"{attacker['name']}'s attack missed!",
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
            "message": _build_damage_message(dmg_res),
        })

        # Fire move thaws frozen target
        if defender.get("status") == "FRZ" and move.get("type") == "FIRE" and damage > 0:
            defender["status"] = None
            events.append({"type": "INFO", "message": f"{defender['name']} thawed out!"})

        if defender["current_hp"] == 0:
            defender["is_fainted"] = True
            events.append({
                "type": "FAINT",
                "target": target_side,
                "pokemon": defender["name"],
                "message": f"{defender['name']} fainted!",
            })
            # Still process recoil if attacker killed defender with recoil move
            if "RecoilThirdOfDamageDealt" in move.get("function_code", ""):
                _apply_status_or_secondary(attacker, defender, move, actor_side, target_side, damage, events)
            break
        else:
            _apply_status_or_secondary(attacker, defender, move, actor_side, target_side, damage, events)

    # Step 4: End-of-turn status damage (Burn / Poison)
    for side_key in ("p1", "p2"):
        side_obj = state[side_key]
        pk = side_obj["team"][side_obj["active_index"]]
        if pk["is_fainted"]:
            continue
        if pk.get("status") == "BRN":
            burn_dmg = max(1, pk["max_hp"] // 16)
            pk["current_hp"] = max(0, pk["current_hp"] - burn_dmg)
            events.append({
                "type": "DAMAGE",
                "target": side_key,
                "damage": burn_dmg,
                "remaining_hp": pk["current_hp"],
                "max_hp": pk["max_hp"],
                "effectiveness": 1.0,
                "is_crit": False,
                "message": f"{pk['name']} was hurt by its burn!",
            })
        elif pk.get("status") == "PSN":
            psn_dmg = max(1, pk["max_hp"] // 8)
            pk["current_hp"] = max(0, pk["current_hp"] - psn_dmg)
            events.append({
                "type": "DAMAGE",
                "target": side_key,
                "damage": psn_dmg,
                "remaining_hp": pk["current_hp"],
                "max_hp": pk["max_hp"],
                "effectiveness": 1.0,
                "is_crit": False,
                "message": f"{pk['name']} was hurt by poison!",
            })
        if pk["current_hp"] == 0 and not pk["is_fainted"]:
            pk["is_fainted"] = True
            events.append({
                "type": "FAINT",
                "target": side_key,
                "pokemon": pk["name"],
                "message": f"{pk['name']} fainted!",
            })

    # Step 5: Check victory / auto-switch for AI
    p1_defeated = all(pk["is_fainted"] for pk in p1["team"])
    p2_defeated = all(pk["is_fainted"] for pk in p2["team"])

    if p1_defeated or p2_defeated:
        state["is_game_over"] = True
        state["winner"] = "p2" if p1_defeated else "p1"
        events.append({
            "type": "GAME_OVER",
            "winner": state["winner"],
            "message": f"Battle ended! {p2['name'] if p1_defeated else p1['name']} wins!",
        })
    elif is_ai_match and p2["team"][p2["active_index"]]["is_fainted"]:
        # AI automatically sends out next healthy Pokémon
        for idx, candidate in enumerate(p2["team"]):
            if not candidate["is_fainted"]:
                p2["active_index"] = idx
                events.append({
                    "type": "SWITCH",
                    "player": "p2",
                    "pokemon": candidate["name"],
                    "species": candidate["species"],
                    "new_index": idx,
                    "message": f"{p2['name']} sent out {candidate['name']}!",
                })
                break

    state["turn"] += 1
    return {"events": events, "state": state}


def choose_ai_move(state: dict) -> dict:
    """Smart AI: scores each move by expected effectiveness + power."""
    p2 = state["p2"]
    p1 = state["p1"]
    ai_pk = p2["team"][p2["active_index"]]
    foe_pk = p1["team"][p1["active_index"]]

    best_idx = 0
    best_score = -1.0

    for idx, move in enumerate(ai_pk["moves"]):
        if move.get("current_pp", 1) <= 0:
            continue
        if move.get("category") == "STATUS" or move.get("power", 0) == 0:
            score = 45.0 if random.random() < 0.35 else 15.0
        else:
            eff = get_type_effectiveness(move["type"], foe_pk["types"])
            stab = 1.5 if move["type"] in ai_pk["types"] else 1.0
            score = move["power"] * eff * stab * random.uniform(0.85, 1.15)
        if score > best_score:
            best_score = score
            best_idx = idx

    return {"type": "MOVE", "move_index": best_idx}


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
