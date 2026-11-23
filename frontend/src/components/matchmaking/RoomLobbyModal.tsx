import React, { useState, useEffect } from 'react';
import {
  X,
  Swords,
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  Play,
  ArrowLeft,
} from 'lucide-react';
import { RoomDetailData, RoomMessage } from '../../types/stadium';
import { PokedexService } from '../../services/pokedexService';
import { StaticPokemonImage } from '../common/StaticPokemonImage';

interface RoomLobbyModalProps {
  roomCode: string;
  playerRole: 'p1' | 'p2';
  playerName: string;
  selectedTeam: string[];
  onClose: () => void;
  onStartDuel: () => void;
  inline?: boolean;
}

export const RoomLobbyModal: React.FC<RoomLobbyModalProps> = ({
  roomCode,
  playerRole,
  playerName,
  selectedTeam,
  onClose,
  onStartDuel,
  inline = false,
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

          // Automatically transition both players into BattleArena when room becomes ACTIVE
          if (rData.status === 'ACTIVE') {
            onStartDuel();
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    refreshData();
    const interval = setInterval(() => {
      if (!document.hidden) refreshData();
    }, 2000);

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
        team: selectedTeam.slice(0, 6),
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
    equipo: selectedTeam.slice(0, 6),
  };

  const p2 = room?.jugadores.find((j) => !j.es_anfitrion);

  const bothReady = (room?.jugadores.length ?? 0) >= 2 && room?.jugadores.every((j) => j.listo);
  const canHostStart = playerRole === 'p1' && Boolean(p2) && Boolean(p2?.listo);

  const handleStartButtonClick = async () => {
    if (bothReady) {
      onStartDuel();
      return;
    }
    if (canHostStart) {
      try {
        const res = await PokedexService.toggleReady(roomCode, {
          player_name: playerName,
          ready: true,
          team: selectedTeam.slice(0, 6),
        });
        setIsReady(true);
        if (res.sala_status === 'ACTIVE') {
          onStartDuel();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (inline) {
    return (
      <div className="flex-1 flex flex-col overflow-y-auto pr-1 custom-scrollbar space-y-2.5 font-sans select-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Salir de la sala"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <Swords className="w-4 h-4 text-amber-500" />
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                  Sala #{roomCode}
                </h2>
                {room?.requiere_contrasena && (
                  <span className="text-[9px] bg-rose-100 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded-full font-bold">
                    Privada
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500">
                Formato 6 vs 6 • {room?.format_settings?.permitir_legendarios ? 'Legendarios Sí' : 'Sin Legendarios'}
              </p>
            </div>
          </div>
        </div>

        {/* Players P1 & P2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Player 1 */}
          <div
            className={`p-2.5 rounded-xl border transition-all ${
              p1.listo ? 'bg-emerald-50 border-emerald-400' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-amber-600 font-black uppercase tracking-wider">
                Anfitrión (P1)
              </span>
              {p1.listo ? (
                <span className="flex items-center gap-1 text-[9px] font-black text-emerald-700">
                  <CheckCircle2 className="w-3 h-3" /> LISTO
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
                  <Clock className="w-3 h-3" /> Preparando
                </span>
              )}
            </div>
            <h3 className="font-black text-xs text-slate-900 truncate">{p1.apodo}</h3>
            <div className="grid grid-cols-6 gap-1 mt-2 pt-2 border-t border-slate-200/80">
              {(p1.equipo?.length ? p1.equipo : selectedTeam.slice(0, 6)).map((sp, i) => (
                <div
                  key={i}
                  className="aspect-square bg-white border border-slate-200 rounded-lg flex items-center justify-center p-0.5 overflow-hidden"
                >
                  <StaticPokemonImage species={sp} alt={sp} className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
          </div>

          {/* Player 2 */}
          <div
            className={`p-2.5 rounded-xl border transition-all ${
              p2?.listo ? 'bg-emerald-50 border-emerald-400' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-sky-600 font-black uppercase tracking-wider">
                Invitado (P2)
              </span>
              {p2 ? (
                p2.listo ? (
                  <span className="flex items-center gap-1 text-[9px] font-black text-emerald-700">
                    <CheckCircle2 className="w-3 h-3" /> LISTO
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
                    <Clock className="w-3 h-3" /> Preparando
                  </span>
                )
              ) : (
                <span className="text-[9px] text-amber-600 animate-pulse font-bold">
                  Esperando...
                </span>
              )}
            </div>
            <h3 className="font-black text-xs text-slate-900 truncate">
              {p2?.apodo || 'Esperando Oponente...'}
            </h3>
            <div className="mt-2 pt-2 border-t border-slate-200/80">
              {p2?.equipo && p2.equipo.length > 0 ? (
                <div className="grid grid-cols-6 gap-1">
                  {p2.equipo.map((sp, i) => (
                    <div
                      key={i}
                      className="aspect-square bg-white border border-slate-200 rounded-lg flex items-center justify-center p-0.5 overflow-hidden"
                    >
                      <StaticPokemonImage species={sp} alt={sp} className="w-full h-full object-contain" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 italic py-1.5 text-center">
                  Esperando que se una el oponente...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-2">
          <div className="text-[11px] text-slate-600 leading-tight">
            <strong className="text-slate-800">Estado:</strong>{' '}
            {bothReady
              ? '¡Ambos listos! Pulsa Comenzar.'
              : !p2
              ? 'Esperando a que se una un oponente (2/2)...'
              : 'Marca "Estoy Listo" para iniciar el combate 6 vs 6.'}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleToggleReady}
              className={`py-2 px-2 rounded-xl font-black text-[11px] shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer ${
                isReady
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-500'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{isReady ? 'LISTO (Cancelar)' : 'ESTOY LISTO'}</span>
            </button>

            <button
              type="button"
              disabled={!bothReady && !canHostStart}
              onClick={handleStartButtonClick}
              className={`py-2 px-2 rounded-xl font-black text-[11px] shadow-2xs flex items-center justify-center gap-1 transition-all ${
                bothReady || canHostStart
                  ? 'bg-gradient-to-r from-[#32f59b] via-[#2ce692] to-[#25db89] text-slate-950 border border-[#19c778] cursor-pointer animate-pulse'
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
              }`}
            >
              <Play className="w-3.5 h-3.5 shrink-0" />
              <span>COMENZAR</span>
            </button>
          </div>
        </div>

        {/* Compact Room Chat */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-col flex-1 min-h-[140px]">
          <div className="flex items-center gap-1.5 pb-1.5 mb-1.5 border-b border-slate-200 text-[11px] font-black text-slate-700 uppercase">
            <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
            <span>Chat de la Sala</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar text-[11px] max-h-[140px]">
            {messages.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic text-center py-4">
                No hay mensajes aún en la sala.
              </p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-1.5 rounded-lg leading-snug ${
                    m.es_sistema
                      ? 'bg-amber-50 text-amber-800 border border-amber-200 text-[10px]'
                      : m.emisor === playerName
                      ? 'bg-emerald-50 text-slate-900 ml-4 border border-emerald-200'
                      : 'bg-white text-slate-800 mr-4 border border-slate-200'
                  }`}
                >
                  {!m.es_sistema && (
                    <span className="font-black text-[9px] block text-emerald-700 mb-0.5">
                      {m.emisor}
                    </span>
                  )}
                  <span>{m.mensaje}</span>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendMessage} className="mt-2 flex gap-1.5">
            <input
              type="text"
              placeholder="Escribe un mensaje..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 min-w-0 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
            />
            <button
              type="submit"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-black text-white transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    );
  }

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
                Formato {room?.pokemon_por_jugador || 6} vs {room?.pokemon_por_jugador || 6} •{' '}
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
                  {(p1.equipo?.length ? p1.equipo : selectedTeam.slice(0, 6)).map(
                    (sp, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 bg-zinc-900 border border-zinc-700/80 rounded-xl flex items-center justify-center p-1 overflow-hidden"
                      >
                        <StaticPokemonImage species={sp} alt={sp} className="w-full h-full" />
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
                        <StaticPokemonImage species={sp} alt={sp} className="w-full h-full" />
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
                    ? '¡Ambos entrenadores están listos! Pulsa Comenzar.'
                    : !p2
                    ? 'Esperando a que se una un oponente (2/2)...'
                    : 'Marca "Estoy Listo" para iniciar el combate 6 vs 6.'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleReady}
                  className={`px-4 py-2.5 rounded-xl font-black text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
                    isReady
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-emerald-400'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isReady ? '¡ESTOY LISTO! (Cancelar)' : 'MARCAR COMO LISTO'}
                </button>

                <button
                  type="button"
                  disabled={!bothReady && !canHostStart}
                  onClick={handleStartButtonClick}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs shadow-xl flex items-center gap-1.5 transition-all ${
                    bothReady || canHostStart
                      ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white cursor-pointer animate-pulse'
                      : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-4 h-4" />
                  COMENZAR
                </button>
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
