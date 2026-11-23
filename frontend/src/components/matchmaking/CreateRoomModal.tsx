import React, { useState } from 'react';
import { X, Lock, Swords, ArrowLeft } from 'lucide-react';
import { PokedexService } from '../../services/pokedexService';
import { AuthService } from '../../services/authService';
import { StaticPokemonImage } from '../common/StaticPokemonImage';

interface CreateRoomModalProps {
  onClose: () => void;
  onRoomCreated: (roomCode: string, isAi: boolean, role: 'p1' | 'p2') => void;
  selectedTeam: string[];
  inline?: boolean;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  onClose,
  onRoomCreated,
  selectedTeam,
  inline = false,
}) => {
  const currentUser = AuthService.getCurrentUser();
  const hostName = currentUser?.username || localStorage.getItem('pokemon_trainer_name') || 'Entrenador';

  const [password, setPassword] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowLegendaries, setAllowLegendaries] = useState(false);
  const [genFilter, setGenFilter] = useState('todas');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedTeam.length !== 6) {
      setError('Debes completar tu equipo líder con 6 Pokémon para crear una sala.');
      return;
    }

    setLoading(true);
    try {
      const res = await PokedexService.createRoom({
        player_name: hostName,
        password: isPrivate ? password.trim() : undefined,
        pokemon_per_player: 6,
        format_settings: {
          generaciones: [genFilter],
          permitir_legendarios: allowLegendaries,
          modo: 'estandar',
        },
        team: selectedTeam.slice(0, 6),
      });

      onRoomCreated(res.room_code, false, 'p1');
    } catch (err: any) {
      setError(err.message || 'Error al crear la sala');
      setLoading(false);
    }
  };

  if (inline) {
    return (
      <div className="flex-1 flex flex-col overflow-y-auto pr-1 custom-scrollbar space-y-2.5 font-sans select-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Volver a Salas"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 leading-tight flex items-center gap-1.5">
                <Swords className="w-4 h-4 text-amber-500" />
                <span>Crear Sala de Duelo</span>
              </h2>
              <p className="text-[10px] text-slate-500">
                Anfitrión: <strong className="text-emerald-700">{hostName}</strong> • Duelo 6 vs 6
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-medium p-2.5 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2.5 text-xs">
          {/* System-Assigned Code & Fixed 6v6 Format */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between">
              <label className="text-slate-500 font-bold block mb-1 text-[10px] uppercase">
                Código de Sala
              </label>
              <div className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 font-mono font-bold text-center text-[10px] select-none">
                Automático (6 dígitos)
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between">
              <label className="text-slate-500 font-bold block mb-1 text-[10px] uppercase">
                Formato
              </label>
              <div className="w-full bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1.5 text-emerald-800 font-black text-center text-[11px]">
                Duelo 6 vs 6
              </div>
            </div>
          </div>

          {/* My Leader Team Preview */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                Tu Equipo Líder ({selectedTeam.length}/6)
              </span>
              <span className="text-[9px] text-slate-400">Oculto para el rival</span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {selectedTeam.slice(0, 6).map((sp, i) => (
                <div
                  key={i}
                  className="aspect-square bg-white border border-slate-200 rounded-lg flex items-center justify-center p-0.5 overflow-hidden"
                  title={sp}
                >
                  <StaticPokemonImage species={sp} alt={sp} className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
          </div>

          {/* Password Protection */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-0"
              />
              <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                Sala Privada (Requiere Contraseña)
              </span>
            </label>
            {isPrivate && (
              <input
                type="password"
                placeholder="Ingresa contraseña de acceso a la sala"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-semibold text-xs focus:outline-hidden focus:border-emerald-500"
                required={isPrivate}
              />
            )}
          </div>

          {/* Format Rules */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
              Reglas y Filtros de Partida
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-slate-500 block text-[10px] font-bold uppercase mb-1">
                  Generaciones
                </label>
                <select
                  value={genFilter}
                  onChange={(e) => setGenFilter(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-slate-800 text-[11px] font-medium"
                >
                  <option value="todas">Todas las Generaciones</option>
                  <option value="gen1">Solo Gen 1 (Kanto)</option>
                  <option value="gen2">Gen 1 - 2 (Johto)</option>
                  <option value="gen3">Gen 1 - 3 (Hoenn)</option>
                  <option value="gen4">Gen 1 - 4 (Sinnoh)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-500 block text-[10px] font-bold uppercase mb-1">
                  Legendarios
                </label>
                <select
                  value={allowLegendaries ? 'si' : 'no'}
                  onChange={(e) => setAllowLegendaries(e.target.value === 'si')}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-slate-800 text-[11px] font-medium"
                >
                  <option value="no">Prohibidos (Sin Legendarios)</option>
                  <option value="si">Permitidos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-3 bg-gradient-to-r from-[#32f59b] via-[#2ce692] to-[#25db89] hover:brightness-105 text-slate-950 font-black text-xs rounded-xl shadow-xs border border-[#19c778] transition-all flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Creando...' : 'Crear Sala'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 font-game select-none animate-in fade-in duration-150">
      <div className="bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border-2 border-zinc-700 w-full max-w-lg rounded-3xl p-6 shadow-2xl text-white space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider leading-tight">
                Crear Sala de Duelo Stadium
              </h2>
              <p className="text-[10px] text-zinc-400">
                Anfitrión: <strong className="text-emerald-400">{hostName}</strong> • Duelo 6 vs 6
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-950/80 border border-red-500/50 text-red-200 text-xs p-3 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* System-Assigned Code & Fixed 6v6 Format */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-400 font-bold block mb-1 text-[11px] uppercase">
                Código de Sala
              </label>
              <div className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold text-center">
                Automático (6 dígitos)
              </div>
            </div>

            <div>
              <label className="text-zinc-400 font-bold block mb-1 text-[11px] uppercase">
                Formato de Combate
              </label>
              <div className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2 text-emerald-400 font-bold text-center">
                Duelo Completo 6 vs 6
              </div>
            </div>
          </div>

          {/* My Leader Team Preview */}
          <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Tu Equipo Líder ({selectedTeam.length}/6)
              </span>
              <span className="text-[10px] text-zinc-500">Oculto para el rival</span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {selectedTeam.slice(0, 6).map((sp, i) => (
                <div
                  key={i}
                  className="aspect-square bg-zinc-900 border border-zinc-700 rounded-xl flex items-center justify-center p-1 overflow-hidden"
                  title={sp}
                >
                  <StaticPokemonImage species={sp} alt={sp} className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
          </div>

          {/* Password Protection */}
          <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span className="font-bold text-zinc-300 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-zinc-400" />
                  Sala Privada (Requiere Contraseña)
                </span>
              </label>
            </div>
            {isPrivate && (
              <input
                type="password"
                placeholder="Ingresa contraseña de acceso a la sala"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white font-semibold focus:outline-hidden focus:border-amber-400"
                required={isPrivate}
              />
            )}
          </div>

          {/* Format Rules */}
          <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-2.5">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
              Reglas y Filtros de Partida:
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-zinc-400 block text-[10px] uppercase mb-1">
                  Generaciones Permitidas
                </label>
                <select
                  value={genFilter}
                  onChange={(e) => setGenFilter(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200"
                >
                  <option value="todas">Todas las Generaciones</option>
                  <option value="gen1">Solo Gen 1 (Kanto)</option>
                  <option value="gen2">Gen 1 - 2 (Johto)</option>
                  <option value="gen3">Gen 1 - 3 (Hoenn)</option>
                  <option value="gen4">Gen 1 - 4 (Sinnoh)</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-400 block text-[10px] uppercase mb-1">
                  Pokémon Legendarios
                </label>
                <select
                  value={allowLegendaries ? 'si' : 'no'}
                  onChange={(e) => setAllowLegendaries(e.target.value === 'si')}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200"
                >
                  <option value="no">🚫 Prohibidos (Sin Legendarios)</option>
                  <option value="si">✅ Permitidos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black rounded-xl shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Creando Sala...' : 'Crear Sala y Esperar Oponente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
