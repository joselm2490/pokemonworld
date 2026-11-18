import React, { useState } from 'react';
import { Pokemon } from '../../types/pokemon';
import { battleAudio } from '../../utils/battleAudio';

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
  const [hoveredIdx, setHoveredIdx] = useState<number>(activeIndex);
  const [cancelHover, setCancelHover] = useState(false);

  if (!isOpen) return null;

  const apiBaseUrl = import.meta.env.VITE_BACKEND_API_URL || '';

  return (
    <div
      className="absolute inset-0 select-none pixelated"
      style={{
        width: '512px',
        height: '384px',
        zIndex: 45,
        backgroundImage: 'url(/battle-ui/party/bg.png)',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* 6 Official Party Panels (2 cols x 3 rows, right column offset +16px just like Essentials) */}
      {Array.from({ length: 6 }).map((_, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const left = col * 256;
        const top = row * 96 + (col === 1 ? 16 : 0);

        const pokemon = party[idx];
        if (!pokemon) {
          return (
            <div
              key={idx}
              className="absolute pixelated"
              style={{
                left: `${left}px`,
                top: `${top}px`,
                width: '256px',
                height: '98px',
                backgroundImage: 'url(/battle-ui/party/panel_blank.png)',
                backgroundRepeat: 'no-repeat',
              }}
            />
          );
        }

        const isActive = idx === activeIndex;
        const isFainted = pokemon.is_fainted || pokemon.current_hp <= 0;
        const isSelected = hoveredIdx === idx && !cancelHover;

        const shape = idx === 0 ? 'round' : 'rect';
        const panelFile = isFainted
          ? isSelected
            ? `panel_${shape}_faint_sel.png`
            : `panel_${shape}_faint.png`
          : isSelected
          ? `panel_${shape}_sel.png`
          : `panel_${shape}.png`;

        const hpRatio = Math.max(0, Math.min(1, pokemon.current_hp / Math.max(1, pokemon.max_hp)));
        const hpWidth = pokemon.current_hp > 0 ? Math.max(2, Math.round(96 * hpRatio)) : 0;
        const hpRowOffset = hpRatio <= 0.2 ? -16 : hpRatio <= 0.5 ? -8 : 0;

        const isFemale = pokemon.gender === 'F' || (!pokemon.gender && pokemon.name.length % 2 === 0);
        const iconUrl = `${apiBaseUrl}/sprites/Graphics/Pokemon/Icons/${pokemon.species.toUpperCase()}.png`;

        return (
          <button
            key={idx}
            type="button"
            disabled={isActive || isFainted}
            onMouseEnter={() => {
              setCancelHover(false);
              if (hoveredIdx !== idx) {
                setHoveredIdx(idx);
                battleAudio.playSE('cursor', 0.45);
              }
            }}
            onClick={() => {
              battleAudio.playSE('decision', 0.6);
              onSelectPokemon(idx);
              onClose();
            }}
            className="absolute border-0 p-0 text-left cursor-pointer pixelated disabled:cursor-not-allowed"
            style={{
              left: `${left}px`,
              top: `${top}px`,
              width: '256px',
              height: '98px',
              backgroundImage: `url(/battle-ui/party/${panelFile})`,
              backgroundRepeat: 'no-repeat',
            }}
          >
            {/* Official Pokéball indicator */}
            <div
              className="absolute pixelated"
              style={{
                left: '10px',
                top: '10px',
                width: '44px',
                height: '56px',
                backgroundImage: `url(/battle-ui/party/${isSelected ? 'icon_ball_sel.png' : 'icon_ball.png'})`,
                backgroundRepeat: 'no-repeat',
                opacity: 0.35,
              }}
            />

            {/* Official Pokémon Party Icon (cropped to first 64x64 frame of the 2-frame icon strip) */}
            <div
              className="absolute overflow-hidden pixelated"
              style={{
                left: '12px',
                top: '4px',
                width: '64px',
                height: '64px',
                filter: isFainted ? 'grayscale(1) opacity(0.6)' : 'none',
              }}
            >
              <img
                src={iconUrl}
                alt={pokemon.name}
                draggable={false}
                className="pixelated max-w-none"
                style={{ height: '64px', width: 'auto' }}
              />
            </div>

            {/* Name */}
            <span
              className="absolute font-pkmn font-bold text-white truncate leading-none"
              style={{
                left: '96px',
                top: '18px',
                maxWidth: '120px',
                fontSize: '20px',
                textShadow: '2px 2px 0 #383838',
              }}
            >
              {pokemon.name}
            </span>

            {/* Gender */}
            <span
              className="absolute font-pkmn font-bold leading-none"
              style={{
                right: '18px',
                top: '18px',
                fontSize: '18px',
                color: isFemale ? '#ff8888' : '#88ccff',
                textShadow: '1px 1px 0 #282828',
              }}
            >
              {isFemale ? '♀' : '♂'}
            </span>

            {/* Active Tag */}
            {isActive && (
              <span
                className="absolute font-pkmn font-bold leading-none px-1.5 py-0.5 rounded-xs bg-amber-400 text-zinc-900"
                style={{
                  left: '18px',
                  top: '50px',
                  fontSize: '11px',
                }}
              >
                OUT
              </span>
            )}

            {/* Official HP Bar Back (138x14) */}
            <div
              className="absolute pixelated"
              style={{
                left: '96px',
                top: '48px',
                width: '138px',
                height: '14px',
                backgroundImage: `url(/battle-ui/party/${isFainted ? 'overlay_hp_back_faint.png' : 'overlay_hp_back.png'})`,
                backgroundRepeat: 'no-repeat',
              }}
            >
              {/* Official HP Fill (96x8 slice inside overlay_hp.png) */}
              <div
                className="absolute pixelated"
                style={{
                  left: '34px',
                  top: '2px',
                  width: `${hpWidth}px`,
                  height: '8px',
                  backgroundImage: 'url(/battle-ui/party/overlay_hp.png)',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: `0px ${hpRowOffset}px`,
                }}
              />
            </div>

            {/* Level (bottom-left) */}
            <span
              className="absolute font-pkmn font-bold text-white leading-none"
              style={{
                left: '20px',
                top: '68px',
                fontSize: '17px',
                textShadow: '2px 2px 0 #383838',
              }}
            >
              Lv.{pokemon.level}
            </span>

            {/* Numerical HP (bottom-right) */}
            <span
              className="absolute font-pkmn font-bold text-white leading-none"
              style={{
                right: '20px',
                top: '68px',
                fontSize: '17px',
                textShadow: '2px 2px 0 #383838',
              }}
            >
              {isFainted ? 'DEB' : `${pokemon.current_hp}/${pokemon.max_hp}`}
            </span>
          </button>
        );
      })}

      {/* Bottom Prompt Box */}
      <div
        className="absolute bg-[#f8f8f8] border-4 border-[#383848] rounded-lg px-4 py-2 flex items-center"
        style={{
          left: '12px',
          top: '322px',
          width: isForcedSwitch ? '488px' : '372px',
          height: '52px',
        }}
      >
        <span className="font-pkmn pkmn-text-message leading-none" style={{ fontSize: '21px' }}>
          {isForcedSwitch ? '¿A qué Pokémon deseas enviar?' : 'Elige un Pokémon para cambiar.'}
        </span>
      </div>

      {/* Official Cancel Button (112x48) */}
      {!isForcedSwitch && (
        <button
          type="button"
          onMouseEnter={() => {
            setCancelHover(true);
            battleAudio.playSE('cursor', 0.45);
          }}
          onMouseLeave={() => setCancelHover(false)}
          onClick={() => {
            battleAudio.playSE('cancel', 0.55);
            onClose();
          }}
          className="absolute border-0 p-0 cursor-pointer pixelated flex items-center justify-center"
          style={{
            left: '392px',
            top: '324px',
            width: '112px',
            height: '48px',
            backgroundImage: `url(/battle-ui/party/${cancelHover ? 'icon_cancel_sel.png' : 'icon_cancel.png'})`,
            backgroundRepeat: 'no-repeat',
          }}
        >
          <span
            className="font-pkmn font-bold text-white leading-none"
            style={{ fontSize: '19px', textShadow: '2px 2px 0 #303030' }}
          >
            SALIR
          </span>
        </button>
      )}
    </div>
  );
};
