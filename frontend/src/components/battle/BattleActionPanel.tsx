import React, { useState } from 'react';
import { Pokemon, PokemonMove } from '../../types/pokemon';
import { TYPE_COLORS } from '../../utils/typeColors';

interface BattleActionPanelProps {
  activePokemon: Pokemon;
  onSelectMove: (moveIndex: number) => void;
  onOpenSwitch: () => void;
  onForfeit: () => void;
  dialogueMessage: string;
  disabled?: boolean;
}

const TYPE_BORDER_COLORS: Record<string, string> = {
  NORMAL: 'border-zinc-400 text-zinc-900',
  FIRE: 'border-orange-500 text-orange-950',
  WATER: 'border-blue-500 text-blue-950',
  GRASS: 'border-emerald-600 text-emerald-950',
  ELECTRIC: 'border-yellow-500 text-yellow-950',
  ICE: 'border-cyan-400 text-cyan-950',
  FIGHTING: 'border-red-600 text-red-950',
  POISON: 'border-purple-600 text-purple-950',
  GROUND: 'border-amber-700 text-amber-950',
  FLYING: 'border-indigo-400 text-indigo-950',
  PSYCHIC: 'border-pink-500 text-pink-950',
  BUG: 'border-lime-600 text-lime-950',
  ROCK: 'border-yellow-700 text-yellow-950',
  GHOST: 'border-indigo-700 text-indigo-950',
  DRAGON: 'border-purple-800 text-purple-950',
  STEEL: 'border-slate-400 text-slate-900',
  FAIRY: 'border-pink-400 text-pink-950',
  DARK: 'border-neutral-700 text-neutral-950',
};

export const BattleActionPanel: React.FC<BattleActionPanelProps> = ({
  activePokemon,
  onSelectMove,
  onOpenSwitch,
  onForfeit,
  dialogueMessage,
  disabled = false,
}) => {
  const [showMoves, setShowMoves] = useState(false);
  const [hoveredMoveIdx, setHoveredMoveIdx] = useState<number>(0);

  const currentHoveredMove: PokemonMove | undefined = activePokemon.moves[hoveredMoveIdx] || activePokemon.moves[0];

  return (
    <div className="w-full bg-[#2e5234] border-t-4 border-[#1b3620] p-2 sm:p-3 shadow-2xl relative select-none">
      {/* Inner Gold/Yellow Border Line (Just like Images 2, 3, 4, 5) */}
      <div className="border-2 border-[#d6b24a] rounded-xl p-2 sm:p-3 bg-[#38613e]/90 flex flex-col md:flex-row items-center gap-3">
        {!showMoves ? (
          /* ================= STANDARD 4-BUTTON MODE (IMAGE 4) ================= */
          <>
            {/* Left: Dialogue Box */}
            <div className="flex-1 w-full h-24 sm:h-28 bg-[#fdfdfd] border-4 border-[#2b2f2c] rounded-xl p-3 sm:p-4 shadow-inner flex flex-col justify-center">
              <p className="font-game text-xs sm:text-sm text-zinc-900 leading-relaxed tracking-wide font-bold">
                {dialogueMessage || (
                  <>
                    What will
                    <br />
                    {activePokemon.name} do?
                  </>
                )}
              </p>
            </div>

            {/* Right: 4 Authentic Pill Action Buttons (2x2 Grid) */}
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5 w-full md:w-80 shrink-0">
              {/* FIGHT Button */}
              <button
                onClick={() => setShowMoves(true)}
                disabled={disabled || activePokemon.is_fainted}
                className="h-11 sm:h-12 rounded-full bg-gradient-to-b from-[#f25d5d] via-[#e54545] to-[#c42828] border-3 border-white shadow-md hover:brightness-110 active:scale-95 transition-transform flex items-center justify-center disabled:opacity-50"
              >
                <span className="font-game font-bold text-xs sm:text-sm text-white tracking-widest text-shadow-heavy uppercase">
                  FIGHT
                </span>
              </button>

              {/* BAG Button */}
              <button
                onClick={() => alert("Competitive PvP rules: No items allowed in battle.")}
                disabled={disabled}
                className="h-11 sm:h-12 rounded-full bg-gradient-to-b from-[#f7a240] via-[#ea8e24] to-[#cc7410] border-3 border-white shadow-md hover:brightness-110 active:scale-95 transition-transform flex items-center justify-center disabled:opacity-50"
              >
                <span className="font-game font-bold text-xs sm:text-sm text-white tracking-widest text-shadow-heavy uppercase">
                  BAG
                </span>
              </button>

              {/* POKÉMON Button */}
              <button
                onClick={onOpenSwitch}
                disabled={disabled}
                className="h-11 sm:h-12 rounded-full bg-gradient-to-b from-[#5ec05e] via-[#4bae4b] to-[#349434] border-3 border-white shadow-md hover:brightness-110 active:scale-95 transition-transform flex items-center justify-center disabled:opacity-50"
              >
                <span className="font-game font-bold text-xs sm:text-sm text-white tracking-widest text-shadow-heavy uppercase">
                  POKÉMON
                </span>
              </button>

              {/* RUN Button */}
              <button
                onClick={onForfeit}
                disabled={disabled}
                className="h-11 sm:h-12 rounded-full bg-gradient-to-b from-[#4bb3f7] via-[#2ba0ec] to-[#1280cc] border-3 border-white shadow-md hover:brightness-110 active:scale-95 transition-transform flex items-center justify-center disabled:opacity-50"
              >
                <span className="font-game font-bold text-xs sm:text-sm text-white tracking-widest text-shadow-heavy uppercase">
                  RUN
                </span>
              </button>
            </div>
          </>
        ) : (
          /* ================= MOVE SELECTION MODE (IMAGE 5) ================= */
          <>
            {/* Left/Middle: 4 Move Pill Buttons */}
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activePokemon.moves.map((move, idx) => {
                const borderClass = TYPE_BORDER_COLORS[move.type] || 'border-zinc-400 text-zinc-900';
                const isOutOfPP = move.current_pp <= 0;

                return (
                  <button
                    key={idx}
                    disabled={disabled || isOutOfPP}
                    onMouseEnter={() => setHoveredMoveIdx(idx)}
                    onClick={() => {
                      setShowMoves(false);
                      onSelectMove(idx);
                    }}
                    className={`h-11 sm:h-12 px-4 rounded-full bg-gradient-to-b from-white via-zinc-100 to-zinc-200 border-3 ${borderClass} shadow-md hover:brightness-95 active:scale-95 transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <span className="font-game font-bold text-[11px] sm:text-xs text-zinc-900 tracking-tight truncate uppercase">
                      {move.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right: Type Badge & PP Box (Image 5) */}
            <div className="w-full sm:w-48 md:w-56 h-24 sm:h-28 bg-[#fdfdfd] border-4 border-[#2b2f2c] rounded-xl p-2.5 flex flex-col justify-between items-center shadow-inner shrink-0">
              {currentHoveredMove ? (
                <>
                  {/* Type Badge */}
                  <div className="w-full flex justify-center mt-1">
                    <div className="px-4 py-1 rounded-sm border-2 border-zinc-700 bg-zinc-200 shadow-xs">
                      <span className="font-game font-black text-[10px] text-zinc-800 uppercase tracking-widest">
                        {currentHoveredMove.type}
                      </span>
                    </div>
                  </div>

                  {/* PP Indicator */}
                  <div className="text-center font-game font-bold text-xs text-zinc-800 tracking-wider">
                    PP: {currentHoveredMove.current_pp}/{currentHoveredMove.pp}
                  </div>
                </>
              ) : null}

              {/* Cancel Button */}
              <button
                onClick={() => setShowMoves(false)}
                className="text-[9px] font-game text-zinc-500 hover:text-zinc-900 underline uppercase"
              >
                [ Cancel ]
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
