import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Swords,
  PlusCircle,
  Users,
  Lock,
  RotateCcw,
  Shield,
  ArrowLeft,
  Sparkles,
  LogIn,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { AuthService, TrainerUser } from '../services/authService';
import { PokedexService } from '../services/pokedexService';
import { RoomSummary } from '../types/stadium';
import { CreateRoomModal } from '../components/matchmaking/CreateRoomModal';
import { RoomLobbyModal } from '../components/matchmaking/RoomLobbyModal';
import { BattleArena } from '../components/battle/BattleArena';
import { useBattle } from '../hooks/useBattle';
import { PokeBallGraphic } from '../components/common/PokeBallGraphic';

export const RoomPage: React.FC = () => {
  const navigate = useNavigate();
  const { roomCode: paramRoomCode } = useParams<{ roomCode?: string }>();

  const [currentUser] = useState<TrainerUser | null>(() => AuthService.getCurrentUser());
  const [openRooms, setOpenRooms] = useState<RoomSummary[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [inputCode, setInputCode] = useState(paramRoomCode || '');
  const [inputPassword, setInputPassword] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeWaitingRoom, setActiveWaitingRoom] = useState<{
    roomCode: string;
    role: 'p1' | 'p2';
    playerName: string;
  } | null>(paramRoomCode ? { roomCode: paramRoomCode.toUpperCase(), role: 'p2', playerName: currentUser?.username || 'Entrenador' } : null);

  // Active PvP Battle State
  const [activeMatch, setActiveMatch] = useState<{
    roomCode: string;
    role: 'p1' | 'p2';
  } | null>(null);

  // User's active team (6 Pokemon)
  const [team] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pokemon_user_team');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 6);
        }
      }
    } catch {}
    return ['CHARIZARD', 'PIKACHU', 'BLASTOISE', 'LUCARIO', 'GENGAR', 'GARCHOMP'];
  });

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
    const interval = setInterval(() => {
      if (!document.hidden && !activeWaitingRoom && !activeMatch) {
        fetchRooms();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [activeWaitingRoom, activeMatch]);

  const handleJoinByCode = async (codeToJoin?: string, passwordToUse?: string) => {
    setJoinError(null);
    const code = (codeToJoin || inputCode).trim().toUpperCase();
    if (!code) {
      setJoinError('Por favor ingresa un código de sala válido.');
      return;
    }

    try {
      const res = await PokedexService.joinRoom(code, {
        player_name: currentUser?.username || 'Entrenador',
        password: passwordToUse || inputPassword || undefined,
        team: team,
      });

      setActiveWaitingRoom({
        roomCode: res.room_code || code,
        role: res.role || 'p2',
        playerName: currentUser?.username || 'Entrenador',
      });
    } catch (err: any) {
      setJoinError(err.message || 'No se pudo ingresar a la sala.');
    }
  };

  const handleRoomCreated = (roomCode: string, _isAi: boolean, role: 'p1' | 'p2') => {
    setIsCreateModalOpen(false);
    setActiveWaitingRoom({
      roomCode,
      role,
      playerName: currentUser?.username || 'Entrenador',
    });
  };

  const handleStartDuelFromLobby = () => {
    if (activeWaitingRoom) {
      setActiveMatch({
        roomCode: activeWaitingRoom.roomCode,
        role: activeWaitingRoom.role,
      });
      setActiveWaitingRoom(null);
    }
  };

  // PvP Battle Hook
  const battle = useBattle({
    roomCode: activeMatch?.roomCode || '',
    isAi: false,
    playerRole: activeMatch?.role || 'p1',
    customTeam: team,
  });

  // If in battle, render BattleArena
  if (activeMatch && battle.battleState) {
    return (
      <BattleArena
        battleState={battle.battleState}
        playerRole={activeMatch.role}
        isAiMatch={false}
        roomCode={activeMatch.roomCode}
        currentMessage={battle.currentMessage}
        isWaitingForTurn={battle.isWaitingForTurn}
        activeAttacker={battle.activeAttacker}
        activeHitTarget={battle.activeHitTarget}
        activeEffect={battle.activeEffect}
        switchingState={battle.switchingState}
        chatMessages={battle.chatMessages}
        onSendMessage={battle.sendChatMessage}
        trainerName={currentUser?.username || 'blue'}
        onSelectAction={battle.selectAction}
        onSwitchFainted={battle.switchFainted}
        onRematch={() => {}}
        onLeaveRoom={() => {
          setActiveMatch(null);
          navigate('/room');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f4f7] text-slate-800 p-3 sm:p-6 font-sans select-none flex flex-col">
      {/* Top Header */}
      <header className="max-w-5xl w-full mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-300">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 hover:text-slate-950 transition-colors cursor-pointer shadow-xs"
            title="Volver a la Arena"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-amber-500" />
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-900">
                SALAS MULTIJUGADOR (FORTH BATTLE)
              </h1>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Crea una sala de duelo o únete para combatir contra otros entrenadores en tiempo real.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2 bg-white border border-slate-300 px-3 py-1.5 rounded-xl shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800">{currentUser.username}</span>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <LogIn className="w-4 h-4" />
              <span>Iniciar Sesión</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl w-full mx-auto flex-1 flex flex-col py-5 space-y-5">
        {!currentUser ? (
          /* Warning: Auth Required for PvP */
          <div className="bg-white border-2 border-amber-400 rounded-3xl p-6 sm:p-8 text-center max-w-lg mx-auto shadow-xl space-y-4 my-auto">
            <PokeBallGraphic size={80} />
            <div className="space-y-1.5">
              <h2 className="text-xl font-black uppercase tracking-wider text-slate-900">
                Cuenta de Entrenador Requerida
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Para participar en duelos multijugador Forth Battle, crear salas personalizadas y registrar tus victorias, debes identificarte con tu perfil oficial de entrenador.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => navigate('/login')}
                className="py-3 px-4 bg-gradient-to-r from-[#d9f977] via-[#b6f04d] to-[#99e334] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer border border-[#b6f04d]"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => navigate('/register')}
                className="py-3 px-4 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md active:scale-95 transition-all cursor-pointer"
              >
                Crear Cuenta
              </button>
            </div>
          </div>
        ) : (
          /* Logged In Room Hub View */
          <>
            {/* Quick Actions Bar: Create Room & Join by Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Create Room */}
              <div className="bg-white/95 border border-slate-300/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="inline-block bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider mb-2">
                    Anfitrión de la Arena
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-wider text-slate-900 mb-1">
                    Crear Sala de Combate
                  </h3>
                  <p className="text-xs text-slate-600 mb-4">
                    Configura una sala pública o privada (con contraseña) en formato 6 vs 6 y comparte el código con tu rival.
                  </p>
                </div>

                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-105 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Crear Nueva Sala de Duelo</span>
                </button>
              </div>

              {/* Card 2: Join by Code */}
              <div className="bg-white/95 border border-slate-300/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="inline-block bg-sky-100 text-sky-800 border border-sky-300 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider mb-2">
                    Acceso Directo
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-wider text-slate-900 mb-1">
                    Unirse con Código
                  </h3>
                  <p className="text-xs text-slate-600 mb-3">
                    ¿Te invitaron a una sala? Escribe su código de 6 u 8 caracteres para entrar.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleJoinByCode();
                  }}
                  className="space-y-2"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ej. STADIUM-4821"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-sky-500 uppercase shadow-inner"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0 shadow-xs"
                    >
                      Unirse
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {joinError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs shadow-xs">
                {joinError}
              </div>
            )}

            {/* Section: Live Public Rooms */}
            <div className="bg-white/95 border border-slate-300/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                    Salas Públicas en Espera
                  </h2>
                </div>
                <button
                  onClick={fetchRooms}
                  disabled={loadingRooms}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition-colors cursor-pointer flex items-center gap-1 text-xs"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${loadingRooms ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Actualizar</span>
                </button>
              </div>

              {loadingRooms && openRooms.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Buscando salas de combate activas...
                </div>
              ) : openRooms.length === 0 ? (
                <div className="py-10 text-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                  <Swords className="w-8 h-8 text-slate-400 opacity-60" />
                  <span className="font-semibold text-slate-700">No hay salas públicas abiertas en este momento.</span>
                  <span className="text-[11px] text-slate-500">
                    ¡Sé el primero creando una sala con el botón de arriba!
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {openRooms.map((room) => (
                    <div
                      key={room.room_code}
                      className="bg-slate-50 border border-slate-200 hover:border-amber-400 rounded-2xl p-3.5 flex flex-col justify-between gap-3 transition-all group shadow-2xs hover:shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-black text-amber-600">
                            #{room.room_code}
                          </span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono font-bold">
                            {room.jugadores_actuales}/{room.max_jugadores || 2} Jugadores
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          Anfitrión: {room.anfitrion}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span>Formato: {room.pokemon_por_jugador}v{room.pokemon_por_jugador}</span>
                          {room.requiere_contrasena && (
                            <span className="flex items-center gap-0.5 text-rose-600 font-bold">
                              <Lock className="w-2.5 h-2.5" /> Con Clave
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleJoinByCode(room.room_code)}
                        className="w-full py-2 bg-slate-900 hover:bg-amber-400 hover:text-slate-950 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center shadow-xs"
                      >
                        Unirse al Duelo
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Create Room Modal */}
      {isCreateModalOpen && (
        <CreateRoomModal
          onClose={() => setIsCreateModalOpen(false)}
          onRoomCreated={handleRoomCreated}
          selectedTeam={team}
        />
      )}

      {/* Room Lobby Waiting Modal */}
      {activeWaitingRoom && (
        <RoomLobbyModal
          roomCode={activeWaitingRoom.roomCode}
          playerRole={activeWaitingRoom.role}
          playerName={activeWaitingRoom.playerName}
          selectedTeam={team}
          onClose={() => setActiveWaitingRoom(null)}
          onStartDuel={handleStartDuelFromLobby}
        />
      )}
    </div>
  );
};
