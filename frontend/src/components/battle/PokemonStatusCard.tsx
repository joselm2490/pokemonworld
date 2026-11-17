import React from 'react';
import { Pokemon } from '../../types/pokemon';

interface PokemonStatusCardProps {
  pokemon: Pokemon;
  isPlayer?: boolean;
  party?: Pokemon[];
  className?: string;
}

export const PokemonStatusCard: React.FC<PokemonStatusCardProps> = ({
  pokemon,
  isPlayer = false,
  party = [],
  className = ''
}) => {
  const hpPercent = Math.max(0, Math.min(100, Math.round((pokemon.current_hp / pokemon.max_hp) * 100)));

  // Dynamic HP bar color
  let hpBarColor = 'bg-emerald-500';
  let hpGlowColor = 'shadow-emerald-500/50';
  if (hpPercent <= 20) {
    hpBarColor = 'bg-rose-500';
    hpGlowColor = 'shadow-rose-500/50';
  } else if (hpPercent <= 50) {
    hpBarColor = 'bg-amber-400';
    hpGlowColor = 'shadow-amber-400/50';
  }

  return (
    <div
      className={`bg-slate-900/90 backdrop-blur-md border-2 border-slate-700/80 rounded-2xl p-3 shadow-xl transition-all duration-300 min-w-[280px] max-w-[340px] ${
        isPlayer ? 'border-b-4 border-r-4 border-b-blue-500/60' : 'border-b-4 border-l-4 border-b-rose-500/60'
      } ${className}`}
    >
      {/* Top Header: Name, Level, Status */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-wide text-white uppercase text-shadow-sm font-game">
            {pokemon.name}
          </span>
          {pokemon.status && (
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-600/80 text-white uppercase tracking-wider">
              {pokemon.status}
            </span>
          )}
        </div>
        <span className="text-xs font-semibold text-amber-300 font-game">
          Lv.{pokemon.level}
        </span>
      </div>

      {/* HP Bar Container */}
      <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-lg border border-slate-800">
        <span className="text-[10px] font-black text-amber-400 font-game px-1">
          HP
        </span>
        <div className="relative flex-1 h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${hpBarColor} shadow-sm ${hpGlowColor}`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* Bottom info: HP numbers for player, or party Pokeballs */}
      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
        {/* Team Pokeball indicators */}
        <div className="flex items-center gap-1">
          {party.slice(0, 6).map((member, idx) => (
            <div
              key={idx}
              title={`${member.name} (${member.is_fainted ? 'Fainted' : 'Ready'})`}
              className={`w-2.5 h-2.5 rounded-full border transition-all ${
                member.is_fainted
                  ? 'bg-slate-700 border-slate-600 opacity-40'
                  : 'bg-rose-500 border-white shadow-sm shadow-rose-500/50'
              }`}
            />
          ))}
        </div>

        {/* Numerical HP for player */}
        {isPlayer && (
          <span className="font-mono font-bold text-slate-200">
            {pokemon.current_hp} / {pokemon.max_hp}
          </span>
        )}
      </div>
    </div>
  );
};

