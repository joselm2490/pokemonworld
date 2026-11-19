import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BattleArena } from '../components/battle/BattleArena';
import { useBattle } from '../hooks/useBattle';
import { Bot, ArrowLeft } from 'lucide-react';

export const PracticePage: React.FC = () => {
  const navigate = useNavigate();
  const [matchId, setMatchId] = useState(() => 'PRACTICE-' + Math.floor(1000 + Math.random() * 9000));

  // Retrieve user's active team (6 Pokemon)
  const [team] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pokemon_user_team');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 6);
        }
      }
    } catch {}
    return ['CHARIZARD', 'PIKACHU', 'BLASTOISE', 'LUCARIO', 'GENGAR', 'GARCHOMP'];
  });

  const battle = useBattle({
    roomCode: matchId,
    isAi: true,
    playerRole: 'p1',
    customTeam: team,
  });

  const handleRematch = () => {
    setMatchId('PRACTICE-' + Math.floor(1000 + Math.random() * 9000));
  };

  const handleLeave = () => {
    navigate('/');
  };

  if (!battle.battleState) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <Bot className="w-12 h-12 text-emerald-400 animate-bounce" />
          <h2 className="text-xl font-black uppercase tracking-wider">
            Iniciando Combate 6 vs 6 (IA)
          </h2>
          <p className="text-xs text-slate-400">
            Cargando la Arena de Entrenamiento con tu equipo activo...
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold uppercase rounded-xl transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancelar y Volver</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <BattleArena
      battleState={battle.battleState}
      playerRole="p1"
      isAiMatch={true}
      roomCode={matchId}
      currentMessage={battle.currentMessage}
      isWaitingForTurn={battle.isWaitingForTurn}
      activeAttacker={battle.activeAttacker}
      activeHitTarget={battle.activeHitTarget}
      activeEffect={battle.activeEffect}
      switchingState={battle.switchingState}
      onSelectAction={battle.selectAction}
      onSwitchFainted={battle.switchFainted}
      onRematch={handleRematch}
      onLeaveRoom={handleLeave}
    />
  );
};
