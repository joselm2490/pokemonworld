import React, { useState } from 'react';
import { Pokemon, PokemonMove } from '../../types/pokemon';
import { TYPE_COLORS } from '../../utils/typeColors';
import { Swords, RefreshCw, Backpack, Flag, ArrowLeft } from 'lucide-react';

interface BattleActionPanelProps {
  activePokemon: Pokemon;
  onSelectMove: (moveIndex: number) => void;
  onOpenSwitch: () => void;
  onForfeit: () => void;
  disabled?: boolean;
}

export const BattleActionPanel: React.FC<BattleActionPanelProps> = ({
  activePokemon,
  onSelectMove,
  onOpenSwitch,
  onForfeit,
  disabled = false,
}) => {
  const [showMoves, setShowMoves] = useState(false);

  return (
    <div className="w-full bg-slate-900/95 border-t-4 border-slate-700/80 p-4 shadow-2xl backdrop-blur-md">
      <div className="max-w-4xl mx-auto">
        {!showMoves ? (
          /* Main 4 Action Buttons */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => setShowMoves(true)}
              disabled={disabled || activePokemon.is_fainted}
              className="flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-game text-xs md:text-sm tracking-wider uppercase shadow-lg shadow-rose-900/40 border border-rose-400/40 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              <Swords className="w-5 h-5" />
              <span>Fight</span>
            </button>

            <button
              onClick={onOpenSwitch}
              disabled={disabled}
              className="flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-game text-xs md:text-sm tracking-wider uppercase shadow-lg shadow-blue-900/40 border border-blue-400/40 active:scale-95 transition-all disabled:opacity-50"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Pokémon</span>
            </button>

            <button
              onClick={() => alert("Items are not permitted in standard Competitive PvP matches.")}
              disabled={disabled}
              className="flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-game text-xs md:text-sm tracking-wider uppercase shadow-lg shadow-amber-900/40 border border-amber-400/40 active:scale-95 transition-all disabled:opacity-50"
            >
              <Backpack className="w-5 h-5" />
              <span>Bag</span>
            </button>

            <button
              onClick={onForfeit}
              disabled={disabled}
              className="flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-slate-200 font-game text-xs md:text-sm tracking-wider uppercase shadow-lg shadow-slate-950/50 border border-slate-600/40 active:scale-95 transition-all disabled:opacity-50"
            >
              <Flag className="w-5 h-5" />
              <span>Run</span>
            </button>
          </div>
        ) : (
          /* Move Selection Grid */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowMoves(false)}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <span className="text-xs text-slate-400 font-mono">
                Select a Move for <strong className="text-amber-400">{activePokemon.name}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activePokemon.moves.map((move: PokemonMove, idx: number) => {
                const typeStyle = TYPE_COLORS[move.type] || TYPE_COLORS.NORMAL;
                const isOutOfPP = move.current_pp <= 0;

                return (
                  <button
                    key={idx}
                    disabled={disabled || isOutOfPP}
                    onClick={() => {
                      setShowMoves(false);
                      onSelectMove(idx);
                    }}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all text-left group active:scale-[0.98] ${isOutOfPP
                      ? 'bg-slate-900 border-slate-800 opacity-40 cursor-not-allowed'
                      : 'bg-slate-800/80 hover:bg-slate-700/90 border-slate-700 hover:border-slate-500 shadow-md'
                      }`}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white tracking-wide text-sm group-hover:text-amber-300 transition-colors">
                          {move.name}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${typeStyle.bg} ${typeStyle.text}`}
                        >
                          {move.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>
                          {move.category === 'PHYSICAL' ? '💥 Physical' : move.category === 'SPECIAL' ? '🌀 Special' : '🛡️ Status'}
                        </span>
                        <span>Power: {move.power || '-'}</span>
                        <span>Acc: {move.accuracy || '-'}%</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-mono font-semibold text-slate-300">
                        PP {move.current_pp} / {move.pp}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

