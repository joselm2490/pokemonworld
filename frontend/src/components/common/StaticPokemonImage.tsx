import React, { useState } from 'react';
import { getStaticPokemonImageUrl } from '../../utils/speciesToDex';

interface StaticPokemonImageProps {
  species?: string;
  dexNumber?: number;
  alt?: string;
  className?: string;
}

export const StaticPokemonImage: React.FC<StaticPokemonImageProps> = ({
  species,
  dexNumber,
  alt,
  className = '',
}) => {
  const [failed, setFailed] = useState(false);
  const src = getStaticPokemonImageUrl(species, dexNumber);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-800/70 rounded-xl text-[10px] font-bold text-amber-300 p-2 text-center ${className}`}
      >
        {alt || species || '???'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || species || 'Pokémon'}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
      className={`object-contain select-none ${className}`}
    />
  );
};
