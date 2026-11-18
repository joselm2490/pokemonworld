import React from 'react';
import { Pokemon } from '../../types/pokemon';
import { STATUS_SPRITE_INDEX } from '../../utils/battleSprites';
import { SpriteNumbers } from './SpriteNumbers';

interface PokemonStatusCardProps {
  pokemon: Pokemon;
  isPlayer?: boolean;
  className?: string;
}

export const PokemonStatusCard: React.FC<PokemonStatusCardProps> = ({
  pokemon,
  isPlayer = false,
  className = '',
}) => {
  const hpRatio = Math.max(0, Math.min(1, pokemon.current_hp / Math.max(1, pokemon.max_hp)));
  const hpWidthPx = pokemon.current_hp > 0 ? Math.max(2, Math.round(96 * hpRatio)) : 0;

  // overlay_hp.png is 96x18 (3 rows of 6px: 0=Green, 1=Yellow, 2=Red)
  let hpRowOffset = 0;
  if (hpRatio <= 0.2) {
    hpRowOffset = -12;
  } else if (hpRatio <= 0.5) {
    hpRowOffset = -6;
  }

  const isFemale = pokemon.species.toLowerCase().includes('female') || pokemon.name.length % 2 === 0;
  const statusRow = pokemon.status ? STATUS_SPRITE_INDEX[pokemon.status] : undefined;

  if (!isPlayer) {
    // ================= OPPONENT DATABOX (260 x 62) =================
    return (
      <div
        className={`relative select-none pixelated ${className}`}
        style={{
          width: '260px',
          height: '62px',
          backgroundImage: 'url(/battle-ui/ui/databox_normal_foe.png)',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Pokémon Name */}
        <span
          className="absolute font-pkmn pkmn-text-dark leading-none truncate"
          style={{
            left: '8px',
            top: '8px',
            maxWidth: '124px',
            fontSize: '20px',
          }}
        >
          {pokemon.name}
        </span>

        {/* Gender Symbol */}
        <span
          className={`absolute font-pkmn font-bold leading-none ${
            isFemale ? 'pkmn-text-female' : 'pkmn-text-male'
          }`}
          style={{
            left: '132px',
            top: '10px',
            fontSize: '18px',
          }}
        >
          {isFemale ? '♀' : '♂'}
        </span>

        {/* Level (overlay_lv.png + icon_numbers.png) */}
        <div
          className="absolute"
          style={{
            left: '148px',
            top: '15px',
          }}
        >
          <SpriteNumbers value={String(pokemon.level)} showLv />
        </div>

        {/* Owned Pokéball Icon (14x14) */}
        <div
          className="absolute pixelated"
          style={{
            left: '8px',
            top: '36px',
            width: '14px',
            height: '14px',
            backgroundImage: 'url(/battle-ui/ui/icon_own.png)',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* Status Condition Badge (44x16) */}
        {statusRow !== undefined && (
          <div
            className="absolute pixelated"
            style={{
              left: '34px',
              top: '35px',
              width: '44px',
              height: '16px',
              backgroundImage: 'url(/battle-ui/ui/icon_statuses-espanol.png)',
              backgroundSize: '44px 96px',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: `0px -${statusRow * 16}px`,
            }}
          />
        )}

        {/* Official HP Bar Fill (slot at x:118, y:40, 96x6) */}
        <div
          className="absolute pixelated transition-[width] duration-300 ease-out"
          style={{
            left: '118px',
            top: '40px',
            width: `${hpWidthPx}px`,
            height: '6px',
            backgroundImage: 'url(/battle-ui/ui/overlay_hp.png)',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: `0px ${hpRowOffset}px`,
          }}
        />
      </div>
    );
  }

  // ================= PLAYER DATABOX (260 x 84) =================
  return (
    <div
      className={`relative select-none pixelated ${className}`}
      style={{
        width: '260px',
        height: '84px',
        backgroundImage: 'url(/battle-ui/ui/databox_normal.png)',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Pokémon Name */}
      <span
        className="absolute font-pkmn pkmn-text-dark leading-none truncate"
        style={{
          left: '44px',
          top: '8px',
          maxWidth: '116px',
          fontSize: '20px',
        }}
      >
        {pokemon.name}
      </span>

      {/* Gender Symbol */}
      <span
        className={`absolute font-pkmn font-bold leading-none ${
          isFemale ? 'pkmn-text-female' : 'pkmn-text-male'
        }`}
        style={{
          left: '164px',
          top: '10px',
          fontSize: '18px',
        }}
      >
        {isFemale ? '♀' : '♂'}
      </span>

      {/* Level (overlay_lv.png + icon_numbers.png) */}
      <div
        className="absolute"
        style={{
          left: '180px',
          top: '15px',
        }}
      >
        <SpriteNumbers value={String(pokemon.level)} showLv />
      </div>

      {/* Status Condition Badge (44x16) */}
      {statusRow !== undefined && (
        <div
          className="absolute pixelated"
          style={{
            left: '56px',
            top: '35px',
            width: '44px',
            height: '16px',
            backgroundImage: 'url(/battle-ui/ui/icon_statuses-espanol.png)',
            backgroundSize: '44px 96px',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: `0px -${statusRow * 16}px`,
          }}
        />
      )}

      {/* Official HP Bar Fill (slot at x:136, y:40, 96x6) */}
      <div
        className="absolute pixelated transition-[width] duration-300 ease-out"
        style={{
          left: '136px',
          top: '40px',
          width: `${hpWidthPx}px`,
          height: '6px',
          backgroundImage: 'url(/battle-ui/ui/overlay_hp.png)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: `0px ${hpRowOffset}px`,
        }}
      />

      {/* Official HP Numbers (icon_numbers.png) */}
      <div
        className="absolute flex justify-end"
        style={{
          right: '24px',
          top: '52px',
        }}
      >
        <SpriteNumbers value={`${pokemon.current_hp}/${pokemon.max_hp}`} />
      </div>

      {/* Official EXP Bar Overlay (192x4 at bottom slot) */}
      <div
        className="absolute pixelated"
        style={{
          left: '40px',
          top: '76px',
          width: '124px',
          height: '4px',
          backgroundImage: 'url(/battle-ui/ui/overlay_exp.png)',
          backgroundRepeat: 'no-repeat',
        }}
      />
    </div>
  );
};
