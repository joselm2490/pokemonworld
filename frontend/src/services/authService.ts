import { battleLogger } from '../utils/logger';

const DEFAULT_PROD_API = 'https://pokemon-battle-server-cid8.onrender.com';
const API_BASE =
  import.meta.env.VITE_BACKEND_API_URL ||
  (import.meta.env.PROD ? DEFAULT_PROD_API : '');

export interface TrainerUser {
  username: string;
  email?: string;
  token?: string;
}

export interface TrainerTeamData {
  slot: number;
  name: string;
  pokemon_list: string[];
  is_active: boolean;
}

export const AuthService = {
  getCurrentUser(): TrainerUser | null {
    try {
      const saved = localStorage.getItem('pokemon_auth_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.username) {
          return parsed;
        }
      }
    } catch {}
    return null;
  },

  setCurrentUser(user: TrainerUser | null) {
    if (user) {
      localStorage.setItem('pokemon_auth_user', JSON.stringify(user));
      localStorage.setItem('pokemon_trainer_name', user.username);
    } else {
      localStorage.removeItem('pokemon_auth_user');
      localStorage.removeItem('pokemon_trainer_name');
      localStorage.removeItem('pokemon_trainer_teams');
      localStorage.removeItem('pokemon_active_slot');
      localStorage.removeItem('pokemon_user_team');
    }
  },

  async syncActiveTeam(): Promise<string[] | null> {
    try {
      const data = await this.getTeams();
      if (data?.teams && data.teams.length > 0) {
        const activeTeam =
          data.teams.find((t) => t.is_active) ||
          data.teams.find((t) => t.slot === data.active_slot) ||
          data.teams[0];
        if (activeTeam?.pokemon_list?.length) {
          localStorage.setItem('pokemon_user_team', JSON.stringify(activeTeam.pokemon_list));
          localStorage.setItem('pokemon_active_slot', String(activeTeam.slot));
          return activeTeam.pokemon_list;
        }
      }
    } catch {}
    return null;
  },

  async login(usernameOrEmail: string, password: string): Promise<TrainerUser> {
    const cleanUser = usernameOrEmail.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      throw new Error('Por favor ingresa tu nombre de entrenador o correo y tu contraseña.');
    }

    try {
      const res = await fetch(`${API_BASE}/api/accounts/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (data?.error) {
          throw new Error(data.error);
        }
        if (res.status === 404 || res.status >= 500) {
          throw new Error(`No se pudo conectar con el servidor Django (HTTP ${res.status}).`);
        }
        throw new Error('Credenciales inválidas. Revisa tu nombre de entrenador / correo y contraseña.');
      }

      const user: TrainerUser = {
        username: data?.username || cleanUser,
        email: data?.email,
        token: data?.token,
      };
      this.setCurrentUser(user);
      await this.syncActiveTeam();
      return user;
    } catch (err: any) {
      battleLogger.error('AUTH', 'Login request failed', err);
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        throw new Error('Conectando con el servidor de la Arena... Por favor espera unos segundos e intenta nuevamente.');
      }
      throw new Error(err.message || 'Error al iniciar sesión con Django.');
    }
  },

  async register(username: string, email: string, password: string): Promise<TrainerUser> {
    const cleanUser = username.trim();
    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      throw new Error('Nombre de entrenador y contraseña son obligatorios.');
    }

    try {
      const res = await fetch(`${API_BASE}/api/accounts/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUser,
          email: cleanEmail,
          password: cleanPass,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (data?.error) {
          throw new Error(data.error);
        }
        if (res.status === 404 || res.status >= 500) {
          throw new Error(`No se pudo conectar con el servidor Django (HTTP ${res.status}).`);
        }
        throw new Error('Error al registrar la cuenta de entrenador en Django.');
      }

      const user: TrainerUser = {
        username: data?.username || cleanUser,
        email: data?.email || cleanEmail,
        token: data?.token,
      };
      this.setCurrentUser(user);
      await this.syncActiveTeam();
      return user;
    } catch (err: any) {
      battleLogger.error('AUTH', 'Register request failed', err);
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        throw new Error(
          'El servidor Django está despertando en la nube. Por favor espera unos segundos y vuelve a pulsar Registrar Entrenador.'
        );
      }
      throw new Error(err.message || 'Error al registrar la cuenta de entrenador en Django.');
    }
  },

  logout() {
    this.setCurrentUser(null);
  },

  async getTeams(): Promise<{ teams: TrainerTeamData[]; active_slot: number }> {
    const user = this.getCurrentUser();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (user?.username) {
      headers['X-Trainer-User'] = user.username;
    }

    try {
      const res = await fetch(`${API_BASE}/api/accounts/teams/`, { headers });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('pokemon_trainer_teams', JSON.stringify(data.teams));
        return data;
      }
    } catch (e) {
      battleLogger.error('AUTH', 'getTeams failed, using local cache', e);
    }

    const saved = localStorage.getItem('pokemon_trainer_teams');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const active = parsed.find((t: any) => t.is_active)?.slot || 1;
          return { teams: parsed, active_slot: active };
        }
      } catch {}
    }

    const defaultTeams: TrainerTeamData[] = Array.from({ length: 10 }, (_, i) => ({
      slot: i + 1,
      name: `Equipo ${i + 1}`,
      pokemon_list: ['CHARIZARD', 'PIKACHU', 'BLASTOISE', 'LUCARIO', 'GENGAR', 'GARCHOMP'],
      is_active: i === 0,
    }));
    return { teams: defaultTeams, active_slot: 1 };
  },

  async saveTeam(slot: number, name: string, pokemon_list: string[], is_active: boolean): Promise<TrainerTeamData> {
    const user = this.getCurrentUser();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (user?.username) {
      headers['X-Trainer-User'] = user.username;
    }

    try {
      const res = await fetch(`${API_BASE}/api/accounts/teams/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ slot, name, pokemon_list, is_active }),
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {
      battleLogger.error('AUTH', 'saveTeam API failed', e);
    }

    return { slot, name, pokemon_list, is_active };
  },
};
