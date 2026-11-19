import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { BattleChatMessage } from '../../hooks/useBattle';

interface BattleChatCardProps {
  messages: BattleChatMessage[];
  onSendMessage: (text: string) => void;
  myRole: 'p1' | 'p2';
  myTrainerName: string;
  opponentName: string;
}

export const BattleChatCard: React.FC<BattleChatCardProps> = ({
  messages,
  onSendMessage,
  myRole,
  myTrainerName,
  opponentName,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputText.trim();
    if (!clean) return;
    onSendMessage(clean);
    setInputText('');
  };

  const getOpponentInitial = () => {
    const clean = opponentName.trim();
    return clean ? clean[0].toUpperCase() : 'R';
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-md border border-slate-200 flex flex-col overflow-hidden h-[190px] sm:h-[220px]">
      {/* Messages Scroll Area */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5 custom-scrollbar bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 gap-1 my-auto">
            <MessageSquare className="w-6 h-6 opacity-40 text-slate-400" />
            <p className="text-[11px] font-sans">
              Chat en vivo activado con <strong>{opponentName}</strong>
            </p>
            <span className="text-[10px] text-slate-400 font-mono">
              ¡Escribe un mensaje para conversar durante el duelo!
            </span>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.playerRole === myRole;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] ${
                  isMe ? 'ml-auto' : 'mr-auto'
                }`}
              >
                {/* Header: Name + Timestamp */}
                <div className="flex items-center gap-1.5 mb-0.5 px-1">
                  {!isMe && (
                    <div className="w-4 h-4 rounded-full bg-[#d946ef] text-white flex items-center justify-center text-[9px] font-black uppercase">
                      {getOpponentInitial()}
                    </div>
                  )}
                  <span className="text-[10px] font-bold text-slate-700">
                    {isMe ? 'Tú' : msg.sender || opponentName}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {msg.timestamp}
                  </span>
                </div>

                {/* Bubble */}
                <div
                  className={`px-3 py-1.5 rounded-2xl text-xs font-sans break-words shadow-2xs leading-relaxed ${
                    isMe
                      ? 'bg-[#e0f2fe] text-slate-900 border border-[#bae6fd] rounded-tr-xs'
                      : 'bg-white text-slate-900 border border-slate-200 rounded-tl-xs'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={handleSubmit}
        className="p-2 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Escribe un mensaje..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          maxLength={120}
          className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#32f59b] focus:bg-white transition-all"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-black active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
          title="Enviar mensaje"
        >
          <Send className="w-3.5 h-3.5 text-[#32f59b]" />
        </button>
      </form>
    </div>
  );
};
