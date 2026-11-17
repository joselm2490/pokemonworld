import React, { useEffect, useRef } from 'react';

export interface ActiveEffect {
  id: number;
  kind: 'attack' | 'pokeball';
  sheet: string; // e.g. 'fire', 'water', 'electric', 'heal', 'burst'
  targetIsPlayer: boolean;
}

interface SheetSpec {
  file: string;
  cols: number;
  rows: number;
  maxFrames: number;
  fpsMs: number;
}

const ANIMATION_SHEETS: Record<string, SheetSpec> = {
  normal: { file: 'normal.png', cols: 5, rows: 2, maxFrames: 10, fpsMs: 55 },
  fire: { file: 'fire.png', cols: 5, rows: 2, maxFrames: 10, fpsMs: 55 },
  water: { file: 'water.png', cols: 5, rows: 3, maxFrames: 12, fpsMs: 50 },
  electric: { file: 'electric.png', cols: 5, rows: 2, maxFrames: 10, fpsMs: 55 },
  grass: { file: 'grass.png', cols: 5, rows: 2, maxFrames: 10, fpsMs: 55 },
  ice: { file: 'ice.png', cols: 5, rows: 5, maxFrames: 14, fpsMs: 45 },
  fighting: { file: 'fighting.png', cols: 5, rows: 4, maxFrames: 12, fpsMs: 50 },
  poison: { file: 'poison.png', cols: 5, rows: 3, maxFrames: 12, fpsMs: 50 },
  ground: { file: 'ground.png', cols: 5, rows: 2, maxFrames: 10, fpsMs: 55 },
  flying: { file: 'flying.png', cols: 5, rows: 3, maxFrames: 12, fpsMs: 50 },
  psychic: { file: 'psychic.png', cols: 4, rows: 4, maxFrames: 12, fpsMs: 50 },
  bug: { file: 'bug.png', cols: 4, rows: 1, maxFrames: 4, fpsMs: 95 },
  rock: { file: 'rock.png', cols: 4, rows: 2, maxFrames: 8, fpsMs: 65 },
  ghost: { file: 'dark.png', cols: 5, rows: 3, maxFrames: 12, fpsMs: 50 },
  dark: { file: 'dark.png', cols: 5, rows: 3, maxFrames: 12, fpsMs: 50 },
  dragon: { file: 'dragon.png', cols: 5, rows: 3, maxFrames: 12, fpsMs: 50 },
  steel: { file: 'steel.png', cols: 4, rows: 3, maxFrames: 10, fpsMs: 55 },
  fairy: { file: 'fairy.png', cols: 5, rows: 3, maxFrames: 12, fpsMs: 50 },
  heal: { file: 'heal.png', cols: 5, rows: 6, maxFrames: 15, fpsMs: 45 },
  burst: { file: 'burst.png', cols: 5, rows: 2, maxFrames: 10, fpsMs: 55 },
};

interface BattleEffectOverlayProps {
  effect: ActiveEffect | null;
}

export const BattleEffectOverlay: React.FC<BattleEffectOverlayProps> = ({ effect }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 512, 288);
    if (!effect) return;

    let cancelled = false;
    let rafId = 0;

    const targetX = effect.targetIsPlayer ? 128 : 384;
    const targetY = effect.targetIsPlayer ? 210 : 148;

    if (effect.kind === 'pokeball') {
      // Official Pokéball spinning arc + open + star burst
      const ballImg = new Image();
      const openImg = new Image();
      const starImg = new Image();
      ballImg.src = '/battle-ui/animations/ball_POKEBALL.png';
      openImg.src = '/battle-ui/animations/ball_POKEBALL_open.png';
      starImg.src = '/battle-ui/animations/ballBurst_star.png';

      const startX = effect.targetIsPlayer ? 20 : 492;
      const startY = effect.targetIsPlayer ? 250 : 90;
      const startTime = performance.now();
      const throwDuration = 360;
      const burstDuration = 340;

      const animateBall = (now: number) => {
        if (cancelled) return;
        const elapsed = now - startTime;
        ctx.clearRect(0, 0, 512, 288);
        ctx.imageSmoothingEnabled = false;

        if (elapsed < throwDuration) {
          const t = elapsed / throwDuration;
          const x = startX + (targetX - startX) * t;
          const arcHeight = 85;
          const y = startY + (targetY - startY) * t - Math.sin(t * Math.PI) * arcHeight;
          const frame = Math.floor(elapsed / 45) % 8;
          if (ballImg.complete && ballImg.naturalWidth > 0) {
            ctx.drawImage(ballImg, frame * 32, 0, 32, 64, x - 16, y - 32, 32, 64);
          }
          rafId = requestAnimationFrame(animateBall);
        } else if (elapsed < throwDuration + burstDuration) {
          const bt = (elapsed - throwDuration) / burstDuration;
          // Open ball flash
          if (openImg.complete && openImg.naturalWidth > 0 && bt < 0.5) {
            ctx.globalAlpha = 1 - bt * 2;
            ctx.drawImage(openImg, targetX - 16, targetY - 32, 32, 64);
          }
          // Expanding white flash circle
          ctx.globalAlpha = Math.max(0, 0.85 * (1 - bt));
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(targetX, targetY, 18 + bt * 56, 0, Math.PI * 2);
          ctx.fill();

          // 6 Radiating official Pokéball stars
          if (starImg.complete && starImg.naturalWidth > 0) {
            ctx.globalAlpha = Math.max(0, 1 - bt);
            for (let i = 0; i < 6; i++) {
              const angle = (i * Math.PI) / 3 + bt * 1.4;
              const dist = 12 + bt * 62;
              const sx = targetX + Math.cos(angle) * dist - 16;
              const sy = targetY + Math.sin(angle) * dist - 16;
              ctx.drawImage(starImg, 0, 0, 64, 64, sx, sy, 32, 32);
            }
          }
          ctx.globalAlpha = 1;
          rafId = requestAnimationFrame(animateBall);
        } else {
          ctx.clearRect(0, 0, 512, 288);
        }
      };

      rafId = requestAnimationFrame(animateBall);
      return () => {
        cancelled = true;
        cancelAnimationFrame(rafId);
      };
    }

    // Official RPG Maker / Pokémon Essentials 192x192 Attack Animation Sheet
    const spec = ANIMATION_SHEETS[effect.sheet.toLowerCase()] || ANIMATION_SHEETS.normal;
    const img = new Image();
    img.src = `/battle-ui/animations/${spec.file}`;

    img.onload = () => {
      if (cancelled) return;
      const cellW = Math.floor(img.naturalWidth / spec.cols);
      const cellH = Math.floor(img.naturalHeight / spec.rows);
      const totalCels = Math.min(spec.maxFrames, spec.cols * spec.rows);
      const drawSize = 180;
      const startTime = performance.now();

      const drawFrame = (now: number) => {
        if (cancelled) return;
        const frameIdx = Math.floor((now - startTime) / spec.fpsMs);
        ctx.clearRect(0, 0, 512, 288);

        if (frameIdx >= totalCels) {
          return;
        }

        const col = frameIdx % spec.cols;
        const row = Math.floor(frameIdx / spec.cols);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          img,
          col * cellW,
          row * cellH,
          cellW,
          cellH,
          targetX - drawSize / 2,
          targetY - drawSize / 2,
          drawSize,
          drawSize
        );

        rafId = requestAnimationFrame(drawFrame);
      };

      rafId = requestAnimationFrame(drawFrame);
    };

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      ctx.clearRect(0, 0, 512, 288);
    };
  }, [effect]);

  return (
    <canvas
      ref={canvasRef}
      width={512}
      height={288}
      className="absolute left-0 top-0 pointer-events-none pixelated"
      style={{ zIndex: 25 }}
    />
  );
};
