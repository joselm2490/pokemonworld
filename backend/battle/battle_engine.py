import math
import random
from typing import Optional, List
from .data_roster import POKEMON_ROSTER
from .pbs_loader import get_all_pokemon, get_all_moves, build_moveset_for_species
from .type_chart import get_type_effectiveness


def calculate_stat(base: int, level: int = 50, is_hp: bool = False, iv: int = 31, ev: int = 85) -> int:
    if is_hp:
        if base == 1:
            return 1  # Shedinja
        return math.floor(((2 * base + iv + math.floor(ev / 4)) * level) / 100) + level + 10
    else:
        return math.floor(((2 * base + iv + math.floor(ev / 4)) * level) / 100) + 5


def stage_multiplier(stage: int) -> float:
    stage = max(-6, min(6, stage))
    if stage >= 0:
        return (2 + stage) / 2.0
    return 2.0 / (2 - stage)


_MOVE_TRANSLATIONS = None


def get_move_translations() -> dict:
    global _MOVE_TRANSLATIONS
    if _MOVE_TRANSLATIONS is not None:
        return _MOVE_TRANSLATIONS
    try:
        from pokedex.models import Movimiento
        _MOVE_TRANSLATIONS = {
            m.nombre_ingles.strip().upper(): m.nombre
            for m in Movimiento.objects.exclude(nombre_ingles='').exclude(nombre_ingles__isnull=True)
        }
    except Exception:
        _MOVE_TRANSLATIONS = {}
    return _MOVE_TRANSLATIONS


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

    # Translate move name to Spanish
    trans_map = get_move_translations()
    name_clean = merged.get("name", "").strip().upper()
    if name_clean in trans_map:
        merged["name"] = trans_map[name_clean]

    merged["current_pp"] = merged.get("pp", 15)
    return merged


def create_pokemon_instance(species: str, level: int = 50, db_cache: Optional[dict] = None, moves_cache: Optional[dict] = None) -> dict:
    species_key = species.upper().strip()
    pbs_pokemon = get_all_pokemon()
    pbs_data = pbs_pokemon.get(species_key)
    featured_data = POKEMON_ROSTER.get(species_key)

    # Attempt to pull from Django Pokédex database with WikiDex stats & abilities
    db_pkmn = None
    if db_cache is not None:
        db_pkmn = db_cache.get(species_key)
    else:
        try:
            from pokedex.models import Pokemon
            db_pkmn = (
                Pokemon.objects
                .filter(nombre_ingles__iexact=species_key)
                .select_related('estadisticas', 'tipo1', 'tipo2')
                .prefetch_related('habilidades')
                .first()
            )
        except Exception:
            db_pkmn = None

    if db_pkmn and hasattr(db_pkmn, 'estadisticas'):
        name = db_pkmn.nombre
        types = [db_pkmn.tipo1.nombre_ingles.upper()]
        if db_pkmn.tipo2:
            types.append(db_pkmn.tipo2.nombre_ingles.upper())

        st = db_pkmn.estadisticas
        base = {
            "hp": st.hp,
            "attack": st.ataque,
            "defense": st.defensa,
            "sp_attack": st.ataque_especial,
            "sp_defense": st.defensa_especial,
            "speed": st.velocidad
        }
        hab_first = db_pkmn.habilidades.first()
        ability = hab_first.nombre if hab_first else "Presión"
        gender_ratio = "Female50Percent"

        # 1. Prioritize movimientos_predeterminados directly from Supabase PostgreSQL
        db_moves = []
        if db_pkmn.movimientos_predeterminados:
            try:
                for mid in db_pkmn.movimientos_predeterminados:
                    m_obj = None
                    if moves_cache and mid in moves_cache:
                        m_obj = moves_cache[mid]
                    else:
                        from pokedex.models import Move
                        m_obj = Move.objects.filter(id=mid).select_related('tipo', 'clase').first()
                    if m_obj:
                        t_name = m_obj.tipo.nombre_ingles.upper() if m_obj.tipo else (m_obj.tipo_nombre.upper() if m_obj.tipo_nombre else 'NORMAL')
                        c_name = m_obj.clase.nombre_ingles.upper() if m_obj.clase else (m_obj.clase_nombre.upper() if m_obj.clase_nombre else 'PHYSICAL')
                        db_moves.append(_enrich_move_from_pbs({
                            "id": m_obj.nombre_ingles.upper().replace(' ', '').replace('-', ''),
                            "name": m_obj.nombre or m_obj.nombre_ingles,
                            "type": t_name,
                            "category": c_name,
                            "power": m_obj.potencia or 0,
                            "accuracy": m_obj.precision or 100,
                            "pp": m_obj.pp or 15,
                            "current_pp": m_obj.pp or 15,
                            "priority": m_obj.prioridad,
                            "description": m_obj.descripcion or "",
                        }))
            except Exception:
                db_moves = []

        if db_moves:
            moves = db_moves
        elif featured_data:
            moves = [_enrich_move_from_pbs(m) for m in featured_data["moves"]]
        elif pbs_data:
            moves = [_enrich_move_from_pbs(m) for m in build_moveset_for_species(pbs_data)]
        else:
            moves = [_enrich_move_from_pbs(m) for m in POKEMON_ROSTER.get("CHARIZARD", {}).get("moves", [])]

    elif featured_data:
        name = featured_data["name"]
        types = list(featured_data["types"])
        base = dict(featured_data["base_stats"])
        moves = [_enrich_move_from_pbs(m) for m in featured_data["moves"]]
        ability = pbs_data["abilities"][0] if pbs_data and pbs_data.get("abilities") else "Presión"
        gender_ratio = pbs_data.get("gender_ratio", "Female50Percent") if pbs_data else "Female50Percent"

    elif pbs_data:
        name = pbs_data["name"]
        types = list(pbs_data["types"])
        base = dict(pbs_data["base_stats"])
        moves = [_enrich_move_from_pbs(m) for m in build_moveset_for_species(pbs_data)]
        ability = pbs_data["abilities"][0] if pbs_data.get("abilities") else "Presión"
        gender_ratio = pbs_data.get("gender_ratio", "Female50Percent")
    else:
        # Fallback to Charizard
        return create_pokemon_instance("CHARIZARD", level)

    # Las estadísticas en los duelos son EXACTAMENTE las estadísticas de cada Pokémon en Supabase
    if db_pkmn and hasattr(db_pkmn, 'estadisticas'):
        max_hp = int(base["hp"])
        attack = int(base["attack"])
        defense = int(base["defense"])
        sp_attack = int(base["sp_attack"])
        sp_defense = int(base["sp_defense"])
        speed = int(base["speed"])
    else:
        max_hp = int(base.get("hp", 50))
        attack = int(base.get("attack", 50))
        defense = int(base.get("defense", 50))
        sp_attack = int(base.get("sp_attack", 50))
        sp_defense = int(base.get("sp_defense", 50))
        speed = int(base.get("speed", 50))

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


def create_default_party(species_list: list, level: int = 50) -> list:
    """Builds a full party using a single batched DB lookup to avoid N+1 queries."""
    db_cache = {}
    moves_cache = {}
    try:
        from pokedex.models import Pokemon, Move
        from django.db.models import Q
        query = Q()
        for sp in species_list:
            query |= Q(nombre_ingles__iexact=sp.strip())
        if query:
            qs = (
                Pokemon.objects
                .filter(query)
                .select_related('estadisticas', 'tipo1', 'tipo2')
                .prefetch_related('habilidades')
            )
            all_move_ids = set()
            for obj in qs:
                if obj.nombre_ingles:
                    db_cache[obj.nombre_ingles.upper().strip()] = obj
                if obj.movimientos_predeterminados:
                    all_move_ids.update(obj.movimientos_predeterminados)

            if all_move_ids:
                move_objs = Move.objects.filter(id__in=all_move_ids).select_related('tipo', 'clase')
                for m in move_objs:
                    moves_cache[m.id] = m
    except Exception:
        db_cache = {}
        moves_cache = {}
    return [create_pokemon_instance(sp, level, db_cache=db_cache, moves_cache=moves_cache) for sp in species_list]


def _can_apply_status(target: dict, status_code: str) -> bool:
    if target.get("status") or target.get("is_fainted"):
        return False
    types = target.get("types", [])
    if status_code == "BRN" and "FIRE" in types:
        return False
    if status_code == "PAR" and "ELECTRIC" in types:
        return False
    if status_code == "PSN" and ("POISON" in types or "STEEL" in types):
        return False
    if status_code == "FRZ" and "ICE" in types:
        return False
    return True


STAT_NAMES_ES = {
    "attack": "Ataque",
    "defense": "Defensa",
    "sp_attack": "Ataque Especial",
    "sp_defense": "Defensa Especial",
    "speed": "Velocidad"
}


def _apply_stat_change(target: dict, stat: str, delta: int, target_side: str, events: list):
    stages = target.setdefault("stages", {"attack": 0, "defense": 0, "sp_attack": 0, "sp_defense": 0, "speed": 0})
    old_val = stages.get(stat, 0)
    new_val = max(-6, min(6, old_val + delta))
    label_es = STAT_NAMES_ES.get(stat, stat.title())

    if new_val == old_val:
        events.append({
            "type": "INFO",
            "message": f"¡El {label_es} de {target['name']} no puede {'subir' if delta > 0 else 'bajar'} más!"
        })
        return
    stages[stat] = new_val

    if delta >= 2:
        verb = "subió mucho"
    elif delta == 1:
        verb = "subió"
    elif delta <= -2:
        verb = "bajó mucho"
    else:
        verb = "bajó"

    events.append({
        "type": "STAT_CHANGE",
        "target": target_side,
        "stat": stat,
        "delta": delta,
        "animation": "burst" if delta > 0 else "normal",
        "message": f"¡El {label_es} de {target['name']} {verb}!"
    })


def calculate_damage(attacker: dict, defender: dict, move: dict) -> dict:
    if move.get("category") == "STATUS" or move.get("power", 0) == 0:
        return {"damage": 0, "is_miss": False, "effectiveness": 1.0, "is_crit": False}

    accuracy = move.get("accuracy", 100)
    if accuracy > 0 and random.randint(1, 100) > accuracy:
        return {"damage": 0, "is_miss": True, "effectiveness": 1.0, "is_crit": False}

    level = attacker.get("level", 50)
    power = move.get("power", 50)
    category = move.get("category", "SPECIAL")

    attacker_stages = attacker.get("stages", {})
    defender_stages = defender.get("stages", {})

    if category == "PHYSICAL":
        atk = attacker["stats"]["attack"] * stage_multiplier(attacker_stages.get("attack", 0))
        defe = defender["stats"]["defense"] * stage_multiplier(defender_stages.get("defense", 0))
        if attacker.get("status") == "BRN":
            atk *= 0.5
    else:
        atk = attacker["stats"]["sp_attack"] * stage_multiplier(attacker_stages.get("sp_attack", 0))
        defe = defender["stats"]["sp_defense"] * stage_multiplier(defender_stages.get("sp_defense", 0))

    atk = max(1, atk)
    defe = max(1, defe)

    base_dmg = math.floor(math.floor((math.floor((2 * level) / 5) + 2) * power * (atk / defe)) / 50) + 2

    # STAB (Same Type Attack Bonus)
    move_type = move.get("type", "NORMAL")
    stab = 1.5 if move_type in attacker.get("types", []) else 1.0

    # Type effectiveness
    effectiveness = get_type_effectiveness(move_type, defender.get("types", []))

    # Critical hit (~1/24)
    is_crit = random.random() < 0.0417
    crit_mult = 1.5 if is_crit else 1.0

    rand_variance = random.uniform(0.85, 1.0)
    total_damage = math.floor(base_dmg * stab * effectiveness * crit_mult * rand_variance)
    if effectiveness == 0.0:
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
    fc = move.get("function_code", "")
    is_status_move = move.get("category") == "STATUS"
    effect_chance = move.get("effect_chance", 100 if is_status_move else 0)

    triggers = is_status_move or (effect_chance > 0 and random.randint(1, 100) <= effect_chance)
    if not triggers:
        return

    # Status inflictions
    status_map = [
        ("BurnTarget", "BRN", "¡sufrió quemaduras!"),
        ("ParalyzeTarget", "PAR", "¡está paralizado! ¡Quizás no pueda moverse!"),
        ("SleepTarget", "SLP", "¡se quedó dormido!"),
        ("FreezeTarget", "FRZ", "¡se congeló por completo!"),
        ("BadPoisonTarget", "PSN", "¡fue gravemente envenenado!"),
        ("PoisonTarget", "PSN", "¡fue envenenado!"),
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
                    "message": f"¡{defender['name']} {msg}",
                })
            elif is_status_move:
                events.append({"type": "INFO", "message": "¡Pero falló!"})
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
            "message": f"¡{attacker['name']} recuperó PS!",
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
            "message": f"¡{attacker['name']} absorbió energía!",
        })

    # Recoil moves (33% recoil)
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
            "message": f"¡{attacker['name']} sufrió daño por el retroceso!",
        })
        if attacker["current_hp"] == 0:
            attacker["is_fainted"] = True
            events.append({"type": "FAINT", "target": actor_side, "pokemon": attacker["name"], "message": f"¡{attacker['name']} se debilitó!"})

    # Stat boosters / debuffers
    if "RaiseUserAttack2" in fc:
        _apply_stat_change(attacker, "attack", 2, actor_side, events)
    elif "RaiseUserDefense1" in fc:
        _apply_stat_change(attacker, "defense", 1, actor_side, events)
    elif "RaiseUserSpeed1" in fc:
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
                "message": f"¡Vuelve, {old_name}! ¡Adelante, {p1_active['name']}!",
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
                "message": f"¡{p2['name']} envió a {p2_active['name']}!",
            })

    # Step 2: Determine turn order for MOVE actions
    turn_queue = []

    p1_move = None
    if p1_action.get("type") == "MOVE" and not p1_active["is_fainted"]:
        m_idx = p1_action.get("move_index", 0)
        p1_move = p1_active["moves"][m_idx] if 0 <= m_idx < len(p1_active["moves"]) else p1_active["moves"][0]

    p2_move = None
    if p2_action.get("type") == "MOVE" and not p2_active["is_fainted"]:
        m_idx = p2_action.get("move_index", 0)
        p2_move = p2_active["moves"][m_idx] if 0 <= m_idx < len(p2_active["moves"]) else p2_active["moves"][0]

    if p1_move and p2_move:
        p1_pri = p1_move.get("priority", 0)
        p2_pri = p2_move.get("priority", 0)
        p1_spe = p1_active["stats"]["speed"] * stage_multiplier(p1_active.get("stages", {}).get("speed", 0))
        p2_spe = p2_active["stats"]["speed"] * stage_multiplier(p2_active.get("stages", {}).get("speed", 0))
        if p1_active.get("status") == "PAR":
            p1_spe *= 0.5
        if p2_active.get("status") == "PAR":
            p2_spe *= 0.5

        if p1_pri > p2_pri or (p1_pri == p2_pri and p1_spe > p2_spe) or (p1_pri == p2_pri and p1_spe == p2_spe and random.random() < 0.5):
            turn_queue = [("p1", p1_move), ("p2", p2_move)]
        else:
            turn_queue = [("p2", p2_move), ("p1", p1_move)]
    elif p1_move:
        turn_queue = [("p1", p1_move)]
    elif p2_move:
        turn_queue = [("p2", p2_move)]

    # Step 3: Execute moves in order
    for actor_side, move in turn_queue:
        target_side = "p2" if actor_side == "p1" else "p1"
        attacker = state[actor_side]["team"][state[actor_side]["active_index"]]
        defender = state[target_side]["team"][state[target_side]["active_index"]]

        if attacker["is_fainted"] or defender["is_fainted"]:
            continue

        # Sleep check
        if attacker.get("status") == "SLP":
            attacker["sleep_turns"] = attacker.get("sleep_turns", 1) - 1
            if attacker["sleep_turns"] <= 0:
                attacker["status"] = None
                events.append({"type": "INFO", "message": f"¡{attacker['name']} se despertó!"})
            else:
                events.append({"type": "INFO", "message": f"¡{attacker['name']} está profundamente dormido!"})
                continue

        # Freeze check
        if attacker.get("status") == "FRZ":
            if move.get("type") == "FIRE" or random.random() < 0.20:
                attacker["status"] = None
                events.append({"type": "INFO", "message": f"¡{attacker['name']} se descongeló!"})
            else:
                events.append({"type": "INFO", "message": f"¡{attacker['name']} está congelado y no se puede mover!"})
                continue

        # Paralyze check
        if attacker.get("status") == "PAR" and random.random() < 0.25:
            events.append({"type": "INFO", "message": f"¡{attacker['name']} está paralizado! ¡No se puede mover!"})
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
            "message": f"¡{attacker['name']} usó {move['name']}!",
        })

        # Status moves
        if move.get("category") == "STATUS" or move.get("power", 0) == 0:
            acc = move.get("accuracy", 100)
            if acc > 0 and random.randint(1, 100) > acc:
                events.append({"type": "MISS", "actor": actor_side, "message": f"¡El ataque de {attacker['name']} falló!"})
                continue
            _apply_status_or_secondary(attacker, defender, move, actor_side, target_side, 0, events)
            continue

        # Damaging moves
        dmg_res = calculate_damage(attacker, defender, move)
        if dmg_res["is_miss"]:
            events.append({
                "type": "MISS",
                "actor": actor_side,
                "message": f"¡El ataque de {attacker['name']} falló!",
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
            events.append({"type": "INFO", "message": f"¡{defender['name']} se descongeló!"})

        if defender["current_hp"] == 0:
            defender["is_fainted"] = True
            events.append({
                "type": "FAINT",
                "target": target_side,
                "pokemon": defender["name"],
                "message": f"¡{defender['name']} se debilitó!",
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
                "message": f"¡{pk['name']} sufre por la quemadura!",
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
                "message": f"¡{pk['name']} sufre los efectos del veneno!",
            })
        if pk["current_hp"] == 0 and not pk["is_fainted"]:
            pk["is_fainted"] = True
            events.append({
                "type": "FAINT",
                "target": side_key,
                "pokemon": pk["name"],
                "message": f"¡{pk['name']} se debilitó!",
            })

    # Step 5: Check victory / auto-switch for AI
    p1_defeated = all(pk["is_fainted"] for pk in p1["team"])
    p2_defeated = all(pk["is_fainted"] for pk in p2["team"])

    if p1_defeated or p2_defeated:
        state["is_game_over"] = True
        state["winner"] = "p2" if p1_defeated else "p1"
        winner_name = p2['name'] if p1_defeated else p1['name']
        events.append({
            "type": "GAME_OVER",
            "winner": state["winner"],
            "message": f"¡Combate finalizado! ¡{winner_name} ha ganado!",
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
                    "message": f"¡{p2['name']} envió a {candidate['name']}!",
                })
                break

    state["turn"] += 1
    return {"events": events, "state": state}


def choose_ai_move(ai_pk_or_state: dict, foe_pk: Optional[dict] = None) -> dict:
    """Smart AI move selector. Accepts either (state) or (ai_pk, foe_pk)."""
    if foe_pk is None and "p1" in ai_pk_or_state and "p2" in ai_pk_or_state:
        p2 = ai_pk_or_state["p2"]
        p1 = ai_pk_or_state["p1"]
        ai_pk = p2["team"][p2["active_index"]]
        foe_pk = p1["team"][p1["active_index"]]
    else:
        ai_pk = ai_pk_or_state

    best_idx = 0
    best_score = -1.0

    for idx, move in enumerate(ai_pk.get("moves", [])):
        if move.get("current_pp", 1) <= 0:
            continue
        if move.get("category") == "STATUS":
            score = 25.0
            if foe_pk and foe_pk.get("status") is None and any(
                st in move.get("function_code", "") for st in ["Burn", "Paralyze", "Sleep", "Poison"]
            ):
                score += 35.0
        else:
            eff = get_type_effectiveness(move["type"], foe_pk.get("types", []) if foe_pk else [])
            stab = 1.5 if move["type"] in ai_pk.get("types", []) else 1.0
            score = move.get("power", 50) * eff * stab * random.uniform(0.85, 1.15)
        if score > best_score:
            best_score = score
            best_idx = idx

    return {"type": "MOVE", "move_index": best_idx}


def _build_damage_message(res: dict) -> str:
    parts = []
    if res.get("is_crit"):
        parts.append("¡Un golpe crítico!")
    eff = res.get("effectiveness", 1.0)
    if eff > 1.0:
        parts.append("¡Es muy eficaz!")
    elif eff == 0.0:
        parts.append("No afecta al Pokémon rival...")
    elif eff < 1.0:
        parts.append("No es muy eficaz...")
    return " ".join(parts)
