import React, { useState } from 'react';
import {
  Trophy,
  X,
  Swords,
  Bot,
  Users,
  Play,
  Lock,
  RotateCcw,
  Sparkles,
  Shield,
  Clock,
  PlusCircle,
  LogIn,
} from 'lucide-react';
import { RoomSummary } from '../../types/stadium';
import { PokeBallGraphic } from '../common/PokeBallGraphic';

interface ArenaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartAiBattle: () => void;
  onOpenCreateRoom: () => void;
  onOpenAuth: () => void;
  onOpenPokedex: () => void;
  trainerName?: string;
  isLoggedIn?: boolean;
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
  onOpenAuth,
  onOpenPokedex,
  trainerName = 'Entrenador',
  isLoggedIn = false,
  openRooms,
  loadingRooms,
  onRefreshRooms,
  onJoinRoom,
  joinError,
  selectedTeamCount,
}) => {
  const [activeTab, setActiveTab] = useState<'banners' | 'rooms'>('banners');
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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 select-none font-sans animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden pb-12">
        {/* Top Header: Solid Black with Gold Trophy & ARENA Title */}
        <div className="bg-[#14171a] text-white px-5 py-3 flex items-center justify-center relative">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-[#f5d433] fill-[#f5d433]" />
            <h2 className="text-xl font-black uppercase tracking-wider font-sans">
              ARENA
            </h2>
          </div>
        </div>

        {/* Modal Scrollable Content: 4 Banners matching Reference */}
        <div className="p-3.5 space-y-3 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* ================= BANNER 1: INGRESA / REGISTRO (LIME GREEN WITH POKÉBALL) ================= */}
          <div
            onClick={() => {
              onClose();
              onOpenAuth();
            }}
            className="relative h-28 rounded-xl overflow-hidden bg-gradient-to-r from-[#d9f977] via-[#e2fa88] to-[#ebfc9d] border-2 border-[#b5db44] shadow-md cursor-pointer group hover:brightness-105 active:scale-[0.99] transition-all flex items-center px-4"
          >
            {/* Background Tech Halftone Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#b2d93e_1.5px,transparent_1.5px)] [background-size:12px_12px] opacity-40 pointer-events-none" />

            {/* Left Content */}
            <div className="relative z-10 flex flex-col justify-between h-full py-2.5">
              <div>
                <div className="inline-block bg-[#162024] text-[#42e896] text-[8px] font-black tracking-widest px-2 py-0.5 rounded-sm uppercase">
                  {isLoggedIn ? 'PERFIL CONECTADO' : 'ACCESO DE ENTRENADOR'}
                </div>
                <h3 className="text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(20,30,20,0.85)] tracking-tighter uppercase italic leading-none pt-1">
                  INGRESA /
                </h3>
                <h3 className="text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(20,30,20,0.85)] tracking-tighter uppercase italic leading-none">
                  REGISTRO
                </h3>
              </div>

              {/* Bottom Ribbon */}
              <div className="bg-[#111718] text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm flex items-center gap-1.5 w-fit shadow-xs">
                <span className={`w-2 h-2 rounded-full ${isLoggedIn ? 'bg-[#42e896]' : 'bg-[#d9f977]'} animate-pulse`} />
                <span className="truncate max-w-[170px]">
                  {isLoggedIn ? `ENTRENADOR: ${trainerName}` : 'INICIAR SESIÓN / REGISTRO'}
                </span>
              </div>
            </div>

            {/* Pokéball Graphic on Right (Replaces the doll/character) */}
            <div className="absolute right-2 -bottom-0.5 w-26 h-26 flex items-center justify-center pointer-events-none group-hover:scale-110 transition-transform duration-300">
              <PokeBallGraphic size={90} glow={true} />
            </div>
          </div>

          {/* ================= BANNER 2: FORTH BATTLE (DARK NAVY / PVP MULTIPLAYER) ================= */}
          <div
            onClick={() => setActiveTab(activeTab === 'rooms' ? 'banners' : 'rooms')}
            className="relative h-28 rounded-xl overflow-hidden bg-gradient-to-r from-[#17202d] via-[#1c2738] to-[#121a24] border-2 border-slate-700 shadow-md cursor-pointer group hover:brightness-110 active:scale-[0.99] transition-all flex items-center px-4"
          >
            {/* Cyber Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#253346_1px,transparent_1px),linear-gradient(to_bottom,#253346_1px,transparent_1px)] bg-[size:16px_16px] opacity-30 pointer-events-none" />

            {/* Left Content */}
            <div className="relative z-10 flex flex-col justify-between h-full py-2.5">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">
                  FORTH BATTLE
                </h3>
                <span className="text-[9px] font-mono text-slate-400 block mt-1">
                  SALAS MULTIJUGADOR 6v6 • ONLINE
                </span>
              </div>

              {/* Bottom Ribbon */}
              <div className="flex items-center gap-2">
                <div className="bg-black/90 text-slate-200 text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm flex items-center gap-1 w-fit border border-slate-700">
                  <Clock className="w-2.5 h-2.5 text-amber-400" />
                  <span>ENDS IN 0d 05:48:38</span>
                </div>
                <span className="text-[9px] font-bold text-cyan-400 underline">
                  {activeTab === 'rooms' ? 'Ocultar salas ▲' : 'Ver salas ▼'}
                </span>
              </div>
            </div>

            {/* Right Emblem Icons */}
            <div className="absolute right-4 flex items-center gap-2 pointer-events-none">
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/60 flex items-center justify-center text-white">
                <Swords className="w-5 h-5 text-white" />
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 border-2 border-white/80 flex items-center justify-center text-white">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          {/* Expandable Rooms List & Room Creation when Forth Battle is toggled */}
          {activeTab === 'rooms' && (
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-300 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200 text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Salas Públicas en Espera ({openRooms.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCreateRoom();
                    }}
                    className="flex items-center gap-1 text-[10px] font-black text-emerald-700 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>Crear Sala</span>
                  </button>
                  <button
                    onClick={onRefreshRooms}
                    className="p-1 text-slate-500 hover:text-slate-900 rounded"
                    title="Actualizar"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${loadingRooms ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Direct Code Join */}
              <form onSubmit={handleCodeSubmit} className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="CÓDIGO DE SALA"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono uppercase text-slate-800 focus:outline-hidden focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={!inputCode.trim()}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold disabled:opacity-40 shadow-xs cursor-pointer"
                >
                  Unirse
                </button>
              </form>

              {joinError && (
                <p className="text-[10px] text-rose-600 bg-rose-50 p-1.5 rounded border border-rose-200">
                  {joinError}
                </p>
              )}

              <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                {openRooms.length === 0 ? (
                  <p className="text-[10px] text-slate-500 text-center py-3 italic">
                    No hay salas esperando rival. ¡Sé el primero en crear una!
                  </p>
                ) : (
                  openRooms.map((r) => (
                    <div
                      key={r.room_code}
                      className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 text-xs">{r.room_code}</span>
                          {r.requiere_contrasena && <Lock className="w-3 h-3 text-amber-500" />}
                          <span className="text-[8px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-mono">
                            {r.pokemon_por_jugador}v{r.pokemon_por_jugador}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-500 block">
                          Host: <strong>{r.anfitrion}</strong>
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
                        className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-[10px] font-bold cursor-pointer"
                      >
                        Entrar
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ================= BANNER 3: TRAINING BATTLE (PURPLE GRID / VS IA 6v6) ================= */}
          <div
            onClick={() => {
              onClose();
              onStartAiBattle();
            }}
            className="relative h-24 rounded-xl overflow-hidden bg-gradient-to-r from-[#7a52c7] via-[#875fd3] to-[#9973e2] border-2 border-[#603baf] shadow-md cursor-pointer group hover:brightness-105 active:scale-[0.99] transition-all flex items-center px-4"
          >
            {/* Purple Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff30_1px,transparent_1px),linear-gradient(to_bottom,#ffffff30_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />

            {/* Left Typography */}
            <div className="relative z-10">
              <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-sm">
                TRAINING
              </h3>
              <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-sm">
                BATTLE
              </h3>
              <span className="text-[9px] font-bold text-purple-200 tracking-wider uppercase block mt-1">
                COMBATE VS IA (6 VS 6)
              </span>
            </div>

            {/* Sparring Stick Figures on Right */}
            <div className="absolute right-4 flex items-center gap-2 pointer-events-none text-white opacity-95">
              <div className="flex flex-col items-center">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white mb-0.5" />
                <div className="w-1 h-5 bg-white" />
              </div>
              <div className="text-2xl font-black italic text-white/80">⚡</div>
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full border-2 border-white mb-0.5" />
                <div className="w-1 h-4 bg-white" />
              </div>
            </div>
          </div>

          {/* ================= BANNER 4: POKÉDEX (CYAN GRID / NATIONAL DEX) ================= */}
          <div
            onClick={() => {
              onClose();
              onOpenPokedex();
            }}
            className="relative h-24 rounded-xl overflow-hidden bg-gradient-to-r from-[#44c4e8] via-[#52d2f4] to-[#68defd] border-2 border-[#2fa8cb] shadow-md cursor-pointer group hover:brightness-105 active:scale-[0.99] transition-all flex items-center px-4"
          >
            {/* Cyan Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff30_1px,transparent_1px),linear-gradient(to_bottom,#ffffff30_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />

            {/* Left Typography */}
            <div className="relative z-10">
              <h3 className="text-3xl font-black text-white italic tracking-tight leading-none drop-shadow-sm font-sans">
                Pokédex
              </h3>
              <span className="text-[9px] font-bold text-[#0c4756] tracking-wider uppercase block mt-1">
                CATÁLOGO NACIONAL • GUÍA TÁCTICA
              </span>
            </div>

            {/* White Circular Stadium Medals on Right */}
            <div className="absolute right-4 flex items-center -space-x-2 pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-slate-200">
                <Shield className="w-6 h-6 text-[#2ba7ca]" />
              </div>
              <div className="w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center border-2 border-slate-200">
                <Sparkles className="w-5 h-5 text-[#2ba7ca]" />
              </div>
            </div>
          </div>
        </div>

        {/* Private Room Password Sub-Dialog */}
        {selectedPrivateRoom && (
          <div className="p-3 bg-slate-900 text-white border-t border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-300">
              <span>Clave para #{selectedPrivateRoom.room_code}</span>
              <button onClick={() => setSelectedPrivateRoom(null)}>✕</button>
            </div>
            <form onSubmit={handlePasswordSubmit} className="flex gap-2">
              <input
                type="password"
                placeholder="Contraseña..."
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                className="flex-1 bg-black border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-amber-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer"
              >
                OK
              </button>
            </form>
          </div>
        )}

        {/* Floating Dark Circular Close Button overlapping bottom center */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-[#1b1f24] hover:bg-black border-3 border-white text-white flex items-center justify-center shadow-2xl transition-transform active:scale-90 cursor-pointer z-20"
          title="Cerrar Menú Principal"
        >
          <X className="w-5 h-5 text-white" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};
