# Standard Competitive Pokémon Roster with stats, types, and signature movesets

POKEMON_ROSTER = {
    "CHARIZARD": {
        "name": "Charizard",
        "species": "CHARIZARD",
        "types": ["FIRE", "FLYING"],
        "base_stats": {"hp": 78, "attack": 84, "defense": 78, "sp_attack": 109, "sp_defense": 85, "speed": 100},
        "moves": [
            {"name": "Flamethrower", "type": "FIRE", "category": "SPECIAL", "power": 90, "accuracy": 100, "pp": 15, "priority": 0},
            {"name": "Air Slash", "type": "FLYING", "category": "SPECIAL", "power": 75, "accuracy": 95, "pp": 15, "priority": 0},
            {"name": "Dragon Pulse", "type": "DRAGON", "category": "SPECIAL", "power": 85, "accuracy": 100, "pp": 10, "priority": 0},
            {"name": "Solar Beam", "type": "GRASS", "category": "SPECIAL", "power": 120, "accuracy": 100, "pp": 10, "priority": 0}
        ]
    },
    "PIKACHU": {
        "name": "Pikachu",
        "species": "PIKACHU",
        "types": ["ELECTRIC"],
        "base_stats": {"hp": 65, "attack": 90, "defense": 55, "sp_attack": 90, "sp_defense": 60, "speed": 110},
        "moves": [
            {"name": "Thunderbolt", "type": "ELECTRIC", "category": "SPECIAL", "power": 90, "accuracy": 100, "pp": 15, "priority": 0},
            {"name": "Volt Tackle", "type": "ELECTRIC", "category": "PHYSICAL", "power": 120, "accuracy": 100, "pp": 15, "priority": 0},
            {"name": "Quick Attack", "type": "NORMAL", "category": "PHYSICAL", "power": 40, "accuracy": 100, "pp": 30, "priority": 1},
            {"name": "Iron Tail", "type": "STEEL", "category": "PHYSICAL", "power": 100, "accuracy": 75, "pp": 15, "priority": 0}
        ]
    },
    "BLASTOISE": {
        "name": "Blastoise",
        "species": "BLASTOISE",
        "types": ["WATER"],
        "base_stats": {"hp": 79, "attack": 83, "defense": 100, "sp_attack": 85, "sp_defense": 105, "speed": 78},
        "moves": [
            {"name": "Hydro Pump", "type": "WATER", "category": "SPECIAL", "power": 110, "accuracy": 80, "pp": 5, "priority": 0},
            {"name": "Surf", "type": "WATER", "category": "SPECIAL", "power": 90, "accuracy": 100, "pp": 15, "priority": 0},
            {"name": "Ice Beam", "type": "ICE", "category": "SPECIAL", "power": 90, "accuracy": 100, "pp": 10, "priority": 0},
            {"name": "Flash Cannon", "type": "STEEL", "category": "SPECIAL", "power": 80, "accuracy": 100, "pp": 10, "priority": 0}
        ]
    },
    "VENUSAUR": {
        "name": "Venusaur",
        "species": "VENUSAUR",
        "types": ["GRASS", "POISON"],
        "base_stats": {"hp": 80, "attack": 82, "defense": 83, "sp_attack": 100, "sp_defense": 100, "speed": 80},
        "moves": [
            {"name": "Solar Beam", "type": "GRASS", "category": "SPECIAL", "power": 120, "accuracy": 100, "pp": 10, "priority": 0},
            {"name": "Sludge Bomb", "type": "POISON", "category": "SPECIAL", "power": 90, "accuracy": 100, "pp": 10, "priority": 0},
            {"name": "Energy Ball", "type": "GRASS", "category": "SPECIAL", "power": 90, "accuracy": 100, "pp": 10, "priority": 0},
            {"name": "Earthquake", "type": "GROUND", "category": "PHYSICAL", "power": 100, "accuracy": 100, "pp": 10, "priority": 0}
        ]
    },
    "GENGAR": {
        "name": "Gengar",
        "species": "GENGAR",
        "types": ["GHOST", "POISON"],
        "base_stats": {"hp": 60, "attack": 65, "defense": 60, "sp_attack": 130, "sp_defense": 75, "speed": 110},
        "moves": [
            {"name": "Shadow Ball", "type": "GHOST", "category": "SPECIAL", "power": 80, "accuracy": 100, "pp": 15, "priority": 0},
            {"name": "Sludge Wave", "type": "POISON", "category": "SPECIAL", "power": 95, "accuracy": 100, "pp": 10, "priority": 0},
            {"name": "Thunderbolt", "type": "ELECTRIC", "category": "SPECIAL", "power": 90, "accuracy": 100, "pp": 15, "priority": 0},
            {"name": "Dazzling Gleam", "type": "FAIRY", "category": "SPECIAL", "power": 80, "accuracy": 100, "pp": 10, "priority": 0}
        ]
    },
    "LUCARIO": {
        "name": "Lucario",
        "species": "LUCARIO",
        "types": ["FIGHTING", "STEEL"],
        "base_stats": {"hp": 70, "attack": 110, "defense": 70, "sp_attack": 115, "sp_defense": 70, "speed": 90},
        "moves": [
            {"name": "Aura Sphere", "type": "FIGHTING", "category": "SPECIAL", "power": 80, "accuracy": 100, "pp": 20, "priority": 0},
            {"name": "Close Combat", "type": "FIGHTING", "category": "PHYSICAL", "power": 120, "accuracy": 100, "pp": 5, "priority": 0},
            {"name": "Flash Cannon", "type": "STEEL", "category": "SPECIAL", "power": 80, "accuracy": 100, "pp": 10, "priority": 0},
            {"name": "Extreme Speed", "type": "NORMAL", "category": "PHYSICAL", "power": 80, "accuracy": 100, "pp": 5, "priority": 2}
        ]
    },
    "MEWTWO": {
        "name": "Mewtwo",
        "species": "MEWTWO",
        "types": ["PSYCHIC"],
        "base_stats": {"hp": 106, "attack": 110, "defense": 90, "sp_attack": 154, "sp_defense": 90, "speed": 130},
        "moves": [
            {"name": "Psystrike", "type": "PSYCHIC", "category": "SPECIAL", "power": 100, "accuracy": 100, "pp": 10, "priority": 0},
            {"name": "Shadow Ball", "type": "GHOST", "category": "SPECIAL", "power": 80, "accuracy": 100, "pp": 15, "priority": 0},
            {"name": "Ice Beam", "type": "ICE", "category": "SPECIAL", "power": 90, "accuracy": 100, "pp": 10, "priority": 0},
            {"name": "Aura Sphere", "type": "FIGHTING", "category": "SPECIAL", "power": 80, "accuracy": 100, "pp": 20, "priority": 0}
        ]
    },
    "GARCHOMP": {
        "name": "Garchomp",
        "species": "GARCHOMP",
        "types": ["DRAGON", "GROUND"],
        "base_stats": {"hp": 108, "attack": 130, "defense": 95, "sp_attack": 80, "sp_defense": 85, "speed": 102},
        "moves": [
            {"name": "Earthquake", "type": "GROUND", "category": "PHYSICAL", "power": 100, "accuracy": 100, "pp": 10, "priority": 0},
            {"name": "Dragon Claw", "type": "DRAGON", "category": "PHYSICAL", "power": 80, "accuracy": 100, "pp": 15, "priority": 0},
            {"name": "Stone Edge", "type": "ROCK", "category": "PHYSICAL", "power": 100, "accuracy": 80, "pp": 5, "priority": 0},
            {"name": "Iron Head", "type": "STEEL", "category": "PHYSICAL", "power": 80, "accuracy": 100, "pp": 15, "priority": 0}
        ]
    },
    "GRENINJA": {
        "name": "Greninja",
        "species": "GRENINJA",
        "types": ["WATER", "DARK"],
        "base_stats": {"hp": 72, "attack": 95, "defense": 67, "sp_attack": 103, "sp_defense": 71, "speed": 122},
        "moves": [
            {"name": "Hydro Pump", "type": "WATER", "category": "SPECIAL", "power": 110, "accuracy": 80, "pp": 5, "priority": 0},
            {"name": "Dark Pulse", "type": "DARK", "category": "SPECIAL", "power": 80, "accuracy": 100, "pp": 15, "priority": 0},
            {"name": "Ice Beam", "type": "ICE", "category": "SPECIAL", "power": 90, "accuracy": 100, "pp": 10, "priority": 0},
            {"name": "Water Shuriken", "type": "WATER", "category": "SPECIAL", "power": 60, "accuracy": 100, "pp": 20, "priority": 1}
        ]
    },
    "DRAGONITE": {
        "name": "Dragonite",
        "species": "DRAGONITE",
        "types": ["DRAGON", "FLYING"],
        "base_stats": {"hp": 91, "attack": 134, "defense": 95, "sp_attack": 100, "sp_defense": 100, "speed": 80},
        "moves": [
            {"name": "Outrage", "type": "DRAGON", "category": "PHYSICAL", "power": 120, "accuracy": 100, "pp": 10, "priority": 0},
            {"name": "Extreme Speed", "type": "NORMAL", "category": "PHYSICAL", "power": 80, "accuracy": 100, "pp": 5, "priority": 2},
            {"name": "Earthquake", "type": "GROUND", "category": "PHYSICAL", "power": 100, "accuracy": 100, "pp": 10, "priority": 0},
            {"name": "Fire Punch", "type": "FIRE", "category": "PHYSICAL", "power": 75, "accuracy": 100, "pp": 15, "priority": 0}
        ]
    },
    "TYRANITAR": {
        "name": "Tyranitar",
        "species": "TYRANITAR",
        "types": ["ROCK", "DARK"],
        "base_stats": {"hp": 100, "attack": 134, "defense": 110, "sp_attack": 95, "sp_defense": 100, "speed": 61},
        "moves": [
            {"name": "Stone Edge", "type": "ROCK", "category": "PHYSICAL", "power": 100, "accuracy": 80, "pp": 5, "priority": 0},
            {"name": "Crunch", "type": "DARK", "category": "PHYSICAL", "power": 80, "accuracy": 100, "pp": 15, "priority": 0},
            {"name": "Earthquake", "type": "GROUND", "category": "PHYSICAL", "power": 100, "accuracy": 100, "pp": 10, "priority": 0},
            {"name": "Ice Punch", "type": "ICE", "category": "PHYSICAL", "power": 75, "accuracy": 100, "pp": 15, "priority": 0}
        ]
    },
    "SYLVEON": {
        "name": "Sylveon",
        "species": "SYLVEON",
        "types": ["FAIRY"],
        "base_stats": {"hp": 95, "attack": 65, "defense": 65, "sp_attack": 110, "sp_defense": 130, "speed": 60},
        "moves": [
            {"name": "Moonblast", "type": "FAIRY", "category": "SPECIAL", "power": 95, "accuracy": 100, "pp": 15, "priority": 0},
            {"name": "Hyper Voice", "type": "NORMAL", "category": "SPECIAL", "power": 90, "accuracy": 100, "pp": 10, "priority": 0},
            {"name": "Psyshock", "type": "PSYCHIC", "category": "SPECIAL", "power": 80, "accuracy": 100, "pp": 10, "priority": 0},
            {"name": "Shadow Ball", "type": "GHOST", "category": "SPECIAL", "power": 80, "accuracy": 100, "pp": 15, "priority": 0}
        ]
    }
}

