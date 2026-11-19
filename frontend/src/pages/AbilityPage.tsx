import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AbilitiesCatalog } from '../components/abilities/AbilitiesCatalog';

export const AbilityPage: React.FC = () => {
  const navigate = useNavigate();
  return <AbilitiesCatalog onBack={() => navigate('/')} />;
};
