import React, { useState, useEffect } from 'react';
import { getHomeIconUrl, getShowdownSpriteUrl, getStaticPokemonImageUrl } from '../../utils/speciesToDex';

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
  const homeIcon = getHomeIconUrl(species, dexNumber);
  const primaryShowdown = getShowdownSpriteUrl(species);
  const localStatic = getStaticPokemonImageUrl(species, dexNumber);

  const initialStep = homeIcon ? 'home' : primaryShowdown ? 'primary' : 'fallback';
  const [step, setStep] = useState<'home' | 'primary' | 'fallback' | 'failed'>(initialStep);

  useEffect(() => {
    setStep(homeIcon ? 'home' : primaryShowdown ? 'primary' : 'fallback');
  }, [species, dexNumber, homeIcon, primaryShowdown]);

  if (step === 'failed') {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-800/70 rounded-xl text-[10px] font-bold text-amber-300 p-2 text-center ${className}`}
      >
        {alt || species || '???'}
      </div>
    );
  }

  const src =
    step === 'home' && homeIcon
      ? homeIcon
      : step === 'primary' && primaryShowdown
      ? primaryShowdown
      : localStatic;

  return (
    <img
      src={src}
      alt={alt || species || 'Pokémon'}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => {
        if (step === 'home') {
          setStep(primaryShowdown ? 'primary' : 'fallback');
        } else if (step === 'primary') {
          setStep('fallback');
        } else {
          setStep('failed');
        }
      }}
      className={`object-contain select-none ${className}`}
    />
  );
};
