import { PokemonType } from './pokemon';

export interface AbilityDetail {
  id: number;
  nombre: string;
  nombre_ingles: string;
  descripcion: string;
}

export interface TypeDetail {
  id: number;
  nombre: string;
  nombre_ingles: string;
  color_hex: string;
}

export interface TypeEffectivenessDetail {
  tipo: string;
  tipo_ingles: string;
  color_hex: string;
  multiplicador: number;
}

export interface EvolutionNode {
  id: number;
  numero_pokedex: number;
  nombre: string;
  nombre_ingles: string;
  icon_url: string;
}

export interface EvolutionChain {
  fase_actual: number;
  es_campeon: boolean;
  preevolucion: EvolutionNode | null;
  evolucion: EvolutionNode | null;
}

export interface StadiumMove {
  id: number;
  codigo: string;
  nombre: string;
  nombre_alt?: string;
  nombre_ingles: string;
  gen: number;
  tipo: string;
  tipo_color: string;
  clase: string;
  clase_color?: string;
  potencia?: number;
  potencia_texto?: string;
  precision?: number;
  precision_texto?: string;
  pp?: number;
  pp_texto?: string;
  prioridad: number;
  contacto?: boolean;
  es_gigamax?: boolean;
  es_movimiento_z?: boolean;
  probabilidad_efecto?: number;
  descripcion?: string;
  efecto_secundario?: string;
}

export interface StadiumPokemonSummary {
  id: number;
  numero_pokedex: number;
  species: string;
  nombre: string;
  nombre_ingles: string;
  gen: number;
  types: string[];
  types_detail: TypeDetail[];
  habilidades?: AbilityDetail[];
  categoria_rareza: 'estandar' | 'legendario' | 'pseudolegendario';
  fase: number;
  campeon: boolean;
  peso_kg?: number;
  altura_m?: number;
  base_stats?: {
    hp: number;
    attack: number;
    defense: number;
    sp_attack: number;
    sp_defense: number;
    speed: number;
    total: number;
  };
  front_sprite_url: string;
  back_sprite_url: string;
  icon_url: string;
}

export interface StadiumPokemonDetail extends StadiumPokemonSummary {
  curva_crecimiento?: string;
  ratio_captura?: number;
  experiencia_base?: number;
  evoluciones: EvolutionChain;
  efectividades: Record<string, TypeEffectivenessDetail>;
  movimientos_predeterminados_data: StadiumMove[];
  learnset: Array<{
    metodo: string;
    nivel: number;
    movimiento: StadiumMove;
  }>;
}

export interface RoomSettings {
  generaciones: string[];
  permitir_legendarios: boolean;
  modo: string;
}

export interface RoomPlayer {
  apodo: string;
  es_anfitrion: boolean;
  equipo_count: number;
  equipo: string[];
  listo: boolean;
  conectado: boolean;
}

export interface RoomMessage {
  id: number;
  emisor: string;
  mensaje: string;
  es_sistema: boolean;
  enviado_en: string;
}

export interface RoomSummary {
  room_code: string;
  anfitrion: string;
  jugadores_actuales: number;
  max_jugadores: number;
  pokemon_por_jugador: number;
  requiere_contrasena: boolean;
  format_settings: RoomSettings;
  created_at: string;
}

export interface RoomDetailData {
  room_code: string;
  anfitrion: string;
  invitado?: string;
  status: 'WAITING' | 'ACTIVE' | 'FINISHED' | 'CANCELLED';
  pokemon_por_jugador: number;
  requiere_contrasena: boolean;
  format_settings: RoomSettings;
  jugadores: RoomPlayer[];
}
