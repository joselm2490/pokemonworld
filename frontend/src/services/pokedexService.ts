import {
  StadiumPokemonSummary,
  StadiumPokemonDetail,
  StadiumMove,
  TypeDetail,
  RoomSummary,
  RoomDetailData,
  RoomMessage,
} from '../types/stadium';
import { battleLogger } from '../utils/logger';

const API_BASE = import.meta.env.VITE_BACKEND_API_URL || '';

async function apiFetch<T>(path: string, init?: RequestInit, fallbackError = 'Error de red'): Promise<T> {
  const url = `${API_BASE}${path}`;
  const method = init?.method || 'GET';
  const t0 = performance.now();
  battleLogger.api(`${method} ${url}`);

  try {
    const res = await fetch(url, init);
    const ms = Math.round(performance.now() - t0);
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      battleLogger.error('API', `${method} ${path} -> HTTP ${res.status} (${ms}ms)`, errBody);
      throw new Error(errBody.error || fallbackError);
    }
    const data = await res.json();
    battleLogger.api(`${method} ${path} -> HTTP ${res.status} (${ms}ms)`);
    return data as T;
  } catch (err) {
    const ms = Math.round(performance.now() - t0);
    battleLogger.error('API', `${method} ${path} FAILED (${ms}ms)`, err);
    throw err;
  }
}

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
    query.set('limit', String(params.limit || 24));
    query.set('offset', String(params.offset || 0));

    return apiFetch(`/api/pokedex/pokemon/?${query.toString()}`, undefined, 'Error al cargar lista de Pokémon');
  },

  async getPokemonDetail(idOrName: string | number): Promise<StadiumPokemonDetail> {
    return apiFetch(`/api/pokedex/pokemon/${idOrName}/`, undefined, 'Error al cargar detalle del Pokémon');
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

    return apiFetch(`/api/pokedex/movimientos/?${query.toString()}`, undefined, 'Error al cargar movimientos');
  },

  async getTypes(): Promise<{ tipos: TypeDetail[] }> {
    return apiFetch('/api/pokedex/tipos/', undefined, 'Error al cargar tipos');
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
    return apiFetch(
      '/api/battle/rooms/create/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      'Error al crear la sala'
    );
  },

  async getOpenRooms(): Promise<RoomSummary[]> {
    return apiFetch('/api/battle/rooms/open/', undefined, 'Error al listar salas abiertas');
  },

  async getRoomDetail(roomCode: string): Promise<RoomDetailData> {
    return apiFetch(`/api/battle/rooms/${roomCode}/`, undefined, 'Error al obtener detalle de la sala');
  },

  async joinRoom(roomCode: string, data: { player_name: string; password?: string; team?: string[] }): Promise<any> {
    return apiFetch<any>(
      `/api/battle/rooms/${roomCode}/join/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      'Error al unirse a la sala'
    );
  },

  async toggleReady(roomCode: string, data: { player_name: string; ready?: boolean; team?: string[] }): Promise<any> {
    return apiFetch<any>(
      `/api/battle/rooms/${roomCode}/ready/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      'Error al actualizar estado'
    );
  },

  async getRoomChat(roomCode: string): Promise<RoomMessage[]> {
    try {
      return await apiFetch<RoomMessage[]>(`/api/battle/rooms/${roomCode}/chat/`);
    } catch {
      return [];
    }
  },

  async sendRoomChat(roomCode: string, data: { emisor: string; mensaje: string }): Promise<any> {
    return apiFetch<any>(
      `/api/battle/rooms/${roomCode}/chat/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      'Error al enviar mensaje'
    );
  },
};
