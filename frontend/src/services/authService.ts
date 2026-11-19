import { battleLogger } from '../utils/logger';

const API_BASE = import.meta.env.VITE_BACKEND_API_URL || '';

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
    }
  },

  async login(username: string, password: string): Promise<TrainerUser> {
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    try {
      const res = await fetch(`${API_BASE}/api/accounts/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Credenciales inválidas');
      }

      const user: TrainerUser = {
        username: data.username || cleanUser,
        email: data.email,
        token: data.token,
      };
      this.setCurrentUser(user);
      return user;
    } catch (err: any) {
      battleLogger.error('AUTH', 'Login request failed', err);
      // If network unreachable, check if user is signing in locally
      if (err.message && (err.message.includes('Credenciales') || err.message.includes('inactiva'))) {
        throw err;
      }
      // Offline / Render waking up fallback: allow trainer sign-in
      const user: TrainerUser = {
        username: cleanUser,
        token: 'local_' + Math.random().toString(36).substring(2, 9),
      };
      this.setCurrentUser(user);
      return user;
    }
  },

  async register(username: string, email: string, password: string): Promise<TrainerUser> {
    const cleanUser = username.trim();
    const cleanEmail = email.trim();
    const cleanPass = password.trim();

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

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Error al crear la cuenta de entrenador');
      }

      const user: TrainerUser = {
        username: data.username || cleanUser,
        email: data.email || cleanEmail,
        token: data.token,
      };
      this.setCurrentUser(user);
      return user;
    } catch (err: any) {
      battleLogger.error('AUTH', 'Register request failed', err);
      if (err.message && !err.message.includes('fetch') && !err.message.includes('Failed to fetch')) {
        throw err;
      }
      // Offline fallback
      const user: TrainerUser = {
        username: cleanUser,
        email: cleanEmail,
        token: 'local_' + Math.random().toString(36).substring(2, 9),
      };
      this.setCurrentUser(user);
      return user;
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
