import React, { useState, useEffect } from 'react';
import {
  Trophy,
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
  Trash2,
  Crown,
  ChevronRight,
  User,
  Edit2,
  Activity,
  Flame,
  Info,
  Search,
  Gift,
  HeartPulse,
  Settings,
  Send,
  Sliders,
  Clock,
  AlertCircle,
  Backpack,
} from 'lucide-react';
import { StaticPokemonImage } from '../common/StaticPokemonImage';
import { CreateRoomModal } from './CreateRoomModal';
import { RoomLobbyModal } from './RoomLobbyModal';
import { PokemonDetailSheet } from './PokemonDetailSheet';
import { AddPokemonModal } from './AddPokemonModal';
import { ArenaModal } from './ArenaModal';
import { PokedexHubModal } from './PokedexHubModal';
import { AuthModal } from '../auth/AuthModal';
import { AuthService, TrainerUser } from '../../services/authService';
import { PokedexService } from '../../services/pokedexService';
import { RoomSummary, StadiumPokemonDetail } from '../../types/stadium';
import { getResolvedLv100Stats, getResolvedTypes } from '../../utils/pokemonStats';

interface LobbyProps {
  onStartMatch: (roomCode: string, isAi: boolean, role: 'p1' | 'p2') => void;
  onOpenTeamBuilder: () => void;
  onOpenPokedex: () => void;
  onOpenMoves: () => void;
  onOpenAbilities?: () => void;
  onOpenRooms?: () => void;
  onOpenAuth?: () => void;
  onOpenPractice?: () => void;
  selectedTeam: string[];
  onUpdateTeam?: (newTeam: string[]) => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  onStartMatch,
  onOpenTeamBuilder,
  onOpenPokedex,
  onOpenMoves,
  onOpenAbilities,
  onOpenRooms,
  onOpenAuth,
  onOpenPractice,
  selectedTeam,
  onUpdateTeam,
}) => {
  // Auth / Trainer Profile State
  const [currentUser, setCurrentUser] = useState<TrainerUser | null>(() => AuthService.getCurrentUser());
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Trainer Name (Persisted)
  const [trainerName, setTrainerName] = useState(() => {
    return localStorage.getItem('pokemon_trainer_name') || 'BrauElizalde';
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(trainerName);

  const handleUserChange = (user: TrainerUser | null) => {
    setCurrentUser(user);
    if (user) {
      setTrainerName(user.username);
      setNameInput(user.username);
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setTrainerName('Entrenador');
    setNameInput('Entrenador');
    setActiveSection('arena');
    if (onOpenAuth) {
      onOpenAuth();
    }
  };

  // Section Navigation (Default: 'arena' when logged in as requested)
  const [activeSection, setActiveSection] = useState<'arena' | 'equipo' | 'salir'>('arena');
  const [isArenaOpen, setIsArenaOpen] = useState(false);
  const [isPokedexHubOpen, setIsPokedexHubOpen] = useState(false);
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
    const clean = nameInput.trim() || 'BrauElizalde';
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

  const handleOpenPokedexHub = () => {
    setIsArenaOpen(false);
    setIsPokedexHubOpen(true);
  };

  const handleClosePokedexHub = () => {
    setIsPokedexHubOpen(false);
    setIsArenaOpen(true);
  };

  const handleSelectPokedexOption = (option: 'pokemon' | 'moves' | 'abilities') => {
    setIsPokedexHubOpen(false);
    if (option === 'pokemon') {
      onOpenPokedex();
    } else if (option === 'moves') {
      onOpenMoves();
    } else if (option === 'abilities' && onOpenAbilities) {
      onOpenAbilities();
    }
  };

  const leaderSpecies = selectedTeam[0] || 'CHARIZARD';

  // Si no está logueado, NO mostrar el Lobby (Imagen 1 con tarjetas Pokémon),
  // sino únicamente la Pantalla Principal (Arena con los 4 Banners)
  if (!currentUser) {
    return (
      <div className="min-h-[100dvh] bg-[#f2f4f7] text-slate-800 flex flex-col justify-center items-center font-sans select-none relative overflow-x-hidden p-3">
        {/* Background Energetic Mint-Green Angled Ribbons (Digimon Vital Bracelet Arena Palette) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div
            className="absolute -top-24 -right-20 w-[120%] h-96 bg-[#8bf8c7] opacity-65 transform -rotate-12 origin-top-right"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 45%)' }}
          />
          <div
            className="absolute top-1/3 -left-32 w-[140%] h-80 bg-[#a6fad4] opacity-45 transform rotate-6"
            style={{ clipPath: 'polygon(0 15%, 100% 0, 100% 65%, 0 85%)' }}
          />
          <div
            className="absolute -bottom-20 -left-20 w-[120%] h-80 bg-[#74f7bc] opacity-50 transform -rotate-6"
            style={{ clipPath: 'polygon(0 40%, 100% 0, 100% 100%, 0 100%)' }}
          />
        </div>

        {/* Centered Main Screen (The 4 Banners Hub) */}
        <div className="relative z-10 w-full max-w-sm sm:max-w-md my-auto">
          <ArenaModal
            isOpen={true}
            isStandalone={true}
            onClose={() => {}}
            onStartAiBattle={onOpenPractice || handlePlayAi}
            onOpenCreateRoom={() => (onOpenRooms ? onOpenRooms() : (onOpenAuth ? onOpenAuth() : setIsAuthOpen(true)))}
            onOpenAuth={() => (onOpenAuth ? onOpenAuth() : setIsAuthOpen(true))}
            onOpenRooms={onOpenRooms}
            onOpenPokedex={handleOpenPokedexHub}
            onLogout={handleLogout}
            trainerName={trainerName}
            isLoggedIn={false}
            openRooms={openRooms}
            loadingRooms={loadingRooms}
            onRefreshRooms={fetchRooms}
            onJoinRoom={handleDirectJoin}
            joinError={joinError}
            selectedTeamCount={selectedTeam.length}
          />
        </div>

        {/* Pokédex Hub Modal */}
        <PokedexHubModal
          isOpen={isPokedexHubOpen}
          onClose={() => setIsPokedexHubOpen(false)}
          onSelectOption={handleSelectPokedexOption}
        />

        {/* Auth Modal (Login / Registro gestionado con Python Django) */}
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          currentUser={currentUser}
          onUserChange={handleUserChange}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#f2f4f7] text-slate-800 flex flex-col justify-between font-sans select-none relative overflow-x-hidden">
      {/* Background Energetic Mint-Green Angled Ribbons (Digimon Vital Bracelet Arena Palette) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-24 -right-20 w-[120%] h-96 bg-[#8bf8c7] opacity-65 transform -rotate-12 origin-top-right"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 45%)' }}
        />
        <div
          className="absolute top-1/3 -left-32 w-[140%] h-80 bg-[#a6fad4] opacity-45 transform rotate-6"
          style={{ clipPath: 'polygon(0 15%, 100% 0, 100% 65%, 0 85%)' }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-[120%] h-80 bg-[#74f7bc] opacity-50 transform -rotate-6"
          style={{ clipPath: 'polygon(0 40%, 100% 0, 100% 100%, 0 100%)' }}
        />
      </div>

      {/* Main Mobile Screen Wrapper (Centered Handheld Viewport) */}
      <div className="relative z-10 max-w-sm sm:max-w-md mx-auto w-full flex-1 flex flex-col justify-between px-3 pt-3 pb-2">
        {/* ================= TOP TRAINER BAR (IMAGE 2) ================= */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* Left: Metallic Dark Badge with Rank '2' / 'S' & Wings */}
          <div className="flex items-center">
            <div
              className="bg-[#2a3038] text-white px-3 py-1 flex items-center gap-1.5 shadow-md border-t border-l border-slate-500"
              style={{ clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)' }}
            >
              <div className="w-5 h-5 rounded-full border border-slate-400 flex items-center justify-center text-[10px] font-black text-amber-300">
                ❖
              </div>
              <span className="text-sm font-black font-mono tracking-tighter text-white">
                2
              </span>
            </div>
          </div>

          {/* Center: Trainer Name White Pill with Auth Dialog */}
          <div className="flex-1 max-w-[200px]">
            <div
              onClick={() => setIsAuthOpen(true)}
              className="bg-white/95 hover:bg-white border border-slate-300/80 rounded-full px-3 py-0.5 shadow-xs flex items-center justify-between cursor-pointer group transition-all"
              title="Cuenta de Entrenador (Iniciar sesión / Registro)"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className={`w-2 h-2 rounded-full ${currentUser ? 'bg-emerald-500' : 'bg-amber-400'} shrink-0`} />
                <span className="text-xs font-bold text-slate-800 truncate">
                  {trainerName}
                </span>
              </div>
              <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 transition-colors ml-1 shrink-0" />
            </div>
          </div>

          {/* Right: 4 Stars (★★★★) */}
          <div className="flex items-center gap-0.5 text-amber-400 text-xs">
            <span>★</span>
            <span>★</span>
            <span>★</span>
            <span className="text-slate-300">★</span>
          </div>
        </div>

        {/* ================= WHITE CONTAINER: DYNAMIC SECTIONS (ARENA / EQUIPO / SALIR) ================= */}
        <div className="bg-white/95 rounded-2xl border-2 border-slate-300/80 shadow-xl p-3 flex-1 flex flex-col overflow-hidden max-h-[58vh]">
          {/* 1. SECCIÓN ARENA (IMAGEN 2 - PREDETERMINADA) */}
          {activeSection === 'arena' && (
            <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar flex-1">
              {/* Forth Battle Card (Salas Multijugador) */}
              <div
                onClick={() => (onOpenRooms ? onOpenRooms() : null)}
                className="relative h-26 rounded-2xl overflow-hidden bg-[#151c26] border border-[#26354a] shadow-md cursor-pointer group hover:brightness-105 active:scale-[0.99] transition-all flex items-center px-4"
              >
                {/* Tech Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none" />

                {/* Left Typography */}
                <div className="relative z-10 flex flex-col justify-between h-full py-2.5">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-sm font-sans">
                      FORTH BATTLE
                    </h3>
                    <span className="text-[9px] font-mono font-bold text-slate-300 tracking-wider uppercase block mt-1">
                      SALAS MULTIJUGADOR 6v6 • ONLINE
                    </span>
                  </div>

                  {/* Bottom Ribbon */}
                  <div className="flex items-center gap-2">
                    <div className="bg-black/90 text-amber-300 text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm flex items-center gap-1 border border-slate-700 shadow-xs">
                      <Clock className="w-2.5 h-2.5 text-amber-400" />
                      <span>ENDS IN 0d 05:48:38</span>
                    </div>
                    <span className="text-[9px] font-bold text-[#38bdf8] hover:text-[#7dd3fc] underline">
                      Ver salas ▼
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

              {/* Training Battle Card (Combate vs IA 6v6) */}
              <div
                onClick={onOpenPractice || handlePlayAi}
                className="relative h-26 rounded-2xl overflow-hidden bg-gradient-to-r from-[#7a52c7] via-[#875fd3] to-[#9973e2] border-2 border-[#603baf] shadow-md cursor-pointer group hover:brightness-105 active:scale-[0.99] transition-all flex items-center px-4"
              >
                {/* Purple Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff30_1px,transparent_1px),linear-gradient(to_bottom,#ffffff30_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />

                {/* Left Typography */}
                <div className="relative z-10">
                  <h3 className="text-xl sm:text-2xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-sm font-sans">
                    TRAINING
                  </h3>
                  <h3 className="text-xl sm:text-2xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-sm font-sans">
                    BATTLE
                  </h3>
                  <span className="text-[9px] font-bold text-purple-200 tracking-wider uppercase block mt-1 font-mono">
                    COMBATE VS IA (6 VS 6)
                  </span>
                </div>

                {/* Sparring Stick Figures on Right */}
                <div className="absolute right-4 flex items-center gap-2 pointer-events-none text-white opacity-95">
                  <div className="flex flex-col items-center">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white mb-0.5" />
                    <div className="w-1 h-5 bg-white" />
                  </div>
                  <div className="text-2xl font-black italic text-amber-300 drop-shadow-sm">⚡</div>
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full border-2 border-white mb-0.5" />
                    <div className="w-1 h-4 bg-white" />
                  </div>
                </div>
              </div>

              {/* Próximamente Card */}
              <div className="relative h-26 rounded-2xl overflow-hidden bg-gradient-to-r from-[#44c4e8] via-[#52d2f4] to-[#68defd] border-2 border-[#2fa8cb] shadow-md flex items-center px-4">
                {/* Cyan Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff30_1px,transparent_1px),linear-gradient(to_bottom,#ffffff30_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />

                {/* Left Typography */}
                <div className="relative z-10">
                  <h3 className="text-2xl sm:text-3xl font-black text-white italic tracking-tight leading-none drop-shadow-sm font-sans">
                    PROXIMAMENTE
                  </h3>
                  <span className="text-[9px] font-bold text-[#0c4756] tracking-wider uppercase block mt-1 font-mono">
                    NUEVOS MODOS DE TORNEO
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
          )}

          {/* 2. SECCIÓN SALIR (IMAGEN 3) */}
          {activeSection === 'salir' && (
            <div className="flex-1 flex flex-col justify-between py-1 animate-in fade-in duration-200 overflow-y-auto custom-scrollbar">
              {/* Top Image: Pikachu de 98.webp */}
              <div className="w-full rounded-2xl overflow-hidden border-2 border-slate-300 shadow-md bg-black shrink-0">
                <img
                  src="/98.webp"
                  alt="¿Deseas cerrar sesión?"
                  className="w-full h-44 sm:h-52 object-cover"
                />
              </div>

              {/* Confirmation Dialog Box (Matching Imagen 3) */}
              <div className="bg-[#fff1f2] border border-[#fecdd3] rounded-2xl p-3.5 sm:p-4 text-center mt-3 shadow-xs space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-black text-[#9f1239] uppercase tracking-wide">
                  <AlertCircle className="w-4 h-4 text-[#e11d48] shrink-0" />
                  <span>¿DESEAS CERRAR SESIÓN?</span>
                </div>
                <p className="text-xs text-slate-600 font-sans">
                  Se desconectará la cuenta del entrenador{' '}
                  <strong className="text-slate-900 font-bold">{trainerName}</strong>.
                </p>
                <div className="flex items-center justify-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex-1 py-2 px-4 bg-[#e11d48] hover:bg-[#be123c] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    CONFIRMAR
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSection('arena')}
                    className="flex-1 py-2 px-4 bg-[#e2e8f0] hover:bg-[#cbd5e1] text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    CANCELAR
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. SECCIÓN EQUIPO (LISTADO DE POKÉMON TECH-GRID) */}
          {activeSection === 'equipo' && (
            <>
              {/* Scrollable Team Cards (Up to 6 Pokémon) */}
              <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar flex-1">
            {selectedTeam.map((species, idx) => {
              const isLeader = idx === 0;
              const detail = teamDetails[species];
              const resolved = getResolvedLv100Stats(species, detail);
              const displayName = detail?.nombre || species;
              const types = getResolvedTypes(species, detail);

              return (
                <div
                  key={`${species}-${idx}`}
                  onClick={() => setInspectingSpecies(species)}
                  className="relative rounded-xl bg-[#535962] border border-[#3e434a] shadow-md p-2.5 text-white overflow-hidden cursor-pointer group hover:brightness-105 transition-all"
                >
                  {/* Subtle 10px White Tech-Grid on Gray Card */}
                  <div
                    className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none"
                  />

                  {/* Top Black Chamfered Header Bar: Name on Left, Total Stats Counter on Right */}
                  <div className="relative z-10 flex items-center justify-between mb-2">
                    {/* Black Chamfered Title Ribbon */}
                    <div
                      className="bg-[#15171b] text-white px-3 py-0.5 pr-6 text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5"
                      style={{ clipPath: 'polygon(0 0, 90% 0, 100% 100%, 0 100%)' }}
                    >
                      <span>{displayName}</span>
                      {isLeader && (
                        <Crown className="w-3 h-3 text-amber-400 inline ml-1" />
                      )}
                    </div>

                    {/* Total: Suma de todos los atributos a Nivel 100 Favorable */}
                    <div className="text-right leading-none flex items-baseline justify-end gap-1">
                      <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider font-mono">
                        total:
                      </span>
                      <span className="text-sm sm:text-base font-black font-mono text-[#00ff9d] tracking-tight drop-shadow-sm">
                        {resolved.total.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Card Main Body: Left Sprite & Badges, Right All 6 Stats */}
                  <div className="relative z-10 grid grid-cols-12 gap-2 items-center">
                    {/* Left Column (Col 5): Full Type Badge, Sprite, Info icon (sin rangos ni botón X) */}
                    <div className="col-span-5 flex flex-col items-center justify-center relative">
                      {/* Top Badges Row: Nombre completo del tipo en español (sin abreviaturas ni rangos) */}
                      <div className="w-full flex items-center gap-1 px-1 mb-1 flex-wrap">
                        {types.map((t) => (
                          <span
                            key={t.nombre}
                            style={{ backgroundColor: t.color_hex }}
                            className="px-2 py-0.5 rounded text-[8px] font-black text-white uppercase shadow-xs tracking-wider"
                          >
                            {t.nombre}
                          </span>
                        ))}
                      </div>

                      {/* Pokémon Sprite Thumbnail */}
                      <div className="w-20 h-20 flex items-center justify-center relative my-0.5">
                        <StaticPokemonImage
                          species={species}
                          alt={displayName}
                          className="w-18 h-18 object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform"
                        />
                      </div>

                      {/* Bottom Info Icon ( i ) - Solo lectura del equipo */}
                      <div className="w-full flex items-center justify-start px-1 text-slate-300">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingSpecies(species);
                          }}
                          className="w-4 h-4 rounded-full bg-black/50 hover:bg-black text-slate-300 hover:text-white flex items-center justify-center text-[9px] font-bold border border-slate-400 transition-colors cursor-pointer"
                          title="Ver ficha técnica completa"
                        >
                          i
                        </button>
                      </div>
                    </div>

                    {/* Right Column (Col 7): Todos los 6 Stats Reales Lv 100 en Español */}
                    <div className="col-span-7 space-y-1 font-mono text-[9px]">
                      {/* Grid de 6 Atributos (3 filas x 2 columnas) */}
                      <div className="grid grid-cols-2 gap-1">
                        {/* 1. PS (Salud) */}
                        <div className="flex items-center justify-between bg-black/35 px-1.5 py-0.5 rounded border border-slate-700/60">
                          <span className="text-slate-300 font-bold text-[8px] uppercase">PS</span>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-white text-[9px]">{resolved.hp}</span>
                            <span className="bg-[#181c20] text-[#00ff9d] text-[7px] font-black px-1 rounded-full border border-slate-700">
                              +0
                            </span>
                          </div>
                        </div>

                        {/* 2. ATAQUE */}
                        <div className="flex items-center justify-between bg-black/35 px-1.5 py-0.5 rounded border border-slate-700/60">
                          <span className="text-slate-300 font-bold text-[8px] uppercase">ATQ</span>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-white text-[9px]">{resolved.attack}</span>
                            <span className="bg-[#181c20] text-[#00ff9d] text-[7px] font-black px-1 rounded-full border border-slate-700">
                              +0
                            </span>
                          </div>
                        </div>

                        {/* 3. DEFENSA */}
                        <div className="flex items-center justify-between bg-black/35 px-1.5 py-0.5 rounded border border-slate-700/60">
                          <span className="text-slate-300 font-bold text-[8px] uppercase">DEF</span>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-white text-[9px]">{resolved.defense}</span>
                            <span className="bg-[#181c20] text-[#00ff9d] text-[7px] font-black px-1 rounded-full border border-slate-700">
                              +0
                            </span>
                          </div>
                        </div>

                        {/* 4. ATQ. ESPECIAL */}
                        <div className="flex items-center justify-between bg-black/35 px-1.5 py-0.5 rounded border border-slate-700/60">
                          <span className="text-slate-300 font-bold text-[8px] uppercase">SPA</span>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-white text-[9px]">{resolved.sp_attack}</span>
                            <span className="bg-[#181c20] text-[#00ff9d] text-[7px] font-black px-1 rounded-full border border-slate-700">
                              +0
                            </span>
                          </div>
                        </div>

                        {/* 5. DEF. ESPECIAL */}
                        <div className="flex items-center justify-between bg-black/35 px-1.5 py-0.5 rounded border border-slate-700/60">
                          <span className="text-slate-300 font-bold text-[8px] uppercase">SPD</span>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-white text-[9px]">{resolved.sp_defense}</span>
                            <span className="bg-[#181c20] text-[#00ff9d] text-[7px] font-black px-1 rounded-full border border-slate-700">
                              +0
                            </span>
                          </div>
                        </div>

                        {/* 6. VELOCIDAD */}
                        <div className="flex items-center justify-between bg-black/35 px-1.5 py-0.5 rounded border border-slate-700/60">
                          <span className="text-slate-300 font-bold text-[8px] uppercase">VEL</span>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-white text-[9px]">{resolved.speed}</span>
                            <span className="bg-[#181c20] text-[#00ff9d] text-[7px] font-black px-1 rounded-full border border-slate-700">
                              +0
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* HABILIDAD PASIVA EN ESPAÑOL */}
                      <div className="pt-0.5">
                        <div className="flex items-center gap-1 text-[8px] text-slate-300">
                          <span className="uppercase tracking-wider font-bold">HABILIDAD</span>
                          <span className="bg-emerald-600 text-white text-[7px] font-black px-1 rounded-xs uppercase">
                            PASIVA
                          </span>
                          <span className="text-slate-400 text-[8px]">Sinergia</span>
                        </div>
                        <div className="bg-[#1c2026] text-slate-200 text-[9px] font-sans px-2 py-0.5 rounded mt-0.5 truncate border border-slate-600 flex items-center justify-between">
                          <span className="truncate">
                            {detail?.habilidades?.[0]?.nombre || resolved.ability || 'Mar Llamas'}
                          </span>
                          <span className="text-amber-400 font-mono text-[8px] font-bold ml-1 shrink-0">R</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>

        {/* ================= MAIN ARENA SKEWED BANNER (IMAGE 2 & 3) ================= */}
        <div className="my-2.5 flex justify-center">
          <button
            type="button"
            onClick={() => setActiveSection('arena')}
            className={`relative w-full max-w-[340px] h-12 bg-gradient-to-r from-[#32f59b] via-[#2ce692] to-[#25db89] hover:brightness-105 active:scale-[0.98] transition-all shadow-[0_4px_14px_rgba(46,230,146,0.45)] border-2 border-[#19c778] flex items-center justify-between px-6 cursor-pointer overflow-hidden group ${
              activeSection === 'arena' ? 'ring-2 ring-emerald-500' : ''
            }`}
            style={{ clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)' }}
            title="Sección Arena Principal"
          >
            {/* Left Spacer for Symmetry */}
            <div className="w-8" />

            {/* Center Bold ARENA Text */}
            <span className="text-2xl font-black italic tracking-wider text-slate-950 font-sans uppercase">
              ARENA
            </span>

            {/* Right White Vital Pulse / Heartbeat Graphic (/\_/\_) */}
            <div className="flex items-center text-white">
              <svg
                viewBox="0 0 60 24"
                className="w-12 h-6 stroke-white fill-none stroke-[3.5] stroke-linecap-round stroke-linejoin-round drop-shadow-xs"
              >
                <path d="M 0 12 L 15 12 L 20 4 L 28 20 L 34 8 L 38 14 L 42 12 L 60 12" />
              </svg>
            </div>
          </button>
        </div>

        {/* ================= CIRCULAR FLOATING ACTION DOCK (IMAGE 2 & 3: Equipo, Cajas, Pokedex, Salir) ================= */}
        <div className="flex items-center justify-around px-2 my-1">
          {/* Button 1: Equipo */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => setActiveSection('equipo')}
              className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer border-2 ${
                activeSection === 'equipo'
                  ? 'bg-gradient-to-b from-[#181d24] to-[#0c1015] border-emerald-400 text-[#32f59b]'
                  : 'bg-gradient-to-b from-[#2e353f] to-[#181d24] border-[#545f6e] hover:border-emerald-400 text-white'
              }`}
              title="Mi Equipo Pokémon"
            >
              <Send className="w-5 h-5" />
            </button>
            <span className={`text-[10px] font-sans font-medium ${activeSection === 'equipo' ? 'text-emerald-700 font-bold' : 'text-slate-600'}`}>
              Equipo
            </span>
          </div>

          {/* Button 2: Cajas */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={onOpenTeamBuilder}
              className="w-13 h-13 rounded-full bg-gradient-to-b from-[#2e353f] to-[#181d24] border-2 border-[#545f6e] hover:border-emerald-400 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
              title="Organizar Escuadrón / Cajas PC"
            >
              <Users className="w-5 h-5 text-white" />
            </button>
            <span className="text-[10px] text-slate-600 font-sans font-medium">
              Cajas
            </span>
          </div>

          {/* Button 3: Pokedex */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleOpenPokedexHub}
              className="w-13 h-13 rounded-full bg-gradient-to-b from-[#2e353f] to-[#181d24] border-2 border-[#545f6e] hover:border-emerald-400 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
              title="Catálogo Pokédex"
            >
              <BookOpen className="w-5 h-5 text-white" />
            </button>
            <span className="text-[10px] text-slate-600 font-sans font-medium">
              Pokedex
            </span>
          </div>

          {/* Button 4: Salir */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => setActiveSection('salir')}
              className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer border-2 ${
                activeSection === 'salir'
                  ? 'bg-gradient-to-b from-[#181d24] to-[#0c1015] border-rose-500 text-rose-400'
                  : 'bg-gradient-to-b from-[#2e353f] to-[#181d24] border-[#545f6e] hover:border-rose-400 text-white'
              }`}
              title="Cerrar Sesión"
            >
              <Backpack className="w-5 h-5" />
            </button>
            <span className={`text-[10px] font-sans font-medium ${activeSection === 'salir' ? 'text-rose-700 font-bold' : 'text-slate-600'}`}>
              Salir
            </span>
          </div>
        </div>

        {/* ================= BOTTOM CHAMFERED NAVIGATION TABS (IMAGE 2) ================= */}
        <div className="grid grid-cols-4 gap-1.5 mt-2">
          {/* Tab 1: BE Black Active Tab */}
          <div
            onClick={() => onOpenRooms && onOpenRooms()}
            className="bg-[#12161b] text-white py-2 flex items-center justify-center gap-1 shadow-md border-t border-slate-700 cursor-pointer hover:bg-black transition-colors"
            style={{ clipPath: 'polygon(12% 0%, 100% 0%, 88% 100%, 0% 100%)' }}
            title="Ir a Salas Multijugador Forth Battle (/room)"
          >
            <span className="text-xs font-black text-[#32f59b] font-mono tracking-tighter">
              BE
            </span>
            <div className="w-4 h-4 rounded-full bg-[#32f59b]/30 border border-[#32f59b] flex items-center justify-center text-[8px] text-white">
              ★
            </div>
          </div>

          {/* Tab 2: Gift Tab (Mint Green) */}
          <div
            className="bg-[#83f8c3] hover:bg-[#72f5b6] text-slate-900 py-2 flex items-center justify-center shadow-xs cursor-pointer transition-colors"
            style={{ clipPath: 'polygon(12% 0%, 100% 0%, 88% 100%, 0% 100%)' }}
          >
            <Gift className="w-4 h-4 text-slate-850" />
          </div>

          {/* Tab 3: Heal / Med Tab (Mint Green) */}
          <div
            className="bg-[#83f8c3] hover:bg-[#72f5b6] text-slate-900 py-2 flex items-center justify-center shadow-xs cursor-pointer transition-colors"
            style={{ clipPath: 'polygon(12% 0%, 100% 0%, 88% 100%, 0% 100%)' }}
          >
            <HeartPulse className="w-4 h-4 text-slate-850" />
          </div>

          {/* Tab 4: Settings Tab (Mint Green) */}
          <div
            className="bg-[#83f8c3] hover:bg-[#72f5b6] text-slate-900 py-2 flex items-center justify-center shadow-xs cursor-pointer transition-colors"
            style={{ clipPath: 'polygon(12% 0%, 100% 0%, 88% 100%, 0% 100%)' }}
          >
            <Settings className="w-4 h-4 text-slate-850" />
          </div>
        </div>
      </div>

      {/* ================= MODALS ================= */}
      {/* 1. Pokemon Detail Sheet */}
      {inspectingSpecies && (
        <PokemonDetailSheet
          species={inspectingSpecies}
          onClose={() => setInspectingSpecies(null)}
          isLeader={selectedTeam[0] === inspectingSpecies}
        />
      )}

      {/* 2. Add Pokemon Modal */}
      <AddPokemonModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddPokemon={handleAddPokemon}
        currentTeam={selectedTeam}
      />

      {/* 3. Arena Mode Selector Modal (Main View) */}
      <ArenaModal
        isOpen={isArenaOpen}
        onClose={() => setIsArenaOpen(false)}
        onStartAiBattle={onOpenPractice || handlePlayAi}
        onOpenCreateRoom={() => (onOpenRooms ? onOpenRooms() : setShowCreateModal(true))}
        onOpenAuth={() => (onOpenAuth ? onOpenAuth() : setIsAuthOpen(true))}
        onOpenRooms={onOpenRooms}
        onOpenPokedex={handleOpenPokedexHub}
        onLogout={handleLogout}
        trainerName={trainerName}
        isLoggedIn={!!currentUser}
        openRooms={openRooms}
        loadingRooms={loadingRooms}
        onRefreshRooms={fetchRooms}
        onJoinRoom={handleDirectJoin}
        joinError={joinError}
        selectedTeamCount={selectedTeam.length}
      />

      {/* 4. Pokédex Hub Modal (Pokémones, Movimientos, Habilidades, Volver) */}
      <PokedexHubModal
        isOpen={isPokedexHubOpen}
        onClose={handleClosePokedexHub}
        onSelectOption={handleSelectPokedexOption}
      />

      {/* 5. Trainer Account / Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onUserChange={handleUserChange}
      />

      {/* 6. Create Room Modal */}
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
