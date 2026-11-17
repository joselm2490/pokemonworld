import React, { useState, useEffect } from 'react';
import { AnimatedPokemonSprite } from '../battle/AnimatedPokemonSprite';
import { TYPE_COLORS } from '../../utils/typeColors';
import { Check, Plus, Trash2, ArrowLeft } from 'lucide-react';

interface TeamBuilderProps {
  onBack: () => void;
  selectedTeam: string[];
  onSaveTeam: (team: string[]) => void;
}

const AVAILABLE_POKEMON = [
  { species: 'CHARIZARD', name: 'Charizard', types: ['FIRE', 'FLYING'], role: 'Special Sweeper' },
  { species: 'PIKACHU', name: 'Pikachu', types: ['ELECTRIC'], role: 'Speed Attacker' },
  { species: 'BLASTOISE', name: 'Blastoise', types: ['WATER'], role: 'Special Tank' },
  { species: 'VENUSAUR', name: 'Venusaur', types: ['GRASS', 'POISON'], role: 'Bulky Support' },
  { species: 'GENGAR', name: 'Gengar', types: ['GHOST', 'POISON'], role: 'Fast Special Cannon' },
  { species: 'LUCARIO', name: 'Lucario', types: ['FIGHTING', 'STEEL'], role: 'Physical Sweeper' },
  { species: 'MEWTWO', name: 'Mewtwo', types: ['PSYCHIC'], role: 'Legendary Powerhouse' },
  { species: 'GARCHOMP', name: 'Garchomp', types: ['DRAGON', 'GROUND'], role: 'Dragon Wallbreaker' },
  { species: 'GRENINJA', name: 'Greninja', types: ['WATER', 'DARK'], role: 'High Speed Ninja' },
  { species: 'DRAGONITE', name: 'Dragonite', types: ['DRAGON', 'FLYING'], role: 'Multi-scale Bruiser' },
  { species: 'TYRANITAR', name: 'Tyranitar', types: ['ROCK', 'DARK'], role: 'Sandstorm Juggernaut' },
  { species: 'SYLVEON', name: 'Sylveon', types: ['FAIRY'], role: 'Special Defense Wall' }
];

export const TeamBuilder: React.FC<TeamBuilderProps> = ({
  onBack,
  selectedTeam,
  onSaveTeam,
}) => {
  const [team, setTeam] = useState<string[]>(selectedTeam);

  const togglePokemon = (species: string) => {
    if (team.includes(species)) {
      setTeam(team.filter((s) => s !== species));
    } else {
      if (team.length >= 6) {
        alert("A battle party can have at most 6 Pokémon!");
        return;
      }
      setTeam([...team, species]);
    }
  };

  const handleSave = () => {
    if (team.length === 0) {
      alert("Please select at least 1 Pokémon for your team!");
      return;
    }
    onSaveTeam(team);
    onBack();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 flex flex-col max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-game text-white tracking-wide">
              Team Builder
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Select 6 Pokémon to assemble your battle roster ({team.length}/6 selected)
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-game text-xs text-white uppercase tracking-wider shadow-lg shadow-emerald-950/50 active:scale-95 transition-all"
        >
          <Check className="w-4 h-4" />
          <span>Save Party</span>
        </button>
      </div>

      {/* Selected 6 Party Bar */}
      <div className="my-6 p-4 rounded-3xl bg-slate-900/80 border-2 border-slate-800 shadow-xl">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
          Active Party Slot Preview
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, idx) => {
            const species = team[idx];
            return (
              <div
                key={idx}
                className={`h-36 rounded-2xl border-2 flex flex-col items-center justify-center relative p-2 transition-all ${
                  species
                    ? 'bg-slate-800/90 border-blue-500/70 shadow-md'
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
                    <AnimatedPokemonSprite species={species} scale={1.8} className="my-auto" />
                    <span className="text-[11px] font-bold text-white uppercase truncate font-game mt-1">
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

      {/* Available Roster Grid */}
      <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 font-game">
        Available Pokémon Roster
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {AVAILABLE_POKEMON.map((pkmn) => {
          const isSelected = team.includes(pkmn.species);
          return (
            <div
              key={pkmn.species}
              onClick={() => togglePokemon(pkmn.species)}
              className={`p-4 rounded-3xl border-2 cursor-pointer transition-all flex flex-col items-center relative overflow-hidden group select-none ${
                isSelected
                  ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-950/50 ring-2 ring-blue-500/30'
                  : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700 shadow-md'
              }`}
            >
              {/* Checkmark badge */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}

              {/* Live Animated Sprite */}
              <div className="w-28 h-28 flex items-center justify-center my-2">
                <AnimatedPokemonSprite species={pkmn.species} scale={2.2} />
              </div>

              {/* Name and Types */}
              <span className="font-bold text-white font-game text-xs tracking-wider uppercase mb-1">
                {pkmn.name}
              </span>
              <span className="text-[11px] text-slate-400 mb-2">
                {pkmn.role}
              </span>

              <div className="flex items-center gap-1.5 mt-auto">
                {pkmn.types.map((type: any) => {
                  const style = TYPE_COLORS[type as keyof typeof TYPE_COLORS] || TYPE_COLORS.NORMAL;
                  return (
                    <span
                      key={type}
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${style.bg} ${style.text}`}
                    >
                      {type}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

