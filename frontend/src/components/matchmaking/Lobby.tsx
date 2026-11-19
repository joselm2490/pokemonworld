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
  Plus,
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
  Backpack,
} from 'lucide-react';
import { StaticPokemonImage } from '../common/StaticPokemonImage';
import { CreateRoomModal } from './CreateRoomModal';
import { RoomLobbyModal } from './RoomLobbyModal';
import { PokemonDetailSheet } from './PokemonDetailSheet';
import { AddPokemonModal } from './AddPokemonModal';
import { ArenaModal } from './ArenaModal';
import { AuthModal } from '../auth/AuthModal';
import { AuthService, TrainerUser } from '../../services/authService';
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

  // Modals - Main View is ARENA Menu (Starts Open)
  const [isArenaOpen, setIsArenaOpen] = useState(true);
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

  const leaderSpecies = selectedTeam[0] || 'CHARIZARD';

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

        {/* ================= WHITE CONTAINER OF POKÉMON TECH-GRID CARDS ================= */}
        <div className="bg-white/95 rounded-2xl border-2 border-slate-300/80 shadow-xl p-3 flex-1 flex flex-col overflow-hidden max-h-[58vh]">
          {/* Scrollable Team Cards (Up to 6 Pokémon) */}
          <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar flex-1">
            {selectedTeam.map((species, idx) => {
              const isLeader = idx === 0;
              const detail = teamDetails[species];
              const stats = detail?.base_stats;
              const displayName = detail?.nombre || species;
              const types = detail?.types_detail || [];

              // Type 2-letter abbreviation like 'Va', 'Fr', 'Da' in Digimon
              const typeAbbr = types[0] ? types[0].nombre.slice(0, 2) : 'No';
              const typeColor = types[0]?.color_hex || '#10b981';

              return (
                <div
                  key={`${species}-${idx}`}
                  onClick={() => setInspectingSpecies(species)}
                  className="relative rounded-lg bg-[#535962] border border-[#3e434a] shadow-md p-2.5 text-white overflow-hidden cursor-pointer group hover:brightness-105 transition-all"
                >
                  {/* Subtle 10px White Tech-Grid on Gray Card */}
                  <div
                    className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none"
                  />

                  {/* Top Black Chamfered Header Bar: Name on Left, Vitals Counter on Right */}
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

                    {/* Vitals Digital Green Counter on Right */}
                    <div className="text-right leading-none">
                      <span className="text-[8px] text-slate-300 font-mono block">Vitals</span>
                      <span className="text-base font-black font-mono text-[#00ff9d] tracking-tight drop-shadow-sm">
                        {stats?.hp || 164}
                        <span className="text-[9px] text-slate-300 font-normal"> /9,999</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Main Body: Left Sprite & Badges, Right Stats */}
                  <div className="relative z-10 grid grid-cols-12 gap-2 items-center">
                    {/* Left Column (Col 5): Circular Type, Rank Badge, Sprite, Info icon */}
                    <div className="col-span-5 flex flex-col items-center justify-center relative">
                      {/* Top Badges Row */}
                      <div className="w-full flex items-center justify-between px-1 mb-1">
                        {/* Circular Type Badge like 'Va' / 'Fr' */}
                        <div
                          style={{ backgroundColor: typeColor }}
                          className="w-5 h-5 rounded-full border border-white/80 flex items-center justify-center text-[9px] font-black text-white shadow-xs capitalize"
                          title={types[0]?.nombre || 'Tipo'}
                        >
                          {typeAbbr}
                        </div>

                        {/* Rank Badge like 'Rank D' */}
                        <div className="bg-[#30343a]/90 border border-slate-500 rounded px-1 py-0.2 text-[8px] font-black text-amber-300 shadow-2xs">
                          {isLeader ? 'Rank S' : 'Rank D'}
                        </div>
                      </div>

                      {/* Pokémon Sprite Thumbnail */}
                      <div className="w-20 h-20 flex items-center justify-center relative my-0.5">
                        <StaticPokemonImage
                          species={species}
                          alt={displayName}
                          className="w-18 h-18 object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform"
                        />
                      </div>

                      {/* Bottom Info Icon ( i ) */}
                      <div className="w-full flex items-center justify-between px-1 text-slate-300">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingSpecies(species);
                          }}
                          className="w-4 h-4 rounded-full bg-black/50 hover:bg-black text-slate-300 hover:text-white flex items-center justify-center text-[9px] font-bold border border-slate-400 transition-colors"
                          title="Ver ficha técnica completa"
                        >
                          i
                        </button>

                        {/* Quick Delete X button (if team > 1) */}
                        {selectedTeam.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePokemon(species);
                            }}
                            className="w-4 h-4 rounded-full bg-rose-950/80 hover:bg-rose-900 text-rose-200 hover:text-white flex items-center justify-center text-[9px] font-bold border border-rose-500 transition-colors"
                            title="Quitar del equipo"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right Column (Col 7): Clean Horizontal Stat Rows with Black Pill + Green Bonus */}
                    <div className="col-span-7 space-y-1 font-mono text-[10px]">
                      {/* HP */}
                      <div className="flex items-center justify-between bg-black/25 px-2 py-0.5 rounded">
                        <span className="text-slate-300 font-bold text-[9px]">HP</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">{stats?.hp ? (stats.hp * 20).toLocaleString() : '3,600'}</span>
                          <span className="bg-[#181c20] text-[#00ff9d] text-[8px] font-black px-1.5 py-0.2 rounded-full border border-slate-700">
                            +0
                          </span>
                        </div>
                      </div>

                      {/* AP / ATAQUE */}
                      <div className="flex items-center justify-between bg-black/25 px-2 py-0.5 rounded">
                        <span className="text-slate-300 font-bold text-[9px]">AP</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">{stats?.attack ? (stats.attack * 14).toLocaleString() : '1,200'}</span>
                          <span className="bg-[#181c20] text-[#00ff9d] text-[8px] font-black px-1.5 py-0.2 rounded-full border border-slate-700">
                            +0
                          </span>
                        </div>
                      </div>

                      {/* BP / DEFENSA & PODER */}
                      <div className="flex items-center justify-between bg-black/25 px-2 py-0.5 rounded">
                        <span className="text-slate-300 font-bold text-[9px]">BP</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">{stats?.defense ? (stats.defense * 45).toLocaleString() : '5,200'}</span>
                          <span className="bg-[#181c20] text-[#00ff9d] text-[8px] font-black px-1.5 py-0.2 rounded-full border border-slate-700">
                            +0
                          </span>
                        </div>
                      </div>

                      {/* ABILITY / HABILIDAD BOX */}
                      <div className="pt-0.5">
                        <div className="flex items-center gap-1 text-[8px] text-slate-300">
                          <span className="uppercase tracking-wider">ABILITY</span>
                          <span className="bg-blue-600 text-white text-[7px] font-black px-1 rounded-xs">
                            DEF
                          </span>
                          <span className="text-slate-400 text-[8px]">Synergy</span>
                        </div>
                        <div className="bg-[#1c2026] text-slate-200 text-[9px] font-sans px-2 py-0.5 rounded mt-0.5 truncate border border-slate-600 flex items-center justify-between">
                          <span className="truncate">
                            {detail?.habilidades?.[0]?.nombre || 'Mar Llamas'}
                          </span>
                          <span className="text-amber-400 font-mono text-[8px] font-bold ml-1 shrink-0">R</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Dashed Add Card (when team < 6) */}
            {selectedTeam.length < 6 && (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="w-full rounded-lg border-2 border-dashed border-slate-400 hover:border-emerald-500 bg-slate-100 hover:bg-emerald-50 p-4 transition-all flex items-center justify-center gap-2 text-slate-600 hover:text-emerald-700 cursor-pointer shadow-xs"
              >
                <div className="w-7 h-7 rounded-full bg-white border border-slate-400 flex items-center justify-center text-slate-700">
                  <Plus className="w-4 h-4" />
                </div>
                <div className="text-left font-sans">
                  <span className="text-xs font-black uppercase tracking-wider block text-slate-800">
                    + Añadir Pokémon ({selectedTeam.length + 1}/6)
                  </span>
                  <span className="text-[9px] text-slate-500">
                    Seleccionar desde la Pokédex
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* ================= MAIN ARENA SKEWED BANNER (IMAGE 2) ================= */}
        <div className="my-2.5 flex justify-center">
          <button
            type="button"
            onClick={() => setIsArenaOpen(true)}
            className="relative w-full max-w-[340px] h-12 bg-gradient-to-r from-[#32f59b] via-[#2ce692] to-[#25db89] hover:brightness-105 active:scale-[0.98] transition-all shadow-[0_4px_14px_rgba(46,230,146,0.45)] border-2 border-[#19c778] flex items-center justify-between px-6 cursor-pointer overflow-hidden group"
            style={{ clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)' }}
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

        {/* ================= CIRCULAR FLOATING ACTION DOCK (IMAGE 2) ================= */}
        <div className="flex items-center justify-around px-2 my-1">
          {/* Button 1: Send / Versus */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => setIsArenaOpen(true)}
              className="w-13 h-13 rounded-full bg-gradient-to-b from-[#2e353f] to-[#181d24] border-2 border-[#545f6e] hover:border-emerald-400 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
              title="Arena de Combates"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
            <span className="text-[10px] text-slate-600 font-sans font-medium">Send</span>
          </div>

          {/* Button 2: Assign / Team */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={onOpenTeamBuilder}
              className="w-13 h-13 rounded-full bg-gradient-to-b from-[#2e353f] to-[#181d24] border-2 border-[#545f6e] hover:border-emerald-400 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
              title="Organizar Escuadrón / Caja PC"
            >
              <Users className="w-5 h-5 text-white" />
            </button>
            <span className="text-[10px] text-slate-600 font-sans font-medium">Assign</span>
          </div>

          {/* Button 3: Codex / Pokédex */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={onOpenPokedex}
              className="w-13 h-13 rounded-full bg-gradient-to-b from-[#2e353f] to-[#181d24] border-2 border-[#545f6e] hover:border-emerald-400 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
              title="Catálogo Pokédex"
            >
              <BookOpen className="w-5 h-5 text-white" />
            </button>
            <span className="text-[10px] text-slate-600 font-sans font-medium">Codex</span>
          </div>

          {/* Button 4: Adventure / Movimientos */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={onOpenMoves}
              className="w-13 h-13 rounded-full bg-gradient-to-b from-[#2e353f] to-[#181d24] border-2 border-[#545f6e] hover:border-emerald-400 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
              title="Catálogo de Movimientos"
            >
              <Backpack className="w-5 h-5 text-white" />
            </button>
            <span className="text-[10px] text-slate-600 font-sans font-medium">Adventure</span>
          </div>
        </div>

        {/* ================= BOTTOM CHAMFERED NAVIGATION TABS (IMAGE 2) ================= */}
        <div className="grid grid-cols-4 gap-1.5 mt-2">
          {/* Tab 1: BE Black Active Tab */}
          <div
            className="bg-[#12161b] text-white py-2 flex items-center justify-center gap-1 shadow-md border-t border-slate-700 cursor-pointer"
            style={{ clipPath: 'polygon(12% 0%, 100% 0%, 88% 100%, 0% 100%)' }}
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

      {/* 3. Arena Mode Selector Modal (Main View) */}
      <ArenaModal
        isOpen={isArenaOpen}
        onClose={() => setIsArenaOpen(false)}
        onStartAiBattle={handlePlayAi}
        onOpenCreateRoom={() => setShowCreateModal(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenPokedex={onOpenPokedex}
        trainerName={trainerName}
        isLoggedIn={!!currentUser}
        openRooms={openRooms}
        loadingRooms={loadingRooms}
        onRefreshRooms={fetchRooms}
        onJoinRoom={handleDirectJoin}
        joinError={joinError}
        selectedTeamCount={selectedTeam.length}
      />

      {/* 4. Trainer Account / Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onUserChange={handleUserChange}
      />

      {/* 5. Create Room Modal */}
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
