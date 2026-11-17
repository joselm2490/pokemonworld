import React, { useState } from 'react';
import { Swords, Bot, Users, Sparkles, Shield, Play } from 'lucide-react';
import { AnimatedPokemonSprite } from '../battle/AnimatedPokemonSprite';

interface LobbyProps {
  onStartMatch: (roomCode: string, isAi: boolean, role: 'p1' | 'p2') => void;
  onOpenTeamBuilder: () => void;
  selectedTeam: string[];
}

export const Lobby: React.FC<LobbyProps> = ({
  onStartMatch,
  onOpenTeamBuilder,
  selectedTeam,
}) => {
  const [joinCode, setJoinCode] = useState('');

  const generateRoomCode = () => {
    return 'ROOM-' + Math.floor(1000 + Math.random() * 9000);
  };

  const handleCreateRoom = () => {
    const code = generateRoomCode();
    onStartMatch(code, false, 'p1');
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim().toUpperCase();
    if (!cleanCode) return;
    onStartMatch(cleanCode, false, 'p2');
  };

  const handlePlayAi = () => {
    const code = 'AI-' + Math.floor(1000 + Math.random() * 9000);
    onStartMatch(code, true, 'p1');
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#4bb896] via-[#75d4b1] to-[#3f8c36] text-zinc-900 flex flex-col justify-between p-4 sm:p-6 select-none font-game">
      {/* Top Header Bar */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between bg-zinc-900/80 backdrop-blur-xs p-3 px-5 rounded-2xl border-2 border-zinc-700 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center shadow-md">
            <div className="w-2.5 h-2.5 rounded-full bg-white border border-zinc-800" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-white tracking-widest uppercase">
              Pokémon Battle Arena
            </h1>
            <p className="text-[8px] text-zinc-400">
              Deluxe Battle Kit • Gen 9 Rules
            </p>
          </div>
        </div>

        <button
          onClick={onOpenTeamBuilder}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 border-2 border-white text-zinc-900 text-[9px] font-bold shadow-md hover:brightness-110 active:scale-95 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Party ({selectedTeam.length}/6)</span>
        </button>
      </div>

      {/* Main Center Battle Arena Preview */}
      <div className="max-w-3xl mx-auto w-full my-auto py-4 flex flex-col items-center">
        {/* Animated Battle Lineup */}
        <div className="flex items-center justify-center gap-6 sm:gap-12 mb-6">
          <div className="flex flex-col items-center">
            <AnimatedPokemonSprite species={selectedTeam[0] || 'CHARIZARD'} scale={2.6} />
            <span className="text-[10px] font-bold text-white text-shadow-heavy uppercase mt-1">
              {selectedTeam[0] || 'CHARIZARD'}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center">
            <span className="text-2xl sm:text-3xl font-black text-rose-600 text-shadow-white tracking-widest">
              VS
            </span>
          </div>

          <div className="flex flex-col items-center">
            <AnimatedPokemonSprite species={selectedTeam[1] || 'PIKACHU'} scale={2.6} />
            <span className="text-[10px] font-bold text-white text-shadow-heavy uppercase mt-1">
              {selectedTeam[1] || 'PIKACHU'}
            </span>
          </div>
        </div>

        {/* Action Cards (Styled like authentic battle dialogue / menus) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
          {/* Card 1: Single Player AI Battle */}
          <div className="bg-[#2e5234] border-3 border-[#1b3620] rounded-2xl p-3 shadow-2xl">
            <div className="border-2 border-[#d6b24a] rounded-xl p-4 bg-[#38613e]/90 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-5 h-5 text-amber-300" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Battle vs AI
                  </h3>
                </div>
                <p className="text-[9px] text-zinc-200 leading-relaxed font-sans font-medium mb-4">
                  Quick match against the Battle Bot using authentic damage formulas and animated sprites.
                </p>
              </div>

              <button
                onClick={handlePlayAi}
                className="w-full h-11 rounded-full bg-gradient-to-b from-[#5ec05e] via-[#4bae4b] to-[#349434] border-3 border-white text-white font-game text-[11px] font-bold tracking-widest uppercase shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Match</span>
              </button>
            </div>
          </div>

          {/* Card 2: 1v1 Online PvP Room */}
          <div className="bg-[#2e5234] border-3 border-[#1b3620] rounded-2xl p-3 shadow-2xl">
            <div className="border-2 border-[#d6b24a] rounded-xl p-4 bg-[#38613e]/90 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-amber-300" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Online 1v1 PvP
                  </h3>
                </div>
                <p className="text-[9px] text-zinc-200 leading-relaxed font-sans font-medium mb-3">
                  Battle online in real-time with a friend using room codes.
                </p>

                {/* Join input */}
                <form onSubmit={handleJoinRoom} className="flex gap-1.5 mb-2.5">
                  <input
                    type="text"
                    placeholder="ROOM CODE"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="flex-1 bg-white border-2 border-zinc-800 rounded-lg px-2.5 py-1.5 text-[10px] font-game uppercase text-zinc-900 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!joinCode.trim()}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 text-white text-[9px] font-game hover:bg-zinc-700 disabled:opacity-40"
                  >
                    Join
                  </button>
                </form>
              </div>

              <button
                onClick={handleCreateRoom}
                className="w-full h-11 rounded-full bg-gradient-to-b from-[#f25d5d] via-[#e54545] to-[#c42828] border-3 border-white text-white font-game text-[11px] font-bold tracking-widest uppercase shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Swords className="w-4 h-4" />
                <span>Create Room</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="max-w-4xl mx-auto w-full pt-2 flex flex-col sm:flex-row items-center justify-between text-[9px] text-zinc-800 gap-1">
        <span>Deluxe Battle Kit Web Adaptation</span>
        <a
          href="https://pokemon-battle-server-cid8.onrender.com/admin/"
          target="_blank"
          rel="noreferrer"
          className="text-zinc-900 font-bold underline hover:text-red-700"
        >
          Django Admin (joselm2490)
        </a>
      </div>
    </div>
  );
};
