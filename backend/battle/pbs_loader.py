from pathlib import Path
from typing import Dict, List, Optional

PBS_DATA_DIR = Path(__file__).resolve().parent / 'pbs_data'

_MOVES_CACHE: Optional[Dict[str, dict]] = None
_POKEMON_CACHE: Optional[Dict[str, dict]] = None


def _parse_pbs_sections(filepath: Path) -> Dict[str, Dict[str, str]]:
    sections: Dict[str, Dict[str, str]] = {}
    if not filepath.exists():
        return sections

    current_key: Optional[str] = None
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        for raw_line in f:
            line = raw_line.strip()
            if not line or line.startswith('#'):
                continue
            if line.startswith('[') and line.endswith(']'):
                current_key = line[1:-1].strip().upper()
                sections[current_key] = {}
            elif current_key and '=' in line:
                k, v = line.split('=', 1)
                sections[current_key][k.strip()] = v.strip()
    return sections


def get_all_moves() -> Dict[str, dict]:
    global _MOVES_CACHE
    if _MOVES_CACHE is not None:
        return _MOVES_CACHE

    raw = _parse_pbs_sections(PBS_DATA_DIR / 'moves.txt')
    moves: Dict[str, dict] = {}
    for move_id, fields in raw.items():
        category = fields.get('Category', 'Physical').upper()
        power = int(fields.get('Power', '0') or 0)
        accuracy = int(fields.get('Accuracy', '100') or 100)
        pp = int(fields.get('TotalPP', '15') or 15)
        priority = int(fields.get('Priority', '0') or 0)
        effect_chance = int(fields.get('EffectChance', '0') or 0)
        flags = [fl.strip() for fl in fields.get('Flags', '').split(',') if fl.strip()]

        moves[move_id] = {
            'id': move_id,
            'name': fields.get('Name', move_id.title()),
            'type': fields.get('Type', 'NORMAL').upper(),
            'category': category if category in ('PHYSICAL', 'SPECIAL', 'STATUS') else 'PHYSICAL',
            'power': power,
            'accuracy': accuracy,
            'pp': pp,
            'priority': priority,
            'function_code': fields.get('FunctionCode', 'None'),
            'effect_chance': effect_chance,
            'flags': flags,
            'description': fields.get('Description', ''),
        }

    _MOVES_CACHE = moves
    return _MOVES_CACHE


def get_all_pokemon() -> Dict[str, dict]:
    global _POKEMON_CACHE
    if _POKEMON_CACHE is not None:
        return _POKEMON_CACHE

    raw = _parse_pbs_sections(PBS_DATA_DIR / 'pokemon.txt')
    pokemon_map: Dict[str, dict] = {}

    for species_id, fields in raw.items():
        stats_raw = [int(x.strip()) for x in fields.get('BaseStats', '70,70,70,70,70,70').split(',') if x.strip()]
        if len(stats_raw) != 6:
            stats_raw = [70, 70, 70, 70, 70, 70]

        # Official Essentials PBS order: HP, Attack, Defense, Speed, SpAtk, SpDef
        base_stats = {
            'hp': stats_raw[0],
            'attack': stats_raw[1],
            'defense': stats_raw[2],
            'speed': stats_raw[3],
            'sp_attack': stats_raw[4],
            'sp_defense': stats_raw[5],
        }

        types = [t.strip().upper() for t in fields.get('Types', 'NORMAL').split(',') if t.strip()]
        abilities = [a.strip().upper() for a in fields.get('Abilities', '').split(',') if a.strip()]

        # Extract level-up learnset move IDs
        learnset: List[str] = []
        raw_moves = [m.strip() for m in fields.get('Moves', '').split(',') if m.strip()]
        for i in range(1, len(raw_moves), 2):
            m_id = raw_moves[i].upper()
            if m_id not in learnset:
                learnset.append(m_id)

        tutor_moves = [m.strip().upper() for m in fields.get('TutorMoves', '').split(',') if m.strip()]

        pokemon_map[species_id] = {
            'species': species_id,
            'name': fields.get('Name', species_id.title()),
            'types': types,
            'base_stats': base_stats,
            'abilities': abilities,
            'gender_ratio': fields.get('GenderRatio', 'Female50Percent'),
            'learnset': learnset,
            'tutor_moves': tutor_moves,
        }

    _POKEMON_CACHE = pokemon_map
    return _POKEMON_CACHE


def build_moveset_for_species(species_data: dict) -> List[dict]:
    """Selects up to 4 authentic, strong moves from a Pokémon's official PBS learnset."""
    all_moves = get_all_moves()
    types = set(species_data.get('types', []))
    base_stats = species_data.get('base_stats', {})
    prefers_physical = base_stats.get('attack', 70) >= base_stats.get('sp_attack', 70)

    candidate_ids = list(dict.fromkeys(species_data.get('learnset', []) + species_data.get('tutor_moves', [])))
    scored: List[tuple] = []

    for mid in candidate_ids:
        m = all_moves.get(mid)
        if not m:
            continue
        # Skip zero-power non-useful moves unless they are classic status/boost/heal moves
        fc = m['function_code']
        is_useful_status = (
            m['category'] == 'STATUS' and (
                'RaiseUser' in fc or 'HealUser' in fc or 'SleepTarget' in fc
                or 'ParalyzeTarget' in fc or 'BurnTarget' in fc or 'PoisonTarget' in fc
                or 'BadPoisonTarget' in fc
            )
        )
        if m['power'] == 0 and not is_useful_status:
            continue

        score = m['power']
        if m['power'] > 0:
            if m['type'] in types:
                score += 35  # STAB preference
            if prefers_physical and m['category'] == 'PHYSICAL':
                score += 20
            elif not prefers_physical and m['category'] == 'SPECIAL':
                score += 20
            if m['accuracy'] > 0 and m['accuracy'] < 80:
                score -= 15
            if m['power'] > 130:
                score -= 10  # Slight penalty for recharge/self-KO moves
        else:
            score = 88  # Competitive status/boost move

        scored.append((score, m))

    scored.sort(key=lambda pair: pair[0], reverse=True)

    chosen: List[dict] = []
    seen_types = set()
    has_status = False

    # First pass: diverse types + at most 1 status move
    for _, m in scored:
        if len(chosen) >= 4:
            break
        if m['category'] == 'STATUS':
            if has_status:
                continue
            has_status = True
            chosen.append(dict(m))
        else:
            if m['type'] in seen_types and len(scored) > 6:
                continue
            seen_types.add(m['type'])
            chosen.append(dict(m))

    # Second pass: fill remaining slots
    for _, m in scored:
        if len(chosen) >= 4:
            break
        if not any(c['id'] == m['id'] for c in chosen):
            chosen.append(dict(m))

    # Fallback if a Pokémon has fewer than 4 moves (e.g. Magikarp/Unown)
    if not chosen:
        tackle = all_moves.get('TACKLE', {
            'id': 'TACKLE', 'name': 'Tackle', 'type': 'NORMAL', 'category': 'PHYSICAL',
            'power': 40, 'accuracy': 100, 'pp': 35, 'priority': 0,
            'function_code': 'None', 'effect_chance': 0, 'flags': [], 'description': ''
        })
        chosen.append(dict(tackle))

    for m in chosen:
        m['current_pp'] = m['pp']

    return chosen
