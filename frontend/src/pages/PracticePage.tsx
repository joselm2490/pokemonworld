import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BattleArena } from '../components/battle/BattleArena';
import { useBattle } from '../hooks/useBattle';
import { AuthService } from '../services/authService';
import { Bot, ArrowLeft, AlertCircle } from 'lucide-react';
import { PokeballLoader } from '../components/common/PokeballLoader';

const PracticeBattleView: React.FC<{ team: string[]; trainerName: string }> = ({ team, trainerName }) => {
  const navigate = useNavigate();
  const [matchId, setMatchId] = useState(() => 'PRACTICE-' + Math.floor(1000 + Math.random() * 9000));

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
      <div className="min-h-screen bg-[#f2f4f7] flex flex-col items-center justify-center p-4 text-slate-800 font-sans">
        <div className="flex flex-col items-center gap-3">
          <Bot className="w-12 h-12 text-emerald-600 animate-bounce" />
          <h2 className="text-xl font-black uppercase tracking-wider text-slate-900">
            Iniciando Combate 6 vs 6 (IA)
          </h2>
          <p className="text-xs text-slate-500">
            Cargando la Arena de Entrenamiento con tu equipo líder...
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold uppercase rounded-xl transition-colors flex items-center gap-2 border border-slate-300 shadow-sm cursor-pointer"
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
      trainerName={trainerName}
      onSelectAction={battle.selectAction}
      onSwitchFainted={battle.switchFainted}
      onRematch={handleRematch}
      onLeaveRoom={handleLeave}
    />
  );
};

export const PracticePage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();

  const [team, setTeam] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pokemon_user_team');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length <= 6) {
          return parsed;
        }
      }
    } catch {}
    return ['CHARIZARD', 'PIKACHU', 'BLASTOISE', 'LUCARIO', 'GENGAR', 'GARCHOMP'];
  });
  const [syncingTeam, setSyncingTeam] = useState<boolean>(Boolean(currentUser));

  useEffect(() => {
    if (currentUser) {
      AuthService.syncActiveTeam()
        .then((synced) => {
          if (synced) setTeam(synced);
        })
        .finally(() => setSyncingTeam(false));
    }
  }, []);

  if (syncingTeam) {
    return (
      <div className="min-h-screen bg-[#f2f4f7] flex flex-col items-center justify-center p-4 text-slate-800 font-sans">
        <PokeballLoader size="lg" />
      </div>
    );
  }

  if (team.length !== 6) {
    return (
      <div className="min-h-screen bg-[#f2f4f7] flex flex-col items-center justify-center p-4 text-slate-800 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl border-2 border-amber-300 shadow-xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black uppercase tracking-wider text-slate-900">
            Equipo Líder Incompleto ({team.length}/6)
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Debes completar tu equipo líder con 6 Pokémon para poder hacer duelos en Salas o Práctica.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Lobby y Completar Equipo</span>
          </button>
        </div>
      </div>
    );
  }

  return <PracticeBattleView team={team} trainerName={currentUser?.username || 'blue'} />;
};
