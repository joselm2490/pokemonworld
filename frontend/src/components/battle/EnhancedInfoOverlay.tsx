import React from 'react';
import { Pokemon, PokemonMove } from '../../types/pokemon';
import { TYPE_SPRITE_INDEX } from '../../utils/battleSprites';

interface EnhancedInfoOverlayProps {
  mode: 'battler' | 'move' | null;
  playerPokemon: Pokemon;
  opponentPokemon: Pokemon;
  selectedMove?: PokemonMove;
  onClose: () => void;
}

const CATEGORY_ROW: Record<string, number> = {
  PHYSICAL: 0,
  SPECIAL: 1,
  STATUS: 2,
};

const formatStage = (val?: number) => {
  if (!val) return '';
  return val > 0 ? ` (+${val})` : ` (${val})`;
};

export const EnhancedInfoOverlay: React.FC<EnhancedInfoOverlayProps> = ({
  mode,
  playerPokemon,
  opponentPokemon,
  selectedMove,
  onClose,
}) => {
  if (!mode) return null;

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 bg-black/75 flex items-center justify-center p-4 select-none pixelated"
      style={{ width: '512px', height: '384px', zIndex: 42 }}
    >
      {mode === 'battler' ? (
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-[476px] bg-[#1e2630] border-4 border-[#d6b24a] rounded-xl p-3 text-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b-2 border-slate-700 pb-1.5 mb-2.5">
            <span className="font-pkmn font-bold text-amber-300" style={{ fontSize: '20px' }}>
              BATTLER INFO
            </span>
            <button
              type="button"
              onClick={onClose}
              className="font-pkmn text-slate-300 hover:text-white cursor-pointer"
              style={{ fontSize: '16px' }}
            >
              [ Close / A ]
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'YOUR POKÉMON', pk: playerPokemon, accent: 'border-sky-500/60' },
              { label: 'OPPONENT', pk: opponentPokemon, accent: 'border-rose-500/60' },
            ].map(({ label, pk, accent }) => (
              <div
                key={label}
                className={`bg-slate-900/90 border-2 ${accent} rounded-lg p-2.5 flex flex-col gap-1.5`}
              >
                <span className="font-pkmn text-slate-400 leading-none" style={{ fontSize: '13px' }}>
                  {label}
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-pkmn font-bold text-white leading-none" style={{ fontSize: '20px' }}>
                    {pk.name}
                  </span>
                  <span className="font-pkmn text-amber-300 leading-none" style={{ fontSize: '16px' }}>
                    Lv.{pk.level}
                  </span>
                </div>

                {/* Official Type Badges */}
                <div className="flex items-center gap-1.5 my-0.5">
                  {pk.types.map((t) => (
                    <span
                      key={t}
                      className="inline-block pixelated"
                      style={{
                        width: '64px',
                        height: '28px',
                        backgroundImage: 'url(/battle-ui/ui/types.png)',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: `0px -${(TYPE_SPRITE_INDEX[t] ?? 0) * 28}px`,
                        transform: 'scale(0.82)',
                        transformOrigin: 'left center',
                      }}
                    />
                  ))}
                </div>

                <div className="font-pkmn text-slate-300 leading-tight" style={{ fontSize: '15px' }}>
                  HP: {pk.current_hp}/{pk.max_hp}
                  {pk.ability && <div className="text-amber-200">Ability: {pk.ability}</div>}
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 font-pkmn text-slate-200 border-t border-slate-700 pt-1.5" style={{ fontSize: '14px' }}>
                  <span>ATK: {pk.stats.attack}{formatStage(pk.stages?.attack)}</span>
                  <span>DEF: {pk.stats.defense}{formatStage(pk.stages?.defense)}</span>
                  <span>SPA: {pk.stats.sp_attack}{formatStage(pk.stages?.sp_attack)}</span>
                  <span>SPD: {pk.stats.sp_defense}{formatStage(pk.stages?.sp_defense)}</span>
                  <span className="col-span-2 text-sky-300">
                    SPEED: {pk.stats.speed}{formatStage(pk.stages?.speed)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : selectedMove ? (
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-[460px] bg-[#1e2630] border-4 border-[#d6b24a] rounded-xl p-3.5 text-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b-2 border-slate-700 pb-1.5 mb-2.5">
            <span className="font-pkmn font-bold text-amber-300" style={{ fontSize: '21px' }}>
              {selectedMove.name}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="font-pkmn text-slate-300 hover:text-white cursor-pointer"
              style={{ fontSize: '16px' }}
            >
              [ Close / S ]
            </button>
          </div>

          <div className="flex items-center gap-3 mb-3">
            {/* Type Icon */}
            <div
              className="pixelated"
              style={{
                width: '64px',
                height: '28px',
                backgroundImage: 'url(/battle-ui/ui/types.png)',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: `0px -${(TYPE_SPRITE_INDEX[selectedMove.type] ?? 0) * 28}px`,
              }}
            />
            {/* Category Icon (64x28 slice from category.png) */}
            <div
              className="pixelated"
              style={{
                width: '64px',
                height: '28px',
                backgroundImage: 'url(/battle-ui/ui/category.png)',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: `0px -${(CATEGORY_ROW[selectedMove.category] ?? 0) * 28}px`,
              }}
            />
            <span className="ml-auto font-pkmn text-amber-200" style={{ fontSize: '18px' }}>
              PP: {selectedMove.current_pp}/{selectedMove.pp}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-slate-900/90 rounded-lg p-2.5 mb-3 font-pkmn text-center" style={{ fontSize: '16px' }}>
            <div>
              <div className="text-slate-400" style={{ fontSize: '13px' }}>POWER</div>
              <div className="text-white font-bold">{selectedMove.power > 0 ? selectedMove.power : '—'}</div>
            </div>
            <div>
              <div className="text-slate-400" style={{ fontSize: '13px' }}>ACCURACY</div>
              <div className="text-white font-bold">{selectedMove.accuracy > 0 ? `${selectedMove.accuracy}%` : '∞'}</div>
            </div>
            <div>
              <div className="text-slate-400" style={{ fontSize: '13px' }}>PRIORITY</div>
              <div className="text-white font-bold">{selectedMove.priority ? (selectedMove.priority > 0 ? `+${selectedMove.priority}` : selectedMove.priority) : '0'}</div>
            </div>
          </div>

          <p className="font-pkmn text-slate-200 bg-slate-950/70 rounded-lg p-2.5 leading-snug" style={{ fontSize: '17px' }}>
            {selectedMove.description || 'An official Pokémon battle move.'}
          </p>
        </div>
      ) : null}
    </div>
  );
};
