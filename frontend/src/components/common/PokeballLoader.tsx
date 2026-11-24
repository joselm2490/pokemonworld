import React from 'react';

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
  const imgSize = size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-20 h-20' : 'w-14 h-14';
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 select-none">
      <img
        src="/simple_pokeball.gif"
        alt="Cargando"
        className={`${imgSize} object-contain`}
        draggable={false}
      />
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
