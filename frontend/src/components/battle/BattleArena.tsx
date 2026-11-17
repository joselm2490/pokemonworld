import React, { useState } from 'react';
import { BattleState, BattleEvent } from '../../types/pokemon';
import { AnimatedPokemonSprite } from './AnimatedPokemonSprite';
import { PokemonStatusCard } from './PokemonStatusCard';
import { BattleActionPanel } from './BattleActionPanel';
import { SwitchModal } from './SwitchModal';
import { Trophy, RefreshCw, Home } from 'lucide-react';

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

  // Determine Player vs Opponent sides
  const isP1 = playerRole === 'p1';
  const playerSide = isP1 ? battleState.p1 : battleState.p2;
  const opponentSide = isP1 ? battleState.p2 : battleState.p1;

  const playerActivePkmn = playerSide.team[playerSide.active_index];
  const opponentActivePkmn = opponentSide.team[opponentSide.active_index];

  const mustSwitch = playerActivePkmn.is_fainted && !battleState.is_game_over;

  const isWinner = battleState.winner === playerRole;

  return (
    <div className="relative w-full h-[100dvh] flex flex-col justify-between overflow-hidden bg-gradient-to-b from-sky-900 via-indigo-950 to-slate-950 select-none">
      {/* Top Navigation Bar with Room & Status */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-2.5 bg-slate-950/70 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onLeaveRoom}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Lobby</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-game">Room:</span>
            <span className="text-xs font-mono font-bold text-amber-400 tracking-wider bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {roomCode}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-300">
            Turn {battleState.turn}
          </span>
          {isWaitingForTurn && (
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-blue-400 bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-800 animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Waiting for Opponent...
            </span>
          )}
        </div>
      </div>

      {/* Main 3D Battlefield Arena */}
      <div className="relative flex-1 w-full max-w-5xl mx-auto flex flex-col justify-between p-4 pt-14 pb-2">
        {/* Opponent Area (Top Right) */}
        <div className="relative flex flex-col md:flex-row items-center justify-between w-full mt-4">
          {/* Opponent Status Card (Top Left) */}
          <div className="self-start md:self-auto mb-2 md:mb-0">
            <PokemonStatusCard
              pokemon={opponentActivePkmn}
              isPlayer={false}
              party={opponentSide.team}
            />
          </div>

          {/* Opponent Platform & Sprite (Top Right) */}
          <div className="relative flex flex-col items-center justify-center mr-0 md:mr-12">
            {/* Battle Platform (Opponent) */}
            <div className="w-56 h-20 bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 rounded-[100%] border-4 border-emerald-950 shadow-2xl transform rotate-x-60 -mb-10 scale-90" />
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

        {/* Player Area (Bottom Left) */}
        <div className="relative flex flex-col-reverse md:flex-row items-center justify-between w-full mb-2">
          {/* Player Platform & Sprite (Bottom Left - Back View) */}
          <div className="relative flex flex-col items-center justify-center ml-0 md:ml-12">
            {/* Battle Platform (Player) */}
            <div className="w-72 h-28 bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-800 rounded-[100%] border-4 border-emerald-950 shadow-2xl transform rotate-x-60 -mb-14" />
            <AnimatedPokemonSprite
              species={playerActivePkmn.species}
              isBack={true}
              isAttacking={activeAttacker === (isP1 ? 'p1' : 'p2')}
              isHit={activeHitTarget === (isP1 ? 'p1' : 'p2')}
              isFainted={playerActivePkmn.is_fainted}
              scale={3.0}
            />
          </div>

          {/* Player Status Card (Bottom Right) */}
          <div className="self-end md:self-auto mb-2 md:mb-0">
            <PokemonStatusCard
              pokemon={playerActivePkmn}
              isPlayer={true}
              party={playerSide.team}
            />
          </div>
        </div>
      </div>

      {/* Battle Narrative Dialogue Bar */}
      <div className="w-full bg-slate-950/90 border-t-2 border-slate-800 py-3 px-6 shadow-inner">
        <div className="max-w-4xl mx-auto flex items-center min-h-[36px]">
          <p className="font-game text-xs md:text-sm text-slate-100 tracking-wide leading-relaxed text-shadow-sm">
            {currentMessage || `What will ${playerActivePkmn.name} do?`}
          </p>
        </div>
      </div>

      {/* Action Controls Panel */}
      <BattleActionPanel
        activePokemon={playerActivePkmn}
        disabled={isWaitingForTurn || battleState.is_game_over || mustSwitch}
        onSelectMove={(moveIndex) => onSelectAction({ type: 'MOVE', move_index: moveIndex })}
        onOpenSwitch={() => setIsSwitchOpen(true)}
        onForfeit={() => {
          if (confirm("Are you sure you want to forfeit this match?")) {
            onLeaveRoom();
          }
        }}
      />

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

      {/* Game Over Victory / Defeat Modal */}
      {battleState.is_game_over && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-slate-900 border-2 border-slate-700 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center">
              <Trophy className={`w-10 h-10 ${isWinner ? 'text-amber-400' : 'text-slate-400'}`} />
            </div>

            <h2 className="text-2xl font-bold font-game uppercase tracking-wider mb-2 text-white">
              {isWinner ? 'Victory!' : 'Defeated!'}
            </h2>
            <p className="text-sm text-slate-300 mb-6">
              {isWinner
                ? 'Congratulations! You defeated the opposing trainer!'
                : 'All your Pokémon fainted! Better luck next time!'}
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={onRematch}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 font-game text-xs text-white uppercase tracking-wider shadow-lg active:scale-95 transition-all"
              >
                Rematch
              </button>
              <button
                onClick={onLeaveRoom}
                className="w-full py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
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

