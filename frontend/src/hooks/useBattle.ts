import { useState, useEffect, useRef } from 'react';
import { BattleState, BattleEvent } from '../types/pokemon';

interface UseBattleProps {
  roomCode: string;
  isAi: boolean;
  playerRole: 'p1' | 'p2';
  customTeam: string[];
}

export const useBattle = ({ roomCode, isAi, playerRole, customTeam }: UseBattleProps) => {
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [isWaitingForTurn, setIsWaitingForTurn] = useState<boolean>(false);
  const [activeAttacker, setActiveAttacker] = useState<'p1' | 'p2' | null>(null);
  const [activeHitTarget, setActiveHitTarget] = useState<'p1' | 'p2' | null>(null);

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Determine backend WebSocket host
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use window.location.host for dev proxy, or environment variable for production (e.g. Render backend)
    const backendPort = import.meta.env.VITE_BACKEND_PORT || '8080';
    const backendHost = import.meta.env.VITE_BACKEND_WS_URL || `${wsProtocol}//${window.location.hostname}:${backendPort}`;
    const socketUrl = `${backendHost}/ws/battle/${roomCode}/`;

    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: 'JOIN_ROOM',
          player_name: playerRole === 'p1' ? 'Trainer 1' : 'Trainer 2',
          player_role: playerRole,
          is_ai: isAi,
          team: customTeam,
        })
      );
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'BATTLE_INIT') {
          setBattleState(data.state);
          setIsWaitingForTurn(false);
          setCurrentMessage(`Battle started in Room ${roomCode}!`);
        } else if (data.type === 'TURN_RESOLVED') {
          setIsWaitingForTurn(false);
          await playTurnSequence(data.events, data.state);
        } else if (data.type === 'FAINT_SWITCH_RESOLVED') {
          setBattleState(data.state);
          setCurrentMessage(data.message || 'Pokémon switched!');
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    };

    socket.onerror = (err) => {
      console.warn('WebSocket connection error, starting local battle mode...', err);
      // Fallback local simulation state if backend is disconnected
      initLocalFallback();
    };

    return () => {
      socket.close();
    };
  }, [roomCode, isAi, playerRole]);

  // Sequence playback with delays for authentic Pokémon turn pacing
  const playTurnSequence = async (events: BattleEvent[], finalState: BattleState) => {
    for (const ev of events) {
      if (ev.type === 'SWITCH') {
        setCurrentMessage(ev.message || '');
        await delay(1200);
      } else if (ev.type === 'ATTACK') {
        setActiveAttacker(ev.actor || null);
        setCurrentMessage(ev.message || '');
        await delay(600);
        setActiveAttacker(null);
      } else if (ev.type === 'DAMAGE') {
        setActiveHitTarget(ev.target || null);
        if (ev.message) {
          setCurrentMessage(ev.message);
        }
        await delay(800);
        setActiveHitTarget(null);
      } else if (ev.type === 'MISS') {
        setCurrentMessage(ev.message || 'Attack missed!');
        await delay(900);
      } else if (ev.type === 'FAINT') {
        setCurrentMessage(ev.message || 'Pokémon fainted!');
        await delay(1200);
      } else if (ev.type === 'GAME_OVER') {
        setCurrentMessage(ev.message || 'Match finished!');
        await delay(1500);
      }
    }
    setBattleState(finalState);
  };

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const selectAction = (action: { type: 'MOVE'; move_index: number } | { type: 'SWITCH'; target_index: number }) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      // Fallback local action
      return;
    }
    setIsWaitingForTurn(true);
    socketRef.current.send(
      JSON.stringify({
        type: 'SUBMIT_ACTION',
        player: playerRole,
        action,
      })
    );
  };

  const switchFainted = (targetIndex: number) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(
      JSON.stringify({
        type: 'SWITCH_FAINTED',
        player: playerRole,
        target_index: targetIndex,
      })
    );
  };

  const rematch = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(
      JSON.stringify({
        type: 'REMATCH',
      })
    );
  };

  const initLocalFallback = () => {
    // Creates a standalone state so the UI never crashes even if network is offline
    const p1Team = [
      {
        species: 'CHARIZARD',
        name: 'Charizard',
        types: ['FIRE', 'FLYING'] as any,
        level: 50,
        max_hp: 164,
        current_hp: 164,
        stats: { hp: 164, attack: 104, defense: 98, sp_attack: 129, sp_defense: 105, speed: 120 },
        moves: [
          { name: 'Flamethrower', type: 'FIRE', category: 'SPECIAL', power: 90, accuracy: 100, pp: 15, current_pp: 15 },
          { name: 'Air Slash', type: 'FLYING', category: 'SPECIAL', power: 75, accuracy: 95, pp: 15, current_pp: 15 },
          { name: 'Dragon Pulse', type: 'DRAGON', category: 'SPECIAL', power: 85, accuracy: 100, pp: 10, current_pp: 10 },
          { name: 'Solar Beam', type: 'GRASS', category: 'SPECIAL', power: 120, accuracy: 100, pp: 10, current_pp: 10 },
        ],
        status: null,
        is_fainted: false,
      },
    ];

    const p2Team = [
      {
        species: 'BLASTOISE',
        name: 'Blastoise',
        types: ['WATER'] as any,
        level: 50,
        max_hp: 165,
        current_hp: 165,
        stats: { hp: 165, attack: 103, defense: 120, sp_attack: 105, sp_defense: 125, speed: 98 },
        moves: [
          { name: 'Hydro Pump', type: 'WATER', category: 'SPECIAL', power: 110, accuracy: 80, pp: 5, current_pp: 5 },
          { name: 'Ice Beam', type: 'ICE', category: 'SPECIAL', power: 90, accuracy: 100, pp: 10, current_pp: 10 },
          { name: 'Flash Cannon', type: 'STEEL', category: 'SPECIAL', power: 80, accuracy: 100, pp: 10, current_pp: 10 },
          { name: 'Surf', type: 'WATER', category: 'SPECIAL', power: 90, accuracy: 100, pp: 15, current_pp: 15 },
        ],
        status: null,
        is_fainted: false,
      },
    ];

    setBattleState({
      turn: 1,
      is_game_over: false,
      winner: null,
      p1: { name: 'Player 1', active_index: 0, team: p1Team as any },
      p2: { name: 'AI Opponent', active_index: 0, team: p2Team as any },
    });
    setCurrentMessage('Local offline simulation active.');
  };

  return {
    battleState,
    currentMessage,
    isWaitingForTurn,
    activeAttacker,
    activeHitTarget,
    selectAction,
    switchFainted,
    rematch,
  };
};

