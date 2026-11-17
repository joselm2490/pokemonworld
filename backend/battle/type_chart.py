# Pokémon Type Effectiveness Table (Gen 6-9)
# Multiplier: 2.0 = Super Effective, 0.5 = Not Very Effective, 0.0 = Immune, 1.0 = Normal

TYPES = [
    'NORMAL', 'FIRE', 'WATER', 'GRASS', 'ELECTRIC', 'ICE',
    'FIGHTING', 'POISON', 'GROUND', 'FLYING', 'PSYCHIC', 'BUG',
    'ROCK', 'GHOST', 'DRAGON', 'STEEL', 'FAIRY', 'DARK'
]

# Attacking Type -> { Defending Type: Multiplier }
TYPE_CHART = {
    'NORMAL': {
        'ROCK': 0.5, 'GHOST': 0.0, 'STEEL': 0.5
    },
    'FIRE': {
        'FIRE': 0.5, 'WATER': 0.5, 'GRASS': 2.0, 'ICE': 2.0,
        'BUG': 2.0, 'ROCK': 0.5, 'DRAGON': 0.5, 'STEEL': 2.0
    },
    'WATER': {
        'FIRE': 2.0, 'WATER': 0.5, 'GRASS': 0.5, 'GROUND': 2.0,
        'ROCK': 2.0, 'DRAGON': 0.5
    },
    'GRASS': {
        'FIRE': 0.5, 'WATER': 2.0, 'GRASS': 0.5, 'POISON': 0.5,
        'GROUND': 2.0, 'FLYING': 0.5, 'BUG': 0.5, 'ROCK': 2.0,
        'DRAGON': 0.5, 'STEEL': 0.5
    },
    'ELECTRIC': {
        'WATER': 2.0, 'ELECTRIC': 0.5, 'GRASS': 0.5, 'GROUND': 0.0,
        'FLYING': 2.0, 'DRAGON': 0.5
    },
    'ICE': {
        'FIRE': 0.5, 'WATER': 0.5, 'GRASS': 2.0, 'ICE': 0.5,
        'GROUND': 2.0, 'FLYING': 2.0, 'DRAGON': 2.0, 'STEEL': 0.5
    },
    'FIGHTING': {
        'NORMAL': 2.0, 'ICE': 2.0, 'POISON': 0.5, 'FLYING': 0.5,
        'PSYCHIC': 0.5, 'BUG': 0.5, 'ROCK': 2.0, 'GHOST': 0.0,
        'DARK': 2.0, 'STEEL': 2.0, 'FAIRY': 0.5
    },
    'POISON': {
        'GRASS': 2.0, 'POISON': 0.5, 'GROUND': 0.5, 'ROCK': 0.5,
        'GHOST': 0.5, 'STEEL': 0.0, 'FAIRY': 2.0
    },
    'GROUND': {
        'FIRE': 2.0, 'ELECTRIC': 2.0, 'GRASS': 0.5, 'POISON': 2.0,
        'FLYING': 0.0, 'BUG': 0.5, 'ROCK': 2.0, 'STEEL': 2.0
    },
    'FLYING': {
        'ELECTRIC': 0.5, 'GRASS': 2.0, 'FIGHTING': 2.0, 'BUG': 2.0,
        'ROCK': 0.5, 'STEEL': 0.5
    },
    'PSYCHIC': {
        'FIGHTING': 2.0, 'POISON': 2.0, 'PSYCHIC': 0.5, 'DARK': 0.0,
        'STEEL': 0.5
    },
    'BUG': {
        'FIRE': 0.5, 'GRASS': 2.0, 'FIGHTING': 0.5, 'POISON': 0.5,
        'FLYING': 0.5, 'PSYCHIC': 2.0, 'GHOST': 0.5, 'DARK': 2.0,
        'STEEL': 0.5, 'FAIRY': 0.5
    },
    'ROCK': {
        'FIRE': 2.0, 'ICE': 2.0, 'FIGHTING': 0.5, 'GROUND': 0.5,
        'FLYING': 2.0, 'BUG': 2.0, 'STEEL': 0.5
    },
    'GHOST': {
        'NORMAL': 0.0, 'PSYCHIC': 2.0, 'GHOST': 2.0, 'DARK': 0.5
    },
    'DRAGON': {
        'DRAGON': 2.0, 'STEEL': 0.5, 'FAIRY': 0.0
    },
    'STEEL': {
        'FIRE': 0.5, 'WATER': 0.5, 'ELECTRIC': 0.5, 'ICE': 2.0,
        'ROCK': 2.0, 'STEEL': 0.5, 'FAIRY': 2.0
    },
    'FAIRY': {
        'FIRE': 0.5, 'FIGHTING': 2.0, 'POISON': 0.5, 'DRAGON': 2.0,
        'DARK': 2.0, 'STEEL': 0.5
    },
    'DARK': {
        'FIGHTING': 0.5, 'PSYCHIC': 2.0, 'GHOST': 2.0, 'DARK': 0.5,
        'FAIRY': 0.5
    }
}

def get_type_effectiveness(attack_type: str, defender_types: list[str]) -> float:
    """Calculate the damage multiplier of an attacking move type against defending Pokémon types."""
    multiplier = 1.0
    attack_type = attack_type.upper()
    chart = TYPE_CHART.get(attack_type, {})
    for def_type in defender_types:
        def_type = def_type.upper()
        multiplier *= chart.get(def_type, 1.0)
    return multiplier

