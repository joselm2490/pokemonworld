import React from 'react';
import { Pokemon } from '../../types/pokemon';

interface PokemonStatusCardProps {
  pokemon: Pokemon;
  isPlayer?: boolean;
  className?: string;
}

export const PokemonStatusCard: React.FC<PokemonStatusCardProps> = ({
  pokemon,
  isPlayer = false,
  className = ''
}) => {
  const hpPercent = Math.max(0, Math.min(100, Math.round((pokemon.current_hp / pokemon.max_hp) * 100)));

  // Authentic HP bar gradient & color
  let hpColor = 'bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600';
  if (hpPercent <= 20) {
    hpColor = 'bg-gradient-to-b from-rose-400 via-rose-500 to-rose-600';
  } else if (hpPercent <= 50) {
    hpColor = 'bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500';
  }

  // Authentic gender symbol
  const isFemale = pokemon.species.includes('female') || pokemon.name.length % 2 === 0;

  if (!isPlayer) {
    // ---------------- OPPONENT DATABOX (TOP-LEFT) ----------------
    return (
      <div className={`relative select-none ${className}`}>
        {/* Outer Shadow */}
        <div className="absolute inset-0 bg-black/40 rounded-sm databox-opponent translate-x-1 translate-y-1" />

        {/* Main Slanted Metallic Container */}
        <div className="relative w-64 sm:w-72 bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-400 border-2 border-zinc-700/90 shadow-md p-2.5 databox-opponent">
          {/* Top Line Highlight */}
          <div className="absolute top-0 left-0 right-3 h-[2px] bg-white/80" />

          {/* Top Row: Pokeball + Name + Gender + Level */}
          <div className="flex items-center justify-between pl-1 pr-6 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Pokeball Icon */}
              <div className="w-3.5 h-3.5 rounded-full border border-zinc-800 bg-gradient-to-b from-red-600 50% to-white 50% relative flex items-center justify-center shrink-0 shadow-sm">
                <div className="w-1 h-1 rounded-full bg-white border border-zinc-800" />
              </div>

              {/* Name */}
              <span className="font-bold text-[11px] sm:text-[12px] text-zinc-900 truncate tracking-tight font-game">
                {pokemon.name}
              </span>

              {/* Gender */}
              <span className={`text-[11px] font-black ${isFemale ? 'text-rose-600' : 'text-blue-600'}`}>
                {isFemale ? '♀' : '♂'}
              </span>
            </div>

            {/* Level */}
            <span className="font-bold text-[10px] sm:text-[11px] text-zinc-800 font-game shrink-0">
              Lv.{pokemon.level}
            </span>
          </div>

          {/* Bottom Row: HP Badge + Bar Container */}
          <div className="flex items-center gap-1 pl-1 pr-6">
            {/* Yellow HP label pill */}
            <div className="bg-gradient-to-b from-amber-300 to-amber-500 border border-zinc-800 px-1 py-0.2 rounded-xs flex items-center justify-center shadow-xs">
              <span className="text-[8px] font-black text-amber-950 font-game leading-none">
                HP
              </span>
            </div>

            {/* Dark Groove Container */}
            <div className="flex-1 h-2.5 bg-zinc-900 rounded-xs p-[1px] border border-zinc-800 shadow-inner overflow-hidden">
              <div
                className={`h-full rounded-xs transition-all duration-400 ease-out ${hpColor}`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- PLAYER DATABOX (BOTTOM-RIGHT) ----------------
  return (
    <div className={`relative select-none ${className}`}>
      {/* Outer Shadow */}
      <div className="absolute inset-0 bg-black/40 rounded-sm databox-player translate-x-1 translate-y-1" />

      {/* Main Slanted Metallic Container */}
      <div className="relative w-68 sm:w-76 bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-400 border-2 border-zinc-700/90 shadow-md p-2.5 databox-player">
        {/* Top Line Highlight */}
        <div className="absolute top-0 left-3 right-0 h-[2px] bg-white/80" />

        {/* Top Row: Name + Gender + Level */}
        <div className="flex items-center justify-between pl-6 pr-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Name */}
            <span className="font-bold text-[11px] sm:text-[12px] text-zinc-900 truncate tracking-tight font-game">
              {pokemon.name}
            </span>

            {/* Gender */}
            <span className={`text-[11px] font-black ${isFemale ? 'text-rose-600' : 'text-blue-600'}`}>
              {isFemale ? '♀' : '♂'}
            </span>
          </div>

          {/* Level */}
          <span className="font-bold text-[10px] sm:text-[11px] text-zinc-800 font-game shrink-0">
            Lv.{pokemon.level}
          </span>
        </div>

        {/* Middle Row: HP Badge + Bar Container */}
        <div className="flex items-center gap-1 pl-6 pr-2 mb-1">
          {/* Yellow HP label pill */}
          <div className="bg-gradient-to-b from-amber-300 to-amber-500 border border-zinc-800 px-1 py-0.2 rounded-xs flex items-center justify-center shadow-xs">
            <span className="text-[8px] font-black text-amber-950 font-game leading-none">
              HP
            </span>
          </div>

          {/* Dark Groove Container */}
          <div className="flex-1 h-2.5 bg-zinc-900 rounded-xs p-[1px] border border-zinc-800 shadow-inner overflow-hidden">
            <div
              className={`h-full rounded-xs transition-all duration-400 ease-out ${hpColor}`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* Bottom Row: Numerical HP (Right Aligned) */}
        <div className="flex justify-end pr-2">
          <span className="font-bold text-[10px] sm:text-[11px] text-zinc-800 font-game tracking-wider">
            {pokemon.current_hp}/{pokemon.max_hp}
          </span>
        </div>
      </div>
    </div>
  );
};
