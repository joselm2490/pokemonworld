import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Trash2,
  Search,
  Star,
  Edit2,
  Save,
  ShieldCheck,
  AlertCircle,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { StaticPokemonImage } from '../components/common/StaticPokemonImage';
import { TYPE_SPRITE_INDEX } from '../utils/battleSprites';
import { PokemonType } from '../types/pokemon';
import { AuthService, TrainerTeamData, TrainerUser } from '../services/authService';

interface RosterItem {
  species: string;
  name: string;
  types: PokemonType[];
  base_stats?: {
    hp: number;
    attack: number;
    defense: number;
    sp_attack: number;
    sp_defense: number;
    speed: number;
  };
}

const DEFAULT_SLOTS: TrainerTeamData[] = [
  { slot: 1, name: 'Equipo 1 (Principal)', pokemon_list: ['CHARIZARD', 'PIKACHU', 'BLASTOISE', 'LUCARIO', 'GENGAR', 'GARCHOMP'], is_active: true },
  { slot: 2, name: 'Equipo 2 (Fuego)', pokemon_list: ['CHARIZARD', 'ARCANINE', 'BLAZIKEN', 'INFERNAPE', 'VOLCARONA', 'TYPHLOSION'], is_active: false },
  { slot: 3, name: 'Equipo 3 (Agua)', pokemon_list: ['BLASTOISE', 'GYARADOS', 'SWAMPERT', 'GRENINJA', 'LAPRAS', 'FERALIGATR'], is_active: false },
  { slot: 4, name: 'Equipo 4 (Dragón)', pokemon_list: ['DRAGONITE', 'GARCHOMP', 'SALAMENCE', 'HYDREIGON', 'DRAGAPULT', 'RAYQUAZA'], is_active: false },
  { slot: 5, name: 'Equipo 5 (Acero/Lucha)', pokemon_list: ['LUCARIO', 'METAGROSS', 'SCIZOR', 'CORVIKNIGHT', 'MACHAMP', 'GALLADE'], is_active: false },
  { slot: 6, name: 'Equipo 6 (Eléctrico)', pokemon_list: ['PIKACHU', 'RAICHU', 'JOLTEON', 'ELECTIVIRE', 'LUXRAY', 'ZAPDOS'], is_active: false },
  { slot: 7, name: 'Equipo 7 (Fantasma)', pokemon_list: ['GENGAR', 'CHANDELURE', 'TYRANITAR', 'ZOROARK', 'MIMIKYU', 'AEGISLASH'], is_active: false },
  { slot: 8, name: 'Equipo 8 (Planta)', pokemon_list: ['VENUSAUR', 'SCEPTILE', 'DECIDUEYE', 'ROSERADE', 'AMOONGUSS', 'TORTERRA'], is_active: false },
  { slot: 9, name: 'Equipo 9 (Psíquico)', pokemon_list: ['MEWTWO', 'ALAKAZAM', 'GARDEVOIR', 'TOGEKISS', 'SYLVEON', 'HATTERENE'], is_active: false },
  { slot: 10, name: 'Equipo 10 (Especial)', pokemon_list: ['SNORLAX', 'TOGEKISS', 'TYRANITAR', 'DRAGONITE', 'LUCARIO', 'CHARIZARD'], is_active: false },
];

const FALLBACK_ROSTER: RosterItem[] = [
  { species: 'CHARIZARD', name: 'Charizard', types: ['FIRE', 'FLYING'] },
  { species: 'PIKACHU', name: 'Pikachu', types: ['ELECTRIC'] },
  { species: 'BLASTOISE', name: 'Blastoise', types: ['WATER'] },
  { species: 'VENUSAUR', name: 'Venusaur', types: ['GRASS', 'POISON'] },
  { species: 'GENGAR', name: 'Gengar', types: ['GHOST', 'POISON'] },
  { species: 'LUCARIO', name: 'Lucario', types: ['FIGHTING', 'STEEL'] },
  { species: 'GARCHOMP', name: 'Garchomp', types: ['DRAGON', 'GROUND'] },
  { species: 'MEWTWO', name: 'Mewtwo', types: ['PSYCHIC'] },
  { species: 'GRENINJA', name: 'Greninja', types: ['WATER', 'DARK'] },
  { species: 'DRAGONITE', name: 'Dragonite', types: ['DRAGON', 'FLYING'] },
  { species: 'TYRANITAR', name: 'Tyranitar', types: ['ROCK', 'DARK'] },
  { species: 'SYLVEON', name: 'Sylveon', types: ['FAIRY'] },
  { species: 'ARCANINE', name: 'Arcanine', types: ['FIRE'] },
  { species: 'GYARADOS', name: 'Gyarados', types: ['WATER', 'FLYING'] },
  { species: 'SNORLAX', name: 'Snorlax', types: ['NORMAL'] },
  { species: 'SCIZOR', name: 'Scizor', types: ['BUG', 'STEEL'] },
];

export const TeamPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser] = useState<TrainerUser | null>(() => AuthService.getCurrentUser());

  // Teams state (10 slots)
  const [teams, setTeams] = useState<TrainerTeamData[]>(DEFAULT_SLOTS);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Roster state
  const [roster, setRoster] = useState<RosterItem[]>(FALLBACK_ROSTER);
  const [rosterQuery, setRosterQuery] = useState('');
  const [loadingRoster, setLoadingRoster] = useState(false);

  // Load user teams from backend (Supabase)
  useEffect(() => {
    AuthService.getTeams()
      .then((data) => {
        if (data.teams && data.teams.length > 0) {
          setTeams(data.teams);
          if (data.active_slot) {
            setSelectedSlotIndex(data.active_slot);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not load teams from backend, using defaults', err);
      });
  }, []);

  // Fetch roster from backend
  useEffect(() => {
    const controller = new AbortController();
    const apiBase = import.meta.env.VITE_BACKEND_API_URL || '';

    const timer = setTimeout(async () => {
      setLoadingRoster(true);
      try {
        const params = new URLSearchParams({ limit: '36' });
        if (rosterQuery.trim()) params.set('q', rosterQuery.trim());
        const res = await fetch(`${apiBase}/api/pokedex/roster/?${params.toString()}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setRoster(data);
          }
        }
      } catch {
        const q = rosterQuery.trim().toLowerCase();
        setRoster(
          FALLBACK_ROSTER.filter(
            (p) => !q || p.name.toLowerCase().includes(q) || p.types.some((t) => t.toLowerCase().includes(q))
          )
        );
      } finally {
        setLoadingRoster(false);
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [rosterQuery]);

  // Current selected team
  const currentTeam = teams.find((t) => t.slot === selectedSlotIndex) || teams[0];

  const handleUpdateName = (newName: string) => {
    setTeams((prev) =>
      prev.map((t) => (t.slot === selectedSlotIndex ? { ...t, name: newName } : t))
    );
  };

  const handleTogglePokemon = (species: string) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.slot !== selectedSlotIndex) return t;
        const exists = t.pokemon_list.includes(species);
        let updated: string[];
        if (exists) {
          updated = t.pokemon_list.filter((s) => s !== species);
        } else {
          if (t.pokemon_list.length >= 6) {
            alert('¡Un equipo Pokémon puede tener un máximo de 6 miembros!');
            return t;
          }
          updated = [...t.pokemon_list, species];
        }
        return { ...t, pokemon_list: updated };
      })
    );
  };

  const handleRemovePokemon = (idx: number) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.slot !== selectedSlotIndex) return t;
        const updated = t.pokemon_list.filter((_, i) => i !== idx);
        return { ...t, pokemon_list: updated };
      })
    );
  };

  const handleSetActive = async () => {
    setTeams((prev) =>
      prev.map((t) => ({ ...t, is_active: t.slot === selectedSlotIndex }))
    );
    // Save to localStorage for quick battle loading
    localStorage.setItem('pokemon_user_team', JSON.stringify(currentTeam.pokemon_list));
    localStorage.setItem('pokemon_active_slot', String(selectedSlotIndex));

    await handleSaveTeam(true);
  };

  const handleSaveTeam = async (justSetAsActive: boolean = false) => {
    if (currentTeam.pokemon_list.length === 0) {
      alert('¡Debes agregar al menos 1 Pokémon a tu equipo antes de guardar!');
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      const isNowActive = justSetAsActive ? true : currentTeam.is_active;
      await AuthService.saveTeam(
        currentTeam.slot,
        currentTeam.name,
        currentTeam.pokemon_list,
        isNowActive
      );
      if (isNowActive) {
        localStorage.setItem('pokemon_user_team', JSON.stringify(currentTeam.pokemon_list));
      }
      setSaveMessage(`¡${currentTeam.name} guardado con éxito en Supabase!`);
      setTimeout(() => setSaveMessage(null), 3500);
    } catch (err: any) {
      setSaveMessage('Guardado localmente (sin conexión)');
      setTimeout(() => setSaveMessage(null), 3500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f4f7] text-slate-800 p-3 sm:p-6 font-sans select-none flex flex-col">
      {/* Top Header */}
      <div className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-300">
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
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-900">
                EQUIPOS DE COMBATE (10 RANURAS)
              </h1>
              {currentUser && (
                <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" />
                  {currentUser.username}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Configura hasta 10 alineaciones de 6 Pokémon y guárdalas en Supabase.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSaveTeam(false)}
            disabled={saving}
            className="flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#d9f977] via-[#b6f04d] to-[#99e334] text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-105 active:scale-95 transition-all cursor-pointer border border-[#9fd638] disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Guardando...' : 'Guardar Equipo'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col py-4 space-y-4">
        {/* 10-Slot Selector Tabs */}
        <div className="bg-white border border-slate-300/80 rounded-2xl p-2 shadow-xs">
          <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            <span>Selecciona Ranura de Equipo (1 a 10)</span>
            <span>
              Activo para combate:{' '}
              <strong className="text-amber-600 font-black">
                Ranura #{teams.find((t) => t.is_active)?.slot || 1}
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 pt-2">
            {teams.map((t) => {
              const isSelected = t.slot === selectedSlotIndex;
              return (
                <button
                  key={t.slot}
                  onClick={() => setSelectedSlotIndex(t.slot)}
                  className={`py-2 px-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center justify-center relative border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-amber-400 shadow-md ring-1 ring-amber-400/50'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <span className="font-mono text-sm">#{String(t.slot).padStart(2, '0')}</span>
                  {t.is_active && (
                    <span className="inline-flex items-center text-[9px] text-amber-400 font-bold mt-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Slot Information Bar */}
        <div className="bg-white border border-slate-300/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-slate-100 text-amber-700 font-mono text-xs font-bold px-2 py-0.5 rounded-md border border-slate-300">
                RANURA #{String(currentTeam.slot).padStart(2, '0')}
              </span>
              {currentTeam.is_active ? (
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                  EQUIPO PRINCIPAL ACTIVO
                </span>
              ) : (
                <button
                  onClick={handleSetActive}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                >
                  <Star className="w-3 h-3 text-amber-600" />
                  Marcar como Equipo Activo
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={currentTeam.name}
                onChange={(e) => handleUpdateName(e.target.value)}
                placeholder="Nombre del Equipo..."
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-sm sm:text-base font-black text-slate-900 focus:outline-hidden focus:border-amber-500 w-full sm:w-80 shadow-inner"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold font-mono text-slate-600">
              {currentTeam.pokemon_list.length}/6 Miembros
            </span>
            <button
              onClick={() => handleUpdateName(`Equipo ${currentTeam.slot}`)}
              className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              Restablecer nombre
            </button>
          </div>
        </div>

        {/* Save message notification */}
        {saveMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs flex items-center gap-2 shadow-xs animate-in fade-in">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveMessage}</span>
          </div>
        )}

        {/* 6 Pokémon Slots Grid */}
        <div className="bg-white border border-slate-300/80 rounded-2xl p-4 shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, idx) => {
              const species = currentTeam.pokemon_list[idx];
              return (
                <div
                  key={idx}
                  className={`h-40 rounded-2xl border-2 flex flex-col items-center justify-center relative p-2 transition-all ${
                    species
                      ? 'bg-slate-50 border-amber-400 shadow-xs group'
                      : 'bg-slate-100/60 border-dashed border-slate-300 text-slate-400'
                  }`}
                >
                  <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-500 font-bold">
                    #{idx + 1}
                  </div>

                  {species ? (
                    <>
                      <button
                        onClick={() => handleRemovePokemon(idx)}
                        className="absolute top-2 right-2 p-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shadow-2xs"
                        title="Quitar del equipo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <StaticPokemonImage
                        species={species}
                        alt={species}
                        className="w-20 h-20 my-auto group-hover:scale-105 transition-transform"
                      />
                      <span className="text-xs font-black text-slate-900 uppercase truncate font-mono mt-1 max-w-[90%] text-center">
                        {species}
                      </span>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Plus className="w-6 h-6 mb-1 opacity-50" />
                      <span className="text-[11px] font-mono">Ranura Vacía</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Roster / Pokédex Catalog for Adding */}
        <div className="bg-white border border-slate-300/80 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>Catálogo de Pokémon Disponibles</span>
                {loadingRoster && (
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500 animate-spin" />
                )}
              </h2>
              <p className="text-[11px] text-slate-600">
                Haz clic en cualquier Pokémon para añadirlo o quitarlo de la Ranura #{currentTeam.slot}.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={rosterQuery}
                onChange={(e) => setRosterQuery(e.target.value)}
                placeholder="Buscar por nombre o tipo..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-500 shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
            {roster.map((pkmn) => {
              const isSelected = currentTeam.pokemon_list.includes(pkmn.species);
              return (
                <div
                  key={pkmn.species}
                  onClick={() => handleTogglePokemon(pkmn.species)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col items-center relative overflow-hidden select-none ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 shadow-xs ring-1 ring-emerald-500/50'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}

                  <div className="w-16 h-16 flex items-center justify-center my-0.5">
                    <StaticPokemonImage
                      species={pkmn.species}
                      alt={pkmn.name}
                      className="w-14 h-14"
                    />
                  </div>

                  <span className="font-bold text-slate-900 text-[11px] tracking-wide uppercase truncate max-w-full text-center">
                    {pkmn.name}
                  </span>

                  <div className="flex items-center justify-center gap-0.5 mt-1">
                    {pkmn.types.map((type) => (
                      <span
                        key={type}
                        className="inline-block pixelated"
                        style={{
                          width: '64px',
                          height: '28px',
                          backgroundImage: 'url(/battle-ui/ui/types-espanol.png)',
                          backgroundSize: '64px 532px',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: `0px -${(TYPE_SPRITE_INDEX[type] ?? 0) * 28}px`,
                          transform: 'scale(0.6)',
                          margin: '-6px -9px',
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
