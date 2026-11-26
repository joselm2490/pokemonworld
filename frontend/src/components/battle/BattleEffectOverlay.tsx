import React, { useEffect, useRef } from 'react';
import { resolveGbaMoveAnimation, GbaMoveAnimSpec } from './gbaMoveAnimations';

export interface ActiveEffect {
  id: number;
  kind: 'attack' | 'pokeball' | 'heal' | 'drain' | 'stat_up' | 'stat_down' | 'paralyzed' | 'sleep';
  sheet: string;
  moveName?: string;
  moveType?: string;
  category?: string;
  statLabel?: string;
  targetIsPlayer: boolean;
}

interface BattleEffectOverlayProps {
  effect: ActiveEffect | null;
}

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
  rotation = 0,
  glowColor?: string
) {
  if (!img.complete || img.naturalWidth === 0) return;
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
  if (glowColor) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 8;
  }
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
    const targetY = effect.targetIsPlayer ? 204 : 146;
    const attackerX = effect.targetIsPlayer ? 384 : 128;
    const attackerY = effect.targetIsPlayer ? 146 : 204;

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

    // Paralysis spark + vibration
    if (effect.kind === 'paralyzed') {
      const sparkImg = getParticleImage(10036);
      const boltImg = getParticleImage(10001);
      const durationMs = 680;
      const startTime = performance.now();

      const animatePar = (now: number) => {
        if (cancelled) return;
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / durationMs);
        ctx.clearRect(0, 0, 512, 288);

        const vibX = Math.sin(elapsed * 0.08) * 5;
        const frameTick = Math.floor(elapsed / 55);
        drawParticleFrame(ctx, sparkImg, targetX + vibX, targetY, 1.8, frameTick, { frameW: 32, frameH: 32, frames: 4 }, Math.sin(t * Math.PI), 0, '#facc15');
        drawParticleFrame(ctx, boltImg, targetX - 24 + vibX, targetY - 12, 1.5, frameTick, undefined, Math.sin(t * Math.PI), 0, '#facc15');
        drawParticleFrame(ctx, boltImg, targetX + 24 + vibX, targetY + 8, 1.5, frameTick + 1, undefined, Math.sin(t * Math.PI), 0, '#facc15');

        if (t < 1) {
          rafId = requestAnimationFrame(animatePar);
        } else {
          ctx.clearRect(0, 0, 512, 288);
        }
      };

      rafId = requestAnimationFrame(animatePar);
      return () => {
        cancelled = true;
        cancelAnimationFrame(rafId);
        ctx.clearRect(0, 0, 512, 288);
      };
    }

    // Sleep: rising zZzZz above the sleeping Pokémon
    if (effect.kind === 'sleep') {
      const zImg = getParticleImage(10059);
      const durationMs = 720;
      const startTime = performance.now();

      const animateSleep = (now: number) => {
        if (cancelled) return;
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / durationMs);
        ctx.clearRect(0, 0, 512, 288);

        for (let i = 0; i < 3; i++) {
          const lt = (t - i * 0.18) / 0.65;
          if (lt < 0 || lt > 1) continue;
          const zx = targetX + 12 + Math.sin(lt * Math.PI * 2 + i) * 10;
          const zy = targetY - 28 - lt * 48;
          const alpha = Math.sin(lt * Math.PI);
          drawParticleFrame(ctx, zImg, zx, zy, 1.4 + lt * 0.4, 0, undefined, alpha, 0, '#93c5fd');
        }

        if (t < 1) {
          rafId = requestAnimationFrame(animateSleep);
        } else {
          ctx.clearRect(0, 0, 512, 288);
        }
      };

      rafId = requestAnimationFrame(animateSleep);
      return () => {
        cancelled = true;
        cancelAnimationFrame(rafId);
        ctx.clearRect(0, 0, 512, 288);
      };
    }

    // Heal / Drain (Leech Seed vines + green orbs)
    if (effect.kind === 'heal' || effect.kind === 'drain') {
      const orbImg = getParticleImage(10309);
      const sparkImg = getParticleImage(10031);
      const vineImg = getParticleImage(10334);
      const durationMs = 700;
      const startTime = performance.now();
      const isDrain = effect.kind === 'drain';

      const animateHealOrDrain = (now: number) => {
        if (cancelled) return;
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / durationMs);
        ctx.clearRect(0, 0, 512, 288);
        const frameTick = Math.floor(elapsed / 55);

        if (isDrain) {
          // Green vines wrapping the target Pokémon + orbs flowing back to healer
          if (t < 0.55) {
            const vt = t / 0.55;
            drawParticleFrame(ctx, vineImg, attackerX - 10, attackerY, 1.6, frameTick, undefined, Math.sin(vt * Math.PI), -0.3, '#22c55e');
            drawParticleFrame(ctx, vineImg, attackerX + 10, attackerY + 6, 1.6, frameTick, undefined, Math.sin(vt * Math.PI), 0.4, '#22c55e');
          }
          for (let i = 0; i < 10; i++) {
            const lt = (t - (i / 10) * 0.42) / 0.58;
            if (lt < 0 || lt > 1) continue;
            const arc = Math.sin(lt * Math.PI) * 32;
            const px = attackerX + (targetX - attackerX) * lt;
            const py = attackerY + (targetY - attackerY) * lt - arc;
            drawParticleFrame(ctx, orbImg, px, py, 1.1, frameTick + i, undefined, 0.95, 0, '#4ade80');
          }
        }

        const healAlpha = isDrain ? Math.max(0, (t - 0.35) / 0.65) : Math.sin(t * Math.PI);
        if (healAlpha > 0.01) {
          for (let i = 0; i < 8; i++) {
            const ang = (i * Math.PI * 2) / 8 + t * 1.8;
            const rx = Math.cos(ang) * 32;
            const ry = targetY + 18 - ((t * 54 + i * 7) % 54);
            drawParticleFrame(ctx, sparkImg, targetX + rx, ry, 1.3, frameTick + i, undefined, Math.sin(t * Math.PI), 0, '#4ade80');
          }
        }

        if (t < 1) {
          rafId = requestAnimationFrame(animateHealOrDrain);
        } else {
          ctx.clearRect(0, 0, 512, 288);
        }
      };

      rafId = requestAnimationFrame(animateHealOrDrain);
      return () => {
        cancelled = true;
        cancelAnimationFrame(rafId);
        ctx.clearRect(0, 0, 512, 288);
      };
    }

    // Stat Raise / Stat Drop
    if (effect.kind === 'stat_up' || effect.kind === 'stat_down') {
      const isUp = effect.kind === 'stat_up';
      const sparkImg = getParticleImage(isUp ? 10031 : 10123);
      const color = isUp ? '#38bdf8' : '#f43f5e';
      const accent = isUp ? '#fef08a' : '#fecdd3';
      const durationMs = 680;
      const startTime = performance.now();

      const animateStat = (now: number) => {
        if (cancelled) return;
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / durationMs);
        ctx.clearRect(0, 0, 512, 288);
        const frameTick = Math.floor(elapsed / 60);

        for (let i = 0; i < 4; i++) {
          const phase = (t * 1.4 + i * 0.25) % 1;
          const ox = ((i % 2 === 0 ? -1 : 1) * (18 + i * 6));
          const cy = isUp ? targetY + 24 - phase * 62 : targetY - 40 + phase * 62;
          drawParticleFrame(ctx, sparkImg, targetX + ox, cy, 1.3, frameTick + i, undefined, Math.sin(phase * Math.PI), 0, color);
        }

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = accent;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const chevrons = [-28, 0, 28];
        chevrons.forEach((ox, idx) => {
          const phase = (t * 1.5 + idx * 0.22) % 1;
          const cy = isUp ? targetY + 24 - phase * 68 : targetY - 44 + phase * 68;
          const dir = isUp ? 1 : -1;
          ctx.globalAlpha = Math.sin(phase * Math.PI) * 0.95;
          ctx.beginPath();
          ctx.moveTo(targetX + ox - 9, cy + dir * 7);
          ctx.lineTo(targetX + ox, cy);
          ctx.lineTo(targetX + ox + 9, cy + dir * 7);
          ctx.stroke();
        });

        if (effect.statLabel) {
          const floatY = isUp ? targetY - 38 - t * 20 : targetY - 56 + t * 20;
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = Math.sin(t * Math.PI);
          ctx.font = 'bold 13px monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = isUp ? '#0f172a' : '#450a0a';
          ctx.fillText(effect.statLabel, targetX + 1, floatY + 1);
          ctx.fillStyle = accent;
          ctx.fillText(effect.statLabel, targetX, floatY);
        }
        ctx.restore();

        if (t < 1) {
          rafId = requestAnimationFrame(animateStat);
        } else {
          ctx.clearRect(0, 0, 512, 288);
        }
      };

      rafId = requestAnimationFrame(animateStat);
      return () => {
        cancelled = true;
        cancelAnimationFrame(rafId);
        ctx.clearRect(0, 0, 512, 288);
      };
    }

    // Authentic Game Particle Move Animation Engine
    const spec = resolveGbaMoveAnimation(effect.moveName, effect.moveType, effect.category);
    const primaryImg = getParticleImage(spec.particleTag);
    const secondaryImg = spec.secondaryTag ? getParticleImage(spec.secondaryTag) : null;
    const count = spec.count || 10;
    const scale = spec.scale || 1.7;
    const durationMs = 600;
    const startTime = performance.now();

    const animateMoveParticles = (now: number) => {
      if (cancelled) return;
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);
      ctx.clearRect(0, 0, 512, 288);

      if (spec.screenTint && t < 0.94) {
        ctx.save();
        ctx.globalAlpha = Math.sin(t * Math.PI);
        ctx.fillStyle = spec.screenTint;
        ctx.fillRect(0, 0, 512, 288);
        ctx.restore();
      }

      const frameTick = Math.floor(elapsed / 55);

      if (spec.pattern === 'leech_seed') {
        // Seed flies to target, then green thorny vines wrap around target
        if (t < 0.38) {
          const lt = t / 0.38;
          const arc = Math.sin(lt * Math.PI) * 48;
          const px = attackerX + (targetX - attackerX) * lt;
          const py = attackerY + (targetY - attackerY) * lt - arc;
          if (secondaryImg) {
            drawParticleFrame(ctx, secondaryImg, px, py, 1.5, frameTick, undefined, 1, 0, spec.color);
          }
        } else {
          const vt = (t - 0.38) / 0.62;
          const alpha = Math.sin(vt * Math.PI);
          drawParticleFrame(ctx, primaryImg, targetX - 12, targetY, scale, frameTick, spec, alpha, -0.35, spec.color);
          drawParticleFrame(ctx, primaryImg, targetX + 12, targetY + 6, scale, frameTick + 1, spec, alpha, 0.35, spec.color);
        }
      } else if (spec.pattern === 'spore_fall') {
        // Spores drift down from above onto the target Pokémon + secondary spark/status
        for (let i = 0; i < count; i++) {
          const lt = (t - (i / count) * 0.35) / 0.65;
          if (lt < 0 || lt > 1) continue;
          const ox = ((i % 5) - 2) * 18 + Math.sin(lt * Math.PI * 3 + i) * 8;
          const py = targetY - 76 + lt * 88;
          drawParticleFrame(ctx, primaryImg, targetX + ox, py, scale, frameTick + i, spec, Math.sin(lt * Math.PI), 0, spec.color);
        }
        if (secondaryImg && t > 0.45) {
          const bt = (t - 0.45) / 0.55;
          drawParticleFrame(ctx, secondaryImg, targetX, targetY, scale * 0.95, frameTick, undefined, 1 - bt, 0, spec.color);
        }
      } else if (spec.pattern === 'stream') {
        for (let i = 0; i < count; i++) {
          const delayT = (i / count) * 0.48;
          const lt = (t - delayT) / 0.52;
          if (lt < 0 || lt > 1) continue;
          const wave = Math.sin(lt * Math.PI * 3 + i) * 7;
          const px = attackerX + (targetX - attackerX) * lt + wave;
          const py = attackerY + (targetY - attackerY) * lt - wave * 0.5;
          const fade = lt > 0.85 ? (1 - lt) / 0.15 : 1;
          drawParticleFrame(ctx, primaryImg, px, py, scale, frameTick + i, spec, fade, 0, spec.color);
        }
        if (secondaryImg && t > 0.4) {
          const bt = (t - 0.4) / 0.6;
          for (let i = 0; i < 4; i++) {
            const ang = (i * Math.PI) / 2 + bt * 2;
            drawParticleFrame(
              ctx,
              secondaryImg,
              targetX + Math.cos(ang) * bt * 28,
              targetY + Math.sin(ang) * bt * 28,
              scale * 0.85,
              frameTick + i,
              undefined,
              1 - bt,
              0,
              spec.color
            );
          }
        }
      } else if (spec.pattern === 'drain') {
        for (let i = 0; i < count; i++) {
          const lt = (t - (i / count) * 0.45) / 0.55;
          if (lt < 0 || lt > 1) continue;
          const arc = Math.sin(lt * Math.PI) * 28;
          const px = targetX + (attackerX - targetX) * lt;
          const py = targetY + (attackerY - targetY) * lt - arc;
          drawParticleFrame(ctx, primaryImg, px, py, scale, frameTick + i, spec, 1 - lt * 0.25, 0, spec.color);
        }
      } else if (spec.pattern === 'sky_strike') {
        for (let i = 0; i < count; i++) {
          const lt = (t - (i / count) * 0.4) / 0.6;
          if (lt < 0 || lt > 1) continue;
          const offsetX = ((i % 5) - 2) * 18;
          const startY = Math.max(-20, targetY - 140);
          const py = startY + (targetY - startY) * Math.min(1, lt * 1.35);
          const fade = lt > 0.8 ? (1 - lt) / 0.2 : 1;
          drawParticleFrame(ctx, primaryImg, targetX + offsetX, py, scale, frameTick + i, spec, fade, 0, spec.color);
        }
        if (secondaryImg && t > 0.25) {
          const bt = (t - 0.25) / 0.75;
          for (let i = 0; i < 6; i++) {
            const ang = (i * Math.PI) / 3 + bt * 1.5;
            drawParticleFrame(
              ctx,
              secondaryImg,
              targetX + Math.cos(ang) * bt * 38,
              targetY + Math.sin(ang) * bt * 38,
              scale * 0.8,
              frameTick + i,
              undefined,
              1 - bt,
              0,
              spec.color
            );
          }
        }
      } else if (spec.pattern === 'slash_claw') {
        const cuts = Math.min(4, Math.max(2, Math.floor(count / 2)));
        for (let i = 0; i < cuts; i++) {
          const lt = (t - i * 0.16) / 0.55;
          if (lt < 0 || lt > 1) continue;
          const ox = (i % 2 === 0 ? -1 : 1) * (1 - lt) * 18;
          const oy = -18 + lt * 36;
          const rot = i % 2 === 0 ? -0.35 : 0.35;
          drawParticleFrame(ctx, primaryImg, targetX + ox, targetY + oy, scale, Math.floor(lt * 4), spec, 1 - lt * 0.3, rot, spec.color);
        }
        if (secondaryImg && t > 0.2) {
          drawParticleFrame(ctx, secondaryImg, targetX, targetY, scale * 0.9, frameTick, undefined, 1 - t, 0, spec.color);
        }
      } else if (spec.pattern === 'bite_fang') {
        const snap = t < 0.45 ? t / 0.45 : 1;
        const openDist = (1 - Math.sin(snap * (Math.PI / 2))) * 34;
        const fade = t > 0.75 ? (1 - t) / 0.25 : 1;
        drawParticleFrame(ctx, primaryImg, targetX, targetY - openDist - 8, scale, 0, spec, fade, 0, spec.color);
        drawParticleFrame(ctx, primaryImg, targetX, targetY + openDist + 8, scale, 1, spec, fade, Math.PI, spec.color);
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
              1 - bt,
              0,
              spec.color
            );
          }
        }
      } else if (spec.pattern === 'punch_impact') {
        const hits = Math.min(4, Math.max(2, Math.floor(count / 2)));
        for (let i = 0; i < hits; i++) {
          const lt = (t - i * 0.14) / 0.48;
          if (lt < 0 || lt > 1) continue;
          const ox = (i % 2 === 0 ? -1 : 1) * 16 * (1 - lt * 0.5);
          const oy = (i < 2 ? -10 : 10) * (1 - lt * 0.5);
          const popScale = scale * (0.85 + Math.sin(lt * Math.PI) * 0.35);
          drawParticleFrame(ctx, primaryImg, targetX + ox, targetY + oy, popScale, frameTick + i, spec, 1 - lt * 0.35, 0, spec.color);
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
              1 - bt,
              0,
              spec.color
            );
          }
        }
      } else if (spec.pattern === 'field_weather') {
        // Full-arena weather sweep (Blizzard, Sandstorm, Rain Dance, Hail, Sunny Day)
        for (let i = 0; i < count; i++) {
          const phase = (t * 1.4 + i / count) % 1;
          const rowY = ((i * 53) % 270) + 10;
          const isRainOrHail = spec.particleTag === 10107 || spec.particleTag === 10043;
          const isSun = spec.particleTag === 10031;
          let px = 0;
          let py = 0;
          if (isSun) {
            px = ((i * 83) % 480) + 16;
            py = 20 + phase * 180;
          } else if (isRainOrHail) {
            px = 520 - phase * 560 + ((i * 37) % 140) - 70;
            py = -20 + phase * 320;
          } else {
            // Blizzard / Sandstorm horizontal-diagonal sweep across entire 512x288 arena
            px = 540 - phase * 600;
            py = rowY + Math.sin(phase * Math.PI * 3 + i) * 18;
          }
          drawParticleFrame(ctx, primaryImg, px, py, scale, frameTick + i, spec, Math.sin(t * Math.PI) * 0.95, 0, spec.color);
          if (secondaryImg && i % 3 === 0) {
            drawParticleFrame(ctx, secondaryImg, (px + 48) % 512, (py + 22) % 288, scale * 0.85, frameTick + i + 1, undefined, Math.sin(t * Math.PI) * 0.75, 0, spec.color);
          }
        }
      } else if (spec.pattern === 'meteor_storm') {
        // Draco Meteor: diagonal meteors streaking from upper-right across darkened field + impact bursts
        for (let i = 0; i < count; i++) {
          const lt = (t - (i / count) * 0.5) / 0.5;
          if (lt < 0 || lt > 1) continue;
          const endX = targetX + ((i % 5) - 2) * 28;
          const endY = targetY + ((i % 3) - 1) * 16;
          const startX = endX + 160;
          const startY = endY - 170;
          const px = startX + (endX - startX) * Math.min(1, lt * 1.15);
          const py = startY + (endY - startY) * Math.min(1, lt * 1.15);
          if (lt < 0.78) {
            drawParticleFrame(ctx, primaryImg, px, py, scale, frameTick + i, spec, 1, 0, spec.color);
          }
          if (secondaryImg && lt >= 0.65) {
            const bt = (lt - 0.65) / 0.35;
            drawParticleFrame(ctx, secondaryImg, endX, endY, scale * (0.9 + bt * 0.5), frameTick + i, undefined, 1 - bt, 0, spec.accent);
          }
        }
      } else if (spec.pattern === 'wave_surge') {
        for (let i = 0; i < count; i++) {
          const lt = Math.min(1, Math.max(0, (t - (i / count) * 0.3) / 0.7));
          if (lt <= 0) continue;
          const spreadX = ((i / (count - 1 || 1)) - 0.5) * 110;
          const riseY = Math.sin(lt * Math.PI) * 32;
          drawParticleFrame(ctx, primaryImg, targetX + spreadX, targetY + 18 - riseY, scale, frameTick + i, spec, 1 - lt * 0.4, 0, spec.color);
        }
      } else if (spec.pattern === 'burst_explosion') {
        for (let i = 0; i < count; i++) {
          const ang = (i * Math.PI * 2) / count + t * 1.4;
          const dist = t * 56;
          drawParticleFrame(ctx, primaryImg, targetX + Math.cos(ang) * dist, targetY + Math.sin(ang) * dist, scale * (1 - t * 0.2), frameTick + i, spec, 1 - t * 0.75, 0, spec.color);
        }
        if (secondaryImg && t < 0.7) {
          drawParticleFrame(ctx, secondaryImg, targetX, targetY, scale * 1.2, frameTick, undefined, 1 - t / 0.7, 0, spec.color);
        }
      } else {
        for (let i = 0; i < count; i++) {
          const ang = (i * Math.PI * 2) / count + t * Math.PI * 2.2;
          const radius = 32 - t * 8;
          const rise = t * 28;
          const px = targetX + Math.cos(ang) * radius;
          const py = targetY + Math.sin(ang) * (radius * 0.55) - rise;
          drawParticleFrame(ctx, primaryImg, px, py, scale, frameTick + i, spec, 1 - Math.max(0, t - 0.7) / 0.3, 0, spec.color);
        }
        if (secondaryImg) {
          drawParticleFrame(ctx, secondaryImg, targetX, targetY - t * 14, scale * 0.9, frameTick, undefined, 1 - t * 0.6, 0, spec.color);
        }
      }

      if (t < 1) {
        rafId = requestAnimationFrame(animateMoveParticles);
      } else {
        ctx.clearRect(0, 0, 512, 288);
      }
    };

    rafId = requestAnimationFrame(animateMoveParticles);

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
      className="absolute left-0 top-0 pointer-events-none"
      style={{ zIndex: 25 }}
    />
  );
};
