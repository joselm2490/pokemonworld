import React, { useState } from 'react';
import { Pokemon } from '../../types/pokemon';
import { battleAudio } from '../../utils/battleAudio';
import { StaticPokemonImage } from '../common/StaticPokemonImage';

interface SwitchModalProps {
  party: Pokemon[];
  activeIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectPokemon: (index: number) => void;
  isForcedSwitch?: boolean;
  apiBaseUrl?: string;
}

const STATUS_COLORS: Record<string, string> = {
  PAR: 'bg-amber-400 text-zinc-950 border-amber-200',
  BRN: 'bg-rose-600 text-white border-rose-300',
  PSN: 'bg-purple-600 text-white border-purple-300',
  TOX: 'bg-purple-700 text-white border-purple-300',
  SLP: 'bg-slate-500 text-white border-slate-300',
  FRZ: 'bg-cyan-400 text-zinc-950 border-cyan-200',
};

export const SwitchModal: React.FC<SwitchModalProps> = ({
  party,
  activeIndex,
  isOpen,
  onClose,
  onSelectPokemon,
  isForcedSwitch = false,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  return (
    <div
      className="absolute inset-0 z-40 select-none overflow-hidden flex flex-col justify-between p-3"
      style={{
        width: '512px',
        height: '384px',
        backgroundColor: '#125360',
        backgroundImage:
          'linear-gradient(180deg, rgba(13, 62, 74, 0.92) 0%, rgba(23, 118, 132, 0.92) 65%, rgba(36, 158, 170, 0.95) 100%), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 24px 24px, 24px 24px',
      }}
    >
      {/* 2-Column Staggered Party Grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 pt-0.5">
        {party.slice(0, 6).map((pokemon, idx) => {
          const isActive = idx === activeIndex;
          const isFainted = pokemon.is_fainted || pokemon.current_hp <= 0;
          const isHovered = hoveredIdx === idx && !isActive && !isFainted;
          const isRightCol = idx % 2 === 1;

          const hpRatio = Math.max(0, Math.min(1, pokemon.current_hp / Math.max(1, pokemon.max_hp)));
          const hpPercent = Math.round(hpRatio * 100);
          const hpGradient =
            hpRatio <= 0.2
              ? 'linear-gradient(180deg, #ff8787 0%, #e03131 100%)'
              : hpRatio <= 0.5
              ? 'linear-gradient(180deg, #ffd43b 0%, #f08c00 100%)'
              : 'linear-gradient(180deg, #69db7c 0%, #37b24d 100%)';

          const isFemale = pokemon.gender === 'F' || (!pokemon.gender && pokemon.name.length % 2 === 0);

          const outerBg = isHovered
            ? 'linear-gradient(180deg, #ffe066 0%, #f59f00 100%)'
            : isFainted
            ? '#3d0c0e'
            : '#0a2e1a';

          const innerBg = isFainted
            ? 'linear-gradient(180deg, #7d1d22 0%, #a62b31 55%, #73181d 100%)'
            : isHovered
            ? 'linear-gradient(180deg, #209c5a 0%, #37c978 55%, #23a35e 100%)'
            : isActive
            ? 'linear-gradient(180deg, #105e3a 0%, #1b8552 55%, #11633d 100%)'
            : 'linear-gradient(180deg, #167a48 0%, #24a862 55%, #19874e 100%)';

          const innerShadow = isHovered
            ? 'inset 0 0 0 2px #fff3bf'
            : isFainted
            ? 'inset 0 2px 0 rgba(255, 138, 143, 0.35)'
            : 'inset 0 2px 0 rgba(126, 242, 178, 0.45)';

          return (
            <button
              key={idx}
              type="button"
              disabled={isActive || isFainted}
              onMouseEnter={() => {
                if (hoveredIdx !== idx) {
                  setHoveredIdx(idx);
                  if (!isActive && !isFainted) {
                    battleAudio.playSE('cursor', 0.45);
                  }
                }
              }}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => {
                battleAudio.playSE('decision', 0.6);
                onSelectPokemon(idx);
                onClose();
              }}
              className="relative p-[2.5px] text-left border-0 cursor-pointer disabled:cursor-not-allowed transition-all duration-150"
              style={{
                background: outerBg,
                clipPath: 'polygon(13px 0, 100% 0, 100% 100%, 0 100%, 0 13px)',
                transform: isRightCol ? 'translateY(10px)' : 'none',
                filter: isHovered ? 'drop-shadow(0 0 8px rgba(255, 212, 59, 0.75))' : 'none',
                zIndex: isHovered ? 5 : 1,
              }}
            >
              <div
                className="grid items-center gap-1.5 px-2.5 py-1.5"
                style={{
                  gridTemplateColumns: '68px 1fr',
                  height: '84px',
                  background: innerBg,
                  clipPath: 'polygon(11px 0, 100% 0, 100% 100%, 0 100%, 0 11px)',
                  boxShadow: innerShadow,
                }}
              >
                {/* Left Column: Pokéball Watermark + 3D Icon + OUT + Level */}
                <div className="relative flex flex-col items-center justify-between h-full">
                  <div
                    className="absolute top-0.5 w-12 h-12 rounded-full pointer-events-none"
                    style={{
                      background:
                        'radial-gradient(circle, transparent 8px, rgba(255, 255, 255, 0.14) 9px, rgba(255, 255, 255, 0.14) 100%)',
                    }}
                  >
                    <div className="absolute top-1/2 left-0 right-0 h-[3px] -translate-y-1/2 bg-black/15" />
                  </div>

                  <div
                    className="relative z-10 w-13 h-13 flex items-center justify-center -mt-0.5"
                    style={{
                      filter: isFainted ? 'grayscale(0.55) brightness(0.85)' : 'none',
                    }}
                  >
                    <StaticPokemonImage
                      species={pokemon.species}
                      alt={pokemon.name}
                      className="w-12 h-12 object-contain drop-shadow-sm"
                    />
                  </div>

                  {isActive && (
                    <span
                      className="absolute bottom-4 z-20 px-1.5 py-[1px] rounded-[3px] bg-[#2b303a] text-[#f8f9fa] border border-[#adb5bd] font-pkmn font-bold leading-none tracking-wider"
                      style={{ fontSize: '10px' }}
                    >
                      OUT
                    </span>
                  )}

                  <span
                    className="relative z-20 font-pkmn font-bold text-white leading-none"
                    style={{
                      fontSize: '15px',
                      textShadow: isFainted ? '1.5px 1.5px 0 #3b090c' : '1.5px 1.5px 0 #0a2917',
                    }}
                  >
                    Lv.{pokemon.level}
                  </span>
                </div>

                {/* Right Column: Name + Gender, HP Bar, Numbers / DEB */}
                <div className="flex flex-col justify-between h-full py-0.5 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="font-pkmn font-bold text-white truncate leading-none"
                      style={{
                        fontSize: '18px',
                        textShadow: isFainted ? '1.5px 1.5px 0 #3b090c' : '1.5px 1.5px 0 #0b2e19',
                      }}
                    >
                      {pokemon.name}
                    </span>
                    <span
                      className="font-pkmn font-bold leading-none shrink-0"
                      style={{
                        fontSize: '17px',
                        color: isFemale ? '#ff6b6b' : '#4dabf7',
                        textShadow: '1.5px 1.5px 0 #092414',
                      }}
                    >
                      {isFemale ? '♀' : '♂'}
                    </span>
                  </div>

                  {/* Stylized HP Track */}
                  <div
                    className="flex items-center bg-[#141c24] border-2 border-[#090d12] rounded px-1 py-[2px]"
                    style={{ boxShadow: '0 1.5px 0 rgba(255,255,255,0.15)' }}
                  >
                    <span
                      className="font-pkmn font-bold text-[#ff922b] leading-none mr-1"
                      style={{ fontSize: '11px' }}
                    >
                      HP
                    </span>
                    <div className="flex-1 h-[7px] bg-[#495057] rounded-[2px] overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${hpPercent}%`,
                          background: hpGradient,
                        }}
                      />
                    </div>
                  </div>

                  {/* Bottom Row: Status / HP Numbers / DEB */}
                  <div className="flex items-center justify-end gap-1.5 min-h-[18px]">
                    {!isFainted && pokemon.status && (
                      <span
                        className={`px-1.5 py-[1px] rounded border font-pkmn font-bold leading-none ${
                          STATUS_COLORS[pokemon.status] || 'bg-slate-700 text-white border-slate-400'
                        }`}
                        style={{ fontSize: '11px' }}
                      >
                        {pokemon.status}
                      </span>
                    )}
                    {isFainted ? (
                      <span
                        className="px-2 py-[2px] rounded bg-[#2b090c] text-[#ff6b6b] border border-[#862e33] font-pkmn font-bold leading-none"
                        style={{ fontSize: '13px', textShadow: '1px 1px 0 #000' }}
                      >
                        DEB
                      </span>
                    ) : (
                      <span
                        className="font-pkmn font-bold text-white leading-none"
                        style={{ fontSize: '16px', textShadow: '1.5px 1.5px 0 #0b2e19' }}
                      >
                        {pokemon.current_hp}/{pokemon.max_hp}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Dialogue Box & SALIR Button */}
      <div
        className="grid gap-3 items-stretch pt-2"
        style={{
          gridTemplateColumns: isForcedSwitch ? '1fr' : '1fr 116px',
        }}
      >
        <div
          className="flex items-center px-3.5 py-2 rounded-lg border-[3px] border-[#2b3545]"
          style={{
            height: '48px',
            background: 'linear-gradient(180deg, #ffffff 0%, #e9ecef 100%)',
            boxShadow: 'inset 0 0 0 2.5px #adb5bd, 0 3px 0 rgba(9, 43, 51, 0.6)',
          }}
        >
          <span className="font-pkmn text-[#212529] leading-none" style={{ fontSize: '20px' }}>
            {isForcedSwitch ? '¿A qué Pokémon deseas enviar?' : 'Elige un Pokémon para cambiar.'}
          </span>
        </div>

        {!isForcedSwitch && (
          <button
            type="button"
            onMouseEnter={() => battleAudio.playSE('cursor', 0.45)}
            onClick={() => {
              battleAudio.playSE('cancel', 0.55);
              onClose();
            }}
            className="rounded-lg border-[3px] border-[#091d42] font-pkmn font-bold text-white cursor-pointer hover:brightness-110 active:translate-y-0.5 transition-all flex items-center justify-center"
            style={{
              height: '48px',
              fontSize: '20px',
              background: 'linear-gradient(180deg, #1c64d1 0%, #0f3d91 100%)',
              textShadow: '2px 2px 0 #091d42',
              boxShadow:
                'inset 0 2px 0 rgba(116, 192, 252, 0.5), inset 0 -3px 0 #0a2966, 0 3px 0 rgba(9, 43, 51, 0.6)',
            }}
          >
            SALIR
          </button>
        )}
      </div>
    </div>
  );
};
