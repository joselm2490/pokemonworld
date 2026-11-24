import React from 'react';
import { PokeBallGraphic } from './PokeBallGraphic';

interface PokeballLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  dark?: boolean;
}

export const PokeballLoader: React.FC<PokeballLoaderProps> = ({
  text = 'CARGANDO...',
  size = 'md',
  dark = false,
}) => {
  const pxSize = size === 'sm' ? 40 : size === 'lg' ? 76 : 56;
  return (
    <div className="flex flex-col items-center justify-center gap-3 select-none">
      <div className="animate-[spin_2.6s_linear_infinite]">
        <PokeBallGraphic size={pxSize} glow={false} />
      </div>
      <p
        className={`text-xs font-black uppercase tracking-widest ${
          dark ? 'text-amber-400' : 'text-slate-600'
        }`}
      >
        {text}
      </p>
    </div>
  );
};
