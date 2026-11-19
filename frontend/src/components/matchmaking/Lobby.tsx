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
  Plus,
  Trash2,
  Crown,
  ChevronRight,
  User,
  Edit2,
  Activity,
  Flame,
} from 'lucide-react';
import { StaticPokemonImage } from '../common/StaticPokemonImage';
import { CreateRoomModal } from './CreateRoomModal';
import { RoomLobbyModal } from './RoomLobbyModal';
import { PokemonDetailSheet } from './PokemonDetailSheet';
import { AddPokemonModal } from './AddPokemonModal';
import { ArenaModal } from './ArenaModal';
import { PokedexService } from '../../services/pokedexService';
import { RoomSummary, StadiumPokemonDetail } from '../../types/stadium';

interface LobbyProps {
  onStartMatch: (roomCode: string, isAi: boolean, role: 'p1' | 'p2') => void;
  onOpenTeamBuilder: () => void;
  onOpenPokedex: () => void;
  onOpenMoves: () => void;
  selectedTeam: string[];
  onUpdateTeam?: (newTeam: string[]) => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  onStartMatch,
  onOpenTeamBuilder,
  onOpenPokedex,
  onOpenMoves,
  selectedTeam,
  onUpdateTeam,
}) => {
  // Trainer Name
  const [trainerName, setTrainerName] = useState(() => {
    return localStorage.getItem('pokemon_trainer_name') || 'Entrenador Red';
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(trainerName);

  // Modals
  const [isArenaOpen, setIsArenaOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [inspectingSpecies, setInspectingSpecies] = useState<string | null>(null);

  // Open Rooms & Waiting State
  const [openRooms, setOpenRooms] = useState<RoomSummary[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const [waitingRoom, setWaitingRoom] = useState<{
    roomCode: string;
    role: 'p1' | 'p2';
    playerName: string;
  } | null>(null);

  // Cached Pokemon Details for Team Stats Display
  const [teamDetails, setTeamDetails] = useState<Record<string, StadiumPokemonDetail>>({});

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
      if (!document.hidden && !waitingRoom) {
        fetchRooms();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [waitingRoom]);

  // Pre-fetch details for active team members to display stats and moves
  useEffect(() => {
    selectedTeam.forEach((species) => {
      if (!teamDetails[species]) {
        PokedexService.getPokemonDetail(species)
          .then((data) => {
            setTeamDetails((prev) => ({ ...prev, [species]: data }));
          })
          .catch(() => {});
      }
    });
  }, [selectedTeam]);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = nameInput.trim() || 'Entrenador Red';
    setTrainerName(clean);
    localStorage.setItem('pokemon_trainer_name', clean);
    setIsEditingName(false);
  };

  const handleRemovePokemon = (speciesToRemove: string) => {
    if (selectedTeam.length <= 1) return;
    const nextTeam = selectedTeam.filter(
      (s) => s.toUpperCase() !== speciesToRemove.toUpperCase()
    );
    if (onUpdateTeam) {
      onUpdateTeam(nextTeam);
    }
  };

  const handleAddPokemon = (speciesToAdd: string) => {
    if (selectedTeam.length >= 6) return;
    const clean = speciesToAdd.toUpperCase().replace(/\s+/g, '_');
    if (selectedTeam.includes(clean)) return;
    const nextTeam = [...selectedTeam, clean];
    if (onUpdateTeam) {
      onUpdateTeam(nextTeam);
    }
  };

  const handleSetLeader = (leaderSpecies: string) => {
    const clean = leaderSpecies.toUpperCase().replace(/\s+/g, '_');
    const withoutLeader = selectedTeam.filter((s) => s.toUpperCase() !== clean);
    const nextTeam = [clean, ...withoutLeader];
    if (onUpdateTeam) {
      onUpdateTeam(nextTeam);
    }
  };

  const handlePlayAi = () => {
    const code = 'AI-' + Math.floor(1000 + Math.random() * 9000);
    onStartMatch(code, true, 'p1');
  };

  const handleRoomCreated = (code: string, isAi: boolean, role: 'p1' | 'p2') => {
    setShowCreateModal(false);
    setWaitingRoom({ roomCode: code, role, playerName: trainerName });
  };

  const handleDirectJoin = async (roomCode: string, password?: string) => {
    setJoinError(null);
    try {
      const code = roomCode.trim().toUpperCase();
      await PokedexService.joinRoom(code, {
        player_name: trainerName,
        password: password || undefined,
        team: selectedTeam,
      });

      setWaitingRoom({ roomCode: code, role: 'p2', playerName: trainerName });
    } catch (err: any) {
      setJoinError(err.message || 'Error al unirse a la sala');
    }
  };

  const handleStartDuelFromRoom = () => {
    if (!waitingRoom) return;
    const { roomCode, role } = waitingRoom;
    setWaitingRoom(null);
    onStartMatch(roomCode, false, role);
  };

  const leaderSpecies = selectedTeam[0] || 'CHARIZARD';

  return (
    <div className="min-h-[100dvh] bg-[#090d12] text-slate-100 flex flex-col justify-between font-game select-none relative overflow-x-hidden">
      {/* Background Cyber Grid Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-25 pointer-events-none" />

      {/* Top Trainer & Navigation Header */}
      <header className="sticky top-0 z-30 bg-[#0d1219]/90 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 py-2.5 shadow-xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Trainer Profile Card */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 border-2 border-white flex items-center justify-center shadow-md text-white font-black text-xs">
              <User className="w-4 h-4" />
            </div>

            {isEditingName ? (
              <form onSubmit={handleSaveName} className="flex items-center gap-1">
                <input
                  type="text"
                  maxLength={18}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="bg-slate-950 border border-emerald-400 rounded-lg px-2 py-0.5 text-xs text-white uppercase font-bold"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-2 py-0.5 rounded-lg bg-emerald-600 text-[10px] font-bold text-white"
                >
                  OK
                </button>
              </form>
            ) : (
              <div
                onClick={() => {
                  setNameInput(trainerName);
                  setIsEditingName(true);
                }}
                className="flex flex-col cursor-pointer group"
                title="Toca para editar tu nombre"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider group-hover:text-emerald-400 transition-colors">
                    {trainerName}
                  </span>
                  <Edit2 className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400">
                  <span>RANGO S</span>
                  <span className="text-slate-600">•</span>
                  <span>ESCUADRÓN {selectedTeam.length}/6</span>
                </div>
              </div>
            )}
          </div>

          {/* Top Quick Navigation Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onOpenPokedex}
              className="flex items-center gap-1 py-1 px-2.5 sm:px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[10px] font-bold transition-all shadow-xs"
              title="Explorar Catálogo Pokédex"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Pokédex</span>
            </button>

            <button
              onClick={onOpenMoves}
              className="flex items-center gap-1 py-1 px-2.5 sm:px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[10px] font-bold transition-all shadow-xs"
              title="Catálogo de 953 Movimientos"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Movimientos</span>
            </button>

            <button
              onClick={onOpenTeamBuilder}
              className="flex items-center gap-1 py-1 px-2.5 sm:px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[10px] font-bold transition-all shadow-xs"
              title="Organizar Equipo Completo"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Caja PC</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Mobile-First / Handheld Console Central Hub */}
      <main className="max-w-2xl mx-auto w-full flex-1 flex flex-col p-3 sm:p-5 z-10 overflow-y-auto">
        {/* Banner Section */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-200">
                Escuadrón de Combate (6 Slots)
              </h2>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Toca cualquier tarjeta para ver su diagnóstico táctico, 6 stats y movimientos.
            </p>
          </div>

          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
            {selectedTeam.length}/6 ACTIVOS
          </span>
        </div>

        {/* Scrollable Team List (Up to 6 Pokémon) */}
        <div className="space-y-2.5 pb-24">
          {selectedTeam.map((species, idx) => {
            const isLeader = idx === 0;
            const detail = teamDetails[species];
            const stats = detail?.base_stats;
            const displayName = detail?.nombre || species;
            const types = detail?.types_detail || [];

            return (
              <div
                key={`${species}-${idx}`}
                onClick={() => setInspectingSpecies(species)}
                className={`relative rounded-2xl border transition-all cursor-pointer p-3 sm:p-3.5 flex flex-col gap-2 shadow-lg group overflow-hidden ${
                  isLeader
                    ? 'bg-gradient-to-r from-[#14231b] via-[#101923] to-[#0c1219] border-emerald-500/60 hover:border-emerald-400 ring-1 ring-emerald-500/20'
                    : 'bg-gradient-to-r from-[#121924] via-[#0f151f] to-[#0a0f16] border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Diagonal Accent Cut for Leader */}
                {isLeader && (
                  <div className="absolute top-0 left-0 bg-emerald-500 text-slate-950 text-[8px] font-mono font-black uppercase px-2.5 py-0.5 rounded-br-lg tracking-widest flex items-center gap-1 shadow-md">
                    <Crown className="w-2.5 h-2.5" />
                    <span>LÍDER #01</span>
                  </div>
                )}

                {/* Top Row: Slot #, Quick Delete X, Promote Leader */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold ${isLeader ? 'text-emerald-400 pl-16' : 'text-slate-500'}`}>
                    SLOT #{String(idx + 1).padStart(2, '0')}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {!isLeader && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetLeader(species);
                        }}
                        className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-400/50 text-[9px] font-bold text-slate-300 hover:text-amber-300 transition-all flex items-center gap-1"
                        title="Promover a Líder (#01)"
                      >
                        <Crown className="w-3 h-3 text-amber-400" />
                        <span className="hidden sm:inline">Hacer Líder</span>
                      </button>
                    )}

                    {selectedTeam.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePokemon(species);
                        }}
                        className="p-1 rounded-md bg-slate-800/60 hover:bg-rose-950 border border-slate-700 hover:border-rose-600/60 text-slate-400 hover:text-rose-200 transition-all"
                        title="Quitar del equipo y enviar a Caja PC"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Main Card Body */}
                <div className="flex items-center gap-3.5">
                  {/* Sprite / Image Thumbnail */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full bg-slate-800/50 border border-slate-700/60 group-hover:border-emerald-500/40 transition-colors" />
                    <StaticPokemonImage
                      species={species}
                      alt={displayName}
                      className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] z-10 group-hover:scale-105 transition-transform"
                    />
                  </div>

                  {/* Info Column */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider truncate">
                          {displayName}
                        </h3>
                        {detail && (
                          <span className="text-[9px] font-mono text-slate-500">
                            #{String(detail.numero_pokedex).padStart(3, '0')}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-sans font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 shrink-0">
                        Lv.50
                      </span>
                    </div>

                    {/* Types Badges */}
                    <div className="flex items-center gap-1">
                      {types.length > 0 ? (
                        types.map((t) => (
                          <span
                            key={t.id}
                            style={{ backgroundColor: t.color_hex }}
                            className="px-2 py-0.2 rounded-full text-[8px] font-bold text-white uppercase shadow-2xs"
                          >
                            {t.nombre}
                          </span>
                        ))
                      ) : (
                        <span className="px-2 py-0.2 rounded-full text-[8px] font-bold bg-slate-700 text-white uppercase">
                          {species}
                        </span>
                      )}
                      {detail?.habilidades && detail.habilidades.length > 0 && (
                        <span className="text-[9px] text-amber-300/80 truncate font-sans ml-1 hidden sm:inline">
                          • {detail.habilidades[0].nombre}
                        </span>
                      )}
                    </div>

                    {/* All 6 Base Stats Compact Grid */}
                    <div className="grid grid-cols-6 gap-1 pt-1 border-t border-slate-800/80 font-mono text-[9px]">
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-[8px]">PS</span>
                        <span className="font-bold text-emerald-400">{stats?.hp || '—'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-[8px]">ATK</span>
                        <span className="font-bold text-rose-400">{stats?.attack || '—'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-[8px]">DEF</span>
                        <span className="font-bold text-blue-400">{stats?.defense || '—'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-[8px]">SPA</span>
                        <span className="font-bold text-purple-400">{stats?.sp_attack || '—'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-[8px]">SPD</span>
                        <span className="font-bold text-amber-400">{stats?.sp_defense || '—'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-[8px]">SPE</span>
                        <span className="font-bold text-cyan-400">{stats?.speed || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors shrink-0 ml-1" />
                </div>
              </div>
            );
          })}

          {/* Add Pokémon Slot (when team < 6) */}
          {selectedTeam.length < 6 && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="w-full rounded-2xl border-2 border-dashed border-slate-800 hover:border-emerald-500/70 bg-slate-950/40 hover:bg-emerald-950/20 p-4 transition-all flex items-center justify-center gap-2.5 text-slate-400 hover:text-emerald-300 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 group-hover:bg-emerald-500/20 border border-slate-700 group-hover:border-emerald-400 flex items-center justify-center text-slate-300 group-hover:text-emerald-400 transition-colors">
                <Plus className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="text-xs font-black uppercase tracking-wider block">
                  + Añadir Pokémon al Equipo
                </span>
                <span className="text-[9px] font-mono text-slate-500 group-hover:text-emerald-400/80">
                  Ranura disponible #{selectedTeam.length + 1} de 6
                </span>
              </div>
            </button>
          )}
        </div>
      </main>

      {/* Sticky Bottom Area: Angled Neon ARENA Button + Quick Dock */}
      <div className="sticky bottom-0 z-30 bg-[#090d12]/95 backdrop-blur-md border-t-2 border-slate-800 px-3 sm:px-6 py-2.5 shadow-2xl">
        <div className="max-w-md mx-auto flex flex-col gap-2">
          {/* Main Angled ARENA Button with Neon Pulse */}
          <button
            type="button"
            onClick={() => setIsArenaOpen(true)}
            className="relative w-full h-12 sm:h-13 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(16,185,129,0.4)] border-2 border-emerald-300 text-slate-950 font-black tracking-widest uppercase cursor-pointer overflow-hidden group"
          >
            {/* Animated Light Sweep */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform" />

            <Swords className="w-5 h-5 text-slate-950 animate-bounce" />
            <span className="text-xs sm:text-sm tracking-widest">
              ARENA DE COMBATE • ENTRAR
            </span>
            <div className="w-2 h-2 rounded-full bg-slate-950 animate-ping ml-1" />
          </button>
        </div>
      </div>

      {/* MODALS */}
      {/* 1. Pokemon Detail Sheet */}
      {inspectingSpecies && (
        <PokemonDetailSheet
          species={inspectingSpecies}
          onClose={() => setInspectingSpecies(null)}
          onRemoveFromTeam={handleRemovePokemon}
          canRemove={selectedTeam.length > 1}
          isLeader={selectedTeam[0] === inspectingSpecies}
          onSetLeader={handleSetLeader}
          teamCount={selectedTeam.length}
        />
      )}

      {/* 2. Add Pokemon Modal */}
      <AddPokemonModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddPokemon={handleAddPokemon}
        currentTeam={selectedTeam}
      />

      {/* 3. Arena Mode Selector Modal */}
      <ArenaModal
        isOpen={isArenaOpen}
        onClose={() => setIsArenaOpen(false)}
        onStartAiBattle={handlePlayAi}
        onOpenCreateRoom={() => setShowCreateModal(true)}
        openRooms={openRooms}
        loadingRooms={loadingRooms}
        onRefreshRooms={fetchRooms}
        onJoinRoom={handleDirectJoin}
        joinError={joinError}
        selectedTeamCount={selectedTeam.length}
      />

      {/* 4. Create Room Modal */}
      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onRoomCreated={handleRoomCreated}
          selectedTeam={selectedTeam}
        />
      )}

      {/* 5. Waiting Room Modal */}
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
    </div>
  );
};
