export type PokemonType =
  | 'NORMAL' | 'FIRE' | 'WATER' | 'GRASS' | 'ELECTRIC' | 'ICE'
  | 'FIGHTING' | 'POISON' | 'GROUND' | 'FLYING' | 'PSYCHIC' | 'BUG'
  | 'ROCK' | 'GHOST' | 'DRAGON' | 'STEEL' | 'FAIRY' | 'DARK';

export interface PokemonMove {
  id?: string;
  name: string;
  type: PokemonType;
  category: 'PHYSICAL' | 'SPECIAL' | 'STATUS';
  power: number;
  accuracy: number;
  pp: number;
  current_pp: number;
  priority?: number;
  function_code?: string;
  effect_chance?: number;
  flags?: string[];
  description?: string;
}

export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  sp_attack: number;
  sp_defense: number;
  speed: number;
}

export interface PokemonStatStages {
  attack: number;
  defense: number;
  sp_attack: number;
  sp_defense: number;
  speed: number;
}

export interface Pokemon {
  species: string;
  name: string;
  types: PokemonType[];
  level: number;
  gender?: 'M' | 'F' | null;
  ability?: string;
  max_hp: number;
  current_hp: number;
  stats: PokemonStats;
  stages?: PokemonStatStages;
  moves: PokemonMove[];
  status: 'PAR' | 'QUE' | 'ENV' | 'VEN' | 'DOR' | 'CON' | 'BRN' | 'SLP' | 'PSN' | 'FRZ' | null;
  is_fainted: boolean;
  front_sprite_url?: string;
  back_sprite_url?: string;
}

export interface PlayerState {
  name: string;
  active_index: number;
  team: Pokemon[];
}

export interface BattleState {
  turn: number;
  is_game_over: boolean;
  winner: 'p1' | 'p2' | null;
  p1: PlayerState;
  p2: PlayerState;
}

export interface BattleEvent {
  type:
    | 'ATTACK'
    | 'DAMAGE'
    | 'FAINT'
    | 'SWITCH'
    | 'MISS'
    | 'GAME_OVER'
    | 'INFO'
    | 'STAT_CHANGE'
    | 'HEAL'
    | 'STATUS';
  actor?: 'p1' | 'p2';
  target?: 'p1' | 'p2';
  player?: 'p1' | 'p2';
  move?: string;
  move_type?: PokemonType;
  category?: 'PHYSICAL' | 'SPECIAL' | 'STATUS';
  animation?: string;
  damage?: number;
  remaining_hp?: number;
  max_hp?: number;
  effectiveness?: number;
  is_crit?: boolean;
  pokemon?: string;
  species?: string;
  new_index?: number;
  status?: 'PAR' | 'QUE' | 'ENV' | 'VEN' | 'DOR' | 'CON' | 'BRN' | 'SLP' | 'PSN' | 'FRZ';
  stat?: string;
  delta?: number;
  message?: string;
  winner?: string;
}
