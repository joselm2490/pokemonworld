import React, { useEffect, useRef } from 'react';
import { resolveGbaMoveAnimation, GbaMoveAnimSpec } from './gbaMoveAnimations';

export interface ActiveEffect {
  id: number;
  kind: 'attack' | 'pokeball';
  sheet: string;
  moveName?: string;
  moveType?: string;
  category?: string;
  targetIsPlayer: boolean;
}

interface BattleEffectOverlayProps {
  effect: ActiveEffect | null;
}

// Module-level image cache so GBA particle sprites load once and render without flicker
const particleImageCache = new Map<number, HTMLImageElement>();

function getParticleImage(tag: number): HTMLImageElement {
  const existing = particleImageCache.get(tag);
  if (existing) return existing;
  const img = new Image();
  img.src = `/battle-ui/gba-particles/${tag}.png`;
  particleImageCache.set(tag, img);
  return img;
}

function drawParticleFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  scale: number,
  frameIdx: number,
  spec?: Pick<GbaMoveAnimSpec, 'frameW' | 'frameH' | 'frames'>,
  alpha = 1,
  rotation = 0
) {
  if (!img.complete || img.naturalWidth === 0) return;
  // All gba-particles/*.png are 4x Scale2x HD upscaled
  const HD_FACTOR = 4;
  const fw = spec?.frameW ? spec.frameW * HD_FACTOR : img.naturalWidth;
  const fh = spec?.frameH ? spec.frameH * HD_FACTOR : Math.min(img.naturalWidth, img.naturalHeight);
  const cols = Math.max(1, Math.floor(img.naturalWidth / fw));
  const rows = Math.max(1, Math.floor(img.naturalHeight / fh));
  const totalFrames = spec?.frames || cols * rows;
  const idx = ((frameIdx % totalFrames) + totalFrames) % totalFrames;
  const sx = (idx % cols) * fw;
  const sy = Math.floor(idx / cols) * fh;

  const dw = (fw / HD_FACTOR) * scale;
  const dh = (fh / HD_FACTOR) * scale;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.translate(x, y);
  if (rotation !== 0) ctx.rotate(rotation);
  ctx.drawImage(img, sx, sy, fw, fh, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
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
    const attackerX = effect.targetIsPlayer ? 384 : 128;
    const attackerY = effect.targetIsPlayer ? 148 : 210;

    if (effect.kind === 'pokeball') {
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
          if (openImg.complete && openImg.naturalWidth > 0 && bt < 0.5) {
            ctx.globalAlpha = 1 - bt * 2;
            ctx.drawImage(openImg, targetX - 16, targetY - 32, 32, 64);
          }
          ctx.globalAlpha = Math.max(0, 0.85 * (1 - bt));
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(targetX, targetY, 18 + bt * 56, 0, Math.PI * 2);
          ctx.fill();

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

    // Authentic GBA / Radical Red Particle Animation Engine
    const spec = resolveGbaMoveAnimation(effect.moveName, effect.moveType, effect.category);
    const primaryImg = getParticleImage(spec.particleTag);
    const secondaryImg = spec.secondaryTag ? getParticleImage(spec.secondaryTag) : null;

    const count = spec.count || 10;
    const scale = spec.scale || 1.7;
    const durationMs = 580;
    const startTime = performance.now();

    const animateGbaMove = (now: number) => {
      if (cancelled) return;
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);

      ctx.clearRect(0, 0, 512, 288);

      // GBA-style background screen tint / flash
      if (spec.screenTint && t < 0.92) {
        const tintAlpha = Math.sin(t * Math.PI);
        ctx.save();
        ctx.globalAlpha = tintAlpha;
        ctx.fillStyle = spec.screenTint;
        ctx.fillRect(0, 0, 512, 288);
        ctx.restore();
      }

      const frameTick = Math.floor(elapsed / 55);

      if (spec.pattern === 'stream') {
        for (let i = 0; i < count; i++) {
          const delayT = (i / count) * 0.48;
          const lt = (t - delayT) / 0.52;
          if (lt < 0 || lt > 1) continue;
          const wave = Math.sin(lt * Math.PI * 3 + i) * 7;
          const px = attackerX + (targetX - attackerX) * lt + wave;
          const py = attackerY + (targetY - attackerY) * lt - wave * 0.5;
          const fade = lt > 0.85 ? (1 - lt) / 0.15 : 1;
          drawParticleFrame(ctx, primaryImg, px, py, scale, frameTick + i, spec, fade);
        }
        if (secondaryImg && t > 0.4) {
          const bt = (t - 0.4) / 0.6;
          for (let i = 0; i < 4; i++) {
            const ang = (i * Math.PI) / 2 + bt * 2;
            const dist = bt * 28;
            drawParticleFrame(
              ctx,
              secondaryImg,
              targetX + Math.cos(ang) * dist,
              targetY + Math.sin(ang) * dist,
              scale * 0.85,
              frameTick + i,
              undefined,
              1 - bt
            );
          }
        }
      } else if (spec.pattern === 'drain') {
        for (let i = 0; i < count; i++) {
          const delayT = (i / count) * 0.45;
          const lt = (t - delayT) / 0.55;
          if (lt < 0 || lt > 1) continue;
          const arc = Math.sin(lt * Math.PI) * 26;
          const px = targetX + (attackerX - targetX) * lt;
          const py = targetY + (attackerY - targetY) * lt - arc;
          drawParticleFrame(ctx, primaryImg, px, py, scale, frameTick + i, spec, 1 - lt * 0.25);
        }
      } else if (spec.pattern === 'sky_strike') {
        for (let i = 0; i < count; i++) {
          const delayT = (i / count) * 0.4;
          const lt = (t - delayT) / 0.6;
          if (lt < 0 || lt > 1) continue;
          const offsetX = ((i % 5) - 2) * 18;
          const startY = Math.max(-20, targetY - 140);
          const py = startY + (targetY - startY) * Math.min(1, lt * 1.35);
          const fade = lt > 0.8 ? (1 - lt) / 0.2 : 1;
          drawParticleFrame(ctx, primaryImg, targetX + offsetX, py, scale, frameTick + i, spec, fade);
        }
        if (secondaryImg && t > 0.25) {
          const bt = (t - 0.25) / 0.75;
          for (let i = 0; i < 6; i++) {
            const ang = (i * Math.PI) / 3 + bt * 1.5;
            const dist = bt * 38;
            drawParticleFrame(
              ctx,
              secondaryImg,
              targetX + Math.cos(ang) * dist,
              targetY + Math.sin(ang) * dist,
              scale * 0.8,
              frameTick + i,
              undefined,
              1 - bt
            );
          }
        }
      } else if (spec.pattern === 'slash_claw') {
        const cuts = Math.min(4, Math.max(2, Math.floor(count / 2)));
        for (let i = 0; i < cuts; i++) {
          const delayT = i * 0.16;
          const lt = (t - delayT) / 0.55;
          if (lt < 0 || lt > 1) continue;
          const ox = (i % 2 === 0 ? -1 : 1) * (1 - lt) * 18;
          const oy = -18 + lt * 36;
          const rot = i % 2 === 0 ? -0.35 : 0.35;
          drawParticleFrame(ctx, primaryImg, targetX + ox, targetY + oy, scale, Math.floor(lt * 4), spec, 1 - lt * 0.3, rot);
        }
        if (secondaryImg && t > 0.2) {
          drawParticleFrame(ctx, secondaryImg, targetX, targetY, scale * 0.9, frameTick, undefined, 1 - t);
        }
      } else if (spec.pattern === 'bite_fang') {
        const snap = t < 0.45 ? t / 0.45 : 1;
        const openDist = (1 - Math.sin(snap * (Math.PI / 2))) * 34;
        const fade = t > 0.75 ? (1 - t) / 0.25 : 1;
        // Top & bottom jaw snap
        drawParticleFrame(ctx, primaryImg, targetX, targetY - openDist - 8, scale, 0, spec, fade);
        drawParticleFrame(ctx, primaryImg, targetX, targetY + openDist + 8, scale, 1, spec, fade, Math.PI);
        if (secondaryImg && t > 0.35) {
          const bt = (t - 0.35) / 0.65;
          for (let i = 0; i < 4; i++) {
            const ang = (i * Math.PI) / 2 + bt;
            drawParticleFrame(
              ctx,
              secondaryImg,
              targetX + Math.cos(ang) * bt * 34,
              targetY + Math.sin(ang) * bt * 34,
              scale * 0.75,
              frameTick + i,
              undefined,
              1 - bt
            );
          }
        }
      } else if (spec.pattern === 'punch_impact') {
        const hits = Math.min(4, Math.max(2, Math.floor(count / 2)));
        for (let i = 0; i < hits; i++) {
          const delayT = i * 0.14;
          const lt = (t - delayT) / 0.48;
          if (lt < 0 || lt > 1) continue;
          const ox = ((i % 2 === 0 ? -1 : 1) * 16) * (1 - lt * 0.5);
          const oy = (i < 2 ? -10 : 10) * (1 - lt * 0.5);
          const popScale = scale * (0.85 + Math.sin(lt * Math.PI) * 0.35);
          drawParticleFrame(ctx, primaryImg, targetX + ox, targetY + oy, popScale, frameTick + i, spec, 1 - lt * 0.35);
        }
        if (secondaryImg && t > 0.2) {
          const bt = (t - 0.2) / 0.8;
          for (let i = 0; i < 6; i++) {
            const ang = (i * Math.PI) / 3 + bt * 1.8;
            drawParticleFrame(
              ctx,
              secondaryImg,
              targetX + Math.cos(ang) * bt * 40,
              targetY + Math.sin(ang) * bt * 40,
              scale * 0.75,
              frameTick + i,
              undefined,
              1 - bt
            );
          }
        }
      } else if (spec.pattern === 'wave_surge') {
        for (let i = 0; i < count; i++) {
          const lt = Math.min(1, Math.max(0, (t - (i / count) * 0.3) / 0.7));
          if (lt <= 0) continue;
          const spreadX = ((i / (count - 1 || 1)) - 0.5) * 110;
          const riseY = Math.sin(lt * Math.PI) * 32;
          drawParticleFrame(ctx, primaryImg, targetX + spreadX, targetY + 18 - riseY, scale, frameTick + i, spec, 1 - lt * 0.4);
        }
      } else if (spec.pattern === 'burst_explosion') {
        for (let i = 0; i < count; i++) {
          const ang = (i * Math.PI * 2) / count + t * 1.4;
          const dist = t * 56;
          const px = targetX + Math.cos(ang) * dist;
          const py = targetY + Math.sin(ang) * dist;
          drawParticleFrame(ctx, primaryImg, px, py, scale * (1 - t * 0.2), frameTick + i, spec, 1 - t * 0.75);
        }
        if (secondaryImg && t < 0.7) {
          drawParticleFrame(ctx, secondaryImg, targetX, targetY, scale * 1.2, frameTick, undefined, 1 - t / 0.7);
        }
      } else {
        // orbit_aura
        for (let i = 0; i < count; i++) {
          const ang = (i * Math.PI * 2) / count + t * Math.PI * 2.2;
          const radius = 32 - t * 8;
          const rise = t * 28;
          const px = targetX + Math.cos(ang) * radius;
          const py = targetY + Math.sin(ang) * (radius * 0.55) - rise;
          drawParticleFrame(ctx, primaryImg, px, py, scale, frameTick + i, spec, 1 - Math.max(0, t - 0.7) / 0.3);
        }
        if (secondaryImg) {
          drawParticleFrame(ctx, secondaryImg, targetX, targetY - t * 14, scale * 0.9, frameTick, undefined, 1 - t * 0.6);
        }
      }

      if (t < 1) {
        rafId = requestAnimationFrame(animateGbaMove);
      } else {
        ctx.clearRect(0, 0, 512, 288);
      }
    };

    rafId = requestAnimationFrame(animateGbaMove);

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
