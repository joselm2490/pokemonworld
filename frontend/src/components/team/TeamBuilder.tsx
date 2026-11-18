import React, { useState, useEffect } from 'react';
import { AnimatedPokemonSprite } from '../battle/AnimatedPokemonSprite';
import { TYPE_SPRITE_INDEX } from '../../utils/battleSprites';
import { PokemonType } from '../../types/pokemon';
import { Check, Trash2, ArrowLeft, Search } from 'lucide-react';

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

interface TeamBuilderProps {
  onBack: () => void;
  selectedTeam: string[];
  onSaveTeam: (team: string[]) => void;
}

const FALLBACK_POKEMON: RosterItem[] = [
  { species: 'CHARIZARD', name: 'Charizard', types: ['FIRE', 'FLYING'] },
  { species: 'PIKACHU', name: 'Pikachu', types: ['ELECTRIC'] },
  { species: 'BLASTOISE', name: 'Blastoise', types: ['WATER'] },
  { species: 'VENUSAUR', name: 'Venusaur', types: ['GRASS', 'POISON'] },
  { species: 'GENGAR', name: 'Gengar', types: ['GHOST', 'POISON'] },
  { species: 'LUCARIO', name: 'Lucario', types: ['FIGHTING', 'STEEL'] },
  { species: 'MEWTWO', name: 'Mewtwo', types: ['PSYCHIC'] },
  { species: 'GARCHOMP', name: 'Garchomp', types: ['DRAGON', 'GROUND'] },
  { species: 'GRENINJA', name: 'Greninja', types: ['WATER', 'DARK'] },
  { species: 'DRAGONITE', name: 'Dragonite', types: ['DRAGON', 'FLYING'] },
  { species: 'TYRANITAR', name: 'Tyranitar', types: ['ROCK', 'DARK'] },
  { species: 'SYLVEON', name: 'Sylveon', types: ['FAIRY'] },
];

export const TeamBuilder: React.FC<TeamBuilderProps> = ({
  onBack,
  selectedTeam,
  onSaveTeam,
}) => {
  const [team, setTeam] = useState<string[]>(selectedTeam);
  const [query, setQuery] = useState('');
  const [roster, setRoster] = useState<RosterItem[]>(FALLBACK_POKEMON);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const apiBase = import.meta.env.VITE_BACKEND_API_URL || '';

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: '24' });
        if (query.trim()) params.set('q', query.trim());
        const res = await fetch(`${apiBase}/api/pokedex/roster/?${params.toString()}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setRoster(data);
          } else if (query.trim()) {
            setRoster([]);
          }
        }
      } catch {
        // Fallback to local filter if offline
        const q = query.trim().toLowerCase();
        setRoster(
          FALLBACK_POKEMON.filter(
            (p) => !q || p.name.toLowerCase().includes(q) || p.types.some((t) => t.toLowerCase().includes(q))
          )
        );
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const togglePokemon = (species: string) => {
    if (team.includes(species)) {
      setTeam(team.filter((s) => s !== species));
    } else {
      if (team.length >= 6) {
        alert('A battle party can have at most 6 Pokémon!');
        return;
      }
      setTeam([...team, species]);
    }
  };

  const handleSave = () => {
    if (team.length === 0) {
      alert('Please select at least 1 Pokémon for your team!');
      return;
    }
    onSaveTeam(team);
    onBack();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-5 md:p-8 flex flex-col max-w-6xl mx-auto font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold font-pkmn text-white tracking-wide">
              Team Builder (898 Pokémon)
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Official Pokémon Essentials PBS stats & learnsets • {team.length}/6 selected
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center justify-center gap-2 py-2.5 px-6 rounded-full bg-gradient-to-b from-[#5ec05e] to-[#349434] border-2 border-white font-pkmn text-lg font-bold text-white uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all"
        >
          <Check className="w-4 h-4" />
          <span>Save Party</span>
        </button>
      </div>

      {/* Selected 6 Party Bar */}
      <div className="my-5 p-4 rounded-2xl bg-slate-900/90 border-2 border-slate-800 shadow-xl">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
          Active Party ({team.length}/6)
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, idx) => {
            const species = team[idx];
            return (
              <div
                key={idx}
                className={`h-36 rounded-2xl border-2 flex flex-col items-center justify-center relative p-2 transition-all ${
                  species
                    ? 'bg-slate-800/90 border-amber-400/70 shadow-md'
                    : 'bg-slate-950/60 border-dashed border-slate-800 text-slate-600'
                }`}
              >
                {species ? (
                  <>
                    <button
                      onClick={() => togglePokemon(species)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <AnimatedPokemonSprite species={species} scale={1.6} showShadow={false} className="my-auto" />
                    <span className="text-sm font-bold text-white uppercase truncate font-pkmn mt-1">
                      {species}
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-mono">Empty Slot</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-bold text-slate-200 uppercase tracking-wider font-pkmn">
          Pokédex Roster {loading && <span className="text-xs text-slate-400 font-sans">(Loading...)</span>}
        </h2>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Pokémon or Type (e.g. Rayquaza, Dragon)..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Available Roster Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {roster.map((pkmn) => {
          const isSelected = team.includes(pkmn.species);
          return (
            <div
              key={pkmn.species}
              onClick={() => togglePokemon(pkmn.species)}
              className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center relative overflow-hidden select-none ${
                isSelected
                  ? 'bg-emerald-950/40 border-emerald-400 shadow-lg ring-2 ring-emerald-500/30'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 hover:border-slate-600'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}

              <div className="w-24 h-24 flex items-center justify-center my-1">
                <AnimatedPokemonSprite
                  species={pkmn.species}
                  scale={1.6}
                  showShadow={false}
                  animate={false}
                  animateOnHover={true}
                />
              </div>

              <span className="font-bold text-white font-pkmn text-base tracking-wide uppercase mb-1 truncate max-w-full">
                {pkmn.name}
              </span>

              <div className="flex items-center justify-center gap-1 mt-auto">
                {pkmn.types.map((type) => (
                  <span
                    key={type}
                    className="inline-block pixelated"
                    style={{
                      width: '64px',
                      height: '28px',
                      backgroundImage: 'url(/battle-ui/ui/types.png)',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: `0px -${(TYPE_SPRITE_INDEX[type] ?? 0) * 28}px`,
                      transform: 'scale(0.75)',
                      margin: '-4px -6px',
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
