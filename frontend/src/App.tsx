import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Lobby } from './components/matchmaking/Lobby';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { TeamPage } from './pages/TeamPage';
import { PracticePage } from './pages/PracticePage';
import { TutorialPage } from './pages/TutorialPage';
import { PokemonPage } from './pages/PokemonPage';
import { AbilityPage } from './pages/AbilityPage';
import { MovePage } from './pages/MovePage';

interface HomeLobbyProps {
  initialSection?: 'arena' | 'equipo' | 'cajas' | 'room' | 'pokedex' | 'pokemon' | 'moves' | 'abilities' | 'salir';
  initialRoomCode?: string;
}

const HomeLobby: React.FC<HomeLobbyProps> = ({ initialSection = 'arena', initialRoomCode }) => {
  const navigate = useNavigate();
  const [selectedTeam, setSelectedTeam] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pokemon_user_team');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length <= 6) {
          return parsed;
        }
      }
    } catch {}
    return [
      'CHARIZARD',
      'PIKACHU',
      'BLASTOISE',
      'LUCARIO',
      'GENGAR',
      'GARCHOMP',
    ];
  });

  const handleUpdateTeam = (newTeam: string[]) => {
    if (!Array.isArray(newTeam)) return;
    const bounded = newTeam.slice(0, 6);
    setSelectedTeam(bounded);
    localStorage.setItem('pokemon_user_team', JSON.stringify(bounded));
  };

  return (
    <Lobby
      selectedTeam={selectedTeam}
      onUpdateTeam={handleUpdateTeam}
      initialSection={initialSection}
      initialRoomCode={initialRoomCode}
      onOpenTeamBuilder={() => navigate('/team')}
      onOpenPokedex={() => navigate('/pokemon')}
      onOpenMoves={() => navigate('/move')}
      onOpenAbilities={() => navigate('/ability')}
      onOpenRooms={() => navigate('/room')}
      onOpenAuth={() => navigate('/login')}
      onOpenPractice={() => navigate('/practice')}
      onStartMatch={(roomCode, isAi) => {
        if (isAi) {
          navigate('/practice');
        } else {
          navigate(`/room/${roomCode}`);
        }
      }}
    />
  );
};

const RoomLobbyRoute: React.FC = () => {
  const { roomCode } = useParams<{ roomCode?: string }>();
  return <HomeLobby initialSection="room" initialRoomCode={roomCode} />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Arena / Stadium Lobby */}
        <Route path="/" element={<HomeLobby />} />

        {/* Authentication & User Accounts (Django & Supabase) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Forth Battle PvP Multiplayer Rooms (rendered inside Lobby container) */}
        <Route path="/room" element={<RoomLobbyRoute />} />
        <Route path="/room/:roomCode" element={<RoomLobbyRoute />} />

        {/* Team Builder (10 Teams of 6 Pokémon) */}
        <Route path="/team" element={<TeamPage />} />

        {/* Battles against AI */}
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/tutorial" element={<TutorialPage />} />

        {/* Pokédex Encyclopedia & Catalogs */}
        <Route path="/pokemon" element={<HomeLobby initialSection="pokemon" />} />
        <Route path="/ability" element={<HomeLobby initialSection="abilities" />} />
        <Route path="/move" element={<HomeLobby initialSection="moves" />} />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
