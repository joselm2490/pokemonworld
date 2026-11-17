import React, { useState } from 'react';
import { Swords, Bot, Users, Sparkles, Shield, Copy, Check } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col justify-between p-6">
      {/* Top Banner */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-900/50">
            <Swords className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold font-game tracking-wider text-white">
              Pokémon World PvP
            </h1>
            <p className="text-[11px] text-slate-400">
              Online Deluxe Battle Kit Engine
            </p>
          </div>
        </div>

        <button
          onClick={onOpenTeamBuilder}
          className="flex items-center gap-2 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Edit Team ({selectedTeam.length}/6)</span>
        </button>
      </div>

      {/* Main Center Content */}
      <div className="max-w-4xl mx-auto w-full my-auto py-10 flex flex-col items-center">
        {/* Animated Roster Showcase */}
        <div className="flex items-center justify-center gap-6 mb-8 flex-wrap">
          <AnimatedPokemonSprite species={selectedTeam[0] || 'CHARIZARD'} scale={2.8} />
          <div className="text-center">
            <span className="text-3xl font-game text-rose-500 text-shadow-md block mb-1">
              VS
            </span>
            <span className="text-xs font-mono text-slate-400">
              Competitive Gen 9 Online Rules
            </span>
          </div>
          <AnimatedPokemonSprite species={selectedTeam[1] || 'BLASTOISE'} scale={2.8} />
        </div>

        {/* Game Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl">
          {/* Option 1: Play vs AI Bot */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border-2 border-slate-800 hover:border-blue-500/80 shadow-xl transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center mb-4">
                <Bot className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-base font-bold font-game text-white mb-1">
                Battle vs AI
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Instant match against the Battle Bot to test your team synergy and damage calculations.
              </p>
            </div>

            <button
              onClick={handlePlayAi}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 font-game text-xs text-white uppercase tracking-wider shadow-lg shadow-blue-950/50 active:scale-95 transition-all"
            >
              Start AI Match
            </button>
          </div>

          {/* Option 2: Online 1v1 PvP Room */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border-2 border-slate-800 hover:border-rose-500/80 shadow-xl transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="text-base font-bold font-game text-white mb-1">
                Online PvP (1v1)
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Create a private room or enter a friend's room code to battle in real-time.
              </p>

              {/* Join Room Form */}
              <form onSubmit={handleJoinRoom} className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Enter Room Code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono uppercase tracking-wider text-white focus:outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  disabled={!joinCode.trim()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 disabled:opacity-40 transition-colors"
                >
                  Join
                </button>
              </form>
            </div>

            <button
              onClick={handleCreateRoom}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 font-game text-xs text-white uppercase tracking-wider shadow-lg shadow-rose-950/50 active:scale-95 transition-all"
            >
              Create PvP Room
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Footer & Admin Note */}
      <div className="max-w-5xl mx-auto w-full pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span>Backend: Django 6.1 (ASGI Channels)</span>
          <span>•</span>
          <span>Frontend: React + Vite (Vercel Ready)</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="http://127.0.0.1:8080/admin/"
            target="_blank"
            rel="noreferrer"
            className="text-slate-400 hover:text-amber-400 underline transition-colors"
          >
            Django Admin Panel (joselm2490)
          </a>
        </div>
      </div>
    </div>
  );
};

