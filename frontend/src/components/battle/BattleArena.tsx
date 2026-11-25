import React, { useState, useEffect, useRef } from 'react';
import { BattleState } from '../../types/pokemon';
import { AnimatedPokemonSprite } from './AnimatedPokemonSprite';
import { PokemonStatusCard } from './PokemonStatusCard';
import { BattleActionPanel } from './BattleActionPanel';
import { SwitchModal } from './SwitchModal';
import { BattleEffectOverlay, ActiveEffect } from './BattleEffectOverlay';
import { EnhancedInfoOverlay } from './EnhancedInfoOverlay';
import { BattleChatCard } from './BattleChatCard';
import { BattleChatMessage } from '../../hooks/useBattle';
import { BATTLEBACK_THEMES } from '../../utils/battleSprites';
import { battleAudio } from '../../utils/battleAudio';
import {
  Trophy,
  Volume2,
  VolumeX,
  Bot,
  Sparkles,
  Gift,
  Activity,
  Settings,
  X,
  RefreshCw,
  LogOut,
  Map,
} from 'lucide-react';

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
  activeEffect: ActiveEffect | null;
  switchingState?: { side: 'p1' | 'p2'; phase: 'recalling' | 'sending' } | null;
  chatMessages?: BattleChatMessage[];
  onSendMessage?: (text: string) => void;
  trainerName?: string;
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
  activeEffect,
  switchingState = null,
  chatMessages = [],
  onSendMessage,
  trainerName,
}) => {
  const [isSwitchOpen, setIsSwitchOpen] = useState(false);
  const [showMoves, setShowMoves] = useState(false);
  const [hoveredMoveIdx, setHoveredMoveIdx] = useState(0);
  const [infoMode, setInfoMode] = useState<'battler' | 'move' | null>(null);
  const [themeId, setThemeId] = useState<string>('grass');
  const [muted, setMuted] = useState<boolean>(battleAudio.isMuted());
  const [viewportScale, setViewportScale] = useState(0.75);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Dynamically scale the native 512x384 Pokémon Essentials canvas to fit Card 1 crisply
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scale = rect.width / NATIVE_WIDTH;
      setViewportScale(Math.max(0.35, Math.min(1.0, scale)));
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

  // Enhanced Battle UI hotkeys: A = Battler Info, S = Move Info
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isWaitingForTurn || battleState.is_game_over || isSwitchOpen) return;
      const key = e.key.toLowerCase();
      if (key === 'a') {
        battleAudio.playSE('decision', 0.45);
        setInfoMode((prev) => (prev === 'battler' ? null : 'battler'));
      } else if (key === 's' && showMoves) {
        battleAudio.playSE('decision', 0.45);
        setInfoMode((prev) => (prev === 'move' ? null : 'move'));
      } else if (key === 'escape' && infoMode) {
        setInfoMode(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isWaitingForTurn, battleState.is_game_over, isSwitchOpen, showMoves, infoMode]);

  const theme = BATTLEBACK_THEMES[themeId] || BATTLEBACK_THEMES.grass;

  const isP1 = playerRole === 'p1';
  const playerSide = isP1 ? battleState.p1 : battleState.p2;
  const opponentSide = isP1 ? battleState.p2 : battleState.p1;

  const playerActivePkmn = playerSide.team[playerSide.active_index];
  const opponentActivePkmn = opponentSide.team[opponentSide.active_index];

  const mustSwitch = playerActivePkmn.is_fainted && !battleState.is_game_over;
  const isWinner = battleState.winner === playerRole;

  const myName = (trainerName || playerSide.name || (isP1 ? 'Blue' : 'Red')).toUpperCase();
  const opponentName = (opponentSide.name || (isAiMatch ? 'BOT IA' : isP1 ? 'Red' : 'Blue')).toUpperCase();
  const versusText = `${isP1 ? myName : opponentName} VS ${isP1 ? opponentName : myName}`;

  const cycleTheme = () => {
    battleAudio.playSE('cursor', 0.5);
    const keys = Object.keys(BATTLEBACK_THEMES);
    const nextIdx = (keys.indexOf(themeId) + 1) % keys.length;
    setThemeId(keys[nextIdx]);
  };

  const handleToggleAudio = () => {
    const nowMuted = battleAudio.toggleMute();
    setMuted(nowMuted);
    if (!nowMuted) {
      battleAudio.ensureBgmPlaying();
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-between bg-[#f0fdf4] text-slate-900 select-none overflow-x-hidden font-sans relative py-2 sm:py-3 px-2 sm:px-4">
      {/* Background Vital Bracelet decorative mint ribbons */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-90 z-0">
        <div className="absolute -top-32 -left-32 w-[600px] h-[260px] bg-gradient-to-br from-[#8bf8c7]/40 via-[#4ceba1]/25 to-transparent rotate-[-22deg] blur-2xl" />
        <div className="absolute top-1/3 -right-32 w-[600px] h-[260px] bg-gradient-to-bl from-[#74f7bc]/35 via-[#4ceba1]/20 to-transparent rotate-[-22deg] blur-2xl" />
        <div className="absolute -bottom-24 -left-20 w-[550px] h-[260px] bg-gradient-to-tr from-[#32f59b]/35 to-transparent rotate-[-22deg] blur-2xl" />
      </div>

      {/* Main Handheld Frame matching Reference Mockup */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md flex flex-col gap-2 mx-auto">
        {/* ================= TOP TRAINER STATUS BAR ================= */}
        <div className="flex items-center justify-between px-1 gap-2">
          {/* Metallic Rank Badge (Left) */}
          <div
            className="bg-[#172027] text-white px-3 py-1 flex items-center gap-1.5 shadow-md border-r border-slate-700 shrink-0"
            style={{ clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)' }}
          >
            <span className="text-[#f5d433] text-xs font-black drop-shadow-xs">◆</span>
            <span className="text-white text-xs font-black font-mono tracking-wider">2</span>
          </div>

          {/* Center Pill: Trainer Name */}
          <div className="flex-1 max-w-[210px] bg-white rounded-full px-3 py-1 border border-slate-200/90 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-[#10b981] shrink-0 animate-pulse" />
              <span className="text-xs font-bold text-slate-800 lowercase truncate font-sans">
                {trainerName || 'blue'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 select-none ml-1">✎</span>
          </div>

          {/* Right Stars & Audio Toggle */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center text-[#f5d433] text-xs tracking-tighter drop-shadow-2xs">
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
            </div>
            <button
              type="button"
              onClick={handleToggleAudio}
              className="p-1 rounded-full text-slate-600 hover:text-slate-950 transition-colors cursor-pointer"
              title={muted ? 'Activar audio' : 'Silenciar audio'}
            >
              {muted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-600" />}
            </button>
          </div>
        </div>

        {/* ================= CARD 1: TOP POKÉMON ESSENTIALS BATTLE SCREEN ================= */}
        <div className="w-full bg-white rounded-2xl sm:rounded-3xl p-1.5 sm:p-2 shadow-xl border-2 border-white/80 overflow-hidden relative flex flex-col items-center">
          <div
            ref={containerRef}
            className="w-full flex items-center justify-center overflow-hidden rounded-xl bg-black relative"
            style={{ height: `${Math.round(NATIVE_HEIGHT * viewportScale)}px` }}
          >
            <div
              style={{
                width: `${Math.round(NATIVE_WIDTH * viewportScale)}px`,
                height: `${Math.round(NATIVE_HEIGHT * viewportScale)}px`,
                position: 'relative',
                overflow: 'hidden',
              }}
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
                {/* Battle Field (512 x 288) */}
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

                  {/* Opponent Animated Sprite (Front, Scale 2x) */}
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
                      key={`foe-${opponentSide.active_index}-${opponentActivePkmn.species}`}
                      species={opponentActivePkmn.species}
                      isBack={false}
                      showShadow={false}
                      isAttacking={activeAttacker === (isP1 ? 'p2' : 'p1')}
                      isHit={activeHitTarget === (isP1 ? 'p2' : 'p1')}
                      isFainted={opponentActivePkmn.is_fainted}
                      switchPhase={
                        switchingState && switchingState.side === (isP1 ? 'p2' : 'p1')
                          ? switchingState.phase
                          : null
                      }
                      status={opponentActivePkmn.status}
                      lowHp={opponentActivePkmn.current_hp <= opponentActivePkmn.max_hp / 4}
                      scale={2}
                    />
                  </div>

                  {/* Player Animated Sprite (Back, Scale 2.6x) */}
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
                      key={`player-${playerSide.active_index}-${playerActivePkmn.species}`}
                      species={playerActivePkmn.species}
                      isBack={true}
                      showShadow={false}
                      isAttacking={activeAttacker === (isP1 ? 'p1' : 'p2')}
                      isHit={activeHitTarget === (isP1 ? 'p1' : 'p2')}
                      isFainted={playerActivePkmn.is_fainted}
                      switchPhase={
                        switchingState && switchingState.side === (isP1 ? 'p1' : 'p2')
                          ? switchingState.phase
                          : null
                      }
                      status={playerActivePkmn.status}
                      lowHp={playerActivePkmn.current_hp <= playerActivePkmn.max_hp / 4}
                      scale={3.6}
                    />
                  </div>

                  {/* Official Attack Animations & Pokéball Throw/Burst Canvas */}
                  <BattleEffectOverlay effect={activeEffect} />

                  {/* Official Foe Databox (Top-Left, x:0 y:36) */}
                  <div
                    className="absolute"
                    style={{ left: '0px', top: '36px', zIndex: 20 }}
                  >
                    <PokemonStatusCard pokemon={opponentActivePkmn} isPlayer={false} />
                  </div>

                  {/* Opponent 6-Pokémon Party Pokéball Status Strip (below foe databox) */}
                  <div
                    className="absolute flex items-center gap-[2px] pointer-events-none pixelated"
                    style={{ left: '8px', top: '100px', zIndex: 20 }}
                  >
                    {Array.from({ length: 6 }).map((_, idx) => {
                      const foePkmn = opponentSide.team[idx];
                      const iconSrc = !foePkmn
                        ? '/battle-ui/ui/icon_ball_empty.png'
                        : foePkmn.is_fainted || foePkmn.current_hp <= 0
                        ? '/battle-ui/ui/icon_ball_faint.png'
                        : '/battle-ui/ui/icon_ball.png';
                      return (
                        <img
                          key={idx}
                          src={iconSrc}
                          alt={
                            !foePkmn
                              ? 'Vacío'
                              : foePkmn.is_fainted || foePkmn.current_hp <= 0
                              ? 'Debilitado'
                              : 'Activo'
                          }
                          draggable={false}
                          className="pixelated"
                          style={{ width: '24px', height: '24px' }}
                        />
                      );
                    })}
                  </div>

                  {/* Official Player Databox (Bottom-Right, x:252 y:192) */}
                  <div
                    className="absolute"
                    style={{ left: '252px', top: '192px', zIndex: 20 }}
                  >
                    <PokemonStatusCard pokemon={playerActivePkmn} isPlayer={true} />
                  </div>

                  {/* Clickable Enhanced Battle UI Menu Prompt: INFO [A] only */}
                  {!isWaitingForTurn && !battleState.is_game_over && (
                    <div
                      className="absolute pixelated overflow-hidden"
                      style={{
                        left: '0px',
                        top: '262px',
                        width: '164px',
                        height: '26px',
                        backgroundImage: 'url(/battle-ui/enhanced/menu_prompts.png)',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: `0px ${showMoves ? -52 : 0}px`,
                        zIndex: 26,
                      }}
                    >
                      {/* Top prompt: INFO [A] */}
                      <button
                        type="button"
                        title="Inspeccionar estadísticas (A)"
                        onClick={() => {
                          battleAudio.playSE('decision', 0.45);
                          setInfoMode('battler');
                        }}
                        className="absolute left-0 top-0 w-[110px] h-[26px] bg-transparent border-0 cursor-pointer"
                      >
                        <span
                          className="absolute font-pkmn font-bold pkmn-text-key leading-none"
                          style={{ left: '76px', top: '4px', fontSize: '20px' }}
                        >
                          A
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom HUD (512 x 96 at y:288) */}
                <div
                  className="absolute left-0"
                  style={{ top: '288px', zIndex: 30 }}
                >
                  <BattleActionPanel
                    activePokemon={playerActivePkmn}
                    messageBgUrl={theme.message}
                    showMoves={showMoves}
                    onShowMovesChange={(val) => {
                      setShowMoves(val);
                      if (!val) setInfoMode(null);
                    }}
                    onHoverMoveChange={setHoveredMoveIdx}
                    disabled={isWaitingForTurn || battleState.is_game_over || mustSwitch}
                    dialogueMessage={currentMessage}
                    onSelectMove={(moveIndex) =>
                      onSelectAction({ type: 'MOVE', move_index: moveIndex })
                    }
                    onOpenSwitch={() => setIsSwitchOpen(true)}
                    onForfeit={() => {
                      if (confirm('¿Estás seguro de que deseas abandonar este combate?')) {
                        onLeaveRoom();
                      }
                    }}
                  />
                </div>

                {/* Enhanced Info Overlay (A / S) */}
                <EnhancedInfoOverlay
                  mode={infoMode}
                  playerPokemon={playerActivePkmn}
                  opponentPokemon={opponentActivePkmn}
                  selectedMove={playerActivePkmn.moves[hoveredMoveIdx] || playerActivePkmn.moves[0]}
                  onClose={() => setInfoMode(null)}
                />

                {/* Official 512x384 Party Switch Screen */}
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
              </div>
            </div>
          </div>
        </div>

        {/* ================= CENTRAL CHAMFERED RIBBON (BLUE VS RED + PULSE WAVE) ================= */}
        <div
          className="w-full h-11 bg-gradient-to-r from-[#32f59b] via-[#2fe894] to-[#25db89] border-2 border-[#19c778] shadow-md flex items-center justify-between px-5 font-sans overflow-hidden cursor-default"
          style={{ clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)' }}
        >
          {/* Versus Text */}
          <span className="text-xl sm:text-2xl font-black italic tracking-wider text-slate-950 uppercase font-sans drop-shadow-xs">
            {versusText}
          </span>

          {/* Electrocardiogram Heartbeat Pulse SVG Line */}
          <div className="flex items-center text-white">
            <svg
              viewBox="0 0 60 24"
              className="w-12 h-6 stroke-white fill-none stroke-[3.5] stroke-linecap-round stroke-linejoin-round drop-shadow-xs"
            >
              <path d="M 0 12 L 15 12 L 20 4 L 28 20 L 34 8 L 38 14 L 42 12 L 60 12" />
            </svg>
          </div>
        </div>

        {/* ================= CARD 2: BOTTOM CARD (LIVE CHAT OR TACTICAL AI CARD) ================= */}
        <div className="w-full">
          {isAiMatch ? (
            /* AI / Tutorial Match: Chat is omitted as requested, replaced with Tactical Status */
            <div className="w-full bg-white rounded-2xl sm:rounded-3xl p-3 shadow-md border border-slate-200 flex flex-col justify-between h-[190px] sm:h-[220px]">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      ENTRENAMIENTO TÁCTICO VS IA
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                    TURNO {battleState.turn}
                  </span>
                </div>

                {/* Team Pokéball Status Indicators */}
                <div className="grid grid-cols-2 gap-2 mt-2.5">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">
                      Tu Equipo ({playerSide.team.filter((p) => !p.is_fainted).length}/6)
                    </span>
                    <div className="flex items-center gap-1">
                      {playerSide.team.map((p, idx) => (
                        <div
                          key={idx}
                          className={`w-3 h-3 rounded-full border ${
                            p.is_fainted
                              ? 'bg-slate-300 border-slate-400'
                              : idx === playerSide.active_index
                              ? 'bg-[#32f59b] border-emerald-600 ring-2 ring-emerald-300'
                              : 'bg-emerald-500 border-emerald-700'
                          }`}
                          title={`${p.name || p.species} (${p.current_hp}/${p.max_hp} HP)`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">
                      Rival IA ({opponentSide.team.filter((p) => !p.is_fainted).length}/6)
                    </span>
                    <div className="flex items-center gap-1">
                      {opponentSide.team.map((p, idx) => (
                        <div
                          key={idx}
                          className={`w-3 h-3 rounded-full border ${
                            p.is_fainted
                              ? 'bg-slate-300 border-slate-400'
                              : idx === opponentSide.active_index
                              ? 'bg-rose-500 border-rose-700 ring-2 ring-rose-300'
                              : 'bg-rose-400 border-rose-600'
                          }`}
                          title={p.is_fainted ? 'Debilitado' : 'En combate'}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Turn / Action Announcement */}
                <div className="mt-2.5 p-2 bg-slate-900 text-white rounded-xl text-xs font-mono flex items-center gap-2">
                  {isWaitingForTurn ? (
                    <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin shrink-0" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                  <span className="truncate text-[11px] text-slate-200">
                    {currentMessage || '¡Elige tu próximo movimiento táctico!'}
                  </span>
                </div>
              </div>

              {/* Tactical Tip */}
              <div className="text-[9px] text-slate-400 text-center font-sans">
                💡 Pulsa <kbd className="font-bold text-slate-600 bg-slate-200 px-1 rounded">A</kbd> para ver estadísticas o <kbd className="font-bold text-slate-600 bg-slate-200 px-1 rounded">S</kbd> para detalles de ataques.
              </div>
            </div>
          ) : (
            /* PvP Duel: In-game Live Chat matching Reference Mockup */
            <BattleChatCard
              messages={chatMessages}
              onSendMessage={onSendMessage || (() => {})}
              myRole={playerRole}
              myTrainerName={myName}
              opponentName={opponentName}
            />
          )}
        </div>

        {/* ================= BOTTOM CHAMFERED NAVIGATION DOCK (IMAGE 3) ================= */}
        <div className="grid grid-cols-4 gap-1.5 mt-0.5">
          {/* Tab 1: BE Black Active Tab */}
          <div
            onClick={onLeaveRoom}
            className="bg-[#12161b] text-white py-2 flex items-center justify-center gap-1 shadow-md border-t border-slate-700 cursor-pointer hover:bg-black transition-colors"
            style={{ clipPath: 'polygon(12% 0%, 100% 0%, 88% 100%, 0% 100%)' }}
            title="Volver a la Arena Principal"
          >
            <span className="text-xs font-black text-[#32f59b] font-mono tracking-tighter">
              BE
            </span>
            <div className="w-4 h-4 rounded-full bg-[#32f59b]/30 border border-[#32f59b] flex items-center justify-center text-[8px] text-white">
              ★
            </div>
          </div>

          {/* Tab 2: Gift / Rematch (Mint Green) */}
          <div
            onClick={onRematch}
            className="bg-[#83f8c3] hover:bg-[#72f5b6] active:scale-95 text-slate-900 py-2 flex items-center justify-center shadow-xs cursor-pointer transition-colors"
            style={{ clipPath: 'polygon(12% 0%, 100% 0%, 88% 100%, 0% 100%)' }}
            title="Solicitar Revancha"
          >
            <Gift className="w-4 h-4 text-slate-900" />
          </div>

          {/* Tab 3: Heartbeat / Audio Toggle (Mint Green) */}
          <div
            onClick={handleToggleAudio}
            className="bg-[#83f8c3] hover:bg-[#72f5b6] active:scale-95 text-slate-900 py-2 flex items-center justify-center shadow-xs cursor-pointer transition-colors"
            style={{ clipPath: 'polygon(12% 0%, 100% 0%, 88% 100%, 0% 100%)' }}
            title={muted ? 'Activar BGM/Audio' : 'Silenciar BGM/Audio'}
          >
            <Activity className="w-4 h-4 text-slate-900" />
          </div>

          {/* Tab 4: Settings / Theme Selector (Mint Green) */}
          <div
            onClick={() => setShowSettingsModal(true)}
            className="bg-[#83f8c3] hover:bg-[#72f5b6] active:scale-95 text-slate-900 py-2 flex items-center justify-center shadow-xs cursor-pointer transition-colors"
            style={{ clipPath: 'polygon(12% 0%, 100% 0%, 88% 100%, 0% 100%)' }}
            title="Ajustes de Combate"
          >
            <Settings className="w-4 h-4 text-slate-900" />
          </div>
        </div>
      </div>

      {/* Settings Modal (Theme cycle, audio, forfeit) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="relative w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Ajustes de Combate
              </h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  cycleTheme();
                }}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Map className="w-4 h-4 text-emerald-600" />
                  <span>Cambiar Fondo ({theme.label})</span>
                </div>
                <span className="text-[10px] text-slate-500">▶</span>
              </button>

              <button
                type="button"
                onClick={handleToggleAudio}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {muted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
                  <span>{muted ? 'Activar Música' : 'Silenciar Música'}</span>
                </div>
                <span className="text-[10px] text-slate-500">{muted ? 'OFF' : 'ON'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSettingsModal(false);
                  if (confirm('¿Deseas retirarte de este combate?')) {
                    onLeaveRoom();
                  }
                }}
                className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 rounded-xl text-xs font-bold text-rose-700 flex items-center justify-between cursor-pointer border border-rose-200"
              >
                <div className="flex items-center gap-2">
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Abandonar Combate</span>
                </div>
                <span className="text-[10px] text-rose-400">✕</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victory / Defeat Modal */}
      {battleState.is_game_over && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-gradient-to-b from-zinc-100 to-zinc-300 border-4 border-zinc-800 rounded-3xl p-6 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-amber-400 border-2 border-zinc-800 flex items-center justify-center shadow-md">
              <Trophy className={`w-8 h-8 ${isWinner ? 'text-amber-950' : 'text-zinc-600'}`} />
            </div>

            <h2 className="text-2xl font-bold font-pkmn uppercase tracking-wider mb-2 text-zinc-900">
              {isWinner ? '¡VICTORIA!' : '¡DERROTA!'}
            </h2>
            <p className="text-base text-zinc-700 font-pkmn leading-snug mb-6">
              {isWinner
                ? '¡Todos los Pokémon rivales fueron derrotados!'
                : '¡Todos tus Pokémon se han debilitado!'}
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onRematch}
                className="w-full py-2.5 rounded-full bg-gradient-to-b from-[#f25d5d] to-[#c42828] border-2 border-white font-pkmn text-lg font-bold text-white uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                Revancha
              </button>
              <button
                type="button"
                onClick={onLeaveRoom}
                className="w-full py-2 rounded-full bg-zinc-700 hover:bg-zinc-800 font-pkmn text-base text-white transition-colors cursor-pointer"
              >
                Volver al Lobby
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};