import React, { useState, useEffect } from 'react';
import {
  Save,
  Trash2,
  Search,
  Star,
  Edit2,
  Check,
  Plus,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Crown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { StaticPokemonImage } from '../common/StaticPokemonImage';
import { PokeballLoader } from '../common/PokeballLoader';
import { AuthService, TrainerTeamData, TrainerUser } from '../../services/authService';
import { PokedexService } from '../../services/pokedexService';
import { getResolvedTypes } from '../../utils/pokemonStats';

export interface TypeBadgeInfo {
  nombre: string;
  color_hex: string;
}

export interface RosterItem {
  species: string;
  name: string;
  numero_pokedex?: number;
  gen?: number;
  types: string[];
  types_detail?: TypeBadgeInfo[];
}

const SPANISH_TYPE_COLORS: Record<string, string> = {
  Normal: '#a8a878',
  Fuego: '#f08030',
  Agua: '#6890f0',
  Planta: '#78c850',
  Eléctrico: '#f8d030',
  Electrico: '#f8d030',
  Hielo: '#98d8d8',
  Lucha: '#c03028',
  Veneno: '#a040a0',
  Tierra: '#e0c068',
  Volador: '#a890f0',
  Psíquico: '#f85888',
  Psiquico: '#f85888',
  Bicho: '#a8b820',
  Roca: '#b8a038',
  Fantasma: '#705898',
  Dragón: '#7038f8',
  Dragon: '#7038f8',
  Siniestro: '#705848',
  Acero: '#b8b8d0',
  Hada: '#ee99ac',
};

const FILTER_TYPES = [
  'Fuego',
  'Agua',
  'Planta',
  'Eléctrico',
  'Psíquico',
  'Dragón',
  'Fantasma',
  'Lucha',
  'Acero',
  'Tierra',
  'Roca',
  'Hielo',
  'Bicho',
  'Veneno',
  'Volador',
  'Normal',
  'Siniestro',
  'Hada',
];

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

const FALLBACK_CATALOG: RosterItem[] = [
  { species: 'CHARIZARD', name: 'Charizard', types: ['Fuego', 'Volador'] },
  { species: 'PIKACHU', name: 'Pikachu', types: ['Eléctrico'] },
  { species: 'BLASTOISE', name: 'Blastoise', types: ['Agua'] },
  { species: 'VENUSAUR', name: 'Venusaur', types: ['Planta', 'Veneno'] },
  { species: 'GENGAR', name: 'Gengar', types: ['Fantasma', 'Veneno'] },
  { species: 'LUCARIO', name: 'Lucario', types: ['Lucha', 'Acero'] },
  { species: 'GARCHOMP', name: 'Garchomp', types: ['Dragón', 'Tierra'] },
  { species: 'MEWTWO', name: 'Mewtwo', types: ['Psíquico'] },
  { species: 'GRENINJA', name: 'Greninja', types: ['Agua', 'Siniestro'] },
  { species: 'DRAGONITE', name: 'Dragonite', types: ['Dragón', 'Volador'] },
  { species: 'TYRANITAR', name: 'Tyranitar', types: ['Roca', 'Siniestro'] },
  { species: 'SYLVEON', name: 'Sylveon', types: ['Hada'] },
  { species: 'ARCANINE', name: 'Arcanine', types: ['Fuego'] },
  { species: 'GROWLITHE', name: 'Growlithe', types: ['Fuego'] },
  { species: 'GYARADOS', name: 'Gyarados', types: ['Agua', 'Volador'] },
  { species: 'SNORLAX', name: 'Snorlax', types: ['Normal'] },
  { species: 'SCIZOR', name: 'Scizor', types: ['Bicho', 'Acero'] },
  { species: 'ALAKAZAM', name: 'Alakazam', types: ['Psíquico'] },
  { species: 'MACHAMP', name: 'Machamp', types: ['Lucha'] },
  { species: 'LAPRAS', name: 'Lapras', types: ['Agua', 'Hielo'] },
  { species: 'EEVEE', name: 'Eevee', types: ['Normal'] },
  { species: 'VAPOREON', name: 'Vaporeon', types: ['Agua'] },
  { species: 'JOLTEON', name: 'Jolteon', types: ['Eléctrico'] },
  { species: 'FLAREON', name: 'Flareon', types: ['Fuego'] },
  { species: 'ESPEON', name: 'Espeon', types: ['Psíquico'] },
  { species: 'UMBREON', name: 'Umbreon', types: ['Siniestro'] },
  { species: 'LEAFEON', name: 'Leafeon', types: ['Planta'] },
  { species: 'GLACEON', name: 'Glaceon', types: ['Hielo'] },
  { species: 'METAGROSS', name: 'Metagross', types: ['Acero', 'Psíquico'] },
  { species: 'SALAMENCE', name: 'Salamence', types: ['Dragón', 'Volador'] },
  { species: 'RAYQUAZA', name: 'Rayquaza', types: ['Dragón', 'Volador'] },
  { species: 'ZAPDOS', name: 'Zapdos', types: ['Eléctrico', 'Volador'] },
  { species: 'MOLTRES', name: 'Moltres', types: ['Fuego', 'Volador'] },
  { species: 'ARTICUNO', name: 'Articuno', types: ['Hielo', 'Volador'] },
  { species: 'MIMIKYU', name: 'Mimikyu', types: ['Fantasma', 'Hada'] },
  { species: 'SHEDINJA', name: 'Shedinja', types: ['Bicho', 'Fantasma'] },
];

interface CajasSectionProps {
  onUpdateTeam?: (newTeam: string[]) => void;
  selectedTeam?: string[];
}

export const CajasSection: React.FC<CajasSectionProps> = ({
  onUpdateTeam,
  selectedTeam,
}) => {
  // 10 Teams state
  const [teams, setTeams] = useState<TrainerTeamData[]>(() => {
    const saved = localStorage.getItem('pokemon_trainer_teams');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return DEFAULT_SLOTS;
  });

  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(() => {
    const savedSlot = localStorage.getItem('pokemon_active_slot');
    return savedSlot ? parseInt(savedSlot, 10) || 1 : 1;
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'warn' } | null>(null);

  // Roster catalog, filters & pagination
  const PAGE_SIZE = 20;
  const [catalog, setCatalog] = useState<RosterItem[]>(FALLBACK_CATALOG);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedGen, setSelectedGen] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [typesCache, setTypesCache] = useState<Record<string, TypeBadgeInfo[]>>({});

  // Load user teams from backend/Supabase
  useEffect(() => {
    AuthService.getTeams()
      .then((data) => {
        if (data.teams && data.teams.length > 0) {
          // If we have selectedTeam from props, ensure the active slot mirrors it
          if (selectedTeam && selectedTeam.length > 0) {
            const updated = data.teams.map((t) =>
              t.slot === data.active_slot ? { ...t, pokemon_list: selectedTeam } : t
            );
            setTeams(updated);
          } else {
            setTeams(data.teams);
          }
          if (data.active_slot) {
            setSelectedSlotIndex(data.active_slot);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not load teams from backend, using defaults', err);
      });
  }, []);

  // Fetch full pokedex catalog with search, type & generation filters
  useEffect(() => {
    let isCancelled = false;
    const fetchPokedex = async () => {
      setLoadingCatalog(true);
      try {
        const res = await PokedexService.getPokemonList({
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
          q: searchQuery.trim() || undefined,
          tipo: selectedType || undefined,
          gen: selectedGen || undefined,
        });
        if (!isCancelled && res?.results) {
          const mapped: RosterItem[] = res.results.map((p) => {
            const detailTypes: TypeBadgeInfo[] =
              p.types_detail && p.types_detail.length > 0
                ? p.types_detail.map((t) => ({ nombre: t.nombre, color_hex: t.color_hex }))
                : (p.types || ['Normal']).map((tName) => ({
                    nombre: tName,
                    color_hex: SPANISH_TYPE_COLORS[tName] || '#a8a878',
                  }));
            return {
              species: p.species || p.nombre_ingles?.toUpperCase() || p.nombre?.toUpperCase(),
              name: p.nombre || p.nombre_ingles,
              numero_pokedex: p.numero_pokedex,
              gen: p.gen,
              types: detailTypes.map((t) => t.nombre),
              types_detail: detailTypes,
            };
          });
          setCatalog(mapped);
          setTotalCount(res.total ?? mapped.length);
          setTypesCache((prev) => {
            const next = { ...prev };
            mapped.forEach((item) => {
              const key = item.species.toUpperCase().replace(/\s+/g, '_');
              if (item.types_detail && item.types_detail.length > 0) {
                next[key] = item.types_detail;
              }
            });
            return next;
          });
        }
      } catch {
        // Filter fallback catalog
        if (!isCancelled) {
          const q = searchQuery.trim().toLowerCase();
          setCatalog(
            FALLBACK_CATALOG.filter((p) => {
              const matchesQ =
                !q ||
                p.name.toLowerCase().includes(q) ||
                p.species.toLowerCase().includes(q) ||
                p.types.some((t) => t.toLowerCase().includes(q));
              const matchesType =
                !selectedType || p.types.some((t) => t.toLowerCase() === selectedType.toLowerCase());
              return matchesQ && matchesType;
            })
          );
        }
      } finally {
        if (!isCancelled) setLoadingCatalog(false);
      }
    };

    const timer = setTimeout(fetchPokedex, 200);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedType, selectedGen, page]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Current selected team
  const currentTeam = teams.find((t) => t.slot === selectedSlotIndex) || teams[0];

  // Fetch real types for any team member not yet in typesCache
  const teamKey = currentTeam.pokemon_list.join(',');
  useEffect(() => {
    currentTeam.pokemon_list.forEach((sp) => {
      const spKey = sp.toUpperCase().replace(/\s+/g, '_');
      if (!typesCache[spKey]) {
        const lookupName = sp.includes('_') ? sp.replace(/_/g, '-') : sp;
        PokedexService.getPokemonDetail(lookupName)
          .then((detail) => {
            if (detail?.types_detail && detail.types_detail.length > 0) {
              setTypesCache((prev) => ({
                ...prev,
                [spKey]: detail.types_detail.map((t) => ({
                  nombre: t.nombre,
                  color_hex: t.color_hex,
                })),
              }));
            }
          })
          .catch(() => {});
      }
    });
  }, [selectedSlotIndex, teamKey]);

  const showToast = (text: string, type: 'success' | 'warn' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3200);
  };

  const handleUpdateName = (newName: string) => {
    setTeams((prev) =>
      prev.map((t) => (t.slot === selectedSlotIndex ? { ...t, name: newName } : t))
    );
  };

  const handleTogglePokemon = (species: string) => {
    const key = species.toUpperCase().replace(/\s+/g, '_');
    const exists = currentTeam.pokemon_list.includes(key);

    let updatedList: string[];
    if (exists) {
      updatedList = currentTeam.pokemon_list.filter((s) => s !== key);
    } else {
      if (currentTeam.pokemon_list.length >= 6) {
        showToast('¡Un equipo Pokémon puede tener un máximo de 6 miembros!', 'warn');
        return;
      }
      updatedList = [...currentTeam.pokemon_list, key];
    }

    const updatedTeams = teams.map((t) =>
      t.slot === selectedSlotIndex ? { ...t, pokemon_list: updatedList } : t
    );
    setTeams(updatedTeams);
    localStorage.setItem('pokemon_trainer_teams', JSON.stringify(updatedTeams));

    if (currentTeam.is_active) {
      localStorage.setItem('pokemon_user_team', JSON.stringify(updatedList));
      onUpdateTeam?.(updatedList);
    }
  };

  const handleRemovePokemon = (idx: number) => {
    const updatedList = currentTeam.pokemon_list.filter((_, i) => i !== idx);
    const updatedTeams = teams.map((t) =>
      t.slot === selectedSlotIndex ? { ...t, pokemon_list: updatedList } : t
    );
    setTeams(updatedTeams);
    localStorage.setItem('pokemon_trainer_teams', JSON.stringify(updatedTeams));

    if (currentTeam.is_active) {
      localStorage.setItem('pokemon_user_team', JSON.stringify(updatedList));
      onUpdateTeam?.(updatedList);
    }
  };

  const handleSetActive = async () => {
    const updatedTeams = teams.map((t) => ({
      ...t,
      is_active: t.slot === selectedSlotIndex,
    }));
    setTeams(updatedTeams);
    localStorage.setItem('pokemon_trainer_teams', JSON.stringify(updatedTeams));
    localStorage.setItem('pokemon_user_team', JSON.stringify(currentTeam.pokemon_list));
    localStorage.setItem('pokemon_active_slot', String(selectedSlotIndex));

    onUpdateTeam?.(currentTeam.pokemon_list);
    showToast(`¡Ranura #${currentTeam.slot} marcada como Equipo Principal de Combate!`, 'success');

    // Auto-save to Supabase
    try {
      await AuthService.saveTeam(
        currentTeam.slot,
        currentTeam.name,
        currentTeam.pokemon_list,
        true
      );
    } catch {}
  };

  const handleSaveTeam = async () => {
    if (currentTeam.pokemon_list.length === 0) {
      showToast('¡Debes añadir al menos 1 Pokémon al equipo!', 'warn');
      return;
    }

    setSaving(true);
    try {
      await AuthService.saveTeam(
        currentTeam.slot,
        currentTeam.name,
        currentTeam.pokemon_list,
        currentTeam.is_active
      );
      localStorage.setItem('pokemon_trainer_teams', JSON.stringify(teams));
      if (currentTeam.is_active) {
        localStorage.setItem('pokemon_user_team', JSON.stringify(currentTeam.pokemon_list));
        onUpdateTeam?.(currentTeam.pokemon_list);
      }
      showToast(`¡${currentTeam.name} guardado con éxito!`, 'success');
    } catch {
      showToast('Guardado localmente (sin conexión)', 'success');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto pr-1 custom-scrollbar space-y-2.5 sm:space-y-3 font-sans select-none">
      {/* 1. Header & 10-Slot Selector Tabs */}
      <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-2.5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-1.5">
            <span className="font-black uppercase tracking-wider text-slate-800 text-[11px] sm:text-xs">
              CAJAS PC / 10 RANURAS
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Activo:{' '}
            <strong className="text-amber-600 font-bold">
              #{String(teams.find((t) => t.is_active)?.slot || 1).padStart(2, '0')}
            </strong>
          </span>
        </div>

        {/* 10 Slot Selector Buttons */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
          {teams.map((t) => {
            const isSelected = t.slot === selectedSlotIndex;
            return (
              <button
                key={t.slot}
                type="button"
                onClick={() => setSelectedSlotIndex(t.slot)}
                className={`py-1 px-1 rounded-xl text-[11px] font-black uppercase transition-all cursor-pointer flex flex-col items-center justify-center relative border ${
                  isSelected
                    ? 'bg-[#151c26] text-white border-amber-400 shadow-xs ring-1 ring-amber-400/50'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title={`${t.name} ${t.is_active ? '(Activo)' : ''}`}
              >
                <span className="font-mono text-xs font-black">
                  #{String(t.slot).padStart(2, '0')}
                </span>
                {t.is_active && (
                  <span className="text-[9px] text-amber-400 leading-none mt-0.5">★</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Slot Info & Actions Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-slate-100 text-slate-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-300">
              RANURA #{String(currentTeam.slot).padStart(2, '0')}
            </span>

            {currentTeam.is_active ? (
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
                EQUIPO ACTIVO
              </span>
            ) : (
              <button
                type="button"
                onClick={handleSetActive}
                className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <Star className="w-2.5 h-2.5 text-amber-600" />
                Marcar Activo
              </button>
            )}

            <span className="text-[10px] font-mono font-bold text-slate-500 ml-auto">
              {currentTeam.pokemon_list.length}/6 Miembros
            </span>
          </div>

          {/* Editable Team Name */}
          <div className="flex items-center gap-1.5">
            <Edit2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={currentTeam.name}
              onChange={(e) => handleUpdateName(e.target.value)}
              placeholder="Nombre del equipo..."
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-amber-400 w-full max-w-[240px]"
            />
          </div>
        </div>

        {/* Save Team Button */}
        <button
          type="button"
          onClick={handleSaveTeam}
          disabled={saving}
          className="flex items-center justify-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-[#32f59b] via-[#2ce692] to-[#25db89] text-slate-950 font-black text-xs uppercase tracking-wider shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer border border-[#19c778] disabled:opacity-50 shrink-0 self-end sm:self-center"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'Guardando...' : 'Guardar'}</span>
        </button>
      </div>

      {/* Toast Alert */}
      {message && (
        <div
          className={`p-2 rounded-xl text-xs flex items-center gap-2 shadow-2xs animate-in fade-in ${
            message.type === 'warn'
              ? 'bg-amber-50 text-amber-800 border border-amber-300'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="font-medium text-[11px]">{message.text}</span>
        </div>
      )}

      {/* 3. 6 Pokemon Slots of the Selected Team */}
      <div className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-2.5 shadow-2xs space-y-1.5">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
          ALINEACIÓN DEL EQUIPO (MÁXIMO 6)
        </div>

        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, idx) => {
            const species = currentTeam.pokemon_list[idx];
            const isLeader = idx === 0 && Boolean(species);
            const spKey = species ? species.toUpperCase().replace(/\s+/g, '_') : '';
            const types = species ? typesCache[spKey] || [] : [];

            return (
              <div
                key={idx}
                className={`h-28 sm:h-32 rounded-xl border-2 flex flex-col items-center justify-between p-1.5 relative transition-all ${
                  species
                    ? 'bg-white border-amber-400/90 shadow-2xs'
                    : 'bg-white/40 border-dashed border-slate-300 text-slate-400'
                }`}
              >
                {/* Slot index & Leader Badge */}
                <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400">
                  <span className="font-bold">#{idx + 1}</span>
                  {isLeader && (
                    <span className="text-[8px] font-black text-amber-500 uppercase flex items-center gap-0.5">
                      <Crown className="w-2.5 h-2.5" /> LÍDER
                    </span>
                  )}
                </div>

                {species ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleRemovePokemon(idx)}
                      className="absolute top-1 right-1 p-0.5 rounded-md bg-rose-500 hover:bg-rose-600 text-white transition-colors cursor-pointer shadow-2xs"
                      title="Quitar del equipo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center my-auto">
                      <StaticPokemonImage
                        species={species}
                        alt={species}
                        className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                      />
                    </div>

                    <div className="w-full text-center">
                      <span className="text-[10px] font-black text-slate-800 uppercase truncate block font-mono">
                        {species}
                      </span>
                      <div className="flex items-center justify-center gap-0.5 mt-0.5">
                        {types.slice(0, 2).map((t, ti) => (
                          <span
                            key={ti}
                            className="text-[7px] font-bold text-white px-1 py-0.2 rounded-xs uppercase leading-tight"
                            style={{ backgroundColor: t.color_hex }}
                          >
                            {t.nombre}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center my-auto text-slate-300">
                    <Plus className="w-5 h-5 mb-0.5 opacity-60" />
                    <span className="text-[9px] font-mono">Vacío</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Roster Catalog (Banco / Caja de Pokémon) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 shadow-2xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
              BANCO DE POKÉMON / CAJA PC
            </span>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {totalCount}
            </span>
            {loadingCatalog && <RefreshCw className="w-3 h-3 text-slate-400 animate-spin" />}
          </div>

          <div className="relative w-full sm:w-52">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nombre..."
              className="w-full pl-8 pr-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-400 shadow-2xs"
            />
          </div>
        </div>

        {/* Generation Filter + Type Check Buttons */}
        <div className="space-y-1.5">
          <select
            value={selectedGen}
            onChange={(e) => {
              setSelectedGen(e.target.value);
              setPage(1);
            }}
            className="w-full px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700 focus:outline-hidden focus:border-emerald-500"
          >
            <option value="">Todas las Generaciones</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
              <option key={g} value={String(g)}>
                Generación {g}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => {
                setSelectedType('');
                setPage(1);
              }}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer border flex items-center gap-1 ${
                selectedType === ''
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {selectedType === '' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              <span>Todos</span>
            </button>

            {FILTER_TYPES.map((t) => {
              const isActive = selectedType === t;
              const bg = SPANISH_TYPE_COLORS[t] || '#64748b';
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setSelectedType(isActive ? '' : t);
                    setPage(1);
                  }}
                  style={isActive ? { backgroundColor: bg, borderColor: bg } : undefined}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer border flex items-center gap-1 ${
                    isActive
                      ? 'text-white shadow-xs ring-1 ring-black/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isActive ? (
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  ) : (
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: bg }}
                    />
                  )}
                  <span>{t}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-[10px] text-slate-500">
          Haz clic en cualquier Pokémon para añadirlo o quitarlo de la Ranura #{currentTeam.slot}.
        </div>

        {/* Catalog Grid */}
        {loadingCatalog ? (
          <div className="py-10 flex items-center justify-center">
            <PokeballLoader />
          </div>
        ) : catalog.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No se encontraron Pokémon con esos filtros.
          </div>
        ) : (
        <div className="grid grid-cols-2 gap-2 max-h-[380px] overflow-y-auto custom-scrollbar pr-0.5">
          {catalog.map((pkmn) => {
            const key = pkmn.species.toUpperCase().replace(/\s+/g, '_');
            const isSelected = currentTeam.pokemon_list.includes(key);
            const types: TypeBadgeInfo[] =
              pkmn.types_detail && pkmn.types_detail.length > 0
                ? pkmn.types_detail
                : pkmn.types.map((tName) => ({
                    nombre: tName,
                    color_hex: SPANISH_TYPE_COLORS[tName] || '#a8a878',
                  }));

            return (
              <div
                key={pkmn.species}
                onClick={() => handleTogglePokemon(pkmn.species)}
                className={`group relative p-2.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col items-center justify-between select-none active:scale-[0.98] shadow-xs hover:shadow-md ${
                  isSelected
                    ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/40'
                    : 'bg-white border-slate-200 hover:border-amber-400'
                }`}
                title={isSelected ? 'Haga clic para quitar del equipo' : 'Haga clic para agregar al equipo'}
              >
                {/* Top Badges: Dex # + Selected Checkmark */}
                <div className="w-full flex items-center justify-between text-[10px] mb-0.5">
                  <span className="font-extrabold text-slate-400 group-hover:text-amber-600 transition-colors">
                    {pkmn.numero_pokedex ? `#${String(pkmn.numero_pokedex).padStart(3, '0')}` : ''}
                  </span>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Sprite */}
                <div className="w-16 h-16 flex items-center justify-center my-1 relative">
                  <div className="absolute inset-0 bg-radial from-amber-400/5 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <StaticPokemonImage
                    species={pkmn.species}
                    dexNumber={pkmn.numero_pokedex}
                    alt={pkmn.name}
                    className="w-16 h-16 object-contain group-hover:scale-110 transition-transform"
                  />
                </div>

                {/* Name & Types */}
                <div className="w-full text-center space-y-1">
                  <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide truncate group-hover:text-amber-600 transition-colors">
                    {pkmn.name}
                  </h3>

                  <div className="flex items-center justify-center gap-1 flex-wrap">
                    {types.slice(0, 2).map((t, ti) => (
                      <span
                        key={ti}
                        className="px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white uppercase shadow-xs"
                        style={{ backgroundColor: t.color_hex }}
                      >
                        {t.nombre}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}

        {/* Pagination Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            disabled={page <= 1 || loadingCatalog}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-[11px] font-mono font-bold text-slate-600">
            Página {page} / {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages || loadingCatalog}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            title="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
