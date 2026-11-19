import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MovesCatalog } from '../components/moves/MovesCatalog';

export const MovePage: React.FC = () => {
  const navigate = useNavigate();
  return <MovesCatalog onBack={() => navigate('/')} />;
};
