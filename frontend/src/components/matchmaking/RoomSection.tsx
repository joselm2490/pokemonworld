import React, { useState, useEffect } from 'react';
import {
  Swords,
  PlusCircle,
  Users,
  Lock,
  RotateCcw,
  AlertCircle,
  LogIn,
} from 'lucide-react';
import { AuthService, TrainerUser } from '../../services/authService';
import { PokedexService } from '../../services/pokedexService';
import { RoomSummary } from '../../types/stadium';
import { CreateRoomModal } from './CreateRoomModal';
import { RoomLobbyModal } from './RoomLobbyModal';
import { BattleArena } from '../battle/BattleArena';
import { useBattle } from '../../hooks/useBattle';
import { PokeBallGraphic } from '../common/PokeBallGraphic';

interface RoomSectionProps {
  selectedTeam: string[];
  currentUser: TrainerUser | null;
  initialRoomCode?: string;
  onGoToCajas?: () => void;
  onOpenAuth?: () => void;
}

export const RoomSection: React.FC<RoomSectionProps> = ({
  selectedTeam,
  currentUser,
  initialRoomCode,
  onGoToCajas,
  onOpenAuth,
}) => {
  const [openRooms, setOpenRooms] = useState<RoomSummary[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [inputCode, setInputCode] = useState(initialRoomCode || '');
  const [joinError, setJoinError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeWaitingRoom, setActiveWaitingRoom] = useState<{
    roomCode: string;
    role: 'p1' | 'p2';
    playerName: string;
  } | null>(
    initialRoomCode
      ? {
          roomCode: initialRoomCode.toUpperCase(),
          role: 'p2',
          playerName: currentUser?.username || 'Entrenador',
        }
      : null
  );

  const [activeMatch, setActiveMatch] = useState<{
    roomCode: string;
    role: 'p1' | 'p2';
  } | null>(null);

  const isTeamComplete = selectedTeam.length === 6;

  const fetchRooms = () => {
    setLoadingRooms(true);
    PokedexService.getOpenRooms()
      .then((data) => {
        setOpenRooms(data);
        setLoadingRooms(false);
      })
      .catch(() => {
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

  const handleJoinByCode = async (codeToJoin?: string, requiresPassword?: boolean) => {
    setJoinError(null);
    if (!isTeamComplete) {
      setJoinError('Debes completar tu equipo líder con 6 Pokémon para poder hacer duelos en Salas o Práctica.');
      return;
    }
    const code = (codeToJoin || inputCode).replace(/\D/g, '').slice(0, 6);
    if (!/^\d{6}$/.test(code)) {
      setJoinError('El código de sala debe tener exactamente 6 dígitos numéricos.');
      return;
    }

    let pwd: string | undefined;
    if (requiresPassword) {
      const entered = window.prompt('Esta sala es privada. Ingresa la contraseña:');
      if (entered === null) return;
      pwd = entered;
    }

    try {
      const res = await PokedexService.joinRoom(code, {
        player_name: currentUser?.username || 'Entrenador',
        password: pwd,
        team: selectedTeam.slice(0, 6),
      });

      setActiveWaitingRoom({
        roomCode: res.room_code || code,
        role: res.role || 'p2',
        playerName: currentUser?.username || 'Entrenador',
      });
    } catch (err: any) {
      if (!requiresPassword && err?.message?.toLowerCase().includes('contraseña')) {
        return handleJoinByCode(code, true);
      }
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

  const battle = useBattle({
    roomCode: activeMatch?.roomCode || '',
    isAi: false,
    playerRole: activeMatch?.role || 'p1',
    customTeam: selectedTeam,
  });

  if (activeMatch && battle.battleState) {
    return (
      <div className="fixed inset-0 z-50 bg-[#f2f4f7] overflow-y-auto">
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
          trainerName={currentUser?.username || 'Entrenador'}
          onSelectAction={battle.selectAction}
          onSwitchFainted={battle.switchFainted}
          onRematch={() => {}}
          onLeaveRoom={() => {
            setActiveMatch(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto pr-1 custom-scrollbar space-y-2.5 sm:space-y-3 font-sans select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-1.5 border-b border-slate-200/80">
        <div className="flex items-center gap-1.5">
          <Swords className="w-4 h-4 text-amber-500" />
          <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
            SALAS MULTIJUGADOR (6v6)
          </h2>
        </div>
        <button
          type="button"
          onClick={fetchRooms}
          disabled={loadingRooms}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
          title="Actualizar salas"
        >
          <RotateCcw className={`w-3 h-3 ${loadingRooms ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {!currentUser ? (
        /* Auth Required Card */
        <div className="bg-slate-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 text-center space-y-3 my-auto">
          <div className="flex justify-center">
            <PokeBallGraphic size={56} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Cuenta de Entrenador Requerida
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Inicia sesión o regístrate para crear salas y combatir contra otros entrenadores en tiempo real.
            </p>
          </div>
          {onOpenAuth && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-[#d9f977] via-[#b6f04d] to-[#99e334] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer border border-[#b6f04d] flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              <span>Iniciar Sesión / Registro</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Incomplete Team Warning */}
          {!isTeamComplete && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-2 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-[11px] leading-snug">
                <p className="font-bold">
                  Debes completar tu equipo líder con 6 Pokémon para poder hacer duelos en Salas o Práctica.
                </p>
                <p className="text-[10px] text-amber-700 mt-0.5">
                  Equipo actual: <strong>{selectedTeam.length}/6 Pokémon</strong>.{' '}
                  {onGoToCajas && (
                    <button
                      type="button"
                      onClick={onGoToCajas}
                      className="underline font-bold text-amber-900 hover:text-amber-700 cursor-pointer"
                    >
                      Ir a Cajas para completarlo
                    </button>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Create & Join by Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Create Room */}
            <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3 flex flex-col justify-between gap-2 shadow-2xs">
              <div>
                <span className="inline-block bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider mb-1">
                  Anfitrión
                </span>
                <h3 className="text-xs sm:text-sm font-black uppercase text-slate-900">
                  Crear Sala de Combate
                </h3>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  Crea una sala 6v6 pública o privada y comparte el código.
                </p>
              </div>
              <button
                type="button"
                disabled={!isTeamComplete}
                onClick={() => {
                  if (!isTeamComplete) return;
                  setIsCreateModalOpen(true);
                }}
                className={`w-full py-2 font-black text-[11px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all ${
                  isTeamComplete
                    ? 'bg-gradient-to-r from-[#32f59b] via-[#2ce692] to-[#25db89] hover:brightness-105 text-slate-950 border border-[#19c778] cursor-pointer active:scale-[0.98]'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isTeamComplete ? 'Crear Nueva Sala' : `Bloqueado (${selectedTeam.length}/6)`}</span>
              </button>
            </div>

            {/* Join by Code */}
            <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3 flex flex-col justify-between gap-2 shadow-2xs">
              <div>
                <span className="inline-block bg-sky-100 text-sky-800 border border-sky-300 text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider mb-1">
                  Código Directo
                </span>
                <h3 className="text-xs sm:text-sm font-black uppercase text-slate-900">
                  Unirse con Código
                </h3>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  Ingresa el código de la sala a la que te invitaron.
                </p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleJoinByCode();
                }}
                className="flex gap-1.5"
              >
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Ej. 482910"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={!isTeamComplete}
                  className="flex-1 min-w-0 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-[11px] font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-sky-500 tracking-widest disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!isTeamComplete}
                  className={`px-3 py-1.5 font-black text-[11px] uppercase tracking-wider rounded-xl transition-all shrink-0 shadow-2xs ${
                    isTeamComplete
                      ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Unirse
                </button>
              </form>
            </div>
          </div>

          {joinError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[11px] font-medium">
              {joinError}
            </div>
          )}

          {/* Open Public Rooms */}
          <div className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Salas Públicas en Espera
              </h3>
            </div>

            {loadingRooms && openRooms.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs">
                Buscando salas de combate activas...
              </div>
            ) : openRooms.length === 0 ? (
              <div className="py-6 text-center rounded-xl border border-dashed border-slate-300 bg-white text-slate-500 text-xs flex flex-col items-center justify-center gap-1.5">
                <Swords className="w-6 h-6 text-slate-400 opacity-60" />
                <span className="font-semibold text-slate-700 text-[11px]">
                  No hay salas públicas abiertas en este momento.
                </span>
                <span className="text-[10px] text-slate-500">
                  ¡Crea una sala arriba para invitar a otro entrenador!
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {openRooms.map((room) => (
                  <div
                    key={room.room_code}
                    className="bg-white border border-slate-200 hover:border-amber-400 rounded-xl p-2.5 flex flex-col justify-between gap-2 shadow-2xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-black text-amber-600">
                          #{room.room_code}
                        </span>
                        <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-full font-mono font-bold">
                          {room.jugadores_actuales}/{room.max_jugadores || 2} Jugadores
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 truncate">
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
                      type="button"
                      disabled={!isTeamComplete}
                      onClick={() => handleJoinByCode(room.room_code, room.requiere_contrasena)}
                      className={`w-full py-1.5 font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all text-center ${
                        isTeamComplete
                          ? 'bg-slate-900 hover:bg-amber-400 hover:text-slate-950 text-white cursor-pointer'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isTeamComplete ? 'Unirse al Duelo' : 'Equipo Incompleto (6 req.)'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Room Modal */}
      {isCreateModalOpen && (
        <CreateRoomModal
          onClose={() => setIsCreateModalOpen(false)}
          onRoomCreated={handleRoomCreated}
          selectedTeam={selectedTeam}
        />
      )}

      {/* Waiting Room Lobby Modal */}
      {activeWaitingRoom && (
        <RoomLobbyModal
          roomCode={activeWaitingRoom.roomCode}
          playerRole={activeWaitingRoom.role}
          playerName={activeWaitingRoom.playerName}
          selectedTeam={selectedTeam}
          onClose={() => setActiveWaitingRoom(null)}
          onStartDuel={handleStartDuelFromLobby}
        />
      )}
    </div>
  );
};
