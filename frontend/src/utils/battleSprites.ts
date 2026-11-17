import { PokemonType } from '../types/pokemon';

export const TYPE_SPRITE_INDEX: Record<PokemonType, number> = {
  NORMAL: 0,
  FIGHTING: 1,
  FLYING: 2,
  POISON: 3,
  GROUND: 4,
  ROCK: 5,
  BUG: 6,
  GHOST: 7,
  STEEL: 8,
  FIRE: 10,
  WATER: 11,
  GRASS: 12,
  ELECTRIC: 13,
  PSYCHIC: 14,
  ICE: 15,
  DRAGON: 16,
  DARK: 17,
  FAIRY: 18,
};

export const STATUS_SPRITE_INDEX: Record<string, number> = {
  SLP: 0,
  PSN: 1,
  BRN: 2,
  PAR: 3,
  FRZ: 4,
};

export const COMMAND_SPRITE_ROW = {
  FIGHT: 0,
  POKEMON: 1,
  BAG: 2,
  RUN: 3,
} as const;

export interface BattlebackTheme {
  id: string;
  label: string;
  bg: string;
  base0: string;
  base1: string;
  message: string;
}

export const BATTLEBACK_THEMES: Record<string, BattlebackTheme> = {
  grass: {
    id: 'grass',
    label: 'Grass Field',
    bg: '/battle-ui/battlebacks/field_bg.png',
    base0: '/battle-ui/battlebacks/grass_base0.png',
    base1: '/battle-ui/battlebacks/grass_base1.png',
    message: '/battle-ui/battlebacks/field_message.png',
  },
  field: {
    id: 'field',
    label: 'Open Field',
    bg: '/battle-ui/battlebacks/field_bg.png',
    base0: '/battle-ui/battlebacks/field_base0.png',
    base1: '/battle-ui/battlebacks/field_base1.png',
    message: '/battle-ui/battlebacks/field_message.png',
  },
  champion: {
    id: 'champion',
    label: 'Champion Hall',
    bg: '/battle-ui/battlebacks/champion1_bg.png',
    base0: '/battle-ui/battlebacks/champion1_base0.png',
    base1: '/battle-ui/battlebacks/champion1_base1.png',
    message: '/battle-ui/battlebacks/champion1_message.png',
  },
  city: {
    id: 'city',
    label: 'City Arena',
    bg: '/battle-ui/battlebacks/city_bg.png',
    base0: '/battle-ui/battlebacks/city_base0.png',
    base1: '/battle-ui/battlebacks/city_base1.png',
    message: '/battle-ui/battlebacks/city_message.png',
  },
};
