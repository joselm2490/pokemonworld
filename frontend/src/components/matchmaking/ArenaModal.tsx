import React, { useState } from 'react';
import {
  X,
  Swords,
  Bot,
  Users,
  Play,
  Lock,
  RotateCcw,
  Sparkles,
  Shield,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { RoomSummary } from '../../types/stadium';

interface ArenaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartAiBattle: () => void;
  onOpenCreateRoom: () => void;
  openRooms: RoomSummary[];
  loadingRooms: boolean;
  onRefreshRooms: () => void;
  onJoinRoom: (roomCode: string, password?: string) => void;
  joinError: string | null;
  selectedTeamCount: number;
}

export const ArenaModal: React.FC<ArenaModalProps> = ({
  isOpen,
  onClose,
  onStartAiBattle,
  onOpenCreateRoom,
  openRooms,
  loadingRooms,
  onRefreshRooms,
  onJoinRoom,
  joinError,
  selectedTeamCount,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [selectedPrivateRoom, setSelectedPrivateRoom] = useState<RoomSummary | null>(null);
  const [roomPassword, setRoomPassword] = useState('');

  if (!isOpen) return null;

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputCode.trim().toUpperCase();
    if (!clean) return;
    onJoinRoom(clean);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrivateRoom) return;
    onJoinRoom(selectedPrivateRoom.room_code, roomPassword);
    setSelectedPrivateRoom(null);
    setRoomPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none font-game animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-[#111822] via-[#0d121a] to-[#070a0e] border-2 border-emerald-500/60 w-full max-w-xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#16202c]/95 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                Arena de Combate Pokémon
              </h2>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              MODOS DE DUELO • <span className="text-emerald-400 font-bold">{selectedTeamCount}/6 Pokémon en combate</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
          {/* Mode 1: Single Player AI Battle */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-slate-950/90 border-2 border-emerald-500/50 hover:border-emerald-400 rounded-2xl p-4 shadow-xl transition-all">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Duelo vs Bot Entrenador (IA)
                  </h3>
                  <span className="text-[9px] font-mono text-emerald-400">
                    6v6 Aleatorio • Sin Espera • Instantáneo
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-300 font-sans leading-relaxed mb-3">
              Enfrentamiento individual contra la IA con mecánicas oficiales de Pokémon Essentials. Ambos entrenadores reciben 6 Pokémon aleatorios en su fase final.
            </p>

            <button
              onClick={() => {
                onClose();
                onStartAiBattle();
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Combatir contra la IA</span>
            </button>
          </div>

          {/* Mode 2: Create Custom Room */}
          <div className="bg-gradient-to-r from-amber-950/30 via-slate-900/90 to-slate-950/90 border-2 border-amber-500/50 hover:border-amber-400 rounded-2xl p-4 shadow-xl transition-all">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Swords className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Crear Sala Multijugador (PvP)
                  </h3>
                  <span className="text-[9px] font-mono text-amber-300">
                    Estadio Personalizado • Invita a un Amigo
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-300 font-sans leading-relaxed mb-3">
              Crea una sala con código único, contraseña de acceso opcional y formato 6v6 para combatir contra otro jugador en tiempo real.
            </p>

            <button
              onClick={() => {
                onClose();
                onOpenCreateRoom();
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:brightness-110 text-zinc-950 font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Configurar y Crear Sala</span>
            </button>
          </div>

          {/* Mode 3: Join by Code */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Unirse mediante Código de Sala
            </span>

            <form onSubmit={handleCodeSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="EJ: STADIUM-1234"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono uppercase text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-400"
              />
              <button
                type="submit"
                disabled={!inputCode.trim()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs uppercase transition-all shadow-md cursor-pointer"
              >
                Unirse
              </button>
            </form>

            {joinError && (
              <p className="text-[10px] text-rose-400 bg-rose-950/40 p-2 rounded-lg border border-rose-800/40 font-mono">
                {joinError}
              </p>
            )}
          </div>

          {/* Mode 4: Public Rooms Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                  Salas Públicas en Espera
                </span>
              </div>

              <button
                onClick={onRefreshRooms}
                className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
                title="Actualizar lista de salas"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${loadingRooms ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
              {openRooms.length === 0 ? (
                <div className="text-center py-6 text-[10px] text-slate-500 italic bg-slate-950/50 rounded-xl border border-slate-800/70">
                  No hay salas públicas esperando oponente en este momento. ¡Crea una arriba!
                </div>
              ) : (
                openRooms.map((r) => (
                  <div
                    key={r.room_code}
                    className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-white text-xs">{r.room_code}</span>
                        {r.requiere_contrasena && (
                          <span title="Requiere contraseña">
                            <Lock className="w-3 h-3 text-amber-400" />
                          </span>
                        )}
                        <span className="text-[8px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono">
                          {r.pokemon_por_jugador}v{r.pokemon_por_jugador}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 block font-sans">
                        Anfitrión: <strong className="text-slate-200">{r.anfitrion}</strong>
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        if (r.requiere_contrasena) {
                          setSelectedPrivateRoom(r);
                        } else {
                          onClose();
                          onJoinRoom(r.room_code);
                        }
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-xs"
                    >
                      Entrar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Private Room Password Dialog */}
        {selectedPrivateRoom && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
              <span>Sala Privada #{selectedPrivateRoom.room_code}</span>
              <button
                onClick={() => setSelectedPrivateRoom(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit} className="flex gap-2">
              <input
                type="password"
                placeholder="Contraseña de la sala..."
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
              >
                Confirmar
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
