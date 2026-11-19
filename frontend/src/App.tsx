import React, { useState } from 'react';
import { Lobby } from './components/matchmaking/Lobby';
import { TeamBuilder } from './components/team/TeamBuilder';
import { BattleArena } from './components/battle/BattleArena';
import { PokedexView } from './components/pokedex/PokedexView';
import { MovesCatalog } from './components/moves/MovesCatalog';
import { useBattle } from './hooks/useBattle';

type AppView = 'lobby' | 'team-builder' | 'battle' | 'pokedex' | 'moves';

export const App: React.FC = () => {
  const [view, setView] = useState<AppView>('lobby');
  const [selectedTeam, setSelectedTeam] = useState<string[]>(() => {
    const saved = localStorage.getItem('pokemon_user_team');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 1 && parsed.length <= 6) {
          return parsed;
        }
      } catch {}
    }
    return [
      'CHARIZARD',
      'PIKACHU',
      'BLASTOISE',
      'LUCARIO',
      'GENGAR',
      'GARCHOMP',
    ];
  });

  const handleUpdateTeam = (newTeam: string[]) => {
    if (!newTeam || newTeam.length < 1) return;
    const bounded = newTeam.slice(0, 6);
    setSelectedTeam(bounded);
    localStorage.setItem('pokemon_user_team', JSON.stringify(bounded));
  };

  const [activeMatch, setActiveMatch] = useState<{
    roomCode: string;
    isAi: boolean;
    role: 'p1' | 'p2';
  } | null>(null);

  const battle = useBattle({
    roomCode: activeMatch?.roomCode || '',
    isAi: activeMatch?.isAi || false,
    playerRole: activeMatch?.role || 'p1',
    customTeam: selectedTeam,
  });

  const handleStartMatch = (roomCode: string, isAi: boolean, role: 'p1' | 'p2') => {
    setActiveMatch({ roomCode, isAi, role });
    setView('battle');
  };

  const handleLeaveBattle = () => {
    setActiveMatch(null);
    setView('lobby');
  };

  if (view === 'pokedex') {
    return <PokedexView onBack={() => setView('lobby')} />;
  }

  if (view === 'moves') {
    return <MovesCatalog onBack={() => setView('lobby')} />;
  }

  if (view === 'team-builder') {
    return (
      <TeamBuilder
        selectedTeam={selectedTeam}
        onSaveTeam={handleUpdateTeam}
        onBack={() => setView('lobby')}
      />
    );
  }

  if (view === 'battle' && activeMatch && battle.battleState) {
    return (
      <BattleArena
        battleState={battle.battleState}
        playerRole={activeMatch.role}
        isAiMatch={activeMatch.isAi}
        roomCode={activeMatch.roomCode}
        currentMessage={battle.currentMessage}
        isWaitingForTurn={battle.isWaitingForTurn}
        activeAttacker={battle.activeAttacker}
        activeHitTarget={battle.activeHitTarget}
        activeEffect={battle.activeEffect}
        switchingState={battle.switchingState}
        onSelectAction={battle.selectAction}
        onSwitchFainted={battle.switchFainted}
        onRematch={battle.rematch}
        onLeaveRoom={handleLeaveBattle}
      />
    );
  }

  return (
    <Lobby
      selectedTeam={selectedTeam}
      onUpdateTeam={handleUpdateTeam}
      onOpenTeamBuilder={() => setView('team-builder')}
      onOpenPokedex={() => setView('pokedex')}
      onOpenMoves={() => setView('moves')}
      onStartMatch={handleStartMatch}
    />
  );
};

export default App;
