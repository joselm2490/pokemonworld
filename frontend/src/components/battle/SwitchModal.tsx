import React from 'react';
import { Pokemon } from '../../types/pokemon';
import { TYPE_COLORS } from '../../utils/typeColors';
import { X, Check } from 'lucide-react';

interface SwitchModalProps {
  party: Pokemon[];
  activeIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectPokemon: (index: number) => void;
  isForcedSwitch?: boolean;
}

export const SwitchModal: React.FC<SwitchModalProps> = ({
  party,
  activeIndex,
  isOpen,
  onClose,
  onSelectPokemon,
  isForcedSwitch = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white font-game">
              {isForcedSwitch ? 'Choose Next Pokémon!' : 'Switch Pokémon'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select an available team member to send into battle.
            </p>
          </div>
          {!isForcedSwitch && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Pokémon Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-5 max-h-[60vh] overflow-y-auto pr-1">
          {party.map((pokemon, idx) => {
            const isActive = idx === activeIndex;
            const isFainted = pokemon.is_fainted || pokemon.current_hp <= 0;
            const hpPercent = Math.max(0, Math.min(100, Math.round((pokemon.current_hp / pokemon.max_hp) * 100)));

            let hpColor = 'bg-emerald-500';
            if (hpPercent <= 20) hpColor = 'bg-rose-500';
            else if (hpPercent <= 50) hpColor = 'bg-amber-400';

            return (
              <button
                key={idx}
                disabled={isActive || isFainted}
                onClick={() => {
                  onSelectPokemon(idx);
                  onClose();
                }}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left relative overflow-hidden group ${isActive
                  ? 'bg-blue-950/40 border-blue-500/80 shadow-md ring-1 ring-blue-500/30'
                  : isFainted
                    ? 'bg-slate-900/60 border-slate-800 opacity-45 cursor-not-allowed'
                    : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700 hover:border-blue-400 hover:shadow-lg active:scale-95'
                  }`}
              >
                {/* Active Indicator Badge */}
                {isActive && (
                  <span className="absolute top-2 right-2 text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-500 text-white font-game">
                    Active
                  </span>
                )}

                {/* Pokeball Avatar / Placeholder */}
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                  <span className="text-xl">⚡</span>
                </div>

                {/* Pokémon Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-sm truncate uppercase tracking-wide">
                      {pokemon.name}
                    </span>
                    <span className="text-xs text-amber-300 font-mono font-semibold">
                      Lv.{pokemon.level}
                    </span>
                  </div>

                  {/* Types */}
                  <div className="flex items-center gap-1.5 mb-2">
                    {pokemon.types.map((type, tIdx) => {
                      const color = TYPE_COLORS[type] || TYPE_COLORS.NORMAL;
                      return (
                        <span
                          key={tIdx}
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${color.bg} ${color.text}`}
                        >
                          {type}
                        </span>
                      );
                    })}
                  </div>

                  {/* HP Bar */}
                  <div className="space-y-1">
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${hpColor}`}
                        style={{ width: `${hpPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>{isFainted ? 'Fainted' : 'HP'}</span>
                      <span>{pokemon.current_hp} / {pokemon.max_hp}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

