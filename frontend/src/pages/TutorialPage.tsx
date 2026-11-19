import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BattleArena } from '../components/battle/BattleArena';
import { useBattle } from '../hooks/useBattle';
import { BookOpen, ArrowLeft, Lightbulb, Zap, ShieldCheck } from 'lucide-react';

export const TutorialPage: React.FC = () => {
  const navigate = useNavigate();
  const [matchId, setMatchId] = useState(() => 'TUTORIAL-' + Math.floor(1000 + Math.random() * 9000));
  const [showTips, setShowTips] = useState(true);

  // Default balanced 6-Pokemon team for tutorial
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
    return ['CHARIZARD', 'BLASTOISE', 'VENUSAUR', 'PIKACHU', 'LUCARIO', 'GENGAR'];
  });

  const battle = useBattle({
    roomCode: matchId,
    isAi: true,
    playerRole: 'p1',
    customTeam: team,
  });

  const handleRematch = () => {
    setMatchId('TUTORIAL-' + Math.floor(1000 + Math.random() * 9000));
  };

  const handleLeave = () => {
    navigate('/');
  };

  if (!battle.battleState) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <BookOpen className="w-12 h-12 text-amber-400 animate-pulse" />
          <h2 className="text-xl font-black uppercase tracking-wider">
            Cargando Duelo Tutorial (6 vs IA)
          </h2>
          <p className="text-xs text-slate-400">
            Preparando simulación táctica guiada...
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
    <div className="relative min-h-screen">
      {/* Tutorial Guidance Drawer / Banner */}
      {showTips && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-xl bg-slate-900/95 border-2 border-amber-400 text-white rounded-2xl p-3 shadow-2xl backdrop-blur-md animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-300">
                Guía Táctica: Duelo 6 vs IA
              </h3>
            </div>
            <button
              onClick={() => setShowTips(false)}
              className="text-xs text-slate-400 hover:text-white font-bold px-2 py-0.5 rounded-md hover:bg-slate-800 cursor-pointer"
            >
              ✕ Entendido
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[10px] text-slate-300">
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="font-bold text-amber-400 block mb-0.5">1. Ventajas de Tipo</span>
              Usa ataques supereficaces (x2 / x4 de daño). Revisa los tipos de tu rival en su barra de estado.
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="font-bold text-emerald-400 block mb-0.5">2. Cambio Táctico</span>
              Si estás en desventaja, usa el botón "CAMBIAR" para enviar a un Pokémon que resista el daño.
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="font-bold text-sky-400 block mb-0.5">3. Veredicto Final</span>
              El primer entrenador que debilite a los 6 Pokémon del rival se lleva la victoria de la Arena.
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};
