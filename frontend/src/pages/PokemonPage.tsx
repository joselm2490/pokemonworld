import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PokedexView } from '../components/pokedex/PokedexView';

export const PokemonPage: React.FC = () => {
  const navigate = useNavigate();
  return <PokedexView onBack={() => navigate('/')} />;
};
