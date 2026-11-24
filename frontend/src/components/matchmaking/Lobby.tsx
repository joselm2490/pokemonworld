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
  Send,
  Sliders,
  Clock,
  AlertCircle,
  Settings,
  Volume2,
  VolumeX,
  LogOut,
  X,
} from 'lucide-react';
import { battleAudio } from '../../utils/battleAudio';
import { StaticPokemonImage } from '../common/StaticPokemonImage';
import { CreateRoomModal } from './CreateRoomModal';
import { RoomLobbyModal } from './RoomLobbyModal';
import { PokemonDetailSheet } from './PokemonDetailSheet';
import { AddPokemonModal } from './AddPokemonModal';
import { ArenaModal } from './ArenaModal';
import { PokedexHubModal } from './PokedexHubModal';
import { CajasSection } from './CajasSection';
import { RoomSection } from './RoomSection';
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
  initialSection?: 'arena' | 'equipo' | 'cajas' | 'room' | 'salir';
  initialRoomCode?: string;
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
  initialSection = 'arena',
  initialRoomCode,
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
      try {
        const savedTeam = localStorage.getItem('pokemon_user_team');
        if (savedTeam && onUpdateTeam) {
          const parsed = JSON.parse(savedTeam);
          if (Array.isArray(parsed) && parsed.length > 0) {
            onUpdateTeam(parsed);
          }
        }
      } catch {}
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
  const [activeSection, setActiveSection] = useState<'arena' | 'equipo' | 'cajas' | 'room'>(
    initialSection === 'salir' ? 'arena' : initialSection
  );
  const [showSettingsModal, setShowSettingsModal] = useState(initialSection === 'salir');
  const [muted, setMuted] = useState<boolean>(() => battleAudio.isMuted());

  const handleToggleAudio = () => {
    const nowMuted = battleAudio.toggleMute();
    setMuted(nowMuted);
    if (!nowMuted) {
      battleAudio.ensureBgmPlaying();
    }
  };

  useEffect(() => {
    if (initialSection === 'salir') {
      setActiveSection('arena');
      setShowSettingsModal(true);
    } else {
      setActiveSection(initialSection);
    }
  }, [initialSection]);
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

  // Sync leader team from Django/Supabase on mount if logged in
  useEffect(() => {
    if (currentUser) {
      AuthService.syncActiveTeam().then((synced) => {
        if (synced && onUpdateTeam) {
          onUpdateTeam(synced);
        }
      });
    }
  }, []);

  const isTeamComplete = selectedTeam.length === 6;

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
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-2 sm:mb-3">
          {/* Left: Metallic Dark Badge with Rank '2' / 'S' & Wings */}
          <div className="flex items-center">
            <div
              className="bg-[#2a3038] text-white px-2.5 sm:px-3 py-1 flex items-center gap-1.5 shadow-md border-t border-l border-slate-500"
              style={{ clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)' }}
            >
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-slate-400 flex items-center justify-center text-[9px] sm:text-[10px] font-black text-amber-300">
                ❖
              </div>
              <span className="text-xs sm:text-sm font-black font-mono tracking-tighter text-white">
                2
              </span>
            </div>
          </div>

          {/* Center: Trainer Name White Pill with Auth Dialog */}
          <div className="flex-1 max-w-[200px]">
            <div
              onClick={() => setIsAuthOpen(true)}
              className="bg-white/95 hover:bg-white border border-slate-300/80 rounded-full px-3 py-1 shadow-xs flex items-center justify-center cursor-pointer group transition-all"
              title="Cuenta de Entrenador (Iniciar sesión / Registro)"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className={`w-2 h-2 rounded-full ${currentUser ? 'bg-emerald-500' : 'bg-amber-400'} shrink-0`} />
                <span className="text-xs font-bold text-slate-800 truncate">
                  {trainerName}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Settings / Ajustes Gear Button */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shadow-xs transition-all border cursor-pointer active:scale-95 ${
                showSettingsModal
                  ? 'bg-emerald-700 border-emerald-500 text-white ring-2 ring-emerald-400/60'
                  : 'bg-slate-800 hover:bg-slate-900 border-slate-600 text-white'
              }`}
              title="Ajustes"
            >
              <Settings className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </div>

        {/* ================= WHITE CONTAINER: DYNAMIC SECTIONS (ARENA / EQUIPO / SALIR) ================= */}
        <div className="bg-white/95 rounded-2xl border-2 border-slate-300/80 shadow-xl p-2.5 sm:p-3 flex-1 flex flex-col overflow-hidden max-h-[72vh] sm:max-h-[76vh]">
          {/* 1. SECCIÓN ARENA (IMAGEN 2 - PREDETERMINADA) */}
          {activeSection === 'arena' && (
            <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar flex-1">
              {!isTeamComplete && (
                <div className="p-2.5 sm:p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-2 shadow-2xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 text-[11px] leading-snug">
                    <p className="font-bold">
                      Debes completar el equipo líder con 6 Pokémon para poder hacer duelos en Salas o Práctica.
                    </p>
                    <p className="text-[10px] text-amber-700 mt-0.5">
                      Equipo líder actual: <strong>{selectedTeam.length}/6 Pokémon</strong>.{' '}
                      <button
                        type="button"
                        onClick={() => setActiveSection('cajas')}
                        className="underline font-bold text-amber-900 hover:text-amber-700 cursor-pointer"
                      >
                        Completar en Cajas
                      </button>
                    </p>
                  </div>
                </div>
              )}

              {/* 1. Duelo Online Card (Salas Multijugador) */}
              <button
                type="button"
                disabled={!isTeamComplete}
                onClick={() => {
                  if (!isTeamComplete) return;
                  setActiveSection('room');
                  if (onOpenRooms) onOpenRooms();
                }}
                className={`w-full text-left relative h-26 min-h-[104px] shrink-0 rounded-2xl overflow-hidden bg-[#151c26] border border-[#26354a] shadow-md transition-all flex items-center px-4 ${
                  isTeamComplete
                    ? 'cursor-pointer group hover:brightness-105 active:scale-[0.99]'
                    : 'opacity-50 grayscale cursor-not-allowed'
                }`}
              >
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none" />
                <div className="relative z-10">
                  <h3 className="text-xl sm:text-2xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-sm font-sans">
                    DUELO
                  </h3>
                  <h3 className="text-xl sm:text-2xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-sm font-sans">
                    ONLINE
                  </h3>
                  <span className="text-[9px] font-bold text-purple-200 tracking-wider uppercase block mt-1 font-mono">
                    {isTeamComplete ? 'SALAS MULTIJUGADOR 6v6' : `BLOQUEADO (${selectedTeam.length}/6 POKÉMON)`}
                  </span>
                </div>

                <div className="absolute right-4 flex items-center gap-2 pointer-events-none">
                  {!isTeamComplete ? (
                    <div className="w-10 h-10 rounded-full bg-white/10 border-2 border-white/60 flex items-center justify-center text-amber-300">
                      <Lock className="w-5 h-5" />
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/60 flex items-center justify-center text-white">
                        <Swords className="w-5 h-5 text-white" />
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/10 border-2 border-white/80 flex items-center justify-center text-white">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                    </>
                  )}
                </div>
              </button>

              {/* 2. Duelo Práctica Card (Combate vs IA 6v6) */}
              <button
                type="button"
                disabled={!isTeamComplete}
                onClick={() => {
                  if (!isTeamComplete) return;
                  if (onOpenPractice) onOpenPractice();
                  else handlePlayAi();
                }}
                className={`w-full text-left relative h-26 min-h-[104px] shrink-0 rounded-2xl overflow-hidden bg-gradient-to-r from-[#7a52c7] via-[#875fd3] to-[#9973e2] border-2 border-[#603baf] shadow-md transition-all flex items-center px-4 ${
                  isTeamComplete
                    ? 'cursor-pointer group hover:brightness-105 active:scale-[0.99]'
                    : 'opacity-50 grayscale cursor-not-allowed'
                }`}
              >
                {/* Purple Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff30_1px,transparent_1px),linear-gradient(to_bottom,#ffffff30_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />

                {/* Left Typography */}
                <div className="relative z-10">
                  <h3 className="text-xl sm:text-2xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-sm font-sans">
                    DUELO
                  </h3>
                  <h3 className="text-xl sm:text-2xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-sm font-sans">
                    PRACTICA
                  </h3>
                  <span className="text-[9px] font-bold text-purple-200 tracking-wider uppercase block mt-1 font-mono">
                    {isTeamComplete ? 'COMBATE VS IA (6 VS 6)' : `BLOQUEADO (${selectedTeam.length}/6 POKÉMON)`}
                  </span>
                </div>

                {/* Sparring Stick Figures or Lock on Right */}
                <div className="absolute right-4 flex items-center gap-2 pointer-events-none text-white opacity-95">
                  {!isTeamComplete ? (
                    <div className="w-10 h-10 rounded-full bg-white/15 border-2 border-white/60 flex items-center justify-center text-amber-300">
                      <Lock className="w-5 h-5" />
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col items-center">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-white mb-0.5" />
                        <div className="w-1 h-5 bg-white" />
                      </div>
                      <div className="text-2xl font-black italic text-amber-300 drop-shadow-sm">⚡</div>
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full border-2 border-white mb-0.5" />
                        <div className="w-1 h-4 bg-white" />
                      </div>
                    </>
                  )}
                </div>
              </button>

              {/* 3. Próximamente Card */}
              <div className="relative h-26 min-h-[104px] shrink-0 rounded-2xl overflow-hidden bg-gradient-to-r from-[#44c4e8] via-[#52d2f4] to-[#68defd] border-2 border-[#2fa8cb] shadow-md flex items-center px-4">
                {/* Cyan Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff30_1px,transparent_1px),linear-gradient(to_bottom,#ffffff30_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />

                {/* Left Typography */}
                <div className="relative z-10">
                  <h3 className="text-xl sm:text-2xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-sm font-sans">
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

          {/* 2. SECCIÓN EQUIPO (LISTADO DE POKÉMON TECH-GRID) */}
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
                        TOTAL:
                      </span>
                      <span className="text-sm sm:text-base font-black font-mono text-[#00ff9d] tracking-tight drop-shadow-sm">
                        {resolved.total.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Card Main Body: Left Sprite & Badges, Right All 6 Stats */}
                  <div className="relative z-10 grid grid-cols-12 gap-2 items-center">
                    {/* Left Column (Col 5): Stacked Type Badges, Sprite, Info icon (sin rangos ni botón X) */}
                    <div className="col-span-5 flex flex-col items-center justify-between h-full py-0.5 relative">
                      {/* Top Badges: Stacked Vertically */}
                      <div className="w-full flex flex-col items-start gap-1 px-1 mb-1">
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
                        </div>
                        <div className="bg-[#1c2026] text-slate-200 text-[9px] font-sans px-2 py-0.5 rounded mt-0.5 truncate border border-slate-600">
                          <span className="truncate">
                            {detail?.habilidades?.[0]?.nombre || resolved.ability || 'Mar Llamas'}
                          </span>
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

      {/* 3. SECCIÓN CAJAS PC (ADAPTADA RESPONSIVE DENTRO DEL CONTENEDOR) */}
      {activeSection === 'cajas' && (
        <CajasSection
          onUpdateTeam={onUpdateTeam}
          selectedTeam={selectedTeam}
        />
      )}

      {/* 4. SECCIÓN SALAS MULTIJUGADOR (/room ADAPTADO AL CONTENEDOR) */}
      {activeSection === 'room' && (
        <RoomSection
          selectedTeam={selectedTeam}
          currentUser={currentUser}
          initialRoomCode={initialRoomCode}
          onGoToCajas={() => setActiveSection('cajas')}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
      )}
    </div>

        {/* ================= CIRCULAR FLOATING ACTION DOCK (Arena, Equipo, Cajas, Pokedex) ================= */}
        <div className="flex items-center justify-around max-w-[340px] sm:max-w-[380px] mx-auto w-full px-2 my-2 sm:my-3">
          {/* Button 1: Arena */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => setActiveSection('arena')}
              className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer border-2 ${
                activeSection === 'arena'
                  ? 'bg-gradient-to-b from-[#181d24] to-[#0c1015] border-emerald-400 text-[#32f59b]'
                  : 'bg-gradient-to-b from-[#2e353f] to-[#181d24] border-[#545f6e] hover:border-emerald-400 text-white'
              }`}
              title="Sección Arena"
            >
              <Swords className="w-5 h-5" />
            </button>
            <span
              className={`text-[10px] font-sans font-medium ${
                activeSection === 'arena' ? 'text-emerald-700 font-bold' : 'text-slate-600'
              }`}
            >
              Arena
            </span>
          </div>

          {/* Button 2: Equipo */}
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
            <span
              className={`text-[10px] font-sans font-medium ${
                activeSection === 'equipo' ? 'text-emerald-700 font-bold' : 'text-slate-600'
              }`}
            >
              Equipo
            </span>
          </div>

          {/* Button 3: Cajas */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveSection('cajas')}
              className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer border-2 ${
                activeSection === 'cajas'
                  ? 'bg-gradient-to-b from-[#181d24] to-[#0c1015] border-emerald-400 text-[#32f59b]'
                  : 'bg-gradient-to-b from-[#2e353f] to-[#181d24] border-[#545f6e] hover:border-emerald-400 text-white'
              }`}
              title="Organizar Escuadrón / Cajas PC"
            >
              <Users className="w-5 h-5" />
            </button>
            <span
              className={`text-[10px] font-sans font-medium ${
                activeSection === 'cajas' ? 'text-emerald-700 font-bold' : 'text-slate-600'
              }`}
            >
              Cajas
            </span>
          </div>

          {/* Button 4: Pokedex */}
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
        </div>
      </div>

      {/* ================= MODALS ================= */}
      {/* 0. Settings Modal (Ajustes de Combate / Cerrar Sesión) */}
      {showSettingsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="w-full max-w-xs sm:max-w-sm bg-white border-2 border-slate-200 rounded-3xl p-4 sm:p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                AJUSTES DE COMBATE
              </h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                title="Cerrar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleToggleAudio}
                className="w-full py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  {muted ? (
                    <VolumeX className="w-4 h-4 text-rose-500" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>{muted ? 'Activar Música' : 'Silenciar Música'}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500">
                  {muted ? 'OFF' : 'ON'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSettingsModal(false);
                  handleLogout();
                }}
                className="w-full py-2.5 px-3.5 bg-rose-50 hover:bg-rose-100 rounded-xl text-xs font-bold text-rose-600 flex items-center justify-between cursor-pointer border border-rose-200 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Cerrar Sesión</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

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
