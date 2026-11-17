import React, { useState } from 'react';
import { BattleState } from '../../types/pokemon';
import { AnimatedPokemonSprite } from './AnimatedPokemonSprite';
import { PokemonStatusCard } from './PokemonStatusCard';
import { BattleActionPanel } from './BattleActionPanel';
import { SwitchModal } from './SwitchModal';
import { Trophy, Home } from 'lucide-react';

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

  const isP1 = playerRole === 'p1';
  const playerSide = isP1 ? battleState.p1 : battleState.p2;
  const opponentSide = isP1 ? battleState.p2 : battleState.p1;

  const playerActivePkmn = playerSide.team[playerSide.active_index];
  const opponentActivePkmn = opponentSide.team[opponentSide.active_index];

  const mustSwitch = playerActivePkmn.is_fainted && !battleState.is_game_over;
  const isWinner = battleState.winner === playerRole;

  return (
    <div className="relative w-full h-[100dvh] flex flex-col justify-between overflow-hidden select-none bg-black">
      {/* ================= AUTHENTIC BATTLE SCENE FIELD (IMAGES 2, 3, 4, 5) ================= */}
      <div className="relative flex-1 w-full overflow-hidden flex flex-col justify-between">
        {/* Sky Gradient (Mint-Cyan to Pale Horizon) */}
        <div className="absolute inset-x-0 top-0 h-[48%] bg-gradient-to-b from-[#4bb896] via-[#75d4b1] to-[#b8f0d5]" />

        {/* Grass Field (Horizon to Foreground) */}
        <div className="absolute inset-x-0 top-[48%] bottom-0 bg-gradient-to-b from-[#76cb52] via-[#5db839] to-[#429a24]" />

        {/* Subtle horizontal scanline / atmospheric stripes */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.03)_51%)] bg-[length:100%_4px] pointer-events-none" />

        {/* Top Minimal Room Pill (Discreet, authentic) */}
        <div className="absolute top-2 right-3 z-30 flex items-center gap-2 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/20">
          <button
            onClick={onLeaveRoom}
            className="text-[9px] font-game text-zinc-300 hover:text-white flex items-center gap-1 transition-colors"
          >
            <Home className="w-3 h-3" />
            <span>Lobby</span>
          </button>
          <span className="text-white/40 text-[9px]">•</span>
          <span className="text-[9px] font-game text-amber-300">
            {roomCode}
          </span>
        </div>

        {/* ================= OPPONENT STAGE (TOP-RIGHT) ================= */}
        {/* Opponent Databox (Top-Left, Slanted) */}
        <div className="relative z-20 pt-3 pl-3 sm:pt-5 sm:pl-6 self-start">
          <PokemonStatusCard
            pokemon={opponentActivePkmn}
            isPlayer={false}
          />
        </div>

        {/* Opponent Circular Platform & Sprite */}
        <div className="absolute top-[28%] right-[10%] sm:right-[15%] md:right-[20%] z-10 flex flex-col items-center">
          {/* Opponent Base (Circular Grass + Dirt Rim, Image 4) */}
          <div className="relative w-52 sm:w-64 h-20 sm:h-24">
            {/* Dirt / Soil Lower Rim */}
            <div className="absolute inset-x-0 bottom-0 h-10 rounded-[100%] bg-gradient-to-b from-[#875529] via-[#6d401a] to-[#45240c] border-2 border-[#361a06] shadow-2xl" />
            {/* Top Grass Surface */}
            <div className="absolute inset-x-1.5 top-0 h-16 rounded-[100%] bg-gradient-to-b from-[#8ce85c] via-[#68be3a] to-[#4ea028] border-2 border-[#347818]" />
            {/* Soft inner highlight */}
            <div className="absolute inset-x-6 top-2 h-10 rounded-[100%] bg-[#a4f276]/30 blur-[1px]" />
          </div>

          {/* Opponent Animated Sprite (Positioned right on top of base) */}
          <div className="absolute bottom-8 z-15">
            <AnimatedPokemonSprite
              species={opponentActivePkmn.species}
              isBack={false}
              isAttacking={activeAttacker === (isP1 ? 'p2' : 'p1')}
              isHit={activeHitTarget === (isP1 ? 'p2' : 'p1')}
              isFainted={opponentActivePkmn.is_fainted}
              scale={2.6}
            />
          </div>
        </div>

        {/* ================= PLAYER STAGE (BOTTOM-LEFT) ================= */}
        {/* Player Lush Grass Ridge (Extending from bottom-left corner, Image 4) */}
        <div className="absolute bottom-0 left-0 w-[60%] sm:w-[50%] h-32 sm:h-36 z-10 pointer-events-none">
          {/* Jagged Grass Bank */}
          <div className="w-full h-full bg-gradient-to-t from-[#3d9120] via-[#52ab30] to-[#70c746] rounded-tr-[120px] border-t-3 border-r-3 border-[#286a14] shadow-xl relative overflow-hidden">
            {/* Grass texture tufts */}
            <div className="absolute -top-1 left-8 w-4 h-3 bg-[#88db58] rotate-45" />
            <div className="absolute -top-1 left-20 w-4 h-3 bg-[#88db58] rotate-45" />
            <div className="absolute -top-1 left-36 w-5 h-3 bg-[#88db58] rotate-45" />
            <div className="absolute -top-1 left-52 w-4 h-3 bg-[#88db58] rotate-45" />
          </div>
        </div>

        {/* Authentic Left Badges: INFO [A], MOVE [S] (Image 4 & 5) */}
        <div className="absolute bottom-4 left-3 z-20 flex flex-col gap-1 font-game text-[9px]">
          <div className="bg-black/90 px-1.5 py-0.5 rounded-xs border border-zinc-700 flex items-center gap-1 shadow-md">
            <span className="text-[#f8b820] font-bold">INFO</span>
            <span className="text-white font-bold">[A]</span>
          </div>
          <div className="bg-black/90 px-1.5 py-0.5 rounded-xs border border-zinc-700 flex items-center gap-1 shadow-md">
            <span className="text-[#f8b820] font-bold">BALL</span>
            <span className="text-white font-bold">[S]</span>
          </div>
        </div>

        {/* Player Animated Sprite (Back View, anchored on the bottom-left grass ridge) */}
        <div className="absolute bottom-0 left-[8%] sm:left-[12%] md:left-[16%] z-15">
          <AnimatedPokemonSprite
            species={playerActivePkmn.species}
            isBack={true}
            isAttacking={activeAttacker === (isP1 ? 'p1' : 'p2')}
            isHit={activeHitTarget === (isP1 ? 'p1' : 'p2')}
            isFainted={playerActivePkmn.is_fainted}
            scale={3.2}
          />
        </div>

        {/* Player Databox (Bottom-Right, Slanted) */}
        <div className="relative z-20 pb-4 pr-3 sm:pb-6 sm:pr-6 self-end">
          <PokemonStatusCard
            pokemon={playerActivePkmn}
            isPlayer={true}
          />
        </div>
      </div>

      {/* ================= AUTHENTIC BOTTOM HUD (IMAGES 4 & 5) ================= */}
      <div className="relative z-30">
        <BattleActionPanel
          activePokemon={playerActivePkmn}
          disabled={isWaitingForTurn || battleState.is_game_over || mustSwitch}
          dialogueMessage={currentMessage}
          onSelectMove={(moveIndex) => onSelectAction({ type: 'MOVE', move_index: moveIndex })}
          onOpenSwitch={() => setIsSwitchOpen(true)}
          onForfeit={() => {
            if (confirm("Are you sure you want to forfeit this battle?")) {
              onLeaveRoom();
            }
          }}
        />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-gradient-to-b from-zinc-100 to-zinc-300 border-4 border-zinc-800 rounded-2xl p-6 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-amber-400 border-2 border-zinc-800 flex items-center justify-center shadow-md">
              <Trophy className={`w-8 h-8 ${isWinner ? 'text-amber-950' : 'text-zinc-600'}`} />
            </div>

            <h2 className="text-lg font-bold font-game uppercase tracking-wider mb-2 text-zinc-900">
              {isWinner ? 'YOU WON!' : 'YOU LOST!'}
            </h2>
            <p className="text-xs text-zinc-700 font-game leading-relaxed mb-6">
              {isWinner
                ? 'All opposing Pokémon were defeated!'
                : 'All your Pokémon fainted!'}
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={onRematch}
                className="w-full py-3 rounded-full bg-gradient-to-b from-[#f25d5d] to-[#c42828] border-2 border-white font-game text-xs text-white uppercase tracking-widest shadow-md hover:brightness-110 active:scale-95 transition-all"
              >
                Rematch
              </button>
              <button
                onClick={onLeaveRoom}
                className="w-full py-2.5 rounded-full bg-zinc-700 hover:bg-zinc-800 font-game text-[10px] text-white transition-colors"
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
