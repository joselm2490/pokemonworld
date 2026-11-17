import React, { useState, useEffect, useRef } from 'react';
import { BattleState } from '../../types/pokemon';
import { AnimatedPokemonSprite } from './AnimatedPokemonSprite';
import { PokemonStatusCard } from './PokemonStatusCard';
import { BattleActionPanel } from './BattleActionPanel';
import { SwitchModal } from './SwitchModal';
import { BATTLEBACK_THEMES } from '../../utils/battleSprites';
import { Trophy, Home, Copy, Check, RefreshCw, Map } from 'lucide-react';

interface BattleArenaProps {
  battleState: BattleState;
  playerRole: 'p1' | 'p2';
  isAiMatch: boolean;
  roomCode: string;
  onSelectAction: (action: { type: 'MOVE'; move_index: number } | { type: 'SWITCH'; target_index: number }) => void;
  onSwitchFainted: (targetIndex: number) => void;
  onRematch: () => void;
  onLeaveRoom: () => void;
  currentMessage: string;
  isWaitingForTurn: boolean;
  activeAttacker: 'p1' | 'p2' | null;
  activeHitTarget: 'p1' | 'p2' | null;
}

const NATIVE_WIDTH = 512;
const NATIVE_HEIGHT = 384;

export const BattleArena: React.FC<BattleArenaProps> = ({
  battleState,
  playerRole,
  isAiMatch,
  roomCode,
  onSelectAction,
  onSwitchFainted,
  onRematch,
  onLeaveRoom,
  currentMessage,
  isWaitingForTurn,
  activeAttacker,
  activeHitTarget,
}) => {
  const [isSwitchOpen, setIsSwitchOpen] = useState(false);
  const [showMoves, setShowMoves] = useState(false);
  const [themeId, setThemeId] = useState<string>('grass');
  const [copied, setCopied] = useState(false);
  const [viewportScale, setViewportScale] = useState(1.5);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Dynamically scale the native 512x384 Pokémon Essentials canvas to fit any screen crisply
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scaleX = (rect.width - 16) / NATIVE_WIDTH;
      const scaleY = (rect.height - 16) / NATIVE_HEIGHT;
      const nextScale = Math.max(0.6, Math.min(scaleX, scaleY, 2.5));
      setViewportScale(nextScale);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    window.addEventListener('resize', updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  const theme = BATTLEBACK_THEMES[themeId] || BATTLEBACK_THEMES.grass;

  const isP1 = playerRole === 'p1';
  const playerSide = isP1 ? battleState.p1 : battleState.p2;
  const opponentSide = isP1 ? battleState.p2 : battleState.p1;

  const playerActivePkmn = playerSide.team[playerSide.active_index];
  const opponentActivePkmn = opponentSide.team[opponentSide.active_index];

  const mustSwitch = playerActivePkmn.is_fainted && !battleState.is_game_over;
  const isWinner = battleState.winner === playerRole;

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Cycle through official Essentials battlebacks
  const cycleTheme = () => {
    const keys = Object.keys(BATTLEBACK_THEMES);
    const nextIdx = (keys.indexOf(themeId) + 1) % keys.length;
    setThemeId(keys[nextIdx]);
  };

  return (
    <div className="w-full h-[100dvh] flex flex-col bg-[#0d1117] text-slate-100 overflow-hidden select-none">
      {/* Slim Top Control Bar (Outside the native 512x384 game screen) */}
      <div className="h-11 px-3 sm:px-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onLeaveRoom}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-sans font-semibold text-slate-200 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Lobby</span>
          </button>

          <button
            onClick={handleCopyCode}
            title="Copy room code to invite a friend"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-amber-300 transition-colors"
          >
            <span>{isAiMatch ? `AI • ${roomCode}` : `PvP • ${roomCode}`}</span>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          {isWaitingForTurn && (
            <span className="flex items-center gap-1.5 text-xs font-sans text-sky-400 bg-sky-950/70 px-2.5 py-1 rounded-full border border-sky-800">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Waiting...</span>
            </span>
          )}

          <button
            onClick={cycleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-sans text-slate-200 transition-colors"
          >
            <Map className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{theme.label}</span>
          </button>

          <span className="text-xs font-mono text-slate-400">
            Turn {battleState.turn}
          </span>
        </div>
      </div>

      {/* Centered Scaled 512x384 Native Pokémon Essentials Viewport */}
      <div
        ref={containerRef}
        className="flex-1 w-full flex items-center justify-center overflow-hidden p-2"
      >
        <div
          style={{
            width: `${NATIVE_WIDTH * viewportScale}px`,
            height: `${NATIVE_HEIGHT * viewportScale}px`,
            position: 'relative',
          }}
          className="shadow-[0_0_50px_rgba(0,0,0,0.85)] ring-2 ring-slate-800 rounded-sm overflow-hidden bg-black"
        >
          {/* Native 512x384 Coordinate Stage */}
          <div
            className="pixelated origin-top-left"
            style={{
              width: `${NATIVE_WIDTH}px`,
              height: `${NATIVE_HEIGHT}px`,
              transform: `scale(${viewportScale})`,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* ================= TOP BATTLE FIELD (512 x 288) ================= */}
            <div
              className="absolute left-0 top-0 overflow-hidden pixelated"
              style={{
                width: '512px',
                height: '288px',
                backgroundImage: `url(${theme.bg})`,
                backgroundRepeat: 'no-repeat',
              }}
            >
              {/* Opponent Circular Platform (base1: 256x128) */}
              <img
                src={theme.base1}
                alt=""
                draggable={false}
                className="absolute pointer-events-none pixelated"
                style={{
                  left: '256px',
                  top: '112px',
                  width: '256px',
                  height: '128px',
                  zIndex: 5,
                }}
              />

              {/* Player Foreground Grass Base (base0: 512x64) */}
              <img
                src={theme.base0}
                alt=""
                draggable={false}
                className="absolute pointer-events-none pixelated"
                style={{
                  left: '-128px',
                  top: '224px',
                  width: '512px',
                  height: '64px',
                  zIndex: 6,
                }}
              />

              {/* Opponent Animated Sprite (Front, Scale 2x per DBK Settings.rb) */}
              <div
                className="absolute pointer-events-none"
                style={{
                  left: '384px',
                  bottom: '104px',
                  transform: 'translateX(-50%)',
                  zIndex: 10,
                }}
              >
                <AnimatedPokemonSprite
                  species={opponentActivePkmn.species}
                  isBack={false}
                  showShadow={true}
                  isAttacking={activeAttacker === (isP1 ? 'p2' : 'p1')}
                  isHit={activeHitTarget === (isP1 ? 'p2' : 'p1')}
                  isFainted={opponentActivePkmn.is_fainted}
                  scale={2}
                />
              </div>

              {/* Player Animated Sprite (Back, Scale 3x per DBK Settings.rb) */}
              <div
                className="absolute pointer-events-none"
                style={{
                  left: '128px',
                  bottom: '-18px',
                  transform: 'translateX(-50%)',
                  zIndex: 12,
                }}
              >
                <AnimatedPokemonSprite
                  species={playerActivePkmn.species}
                  isBack={true}
                  showShadow={false}
                  isAttacking={activeAttacker === (isP1 ? 'p1' : 'p2')}
                  isHit={activeHitTarget === (isP1 ? 'p1' : 'p2')}
                  isFainted={playerActivePkmn.is_fainted}
                  scale={2.6}
                />
              </div>

              {/* Official Foe Databox (Top-Left, x:0 y:36) */}
              <div
                className="absolute"
                style={{ left: '0px', top: '36px', zIndex: 20 }}
              >
                <PokemonStatusCard pokemon={opponentActivePkmn} isPlayer={false} />
              </div>

              {/* Official Player Databox (Bottom-Right, x:252 y:192) */}
              <div
                className="absolute"
                style={{ left: '252px', top: '192px', zIndex: 20 }}
              >
                <PokemonStatusCard pokemon={playerActivePkmn} isPlayer={true} />
              </div>

              {/* Official Enhanced Battle UI Menu Prompts (menu_prompts.png at x:0 y:236) */}
              {!isWaitingForTurn && !battleState.is_game_over && (
                <div
                  className="absolute pointer-events-none pixelated"
                  style={{
                    left: '0px',
                    top: '236px',
                    width: '164px',
                    height: '52px',
                    backgroundImage: 'url(/battle-ui/enhanced/menu_prompts.png)',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: `0px ${showMoves ? -52 : 0}px`,
                    zIndex: 22,
                  }}
                >
                  <span
                    className="absolute font-pkmn font-bold pkmn-text-key leading-none"
                    style={{ left: '76px', top: '4px', fontSize: '20px' }}
                  >
                    A
                  </span>
                  <span
                    className="absolute font-pkmn font-bold pkmn-text-key leading-none"
                    style={{ left: '76px', top: '30px', fontSize: '20px' }}
                  >
                    S
                  </span>
                </div>
              )}
            </div>

            {/* ================= BOTTOM HUD (512 x 96 at y:288) ================= */}
            <div
              className="absolute left-0"
              style={{ top: '288px', zIndex: 30 }}
            >
              <BattleActionPanel
                activePokemon={playerActivePkmn}
                messageBgUrl={theme.message}
                showMoves={showMoves}
                onShowMovesChange={setShowMoves}
                disabled={isWaitingForTurn || battleState.is_game_over || mustSwitch}
                dialogueMessage={currentMessage}
                onSelectMove={(moveIndex) =>
                  onSelectAction({ type: 'MOVE', move_index: moveIndex })
                }
                onOpenSwitch={() => setIsSwitchOpen(true)}
                onForfeit={() => {
                  if (confirm('Are you sure you want to forfeit this match?')) {
                    onLeaveRoom();
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Switch Party Modal */}
      <SwitchModal
        isOpen={isSwitchOpen || mustSwitch}
        isForcedSwitch={mustSwitch}
        activeIndex={playerSide.active_index}
        party={playerSide.team}
        onClose={() => setIsSwitchOpen(false)}
        onSelectPokemon={(newIndex) => {
          if (mustSwitch) {
            onSwitchFainted(newIndex);
          } else {
            onSelectAction({ type: 'SWITCH', target_index: newIndex });
          }
        }}
      />

      {/* Victory / Defeat Modal */}
      {battleState.is_game_over && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-gradient-to-b from-zinc-100 to-zinc-300 border-4 border-zinc-800 rounded-2xl p-6 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-amber-400 border-2 border-zinc-800 flex items-center justify-center shadow-md">
              <Trophy className={`w-8 h-8 ${isWinner ? 'text-amber-950' : 'text-zinc-600'}`} />
            </div>

            <h2 className="text-2xl font-bold font-pkmn uppercase tracking-wider mb-2 text-zinc-900">
              {isWinner ? 'YOU WON!' : 'YOU LOST!'}
            </h2>
            <p className="text-base text-zinc-700 font-pkmn leading-snug mb-6">
              {isWinner
                ? 'All opposing Pokémon were defeated!'
                : 'All your Pokémon fainted!'}
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={onRematch}
                className="w-full py-2.5 rounded-full bg-gradient-to-b from-[#f25d5d] to-[#c42828] border-2 border-white font-pkmn text-lg font-bold text-white uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all"
              >
                Rematch
              </button>
              <button
                onClick={onLeaveRoom}
                className="w-full py-2 rounded-full bg-zinc-700 hover:bg-zinc-800 font-pkmn text-base text-white transition-colors"
              >
                Return to Lobby
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
