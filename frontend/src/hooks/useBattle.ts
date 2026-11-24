import { useState, useEffect, useRef } from 'react';
import { BattleState, BattleEvent } from '../types/pokemon';
import { ActiveEffect } from '../components/battle/BattleEffectOverlay';
import { battleAudio } from '../utils/battleAudio';
import { battleLogger } from '../utils/logger';
import { preloadBattleAssets } from '../utils/battlePreloader';
import { AuthService } from '../services/authService';

interface UseBattleProps {
  roomCode: string;
  isAi: boolean;
  playerRole: 'p1' | 'p2';
  customTeam: string[];
}

export interface BattleChatMessage {
  id: string;
  sender: string;
  message: string;
  playerRole: 'p1' | 'p2';
  timestamp: string;
}

export const useBattle = ({ roomCode, isAi, playerRole, customTeam }: UseBattleProps) => {
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [isWaitingForTurn, setIsWaitingForTurn] = useState<boolean>(false);
  const [activeAttacker, setActiveAttacker] = useState<'p1' | 'p2' | null>(null);
  const [activeHitTarget, setActiveHitTarget] = useState<'p1' | 'p2' | null>(null);
  const [activeEffect, setActiveEffect] = useState<ActiveEffect | null>(null);
  const [chatMessages, setChatMessages] = useState<BattleChatMessage[]>([]);
  const [switchingState, setSwitchingState] = useState<{
    side: 'p1' | 'p2';
    phase: 'recalling' | 'sending';
  } | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const effectCounterRef = useRef<number>(1);
  const playerRoleRef = useRef(playerRole);
  const actionSentAtRef = useRef<number>(0);
  const turnTimeoutRef = useRef<number | null>(null);
  playerRoleRef.current = playerRole;

  const clearTurnTimeout = () => {
    if (turnTimeoutRef.current !== null) {
      window.clearTimeout(turnTimeoutRef.current);
      turnTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (!roomCode) {
      setBattleState(null);
      setActiveEffect(null);
      setIsWaitingForTurn(false);
      clearTurnTimeout();
      battleAudio.stopBGM();
      return;
    }

    let isCleanedUp = false;
    let reconnectTimer: number | null = null;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const backendPort = import.meta.env.VITE_BACKEND_PORT || '8080';
    const defaultProdWs = 'wss://pokemon-battle-server-cid8.onrender.com';
    const backendHost =
      import.meta.env.VITE_BACKEND_WS_URL ||
      (import.meta.env.PROD
        ? defaultProdWs
        : `${wsProtocol}//${window.location.hostname}:${backendPort}`);
    const socketUrl = `${backendHost}/ws/battle/${roomCode}/`;

    const connectSocket = () => {
      if (isCleanedUp) return;

      const connectStart = performance.now();
      battleLogger.ws(`Connecting to ${socketUrl}`, { roomCode, isAi, playerRole });

      const socket = new WebSocket(socketUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        if (isCleanedUp) {
          socket.close(1000);
          return;
        }
        const connectMs = Math.round(performance.now() - connectStart);
        battleLogger.ws(`Connected in ${connectMs}ms`, { readyState: socket.readyState });
        battleAudio.playBGM('battle_trainer');

        const currentUser = AuthService.getCurrentUser();
        const joinPayload = {
          type: 'JOIN_ROOM',
          player_name: currentUser?.username || (playerRole === 'p1' ? 'Entrenador 1' : 'Entrenador 2'),
          player_role: playerRole,
          is_ai: isAi,
          team: customTeam,
        };
        actionSentAtRef.current = performance.now();
        battleLogger.ws('SEND -> JOIN_ROOM', joinPayload);
        socket.send(JSON.stringify(joinPayload));
      };

      socket.onmessage = async (event) => {
      const rttMs = actionSentAtRef.current
        ? Math.round(performance.now() - actionSentAtRef.current)
        : 0;

      try {
        const data = JSON.parse(event.data);
        battleLogger.ws(`RECV <- ${data.type} (RTT: ${rttMs}ms, server: ${data.server_ms ?? '?'}ms)`, data);

        if (data.type === 'BATTLE_ERROR') {
          clearTurnTimeout();
          battleLogger.error('SERVER_BATTLE_ERROR', data.error, {
            action: data.action,
            trace: data.trace,
          });
          setIsWaitingForTurn(false);
          setCurrentMessage(`Error del servidor: ${data.error}`);
          return;
        }

        if (data.type === 'CHAT_MESSAGE') {
          setChatMessages((prev) => [
            ...prev,
            {
              id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              sender: data.sender || 'Entrenador',
              message: data.message,
              playerRole: data.player_role || 'p1',
              timestamp:
                data.timestamp ||
                new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
          return;
        }

        if (data.type === 'ACTION_ACK') {
          battleLogger.battle(`Acción confirmada por servidor, esperando a ${data.waiting_for}`);
          return;
        }

        if (data.type === 'BATTLE_INIT') {
          clearTurnTimeout();
          battleLogger.battle('Batalla inicializada', {
            turn: data.state?.turn,
            p1: data.state?.p1?.team?.map((p: any) => p.species),
            p2: data.state?.p2?.team?.map((p: any) => p.species),
          });
          setBattleState(data.state);
          setIsWaitingForTurn(false);
          setCurrentMessage('');
          triggerEffect('pokeball', 'burst', true);
          battleAudio.playSE('throw', 0.55);
          // Preload ONLY the animated sprites & attack animation sheets needed for THIS duel
          void preloadBattleAssets(data.state, playerRoleRef.current);
        } else if (data.type === 'TURN_RESOLVED') {
          clearTurnTimeout();
          setIsWaitingForTurn(true);
          battleLogger.battle(`Resolviendo ${data.events?.length ?? 0} eventos del turno`, data.events);
          await playTurnSequence(data.events, data.state);
          setIsWaitingForTurn(false);
          setCurrentMessage('');
        } else if (data.type === 'FAINT_SWITCH_RESOLVED') {
          clearTurnTimeout();
          setIsWaitingForTurn(true);
          const switchedSide: 'p1' | 'p2' = data.player || 'p1';
          const isPlayerSide = switchedSide === playerRoleRef.current;
          setCurrentMessage(data.message || '¡Adelante!');
          battleAudio.playSE('throw', 0.6);
          triggerEffect('pokeball', 'burst', isPlayerSide);
          await delay(380);
          battleAudio.playSE('ball_drop', 0.55);
          setBattleState(data.state);
          setSwitchingState({ side: switchedSide, phase: 'sending' });
          await delay(500);
          setSwitchingState(null);
          setActiveEffect(null);
          setCurrentMessage('');
          setIsWaitingForTurn(false);
        }
      } catch (err) {
        clearTurnTimeout();
        battleLogger.error('WS_PARSE', 'Error procesando mensaje del servidor', err);
        setIsWaitingForTurn(false);
      }
    };

      socket.onerror = (err) => {
        clearTurnTimeout();
        battleLogger.error('WS_ERROR', `Fallo de conexión WebSocket en ${socketUrl}`, err);
        if (!battleState) {
          initLocalFallback();
        }
      };

      socket.onclose = (ev) => {
        clearTurnTimeout();
        battleLogger.warn('WS_CLOSE', `Conexión cerrada (code=${ev.code}, clean=${ev.wasClean})`, {
          reason: ev.reason || '(sin razón)',
        });
        setIsWaitingForTurn(false);

        if (!isCleanedUp && ev.code !== 1000) {
          setCurrentMessage('Conexión interrumpida. Reconectando con la Arena...');
          reconnectTimer = window.setTimeout(() => {
            connectSocket();
          }, 2000);
        }
      };
    };

    connectSocket();

    return () => {
      isCleanedUp = true;
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }
      clearTurnTimeout();
      battleLogger.ws(`Desconectando sala ${roomCode}`);
      if (socketRef.current) {
        socketRef.current.close(1000);
      }
      battleAudio.stopBGM();
    };
  }, [roomCode, isAi, playerRole]);

  const triggerEffect = (
    kind: 'attack' | 'pokeball',
    sheet: string,
    targetIsPlayer: boolean,
    moveMeta?: { moveName?: string; moveType?: string; category?: string }
  ) => {
    effectCounterRef.current += 1;
    setActiveEffect({
      id: effectCounterRef.current,
      kind,
      sheet,
      moveName: moveMeta?.moveName,
      moveType: moveMeta?.moveType,
      category: moveMeta?.category,
      targetIsPlayer,
    });
  };

  const patchLiveState = (updater: (prev: BattleState) => BattleState) => {
    setBattleState((prev) => (prev ? updater(prev) : prev));
  };

  // Authentic GBA/DS turn playback with animations, incremental HP drains, and SFX
  const playTurnSequence = async (events: BattleEvent[], finalState: BattleState) => {
    for (const ev of events) {
      const targetSide = ev.target || ev.player || 'p2';
      const targetIsPlayer = targetSide === playerRoleRef.current;
      battleLogger.battle(`Play event: ${ev.type}`, ev);

      if (ev.type === 'SWITCH') {
        const side: 'p1' | 'p2' = ev.player || 'p1';
        const sideIsPlayer = side === playerRoleRef.current;
        setCurrentMessage(ev.message || '');
        // 1. Recall outgoing Pokémon (red beam shrink)
        setSwitchingState({ side, phase: 'recalling' });
        battleAudio.playSE('recall', 0.6);
        await delay(360);
        // 2. Throw spinning Pokéball arc
        battleAudio.playSE('throw', 0.65);
        triggerEffect('pokeball', 'burst', sideIsPlayer);
        await delay(380);
        // 3. Pokéball opens + new Pokémon pops out in white flash!
        battleAudio.playSE('ball_drop', 0.6);
        if (typeof ev.new_index === 'number') {
          const nextIdx = ev.new_index;
          patchLiveState((prev) => ({
            ...prev,
            [side]: { ...prev[side], active_index: nextIdx },
          }));
        }
        setSwitchingState({ side, phase: 'sending' });
        await delay(500);
        setSwitchingState(null);
        setActiveEffect(null);
      } else if (ev.type === 'ATTACK') {
        setActiveAttacker(ev.actor || null);
        setCurrentMessage(ev.message || '');
        const sheetKey =
          ev.category === 'STATUS'
            ? 'burst'
            : (ev.move_type || 'NORMAL').toLowerCase();
        const animTargetIsPlayer =
          ev.category === 'STATUS'
            ? ev.actor === playerRoleRef.current
            : targetIsPlayer;
        triggerEffect('attack', sheetKey, animTargetIsPlayer, {
          moveName: ev.move,
          moveType: ev.move_type,
          category: ev.category,
        });
        await delay(600);
        setActiveAttacker(null);
        setActiveEffect(null);
      } else if (ev.type === 'DAMAGE') {
        const eff = ev.effectiveness ?? 1.0;
        if (eff > 1.0) {
          battleAudio.playSE('damage_super', 0.75);
        } else if (eff < 1.0 && eff > 0) {
          battleAudio.playSE('damage_weak', 0.7);
        } else if (eff > 0) {
          battleAudio.playSE('damage_normal', 0.7);
        }

        if ((ev.damage ?? 0) > 0) {
          setActiveHitTarget(targetSide);
        }

        if (typeof ev.remaining_hp === 'number') {
          const newHp = ev.remaining_hp;
          patchLiveState((prev) => {
            const side = prev[targetSide];
            const teamCopy = side.team.map((pk, idx) =>
              idx === side.active_index ? { ...pk, current_hp: newHp } : pk
            );
            return { ...prev, [targetSide]: { ...side, team: teamCopy } };
          });
        }

        if (ev.message) {
          setCurrentMessage(ev.message);
          await delay(800);
        } else {
          await delay(480);
        }
        setActiveHitTarget(null);
      } else if (ev.type === 'HEAL') {
        setCurrentMessage(ev.message || '');
        battleAudio.playSE('party_switch', 0.6);
        triggerEffect('attack', 'heal', targetIsPlayer);
        if (typeof ev.remaining_hp === 'number') {
          const newHp = ev.remaining_hp;
          patchLiveState((prev) => {
            const side = prev[targetSide];
            const teamCopy = side.team.map((pk, idx) =>
              idx === side.active_index ? { ...pk, current_hp: newHp } : pk
            );
            return { ...prev, [targetSide]: { ...side, team: teamCopy } };
          });
        }
        await delay(700);
        setActiveEffect(null);
      } else if (ev.type === 'STAT_CHANGE' || ev.type === 'STATUS') {
        setCurrentMessage(ev.message || '');
        triggerEffect('attack', ev.animation || 'burst', targetIsPlayer);
        if (ev.type === 'STATUS' && ev.status) {
          const newStatus = ev.status;
          patchLiveState((prev) => {
            const side = prev[targetSide];
            const teamCopy = side.team.map((pk, idx) =>
              idx === side.active_index ? { ...pk, status: newStatus } : pk
            );
            return { ...prev, [targetSide]: { ...side, team: teamCopy } };
          });
        }
        await delay(720);
        setActiveEffect(null);
      } else if (ev.type === 'MISS' || ev.type === 'INFO') {
        setCurrentMessage(ev.message || '');
        await delay(750);
      } else if (ev.type === 'FAINT') {
        battleAudio.playSE('faint', 0.75);
        setCurrentMessage(ev.message || '¡El Pokémon se debilitó!');
        patchLiveState((prev) => {
          const side = prev[targetSide];
          const teamCopy = side.team.map((pk, idx) =>
            idx === side.active_index ? { ...pk, current_hp: 0, is_fainted: true } : pk
          );
          return { ...prev, [targetSide]: { ...side, team: teamCopy } };
        });
        await delay(900);
      } else if (ev.type === 'GAME_OVER') {
        setCurrentMessage(ev.message || '¡Combate finalizado!');
        if (ev.winner === playerRoleRef.current) {
          battleAudio.playBGM('victory_trainer', 0.38);
        }
        await delay(1100);
      }
    }

    setBattleState(finalState);
    setActiveEffect(null);
  };

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const selectAction = (
    action: { type: 'MOVE'; move_index: number } | { type: 'SWITCH'; target_index: number }
  ) => {
    battleAudio.ensureBgmPlaying();
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      battleLogger.error('WS_SEND', 'No se pudo enviar acción: WebSocket no está abierto', {
        readyState: socketRef.current?.readyState,
        action,
      });
      setCurrentMessage('Sin conexión con el servidor. Recarga la sala.');
      return;
    }

    const payload = {
      type: 'SUBMIT_ACTION',
      player: playerRole,
      action,
    };
    actionSentAtRef.current = performance.now();
    setIsWaitingForTurn(true);
    battleLogger.ws('SEND -> SUBMIT_ACTION', payload);
    socketRef.current.send(JSON.stringify(payload));

    // Safety timeout (15s) in AI mode so UI never stays stuck on "Calculando turno..."
    clearTurnTimeout();
    if (isAi) {
      turnTimeoutRef.current = window.setTimeout(() => {
        battleLogger.error(
          'TURN_TIMEOUT',
          'El servidor no respondió en 15 segundos tras SUBMIT_ACTION',
          { roomCode, payload, readyState: socketRef.current?.readyState }
        );
        setIsWaitingForTurn(false);
        setCurrentMessage('El servidor tardó demasiado. Intenta de nuevo.');
      }, 15000);
    }
  };

  const switchFainted = (targetIndex: number) => {
    battleAudio.ensureBgmPlaying();
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      battleLogger.error('WS_SEND', 'WebSocket cerrado al intentar cambiar Pokémon debilitado');
      return;
    }
    const payload = {
      type: 'SWITCH_FAINTED',
      player: playerRole,
      target_index: targetIndex,
    };
    actionSentAtRef.current = performance.now();
    battleLogger.ws('SEND -> SWITCH_FAINTED', payload);
    socketRef.current.send(JSON.stringify(payload));
  };

  const rematch = () => {
    battleAudio.playBGM('battle_trainer');
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      battleLogger.error('WS_SEND', 'WebSocket cerrado al solicitar revancha');
      return;
    }
    actionSentAtRef.current = performance.now();
    battleLogger.ws('SEND -> REMATCH');
    socketRef.current.send(JSON.stringify({ type: 'REMATCH' }));
  };

  const initLocalFallback = () => {
    battleLogger.warn('FALLBACK', 'Activando estado local de respaldo porque falló el WebSocket');
    const p1Team = [
      {
        species: 'CHARIZARD',
        name: 'Charizard',
        types: ['FIRE', 'FLYING'] as any,
        level: 50,
        gender: 'M' as const,
        ability: 'Mar Llamas',
        max_hp: 164,
        current_hp: 164,
        stats: { hp: 164, attack: 104, defense: 98, sp_attack: 129, sp_defense: 105, speed: 120 },
        moves: [
          { name: 'Lanzallamas', type: 'FIRE', category: 'SPECIAL', power: 90, accuracy: 100, pp: 15, current_pp: 15 },
          { name: 'Tajo Aéreo', type: 'FLYING', category: 'SPECIAL', power: 75, accuracy: 95, pp: 15, current_pp: 15 },
          { name: 'Pulso Dragón', type: 'DRAGON', category: 'SPECIAL', power: 85, accuracy: 100, pp: 10, current_pp: 10 },
          { name: 'Rayo Solar', type: 'GRASS', category: 'SPECIAL', power: 120, accuracy: 100, pp: 10, current_pp: 10 },
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
        gender: 'M' as const,
        ability: 'Torrente',
        max_hp: 165,
        current_hp: 165,
        stats: { hp: 165, attack: 103, defense: 120, sp_attack: 105, sp_defense: 125, speed: 98 },
        moves: [
          { name: 'Hidrobomba', type: 'WATER', category: 'SPECIAL', power: 110, accuracy: 80, pp: 5, current_pp: 5 },
          { name: 'Rayo Hielo', type: 'ICE', category: 'SPECIAL', power: 90, accuracy: 100, pp: 10, current_pp: 10 },
          { name: 'Foco Resplandor', type: 'STEEL', category: 'SPECIAL', power: 80, accuracy: 100, pp: 10, current_pp: 10 },
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
      p1: { name: 'Entrenador 1', active_index: 0, team: p1Team as any },
      p2: { name: 'Bot Entrenador', active_index: 0, team: p2Team as any },
    });
    setCurrentMessage('');
  };

  const sendChatMessage = (text: string, customSender?: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    const clean = text.trim();
    if (!clean) return;

    const payload = {
      type: 'CHAT_MESSAGE',
      sender:
        customSender ||
        localStorage.getItem('pokemon_trainer_name') ||
        (playerRole === 'p1' ? 'Jugador 1' : 'Jugador 2'),
      message: clean,
      player_role: playerRole,
    };
    socketRef.current.send(JSON.stringify(payload));
  };

  return {
    battleState,
    currentMessage,
    isWaitingForTurn,
    activeAttacker,
    activeHitTarget,
    activeEffect,
    switchingState,
    selectAction,
    switchFainted,
    rematch,
    chatMessages,
    sendChatMessage,
  };
};
