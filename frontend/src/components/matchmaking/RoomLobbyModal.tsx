import React, { useState, useEffect } from 'react';
import {
  X,
  Swords,
  Users,
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  Shield,
  Play,
  RotateCcw,
} from 'lucide-react';
import { RoomDetailData, RoomMessage } from '../../types/stadium';
import { PokedexService } from '../../services/pokedexService';
import { AnimatedPokemonSprite } from '../battle/AnimatedPokemonSprite';

interface RoomLobbyModalProps {
  roomCode: string;
  playerRole: 'p1' | 'p2';
  playerName: string;
  selectedTeam: string[];
  onClose: () => void;
  onStartDuel: () => void;
}

export const RoomLobbyModal: React.FC<RoomLobbyModalProps> = ({
  roomCode,
  playerRole,
  playerName,
  selectedTeam,
  onClose,
  onStartDuel,
}) => {
  const [room, setRoom] = useState<RoomDetailData | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(true);

  // Poll room status & chat every 2.5 seconds
  useEffect(() => {
    let isMounted = true;

    const refreshData = async () => {
      try {
        const [rData, chatData] = await Promise.all([
          PokedexService.getRoomDetail(roomCode),
          PokedexService.getRoomChat(roomCode),
        ]);
        if (isMounted) {
          setRoom(rData);
          setMessages(chatData);
          setLoading(false);

          // Find current player ready state
          const me = rData.jugadores.find((j) => j.apodo === playerName);
          if (me) setIsReady(me.listo);
        }
      } catch (err) {
        console.error(err);
      }
    };

    refreshData();
    const interval = setInterval(refreshData, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [roomCode, playerName]);

  const handleToggleReady = async () => {
    try {
      const nextReady = !isReady;
      setIsReady(nextReady);
      const res = await PokedexService.toggleReady(roomCode, {
        player_name: playerName,
        ready: nextReady,
        team: selectedTeam.slice(0, room?.pokemon_por_jugador || 3),
      });
      if (res.sala_status === 'ACTIVE') {
        onStartDuel();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const txt = chatInput.trim();
    setChatInput('');
    try {
      await PokedexService.sendRoomChat(roomCode, {
        emisor: playerName,
        mensaje: txt,
      });
      const updated = await PokedexService.getRoomChat(roomCode);
      setMessages(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const p1 = room?.jugadores.find((j) => j.es_anfitrion) || {
    apodo: room?.anfitrion || 'Anfitrión',
    listo: false,
    equipo: selectedTeam.slice(0, room?.pokemon_por_jugador || 3),
  };

  const p2 = room?.jugadores.find((j) => !j.es_anfitrion);

  const bothReady = (room?.jugadores.length ?? 0) >= 2 && room?.jugadores.every((j) => j.listo);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 font-game select-none animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border-2 border-zinc-700 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-800/80 border-b border-zinc-700">
          <div className="flex items-center gap-3">
            <Swords className="w-5 h-5 text-amber-400" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black tracking-wider uppercase">
                  Sala de Duelo #{roomCode}
                </h2>
                {room?.requiere_contrasena && (
                  <span className="text-[10px] bg-red-950 text-red-300 border border-red-700/60 px-2 py-0.5 rounded-full font-bold">
                    Privada
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-400">
                Formato {room?.pokemon_por_jugador || 3} vs {room?.pokemon_por_jugador || 3} •{' '}
                {room?.format_settings?.permitir_legendarios ? 'Legendarios Sí' : 'Sin Legendarios'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Grid: Players & Chat */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-5 custom-scrollbar">
          {/* Players Arena Card (Col 8) */}
          <div className="md:col-span-7 flex flex-col gap-4">
            {/* Matchup Header Box */}
            <div className="grid grid-cols-2 gap-3">
              {/* Player 1 Box */}
              <div
                className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                  p1.listo
                    ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                    : 'bg-zinc-950/70 border-zinc-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                      Anfitrión (P1)
                    </span>
                    {p1.listo ? (
                      <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> LISTO
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-500">
                        <Clock className="w-3.5 h-3.5" /> Preparando
                      </span>
                    )}
                  </div>
                  <h3 className="font-black text-sm text-white truncate">{p1.apodo}</h3>
                </div>

                {/* Team Sprites Preview */}
                <div className="flex gap-1.5 mt-3 pt-3 border-t border-zinc-800/80">
                  {(p1.equipo?.length ? p1.equipo : selectedTeam.slice(0, room?.pokemon_por_jugador || 3)).map(
                    (sp, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 bg-zinc-900 border border-zinc-700/80 rounded-xl flex items-center justify-center p-1 overflow-hidden"
                      >
                        <AnimatedPokemonSprite species={sp} className="w-full h-full" />
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Player 2 Box */}
              <div
                className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                  p2?.listo
                    ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                    : 'bg-zinc-950/70 border-zinc-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                      Invitado (P2)
                    </span>
                    {p2 ? (
                      p2.listo ? (
                        <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> LISTO
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-500">
                          <Clock className="w-3.5 h-3.5" /> Preparando
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] text-amber-500/80 animate-pulse font-bold">
                        Esperando...
                      </span>
                    )}
                  </div>
                  <h3 className="font-black text-sm text-white truncate">
                    {p2?.apodo || 'Buscando Oponente...'}
                  </h3>
                </div>

                {/* Team Sprites Preview */}
                <div className="flex gap-1.5 mt-3 pt-3 border-t border-zinc-800/80">
                  {p2?.equipo && p2.equipo.length > 0 ? (
                    p2.equipo.map((sp, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 bg-zinc-900 border border-zinc-700/80 rounded-xl flex items-center justify-center p-1 overflow-hidden"
                      >
                        <AnimatedPokemonSprite species={sp} className="w-full h-full" />
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] text-zinc-600 italic py-2">
                      Esperando que se una el jugador...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ready Button & Duel Status */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div>
                <span className="text-xs font-bold text-white block">Estado del Duelo:</span>
                <span className="text-[11px] text-zinc-400">
                  {bothReady
                    ? '¡Ambos entrenadores están listos para combatir!'
                    : 'Selecciona tu equipo y presiona "Estoy Listo" para comenzar.'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleReady}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs shadow-lg transition-all flex items-center gap-2 ${
                    isReady
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-emerald-400'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isReady ? '¡ESTOY LISTO! (Cancelar)' : 'MARCAR COMO LISTO'}
                </button>

                {bothReady && (
                  <button
                    onClick={onStartDuel}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black text-xs shadow-xl animate-bounce flex items-center gap-1.5"
                  >
                    <Play className="w-4 h-4" />
                    INICIAR COMBATE
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Lobby Chat (Col 5) */}
          <div className="md:col-span-5 flex flex-col bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 h-80 md:h-full">
            <div className="flex items-center gap-2 pb-2.5 mb-2 border-b border-zinc-800 text-xs font-bold text-zinc-300">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>Chat de la Sala</span>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar text-xs">
              {messages.length === 0 ? (
                <p className="text-[10px] text-zinc-600 italic text-center py-8">
                  No hay mensajes aún en la sala.
                </p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-2 rounded-xl text-xs leading-relaxed ${
                      m.es_sistema
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px]'
                        : m.emisor === playerName
                        ? 'bg-zinc-800 text-white ml-4 border border-zinc-700'
                        : 'bg-zinc-900 text-zinc-200 mr-4 border border-zinc-800'
                    }`}
                  >
                    {!m.es_sistema && (
                      <span className="font-black text-[10px] block text-amber-400 mb-0.5">
                        {m.emisor}
                      </span>
                    )}
                    <span>{m.mensaje}</span>
                  </div>
                ))
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Escribe un mensaje en la sala..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-amber-400"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
