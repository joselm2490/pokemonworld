import React, { useState, useEffect } from 'react';
import { Pokemon, PokemonMove } from '../../types/pokemon';
import { COMMAND_SPRITE_ROW, TYPE_SPRITE_INDEX } from '../../utils/battleSprites';
import { battleAudio } from '../../utils/battleAudio';

interface BattleActionPanelProps {
  activePokemon: Pokemon;
  onSelectMove: (moveIndex: number) => void;
  onOpenSwitch: () => void;
  onForfeit: () => void;
  dialogueMessage: string;
  messageBgUrl: string;
  showMoves: boolean;
  onShowMovesChange: (show: boolean) => void;
  onHoverMoveChange?: (moveIndex: number) => void;
  disabled?: boolean;
}

type CommandKey = 'FIGHT' | 'BAG' | 'POKEMON' | 'RUN';

export const BattleActionPanel: React.FC<BattleActionPanelProps> = ({
  activePokemon,
  onSelectMove,
  onOpenSwitch,
  onForfeit,
  dialogueMessage,
  messageBgUrl,
  showMoves,
  onShowMovesChange,
  onHoverMoveChange,
  disabled = false,
}) => {
  const [hoveredCmd, setHoveredCmd] = useState<CommandKey>('FIGHT');
  const [hoveredMoveIdx, setHoveredMoveIdx] = useState<number>(0);

  const selectHoveredCmd = (cmd: CommandKey) => {
    if (hoveredCmd !== cmd) {
      setHoveredCmd(cmd);
      battleAudio.playSE('cursor', 0.45);
    }
  };

  const selectHoveredMove = (idx: number) => {
    if (hoveredMoveIdx !== idx) {
      setHoveredMoveIdx(idx);
      onHoverMoveChange?.(idx);
      battleAudio.playSE('cursor', 0.45);
    }
  };

  // Allow Escape or Right-click to return from Move Menu to Command Menu
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showMoves) {
        onShowMovesChange(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showMoves, onShowMovesChange]);

  const currentHoveredMove: PokemonMove | undefined =
    activePokemon.moves[hoveredMoveIdx] || activePokemon.moves[0];

  const hoveredTypeRow = currentHoveredMove
    ? TYPE_SPRITE_INDEX[currentHoveredMove.type] ?? 0
    : 0;

  const isMessageOnly = disabled && Boolean(dialogueMessage);

  return (
    <div
      className="relative select-none pixelated"
      style={{
        width: '512px',
        height: '96px',
        backgroundImage: `url(${messageBgUrl})`,
        backgroundRepeat: 'no-repeat',
      }}
      onContextMenu={(e) => {
        if (showMoves) {
          e.preventDefault();
          onShowMovesChange(false);
        }
      }}
    >
      {isMessageOnly ? (
        /* ================= FULL MESSAGE BOX MODE ================= */
        <div
          className="absolute inset-0 pixelated"
          style={{
            backgroundImage: 'url(/battle-ui/ui/overlay_message.png)',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div
            className="absolute font-pkmn pkmn-text-message leading-snug"
            style={{
              left: '26px',
              top: '16px',
              width: '460px',
              fontSize: '22px',
            }}
          >
            {dialogueMessage}
          </div>
        </div>
      ) : !showMoves ? (
        /* ================= COMMAND MENU MODE (IMAGES 2, 3, 4) ================= */
        <div
          className="absolute inset-0 pixelated"
          style={{
            backgroundImage: 'url(/battle-ui/ui/overlay_command.png)',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Left Dialogue Box Text */}
          <div
            className="absolute font-pkmn pkmn-text-message leading-[1.25]"
            style={{
              left: '26px',
              top: '16px',
              width: '208px',
              fontSize: '22px',
            }}
          >
            {dialogueMessage ? (
              dialogueMessage
            ) : (
              <>
                ¿Qué debería
                <br />
                hacer {activePokemon.name}?
              </>
            )}
          </div>

          {/* Right 4 Official Command Buttons from cursor_command.png (130x46 each) */}
          {/* Top-Left: FIGHT */}
          <button
            type="button"
            aria-label="Fight"
            disabled={disabled || activePokemon.is_fainted}
            onMouseEnter={() => selectHoveredCmd('FIGHT')}
            onFocus={() => selectHoveredCmd('FIGHT')}
            onClick={() => {
              battleAudio.playSE('decision', 0.6);
              battleAudio.ensureBgmPlaying();
              onShowMovesChange(true);
            }}
            className="absolute border-0 p-0 cursor-pointer pixelated disabled:opacity-50"
            style={{
              left: '252px',
              top: '2px',
              width: '130px',
              height: '46px',
              backgroundImage: 'url(/battle-ui/ui/cursor_command.png)',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: `${hoveredCmd === 'FIGHT' ? -130 : 0}px -${COMMAND_SPRITE_ROW.FIGHT * 46}px`,
            }}
          />

          {/* Top-Right: BAG */}
          <button
            type="button"
            aria-label="Bag"
            disabled={disabled}
            onMouseEnter={() => selectHoveredCmd('BAG')}
            onFocus={() => selectHoveredCmd('BAG')}
            onClick={() => {
              battleAudio.playSE('cancel', 0.55);
              alert('Reglas de Duelo: Los objetos de la mochila están prohibidos en combates oficiales.');
            }}
            className="absolute border-0 p-0 cursor-pointer pixelated disabled:opacity-50"
            style={{
              left: '382px',
              top: '2px',
              width: '130px',
              height: '46px',
              backgroundImage: 'url(/battle-ui/ui/cursor_command.png)',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: `${hoveredCmd === 'BAG' ? -130 : 0}px -${COMMAND_SPRITE_ROW.BAG * 46}px`,
            }}
          />

          {/* Bottom-Left: POKÉMON */}
          <button
            type="button"
            aria-label="Pokemon"
            disabled={disabled}
            onMouseEnter={() => selectHoveredCmd('POKEMON')}
            onFocus={() => selectHoveredCmd('POKEMON')}
            onClick={() => {
              battleAudio.playSE('decision', 0.6);
              battleAudio.ensureBgmPlaying();
              onOpenSwitch();
            }}
            className="absolute border-0 p-0 cursor-pointer pixelated disabled:opacity-50"
            style={{
              left: '252px',
              top: '48px',
              width: '130px',
              height: '46px',
              backgroundImage: 'url(/battle-ui/ui/cursor_command.png)',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: `${hoveredCmd === 'POKEMON' ? -130 : 0}px -${COMMAND_SPRITE_ROW.POKEMON * 46}px`,
            }}
          />

          {/* Bottom-Right: RUN */}
          <button
            type="button"
            aria-label="Run"
            disabled={disabled}
            onMouseEnter={() => selectHoveredCmd('RUN')}
            onFocus={() => selectHoveredCmd('RUN')}
            onClick={() => {
              battleAudio.playSE('cancel', 0.55);
              onForfeit();
            }}
            className="absolute border-0 p-0 cursor-pointer pixelated disabled:opacity-50"
            style={{
              left: '382px',
              top: '48px',
              width: '130px',
              height: '46px',
              backgroundImage: 'url(/battle-ui/ui/cursor_command.png)',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: `${hoveredCmd === 'RUN' ? -130 : 0}px -${COMMAND_SPRITE_ROW.RUN * 46}px`,
            }}
          />
        </div>
      ) : (
        /* ================= FIGHT / MOVE MENU MODE (IMAGE 5) ================= */
        <div
          className="absolute inset-0 pixelated"
          style={{
            backgroundImage: 'url(/battle-ui/ui/overlay_fight.png)',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* 4 Official Move Buttons from cursor_fight.png (192x46 each) */}
          {activePokemon.moves.slice(0, 4).map((move, idx) => {
            const col = idx % 2;
            const row = Math.floor(idx / 2);
            const typeRow = TYPE_SPRITE_INDEX[move.type] ?? 0;
            const isSelected = hoveredMoveIdx === idx;
            const isOutOfPP = move.current_pp <= 0;

            return (
              <button
                key={idx}
                type="button"
                disabled={disabled || isOutOfPP}
                onMouseEnter={() => selectHoveredMove(idx)}
                onFocus={() => selectHoveredMove(idx)}
                onClick={() => {
                  battleAudio.playSE('decision', 0.65);
                  onShowMovesChange(false);
                  onSelectMove(idx);
                }}
                className="absolute border-0 p-0 cursor-pointer pixelated flex items-center justify-center disabled:opacity-45"
                style={{
                  left: `${4 + col * 192}px`,
                  top: `${2 + row * 46}px`,
                  width: '192px',
                  height: '46px',
                  backgroundImage: 'url(/battle-ui/ui/cursor_fight.png)',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: `${isSelected ? -192 : 0}px -${typeRow * 46}px`,
                }}
              >
                <span
                  className="font-pkmn pkmn-text-move truncate px-3 leading-none"
                  style={{ fontSize: '20px' }}
                >
                  {move.name}
                </span>
              </button>
            );
          })}

          {/* Right Info Box: Official Type Sprite (64x28) + PP Counter */}
          {currentHoveredMove && (
            <div
              className="absolute flex flex-col items-center justify-center"
              style={{
                left: '390px',
                top: '4px',
                width: '116px',
                height: '88px',
              }}
            >
              {/* Official Type Icon from types.png */}
              <div
                className="pixelated"
                style={{
                  width: '64px',
                  height: '28px',
                  backgroundImage: 'url(/battle-ui/ui/types.png)',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: `0px -${hoveredTypeRow * 28}px`,
                }}
              />

              {/* PP Counter */}
              <div
                className="font-pkmn pkmn-text-dark leading-none mt-2"
                style={{ fontSize: '19px' }}
              >
                PP: {currentHoveredMove.current_pp}/{currentHoveredMove.pp}
              </div>

              {/* Subtle Back click button */}
              <button
                type="button"
                onClick={() => onShowMovesChange(false)}
                className="mt-0.5 text-[11px] font-pkmn text-zinc-500 hover:text-zinc-900 underline cursor-pointer leading-none"
              >
                Volver (Esc)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
