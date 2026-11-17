import React, { useEffect, useRef, useState } from 'react';

interface AnimatedPokemonSpriteProps {
  species: string;
  isBack?: boolean;
  isShiny?: boolean;
  isAttacking?: boolean;
  isHit?: boolean;
  isFainted?: boolean;
  showShadow?: boolean;
  scale?: number;
  className?: string;
  apiBaseUrl?: string;
}

export const AnimatedPokemonSprite: React.FC<AnimatedPokemonSpriteProps> = ({
  species,
  isBack = false,
  isShiny = false,
  isAttacking = false,
  isHit = false,
  isFainted = false,
  showShadow = true,
  scale = 2,
  className = '',
  apiBaseUrl = import.meta.env.VITE_BACKEND_API_URL || '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const frameIndexRef = useRef(0);
  const totalFramesRef = useRef(1);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Normalize species name (e.g. CHARIZARD)
  const cleanSpecies = species.toUpperCase().replace(/\s+/g, '_');
  const folder = isBack
    ? (isShiny ? 'Back shiny' : 'Back')
    : (isShiny ? 'Front shiny' : 'Front');
  
  const spriteUrl = `${apiBaseUrl}/sprites/Graphics/Pokemon/${folder}/${cleanSpecies}.png`;

  useEffect(() => {
    setImageLoaded(false);
    setHasError(false);
    frameIndexRef.current = 0;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = spriteUrl;

    img.onload = () => {
      imgRef.current = img;
      const height = img.naturalHeight || 64;
      const width = img.naturalWidth || 64;
      // Formula: totalFrames = width / height (each frame is a square of height x height)
      totalFramesRef.current = Math.max(1, Math.round(width / height));
      setImageLoaded(true);
    };

    img.onerror = () => {
      // Fallback to front or default 000 if back/shiny is missing
      if (isBack || isShiny) {
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = 'anonymous';
        fallbackImg.src = `${apiBaseUrl}/sprites/Graphics/Pokemon/Front/${cleanSpecies}.png`;
        fallbackImg.onload = () => {
          imgRef.current = fallbackImg;
          totalFramesRef.current = Math.max(1, Math.round(fallbackImg.naturalWidth / fallbackImg.naturalHeight));
          setImageLoaded(true);
        };
        fallbackImg.onerror = () => setHasError(true);
      } else {
        setHasError(true);
      }
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [cleanSpecies, isBack, isShiny, spriteUrl, apiBaseUrl]);

  // Frame animation loop
  useEffect(() => {
    if (!imageLoaded || !imgRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imgRef.current;
    const frameHeight = img.naturalHeight;
    const frameWidth = img.naturalHeight;
    const totalFrames = totalFramesRef.current;

    // Set canvas dimensions
    const displayWidth = Math.floor(frameWidth * scale);
    const displayHeight = Math.floor(frameHeight * scale);
    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // Frame delay: approx 40ms per frame (~25 fps for classic Pokémon DS/Essentials feel)
    const frameInterval = 45;

    const renderLoop = (time: number) => {
      if (time - lastTimeRef.current >= frameInterval) {
        lastTimeRef.current = time;
        if (!isFainted) {
          frameIndexRef.current = (frameIndexRef.current + 1) % totalFrames;
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;

      const sourceX = frameIndexRef.current * frameWidth;
      ctx.drawImage(
        img,
        sourceX,
        0,
        frameWidth,
        frameHeight,
        0,
        0,
        displayWidth,
        displayHeight
      );

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [imageLoaded, scale, isFainted]);

  // Dynamic animation class names
  let animationClass = '';
  if (isAttacking) {
    animationClass = isBack ? 'anim-attack-p1' : 'anim-attack-p2';
  } else if (isHit) {
    animationClass = 'anim-damage';
  } else if (isFainted) {
    animationClass = 'anim-faint';
  }

  return (
    <div className={`relative inline-flex flex-col items-center justify-end select-none ${className}`}>
      {/* Authentic Ground Shadow (Foe side by default) */}
      {showShadow && (
        <div
          className="absolute bottom-1 w-20 h-4 bg-black/45 rounded-[100%] transition-transform duration-300"
          style={{
            transform: isFainted ? 'scale(0)' : 'scale(1)',
          }}
        />
      )}

      {/* Animated Canvas */}
      {!hasError ? (
        <canvas
          ref={canvasRef}
          className={`relative z-10 pixelated transition-transform duration-200 ${animationClass}`}
        />
      ) : (
        <div className="w-32 h-32 flex flex-col items-center justify-center bg-slate-800/80 rounded-xl border border-slate-700 text-xs text-slate-400">
          <span className="font-bold text-amber-400">{species}</span>
          <span>Sprite Missing</span>
        </div>
      )}
    </div>
  );
};
