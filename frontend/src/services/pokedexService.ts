import {
  StadiumPokemonSummary,
  StadiumPokemonDetail,
  StadiumMove,
  TypeDetail,
  RoomSummary,
  RoomDetailData,
  RoomMessage,
} from '../types/stadium';

const API_BASE = import.meta.env.VITE_BACKEND_API_URL || '';

export const PokedexService = {
  async getPokemonList(params: {
    q?: string;
    tipo?: string;
    gen?: string;
    rareza?: string;
    fase?: string;
    campeon?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ total: number; results: StadiumPokemonSummary[] }> {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.tipo) query.set('tipo', params.tipo);
    if (params.gen) query.set('gen', params.gen);
    if (params.rareza) query.set('rareza', params.rareza);
    if (params.fase) query.set('fase', params.fase);
    if (params.campeon) query.set('campeon', '1');
    query.set('limit', String(params.limit || 60));
    query.set('offset', String(params.offset || 0));

    const res = await fetch(`${API_BASE}/api/pokedex/pokemon/?${query.toString()}`);
    if (!res.ok) throw new Error('Error al cargar lista de Pokémon');
    return res.json();
  },

  async getPokemonDetail(idOrName: string | number): Promise<StadiumPokemonDetail> {
    const res = await fetch(`${API_BASE}/api/pokedex/pokemon/${idOrName}/`);
    if (!res.ok) throw new Error('Error al cargar detalle del Pokémon');
    return res.json();
  },

  async getMovesList(params: {
    q?: string;
    tipo?: string;
    clase?: string;
    gen?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ total: number; results: StadiumMove[] }> {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.tipo) query.set('tipo', params.tipo);
    if (params.clase) query.set('clase', params.clase);
    if (params.gen) query.set('gen', params.gen);
    query.set('limit', String(params.limit || 50));
    query.set('offset', String(params.offset || 0));

    const res = await fetch(`${API_BASE}/api/pokedex/movimientos/?${query.toString()}`);
    if (!res.ok) throw new Error('Error al cargar movimientos');
    return res.json();
  },

  async getTypes(): Promise<{ tipos: TypeDetail[] }> {
    const res = await fetch(`${API_BASE}/api/pokedex/tipos/`);
    if (!res.ok) throw new Error('Error al cargar tipos');
    return res.json();
  },

  // === Gestión de Salas y Duelos ===
  async createRoom(data: {
    player_name: string;
    room_code?: string;
    password?: string;
    pokemon_per_player: number;
    format_settings?: {
      generaciones: string[];
      permitir_legendarios: boolean;
      modo: string;
    };
    team?: string[];
  }): Promise<{ room_code: string; status: string }> {
    const res = await fetch(`${API_BASE}/api/battle/rooms/create/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al crear la sala');
    return res.json();
  },

  async getOpenRooms(): Promise<RoomSummary[]> {
    const res = await fetch(`${API_BASE}/api/battle/rooms/open/`);
    if (!res.ok) throw new Error('Error al listar salas abiertas');
    return res.json();
  },

  async getRoomDetail(roomCode: string): Promise<RoomDetailData> {
    const res = await fetch(`${API_BASE}/api/battle/rooms/${roomCode}/`);
    if (!res.ok) throw new Error('Error al obtener detalle de la sala');
    return res.json();
  },

  async joinRoom(roomCode: string, data: { player_name: string; password?: string; team?: string[] }) {
    const res = await fetch(`${API_BASE}/api/battle/rooms/${roomCode}/join/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al unirse a la sala');
    }
    return res.json();
  },

  async toggleReady(roomCode: string, data: { player_name: string; ready?: boolean; team?: string[] }) {
    const res = await fetch(`${API_BASE}/api/battle/rooms/${roomCode}/ready/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al actualizar estado');
    return res.json();
  },

  async getRoomChat(roomCode: string): Promise<RoomMessage[]> {
    const res = await fetch(`${API_BASE}/api/battle/rooms/${roomCode}/chat/`);
    if (!res.ok) return [];
    return res.json();
  },

  async sendRoomChat(roomCode: string, data: { emisor: string; mensaje: string }) {
    const res = await fetch(`${API_BASE}/api/battle/rooms/${roomCode}/chat/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al enviar mensaje');
    return res.json();
  },
};
