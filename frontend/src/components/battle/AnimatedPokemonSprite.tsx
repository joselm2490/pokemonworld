import React, { useEffect, useRef, useState } from 'react';
import { battleLogger } from '../../utils/logger';
import { toShowdownSlug } from '../../utils/speciesToDex';
import {
  DuelSpriteMode,
  getDuelSpriteMode,
  resolveLocal2DSpriteKey,
  subscribeDuelSpriteMode,
} from '../../utils/battleSettings';

interface AnimatedPokemonSpriteProps {
  species: string;
  isBack?: boolean;
  isShiny?: boolean;
  isAttacking?: boolean;
  isHit?: boolean;
  isFainted?: boolean;
  switchPhase?: 'recalling' | 'sending' | null;
  showShadow?: boolean;
  animate?: boolean;
  animateOnHover?: boolean;
  frameDelayMs?: number;
  status?: string | null;
  lowHp?: boolean;
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
  switchPhase = null,
  showShadow = true,
  animate = true,
  animateOnHover = false,
  frameDelayMs = 60,
  status = null,
  lowHp = false,
  scale = 2,
  className = '',
  apiBaseUrl = import.meta.env.VITE_BACKEND_API_URL || '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isVisible, setIsVisible] = useState(animate && !animateOnHover);
  const [isHovered, setIsHovered] = useState(false);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const frameIndexRef = useRef(0);
  const totalFramesRef = useRef(1);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const [duelMode, setDuelMode] = useState<DuelSpriteMode>(() => getDuelSpriteMode());

  useEffect(() => {
    return subscribeDuelSpriteMode(setDuelMode);
  }, []);

  const cleanSpecies = resolveLocal2DSpriteKey(species);
  const use3dSprite = duelMode === '3d';
  const showdownSlug = toShowdownSlug(species);
  const showdownPrimaryUrl = `/sprites-3d/${isBack ? 'back' : 'front'}/${showdownSlug}.gif`;
  const showdownRemoteUrl = `https://play.pokemonshowdown.com/sprites/ani${isBack ? '-back' : ''}/${showdownSlug}.gif`;
  const showdownFallbackUrl = `https://play.pokemonshowdown.com/sprites/gen5${isBack ? '-back' : ''}/${showdownSlug}.png`;
  const [showdownSrc, setShowdownSrc] = useState(showdownPrimaryUrl);

  useEffect(() => {
    setShowdownSrc(showdownPrimaryUrl);
    setHasError(false);
  }, [showdownPrimaryUrl, duelMode]);

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
    if (!isVisible || use3dSprite) return;

    const cached = SPRITE_CACHE.get(spriteUrl);
    if (cached && cached.complete && cached.naturalWidth > 0) {
      imgRef.current = cached;
      totalFramesRef.current = Math.max(1, Math.round(cached.naturalWidth / (cached.naturalHeight || 64)));
      frameIndexRef.current = 0;
      setHasError(false);
      setLoadedUrl(spriteUrl);
      return;
    }

    setLoadedUrl(null);
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
      setLoadedUrl(spriteUrl);
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
          setLoadedUrl(fallbackUrl);
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
    if (use3dSprite || !loadedUrl || !imgRef.current || !canvasRef.current) return;

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

    if (!shouldAnimate || totalFrames <= 1 || status === 'CON' || status === 'FRZ') {
      return;
    }

    // Balanced Gen 5 / Essentials pacing (~15 FPS normal)
    let frameInterval = frameDelayMs;
    if (status === 'DOR' || status === 'SLP') {
      frameInterval = Math.round(frameDelayMs * 2);
    } else if (status === 'PAR' || lowHp) {
      frameInterval = Math.round(frameDelayMs * 1.45);
    }

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
  }, [loadedUrl, spriteUrl, scale, shouldAnimate, isFainted, frameDelayMs, status, lowHp]);

  let animationClass = '';
  if (switchPhase === 'recalling') {
    animationClass = 'anim-recall';
  } else if (switchPhase === 'sending') {
    animationClass = 'anim-sendout';
  } else if (isAttacking) {
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

      {use3dSprite ? (
        <img
          src={showdownSrc}
          alt={species}
          draggable={false}
          onError={() => {
            if (showdownSrc === showdownPrimaryUrl) {
              setShowdownSrc(showdownRemoteUrl);
            } else if (showdownSrc === showdownRemoteUrl) {
              setShowdownSrc(showdownFallbackUrl);
            } else {
              setHasError(true);
            }
          }}
          style={{
            width: `${Math.round(56 * scale)}px`,
            height: `${Math.round(56 * scale)}px`,
          }}
          className={`relative z-10 object-contain object-bottom transition-transform duration-200 ${animationClass}`}
        />
      ) : !hasError ? (
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
