import { useState, useEffect, useRef } from 'react';
import { BattleState, BattleEvent } from '../types/pokemon';
import { ActiveEffect } from '../components/battle/BattleEffectOverlay';
import { battleAudio } from '../utils/battleAudio';

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
  const [activeEffect, setActiveEffect] = useState<ActiveEffect | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const effectCounterRef = useRef<number>(1);
  const playerRoleRef = useRef(playerRole);
  playerRoleRef.current = playerRole;

  useEffect(() => {
    if (!roomCode) {
      setBattleState(null);
      setActiveEffect(null);
      battleAudio.stopBGM();
      return;
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const backendPort = import.meta.env.VITE_BACKEND_PORT || '8080';
    const backendHost =
      import.meta.env.VITE_BACKEND_WS_URL ||
      `${wsProtocol}//${window.location.hostname}:${backendPort}`;
    const socketUrl = `${backendHost}/ws/battle/${roomCode}/`;

    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      battleAudio.playBGM('battle_trainer');
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
          setCurrentMessage('');
          triggerEffect('pokeball', 'burst', true);
          battleAudio.playSE('throw', 0.55);
        } else if (data.type === 'TURN_RESOLVED') {
          setIsWaitingForTurn(true);
          await playTurnSequence(data.events, data.state);
          setIsWaitingForTurn(false);
          setCurrentMessage('');
        } else if (data.type === 'FAINT_SWITCH_RESOLVED') {
          setIsWaitingForTurn(true);
          const switchedSide: 'p1' | 'p2' = data.player || 'p1';
          const isPlayerSide = switchedSide === playerRoleRef.current;
          setCurrentMessage(data.message || 'Go!');
          battleAudio.playSE('throw', 0.6);
          triggerEffect('pokeball', 'burst', isPlayerSide);
          await delay(360);
          battleAudio.playSE('ball_drop', 0.55);
          setBattleState(data.state);
          await delay(500);
          setActiveEffect(null);
          setCurrentMessage('');
          setIsWaitingForTurn(false);
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    };

    socket.onerror = (err) => {
      console.warn('WebSocket connection error, starting local battle mode...', err);
      initLocalFallback();
    };

    return () => {
      socket.close();
      battleAudio.stopBGM();
    };
  }, [roomCode, isAi, playerRole]);

  const triggerEffect = (kind: 'attack' | 'pokeball', sheet: string, targetIsPlayer: boolean) => {
    effectCounterRef.current += 1;
    setActiveEffect({
      id: effectCounterRef.current,
      kind,
      sheet,
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

      if (ev.type === 'SWITCH') {
        const side: 'p1' | 'p2' = ev.player || 'p1';
        const sideIsPlayer = side === playerRoleRef.current;
        setCurrentMessage(ev.message || '');
        battleAudio.playSE('recall', 0.55);
        await delay(320);
        battleAudio.playSE('throw', 0.6);
        triggerEffect('pokeball', 'burst', sideIsPlayer);
        await delay(360);
        battleAudio.playSE('ball_drop', 0.55);
        if (typeof ev.new_index === 'number') {
          const nextIdx = ev.new_index;
          patchLiveState((prev) => ({
            ...prev,
            [side]: { ...prev[side], active_index: nextIdx },
          }));
        }
        await delay(520);
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
        triggerEffect('attack', sheetKey, animTargetIsPlayer);
        await delay(650);
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

        // Smoothly update HP bar right when damage lands!
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
          await delay(850);
        } else {
          await delay(520);
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
        await delay(750);
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
        await delay(780);
        setActiveEffect(null);
      } else if (ev.type === 'MISS' || ev.type === 'INFO') {
        setCurrentMessage(ev.message || '');
        await delay(820);
      } else if (ev.type === 'FAINT') {
        battleAudio.playSE('faint', 0.75);
        setCurrentMessage(ev.message || 'Pokémon fainted!');
        patchLiveState((prev) => {
          const side = prev[targetSide];
          const teamCopy = side.team.map((pk, idx) =>
            idx === side.active_index ? { ...pk, current_hp: 0, is_fainted: true } : pk
          );
          return { ...prev, [targetSide]: { ...side, team: teamCopy } };
        });
        await delay(1000);
      } else if (ev.type === 'GAME_OVER') {
        setCurrentMessage(ev.message || 'Match finished!');
        if (ev.winner === playerRoleRef.current) {
          battleAudio.playBGM('victory_trainer', 0.38);
        }
        await delay(1200);
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
    battleAudio.ensureBgmPlaying();
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
    battleAudio.playBGM('battle_trainer');
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({ type: 'REMATCH' }));
  };

  const initLocalFallback = () => {
    const p1Team = [
      {
        species: 'CHARIZARD',
        name: 'Charizard',
        types: ['FIRE', 'FLYING'] as any,
        level: 50,
        gender: 'M' as const,
        ability: 'BLAZE',
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
        gender: 'M' as const,
        ability: 'TORRENT',
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
    setCurrentMessage('');
  };

  return {
    battleState,
    currentMessage,
    isWaitingForTurn,
    activeAttacker,
    activeHitTarget,
    activeEffect,
    selectAction,
    switchFainted,
    rematch,
  };
};
