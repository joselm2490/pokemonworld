import React, { useEffect, useRef, useState } from 'react';
import { battleLogger } from '../../utils/logger';

interface AnimatedPokemonSpriteProps {
  species: string;
  isBack?: boolean;
  isShiny?: boolean;
  isAttacking?: boolean;
  isHit?: boolean;
  isFainted?: boolean;
  showShadow?: boolean;
  animate?: boolean;
  animateOnHover?: boolean;
  scale?: number;
  className?: string;
  apiBaseUrl?: string;
}

// Global decoded image cache shared with battlePreloader to prevent redundant network fetches
export const SPRITE_CACHE = new Map<string, HTMLImageElement>();

export const AnimatedPokemonSprite: React.FC<AnimatedPokemonSpriteProps> = ({
  species,
  isBack = false,
  isShiny = false,
  isAttacking = false,
  isHit = false,
  isFainted = false,
  showShadow = true,
  animate = true,
  animateOnHover = false,
  scale = 2,
  className = '',
  apiBaseUrl = import.meta.env.VITE_BACKEND_API_URL || '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isVisible, setIsVisible] = useState(animate && !animateOnHover);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const frameIndexRef = useRef(0);
  const totalFramesRef = useRef(1);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const cleanSpecies = species.toUpperCase().replace(/\s+/g, '_');
  const folder = isBack
    ? isShiny
      ? 'Back shiny'
      : 'Back'
    : isShiny
    ? 'Front shiny'
    : 'Front';

  const spriteUrl = `${apiBaseUrl}/sprites/Graphics/Pokemon/${folder}/${cleanSpecies}.png`;

  // Lazy visibility observer so offscreen cards do not hammer Render or CPU
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setIsVisible(entry.isIntersecting);
        }
      },
      { rootMargin: '120px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Load sprite image only once visible (or immediately from cache)
  useEffect(() => {
    if (!isVisible) return;

    const cached = SPRITE_CACHE.get(spriteUrl);
    if (cached && cached.complete && cached.naturalWidth > 0) {
      imgRef.current = cached;
      totalFramesRef.current = Math.max(1, Math.round(cached.naturalWidth / (cached.naturalHeight || 64)));
      frameIndexRef.current = 0;
      setHasError(false);
      setImageLoaded(true);
      return;
    }

    setImageLoaded(false);
    setHasError(false);
    frameIndexRef.current = 0;

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = spriteUrl;

    img.onload = () => {
      if (cancelled) return;
      SPRITE_CACHE.set(spriteUrl, img);
      imgRef.current = img;
      const height = img.naturalHeight || 64;
      const width = img.naturalWidth || 64;
      totalFramesRef.current = Math.max(1, Math.round(width / height));
      setImageLoaded(true);
    };

    img.onerror = () => {
      if (cancelled) return;
      battleLogger.warn('SPRITE', `No se pudo cargar ${spriteUrl}, intentando fallback Front`);
      if (isBack || isShiny) {
        const fallbackUrl = `${apiBaseUrl}/sprites/Graphics/Pokemon/Front/${cleanSpecies}.png`;
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = 'anonymous';
        fallbackImg.src = fallbackUrl;
        fallbackImg.onload = () => {
          if (cancelled) return;
          SPRITE_CACHE.set(fallbackUrl, fallbackImg);
          imgRef.current = fallbackImg;
          totalFramesRef.current = Math.max(
            1,
            Math.round(fallbackImg.naturalWidth / (fallbackImg.naturalHeight || 64))
          );
          setImageLoaded(true);
        };
        fallbackImg.onerror = () => {
          if (!cancelled) {
            battleLogger.error('SPRITE', `Falló también el fallback para ${cleanSpecies}`);
            setHasError(true);
          }
        };
      } else {
        setHasError(true);
      }
    };

    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [cleanSpecies, isBack, isShiny, spriteUrl, apiBaseUrl, isVisible]);

  const shouldAnimate = isVisible && !isFainted && (animate || (animateOnHover && isHovered));

  // Render static first frame or run animation loop only when needed
  useEffect(() => {
    if (!imageLoaded || !imgRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imgRef.current;
    const frameHeight = img.naturalHeight || 64;
    const frameWidth = frameHeight;
    const totalFrames = totalFramesRef.current;

    const displayWidth = Math.floor(frameWidth * scale);
    const displayHeight = Math.floor(frameHeight * scale);
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }

    const drawCurrentFrame = () => {
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
    };

    // Always draw at least frame 0 immediately
    drawCurrentFrame();

    if (!shouldAnimate || totalFrames <= 1) {
      return;
    }

    const frameInterval = 50; // ~20fps authentic smooth DS/Essentials pacing

    const renderLoop = (time: number) => {
      if (time - lastTimeRef.current >= frameInterval) {
        lastTimeRef.current = time;
        frameIndexRef.current = (frameIndexRef.current + 1) % totalFrames;
        drawCurrentFrame();
      }
      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [imageLoaded, scale, shouldAnimate, isFainted]);

  let animationClass = '';
  if (isAttacking) {
    animationClass = isBack ? 'anim-attack-p1' : 'anim-attack-p2';
  } else if (isHit) {
    animationClass = 'anim-damage';
  } else if (isFainted) {
    animationClass = 'anim-faint';
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={animateOnHover ? () => setIsHovered(true) : undefined}
      onMouseLeave={animateOnHover ? () => setIsHovered(false) : undefined}
      className={`relative inline-flex flex-col items-center justify-end select-none ${className}`}
    >
      {showShadow && (
        <div
          className="absolute bottom-1 w-20 h-4 bg-black/45 rounded-[100%] transition-transform duration-300"
          style={{
            transform: isFainted ? 'scale(0)' : 'scale(1)',
          }}
        />
      )}

      {!hasError ? (
        <canvas
          ref={canvasRef}
          className={`relative z-10 pixelated transition-transform duration-200 ${animationClass}`}
        />
      ) : (
        <div className="w-24 h-24 flex flex-col items-center justify-center bg-slate-800/80 rounded-xl border border-slate-700 text-xs text-slate-400">
          <span className="font-bold text-amber-400">{species}</span>
          <span>Sprite Missing</span>
        </div>
      )}
    </div>
  );
};
