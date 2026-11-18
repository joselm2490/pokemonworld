import React, { useState, useEffect } from 'react';
import {
  Swords,
  Bot,
  Users,
  Sparkles,
  BookOpen,
  Zap,
  Lock,
  Play,
  RotateCcw,
  Shield,
  Layers,
} from 'lucide-react';
import { AnimatedPokemonSprite } from '../battle/AnimatedPokemonSprite';
import { CreateRoomModal } from './CreateRoomModal';
import { RoomLobbyModal } from './RoomLobbyModal';
import { PokedexService } from '../../services/pokedexService';
import { RoomSummary } from '../../types/stadium';

interface LobbyProps {
  onStartMatch: (roomCode: string, isAi: boolean, role: 'p1' | 'p2') => void;
  onOpenTeamBuilder: () => void;
  onOpenPokedex: () => void;
  onOpenMoves: () => void;
  selectedTeam: string[];
}

export const Lobby: React.FC<LobbyProps> = ({
  onStartMatch,
  onOpenTeamBuilder,
  onOpenPokedex,
  onOpenMoves,
  selectedTeam,
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [openRooms, setOpenRooms] = useState<RoomSummary[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Active Room in Waiting State
  const [waitingRoom, setWaitingRoom] = useState<{
    roomCode: string;
    role: 'p1' | 'p2';
    playerName: string;
  } | null>(null);

  // Password Prompt Modal for Joining Private Rooms
  const [promptPasswordRoom, setPromptPasswordRoom] = useState<RoomSummary | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  const fetchRooms = () => {
    setLoadingRooms(true);
    PokedexService.getOpenRooms()
      .then((data) => {
        setOpenRooms(data);
        setLoadingRooms(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingRooms(false);
      });
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleRoomCreated = (code: string, isAi: boolean, role: 'p1' | 'p2') => {
    setShowCreateModal(false);
    setWaitingRoom({ roomCode: code, role, playerName: 'Anfitrión' });
  };

  const handleDirectJoin = async (roomCode: string, password?: string) => {
    setJoinError(null);
    try {
      const code = roomCode.trim().toUpperCase();
      await PokedexService.joinRoom(code, {
        player_name: 'Entrenador 2',
        password: password || undefined,
        team: selectedTeam.slice(0, 3),
      });

      setPromptPasswordRoom(null);
      setPasswordInput('');
      setWaitingRoom({ roomCode: code, role: 'p2', playerName: 'Entrenador 2' });
    } catch (err: any) {
      setJoinError(err.message || 'Error al unirse a la sala');
    }
  };

  const handleManualJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim().toUpperCase();
    if (!cleanCode) return;
    handleDirectJoin(cleanCode);
  };

  const handlePlayAi = () => {
    const code = 'AI-' + Math.floor(1000 + Math.random() * 9000);
    onStartMatch(code, true, 'p1');
  };

  const handleStartDuelFromRoom = () => {
    if (!waitingRoom) return;
    const { roomCode, role } = waitingRoom;
    setWaitingRoom(null);
    onStartMatch(roomCode, false, role);
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#254d38] via-[#1a3826] to-[#0f2418] text-white flex flex-col justify-between p-3 sm:p-5 select-none font-game">
      {/* Top Header Bar */}
      <div className="max-w-5xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between bg-zinc-900/90 backdrop-blur-md p-3 px-5 rounded-2xl border-2 border-zinc-700 shadow-2xl gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center shadow-md animate-spin-slow">
            <div className="w-2.5 h-2.5 rounded-full bg-white border border-zinc-800" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-white tracking-widest uppercase">
              Pokémon Stadium World
            </h1>
            <p className="text-[8px] text-zinc-400">
              Catálogo Pokédex • 953 Movimientos • Duelos y Salas
            </p>
          </div>
        </div>

        {/* Global Navigation Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenPokedex}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-gradient-to-b from-blue-500 to-blue-700 border-2 border-white/80 text-white text-[9px] font-bold shadow-md hover:brightness-110 active:scale-95 transition-all"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Pokédex</span>
          </button>

          <button
            onClick={onOpenMoves}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-gradient-to-b from-purple-500 to-purple-700 border-2 border-white/80 text-white text-[9px] font-bold shadow-md hover:brightness-110 active:scale-95 transition-all"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Movimientos</span>
          </button>

          <button
            onClick={onOpenTeamBuilder}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 border-2 border-white/80 text-zinc-950 text-[9px] font-bold shadow-md hover:brightness-110 active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Equipo ({selectedTeam.length}/6)</span>
          </button>
        </div>
      </div>

      {/* Main Center Area */}
      <div className="max-w-5xl mx-auto w-full my-auto py-4 flex flex-col items-center gap-5">
        {/* Animated Battle Lineup */}
        <div className="flex items-center justify-center gap-6 sm:gap-14">
          <div className="flex flex-col items-center">
            <AnimatedPokemonSprite species={selectedTeam[0] || 'CHARIZARD'} scale={2.4} />
            <span className="text-[10px] font-bold text-white text-shadow-heavy uppercase mt-1">
              {selectedTeam[0] || 'CHARIZARD'}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center">
            <span className="text-3xl sm:text-4xl font-black text-rose-500 text-shadow-white tracking-widest animate-pulse">
              VS
            </span>
            <span className="text-[9px] font-sans font-bold text-zinc-900 bg-amber-300 px-2.5 py-0.5 rounded-full mt-1 shadow-md">
              Duelos Stadium • Reglas Oficiales
            </span>
          </div>

          <div className="flex flex-col items-center">
            <AnimatedPokemonSprite species={selectedTeam[1] || 'GENGAR'} scale={2.4} />
            <span className="text-[10px] font-bold text-white text-shadow-heavy uppercase mt-1">
              {selectedTeam[1] || 'GENGAR'}
            </span>
          </div>
        </div>

        {/* Main Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full">
          {/* Col 1: Duel Modes (AI & Create Room) */}
          <div className="md:col-span-6 space-y-4">
            {/* Card 1: Single Player AI Battle */}
            <div className="bg-[#1e3d29] border-2 border-emerald-600/60 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Bot className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Duelo vs Bot Entrenador (IA)
                  </h3>
                </div>
                <p className="text-[10px] text-zinc-300 font-sans leading-relaxed mb-3">
                  Combate rápido contra la inteligencia artificial para poner a prueba tu equipo y estrategias.
                </p>
              </div>

              <button
                onClick={handlePlayAi}
                className="w-full h-10 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-700 border-2 border-white text-white font-game text-[10px] font-black tracking-widest uppercase shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Iniciar Duelo vs IA</span>
              </button>
            </div>

            {/* Card 2: Create Custom Room */}
            <div className="bg-[#1e3d29] border-2 border-amber-600/60 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Swords className="w-5 h-5 text-amber-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Crear Sala de Combate
                  </h3>
                </div>
                <p className="text-[10px] text-zinc-300 font-sans leading-relaxed mb-3">
                  Crea una sala personalizada con código, clave opcional y formato 3v3 o 6v6 para invitar a un amigo.
                </p>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full h-10 rounded-full bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700 border-2 border-white text-zinc-950 font-game text-[10px] font-black tracking-widest uppercase shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Configurar y Crear Sala</span>
              </button>
            </div>
          </div>

          {/* Col 2: Open Rooms List & Manual Join */}
          <div className="md:col-span-6 bg-zinc-900/90 border-2 border-zinc-700 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Salas de Duelo en Espera
                  </h3>
                </div>
                <button
                  onClick={fetchRooms}
                  className="p-1 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800 transition-colors"
                  title="Actualizar salas"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${loadingRooms ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Manual Join by Code */}
              <form onSubmit={handleManualJoin} className="flex gap-1.5 mb-3">
                <input
                  type="text"
                  placeholder="CÓDIGO DE SALA"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase text-white placeholder-zinc-500 focus:outline-hidden focus:border-amber-400"
                />
                <button
                  type="submit"
                  disabled={!joinCode.trim()}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[9px] font-bold hover:brightness-110 disabled:opacity-40 transition-all shadow-md"
                >
                  Unirse
                </button>
              </form>

              {/* Open Rooms Table */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar text-xs">
                {openRooms.length === 0 ? (
                  <div className="text-center py-6 text-[10px] text-zinc-500 italic bg-zinc-950/40 rounded-xl border border-zinc-800/80">
                    No hay salas públicas esperando oponente en este momento. ¡Crea una arriba!
                  </div>
                ) : (
                  openRooms.map((r) => (
                    <div
                      key={r.room_code}
                      className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 hover:border-zinc-700 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-white text-xs">{r.room_code}</span>
                          {r.requiere_contrasena && (
                            <span title="Sala Privada">
                              <Lock className="w-3 h-3 text-amber-400" />
                            </span>
                          )}
                          <span className="text-[9px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">
                            {r.pokemon_por_jugador}v{r.pokemon_por_jugador}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 block">
                          Anfitrión: <strong className="text-zinc-200">{r.anfitrion}</strong>
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          if (r.requiere_contrasena) {
                            setPromptPasswordRoom(r);
                          } else {
                            handleDirectJoin(r.room_code);
                          }
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition-all shadow-xs"
                      >
                        Entrar
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {joinError && (
              <p className="text-[10px] text-red-400 mt-2 bg-red-950/40 p-2 rounded-lg border border-red-800/50">
                {joinError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Password Prompt Modal */}
      {promptPasswordRoom && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border-2 border-zinc-700 p-5 rounded-2xl w-full max-w-sm space-y-3 shadow-2xl">
            <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              Sala Privada #{promptPasswordRoom.room_code}
            </h3>
            <p className="text-[10px] text-zinc-400">
              Esta sala requiere contraseña para poder ingresar al duelo.
            </p>
            <input
              type="password"
              placeholder="Contraseña de la sala"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPromptPasswordRoom(null)}
                className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDirectJoin(promptPasswordRoom.room_code, passwordInput)}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-xs font-black shadow-md"
              >
                Ingresar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onRoomCreated={handleRoomCreated}
          selectedTeam={selectedTeam}
        />
      )}

      {/* Waiting Room Modal (Prior to Match) */}
      {waitingRoom && (
        <RoomLobbyModal
          roomCode={waitingRoom.roomCode}
          playerRole={waitingRoom.role}
          playerName={waitingRoom.playerName}
          selectedTeam={selectedTeam}
          onClose={() => setWaitingRoom(null)}
          onStartDuel={handleStartDuelFromRoom}
        />
      )}

      {/* Footer */}
      <div className="max-w-5xl mx-auto w-full pt-2 flex flex-col sm:flex-row items-center justify-between text-[9px] text-zinc-400 gap-1 border-t border-zinc-800/60">
        <span>Pokémon Stadium World System • Pokédex & Duelos</span>
        <span className="text-zinc-500">
          Gen 1 - Gen 9 Engine Integrado
        </span>
      </div>
    </div>
  );
};
