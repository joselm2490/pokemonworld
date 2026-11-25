import React, { useEffect, useRef } from 'react';
import { resolveGbaMoveAnimation } from './gbaMoveAnimations';

export interface ActiveEffect {
  id: number;
  kind: 'attack' | 'pokeball' | 'heal' | 'drain' | 'stat_up' | 'stat_down';
  sheet: string;
  moveName?: string;
  moveType?: string;
  category?: string;
  targetIsPlayer: boolean;
}

interface BattleEffectOverlayProps {
  effect: ActiveEffect | null;
}

function drawGlowOrb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  accent: string,
  alpha = 1
) {
  if (radius <= 0.5 || alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.globalCompositeOperation = 'lighter';
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0, accent);
  grad.addColorStop(0.35, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawShockwaveRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  accent: string,
  lineWidth: number,
  alpha: number
) {
  if (radius <= 1 || alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawSlashArc(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  progress: number,
  color: string,
  accent: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = Math.sin(progress * Math.PI);
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;

  const span = 54;
  const tipX = -span + progress * span * 2;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(tipX - 38, -14);
  ctx.quadraticCurveTo(tipX - 8, 0, tipX, 14);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.globalAlpha *= 0.55;
  ctx.stroke();
  ctx.restore();
}

function drawLightningBolt(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  seed: number,
  color: string,
  accent: string,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const steps = 9;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const jitter = i === 0 || i === steps ? 0 : Math.sin(seed * 7.3 + i * 3.1) * 18;
    pts.push([x1 + (x2 - x1) * t + jitter, y1 + (y2 - y1) * t]);
  }

  // Outer electric glow
  ctx.strokeStyle = color;
  ctx.lineWidth = 7;
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  pts.forEach(([px, py], idx) => (idx === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
  ctx.stroke();

  // White-hot inner core
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.5;
  ctx.shadowBlur = 6;
  ctx.stroke();
  ctx.restore();
}

function drawFangJaws(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  openDist: number,
  color: string,
  accent: string,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;

  const drawRow = (dir: -1 | 1, offsetY: number) => {
    ctx.beginPath();
    const teeth = [-26, -12, 0, 12, 26];
    teeth.forEach((tx, idx) => {
      const h = idx === 0 || idx === 4 ? 18 : 12;
      ctx.moveTo(x + tx - 6, y + offsetY);
      ctx.lineTo(x + tx, y + offsetY + dir * h);
      ctx.lineTo(x + tx + 6, y + offsetY);
    });
    ctx.closePath();
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.stroke();
  };

  drawRow(1, -openDist - 12);
  drawRow(-1, openDist + 12);
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

    if (effect.kind === 'heal' || effect.kind === 'drain') {
      const durationMs = 680;
      const startTime = performance.now();
      const isDrain = effect.kind === 'drain';

      const animateHealOrDrain = (now: number) => {
        if (cancelled) return;
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / durationMs);
        ctx.clearRect(0, 0, 512, 288);

        if (isDrain) {
          // Energy orbs flowing smoothly from damaged foe (attackerX/Y) -> healed Pokémon (targetX/Y)
          const count = 12;
          for (let i = 0; i < count; i++) {
            const lt = (t - (i / count) * 0.42) / 0.58;
            if (lt < 0 || lt > 1) continue;
            const arc = Math.sin(lt * Math.PI) * 32;
            const px = attackerX + (targetX - attackerX) * lt;
            const py = attackerY + (targetY - attackerY) * lt - arc;
            drawGlowOrb(ctx, px, py, 13, '#22c55e', '#dcfce7', 0.92);
          }
        }

        // Rising emerald/gold healing sparkles & soft aura on healed Pokémon
        const healAlpha = isDrain ? Math.max(0, (t - 0.3) / 0.7) : Math.sin(t * Math.PI);
        if (healAlpha > 0.01) {
          drawGlowOrb(ctx, targetX, targetY - 8, 42 * healAlpha, '#22c55e', '#bbf7d0', 0.42 * healAlpha);
          for (let i = 0; i < 10; i++) {
            const ang = (i * Math.PI * 2) / 10 + t * 1.8;
            const rx = Math.cos(ang) * 34;
            const ry = targetY + 18 - ((t * 58 + i * 7) % 58);
            const sparkAlpha = Math.sin(t * Math.PI) * 0.95;
            drawGlowOrb(ctx, targetX + rx, ry, 7, '#4ade80', '#ffffff', sparkAlpha);
          }
          drawShockwaveRing(ctx, targetX, targetY - t * 24, 18 + t * 30, '#4ade80', '#dcfce7', 2.5, (1 - t) * 0.8);
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

    if (effect.kind === 'stat_up' || effect.kind === 'stat_down') {
      const isUp = effect.kind === 'stat_up';
      const color = isUp ? '#38bdf8' : '#f43f5e';
      const accent = isUp ? '#fef08a' : '#fecdd3';
      const durationMs = 680;
      const startTime = performance.now();

      const animateStat = (now: number) => {
        if (cancelled) return;
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / durationMs);
        ctx.clearRect(0, 0, 512, 288);

        const alpha = Math.sin(t * Math.PI);
        drawGlowOrb(ctx, targetX, targetY, 44, color, accent, 0.38 * alpha);

        // Draw crisp rising (stat_up) or descending (stat_down) chevrons around the Pokémon
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
          const phase = (t * 1.4 + idx * 0.22) % 1;
          const cy = isUp
            ? targetY + 22 - phase * 64
            : targetY - 42 + phase * 64;
          const dir = isUp ? 1 : -1;
          ctx.globalAlpha = Math.sin(phase * Math.PI) * 0.95;
          ctx.beginPath();
          ctx.moveTo(targetX + ox - 9, cy + dir * 7);
          ctx.lineTo(targetX + ox, cy);
          ctx.lineTo(targetX + ox + 9, cy + dir * 7);
          ctx.stroke();
        });
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

    // Modern HD Canvas 2D Battle VFX Engine (60 FPS glowing particles, beams, lightning & shockwaves)
    const spec = resolveGbaMoveAnimation(effect.moveName, effect.moveType, effect.category);
    const count = spec.count || 14;
    const durationMs = 600;
    const startTime = performance.now();

    const animateHdVfx = (now: number) => {
      if (cancelled) return;
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);

      ctx.clearRect(0, 0, 512, 288);

      // Subtle atmospheric screen flash/tint
      if (spec.screenTint && t < 0.94) {
        ctx.save();
        ctx.globalAlpha = Math.sin(t * Math.PI);
        ctx.fillStyle = spec.screenTint;
        ctx.fillRect(0, 0, 512, 288);
        ctx.restore();
      }

      if (spec.pattern === 'stream') {
        // Charge flash on attacker
        if (t < 0.35) {
          drawGlowOrb(ctx, attackerX, attackerY, 26 * (1 - t / 0.35), spec.color, spec.accent, 0.8);
        }
        // Glowing projectile stream + trail
        for (let i = 0; i < count; i++) {
          const delayT = (i / count) * 0.45;
          const lt = (t - delayT) / 0.55;
          if (lt < 0 || lt > 1) continue;
          const wave = Math.sin(lt * Math.PI * 3 + i * 0.9) * 8;
          const px = attackerX + (targetX - attackerX) * lt + wave;
          const py = attackerY + (targetY - attackerY) * lt - wave * 0.5;
          const rad = (14 + (i % 3) * 4) * (1 - lt * 0.25);
          drawGlowOrb(ctx, px, py, rad, spec.color, spec.accent, 0.9);
        }
        // Impact shockwave & sparks
        if (t > 0.38) {
          const bt = (t - 0.38) / 0.62;
          drawShockwaveRing(ctx, targetX, targetY, 10 + bt * 56, spec.color, spec.accent, 4 * (1 - bt), 1 - bt);
          drawGlowOrb(ctx, targetX, targetY, 44 * (1 - bt * 0.5), spec.color, spec.accent, 1 - bt);
        }
      } else if (spec.pattern === 'drain') {
        for (let i = 0; i < count; i++) {
          const delayT = (i / count) * 0.45;
          const lt = (t - delayT) / 0.55;
          if (lt < 0 || lt > 1) continue;
          const arc = Math.sin(lt * Math.PI) * 32;
          const px = targetX + (attackerX - targetX) * lt;
          const py = targetY + (attackerY - targetY) * lt - arc;
          drawGlowOrb(ctx, px, py, 14, spec.color, spec.accent, 0.9);
        }
        if (t > 0.5) {
          const bt = (t - 0.5) / 0.5;
          drawShockwaveRing(ctx, attackerX, attackerY, 10 + bt * 42, spec.color, spec.accent, 3, 1 - bt);
        }
      } else if (spec.pattern === 'sky_strike') {
        if (spec.style === 'bolt') {
          const flicker = Math.sin(t * Math.PI * 10) > -0.4 ? 1 : 0.35;
          drawLightningBolt(ctx, targetX - 18, 0, targetX, targetY, Math.floor(elapsed / 50), spec.color, spec.accent, (1 - t * 0.4) * flicker);
          drawLightningBolt(ctx, targetX + 20, 0, targetX + 4, targetY + 6, Math.floor(elapsed / 40) + 3, spec.color, spec.accent, (1 - t * 0.5) * flicker);
          drawShockwaveRing(ctx, targetX, targetY, 12 + t * 60, spec.color, spec.accent, 4 * (1 - t), 1 - t);
          drawGlowOrb(ctx, targetX, targetY, 48 * Math.sin(t * Math.PI), spec.color, spec.accent, 0.95);
        } else {
          for (let i = 0; i < count; i++) {
            const delayT = (i / count) * 0.45;
            const lt = (t - delayT) / 0.55;
            if (lt < 0 || lt > 1) continue;
            const ox = ((i % 5) - 2) * 20;
            const sy = Math.max(-20, targetY - 145);
            const py = sy + (targetY - sy) * Math.min(1, lt * 1.3);
            drawGlowOrb(ctx, targetX + ox, py, 16, spec.color, spec.accent, 1 - lt * 0.3);
            if (lt > 0.65) {
              const bt = (lt - 0.65) / 0.35;
              drawShockwaveRing(ctx, targetX + ox, targetY, bt * 28, spec.color, spec.accent, 2.5, 1 - bt);
            }
          }
        }
      } else if (spec.pattern === 'slash_claw') {
        const cuts = 3;
        for (let i = 0; i < cuts; i++) {
          const lt = (t - i * 0.16) / 0.55;
          if (lt < 0 || lt > 1) continue;
          const ang = i === 0 ? -0.65 : i === 1 ? 0.65 : 0;
          drawSlashArc(ctx, targetX, targetY, ang, lt, spec.color, spec.accent);
        }
        drawShockwaveRing(ctx, targetX, targetY, 8 + t * 52, spec.color, spec.accent, 3 * (1 - t), 1 - t);
      } else if (spec.pattern === 'bite_fang') {
        const snap = t < 0.45 ? t / 0.45 : 1;
        const openDist = (1 - Math.sin(snap * (Math.PI / 2))) * 32;
        const fade = t > 0.75 ? (1 - t) / 0.25 : 1;
        drawFangJaws(ctx, targetX, targetY, openDist, spec.color, spec.accent, fade);
        if (t > 0.35) {
          const bt = (t - 0.35) / 0.65;
          drawShockwaveRing(ctx, targetX, targetY, 8 + bt * 58, spec.color, spec.accent, 4 * (1 - bt), 1 - bt);
          drawGlowOrb(ctx, targetX, targetY, 42 * (1 - bt), spec.color, spec.accent, 0.9 * (1 - bt));
        }
      } else if (spec.pattern === 'punch_impact') {
        const hits = 3;
        for (let i = 0; i < hits; i++) {
          const lt = (t - i * 0.16) / 0.55;
          if (lt < 0 || lt > 1) continue;
          const ox = (i - 1) * 18;
          const oy = i === 1 ? -12 : 8;
          drawGlowOrb(ctx, targetX + ox, targetY + oy, 36 * (1 - lt * 0.4), spec.color, spec.accent, 1 - lt);
          drawShockwaveRing(ctx, targetX + ox, targetY + oy, 10 + lt * 46, spec.color, spec.accent, 3.5 * (1 - lt), 1 - lt);
        }
      } else if (spec.pattern === 'wave_surge') {
        for (let i = 0; i < count; i++) {
          const lt = Math.min(1, Math.max(0, (t - (i / count) * 0.25) / 0.75));
          if (lt <= 0) continue;
          const sx = ((i / (count - 1 || 1)) - 0.5) * 120;
          const ry = Math.sin(lt * Math.PI) * 38;
          drawGlowOrb(ctx, targetX + sx, targetY + 18 - ry, 18, spec.color, spec.accent, 0.85 * (1 - lt * 0.35));
        }
        drawShockwaveRing(ctx, targetX, targetY, 15 + t * 65, spec.color, spec.accent, 4 * (1 - t), 1 - t);
      } else if (spec.pattern === 'burst_explosion') {
        drawGlowOrb(ctx, targetX, targetY, 64 * Math.sin(t * Math.PI), spec.color, spec.accent, 1);
        drawShockwaveRing(ctx, targetX, targetY, 10 + t * 76, spec.color, spec.accent, 5 * (1 - t), 1 - t);
        for (let i = 0; i < count; i++) {
          const ang = (i * Math.PI * 2) / count + t * 1.2;
          const dist = t * 68;
          drawGlowOrb(ctx, targetX + Math.cos(ang) * dist, targetY + Math.sin(ang) * dist, 14 * (1 - t * 0.5), spec.color, spec.accent, 1 - t);
        }
      } else {
        // orbit_aura
        if (spec.style === 'shield') {
          drawShockwaveRing(ctx, targetX, targetY, 44, spec.color, spec.accent, 4, Math.sin(t * Math.PI));
          drawGlowOrb(ctx, targetX, targetY, 50, spec.color, spec.accent, 0.35 * Math.sin(t * Math.PI));
        } else {
          for (let i = 0; i < count; i++) {
            const ang = (i * Math.PI * 2) / count + t * Math.PI * 2.4;
            const radius = 36 - t * 8;
            const rise = t * 32;
            const px = targetX + Math.cos(ang) * radius;
            const py = targetY + Math.sin(ang) * (radius * 0.55) - rise;
            drawGlowOrb(ctx, px, py, 12, spec.color, spec.accent, 0.9 * (1 - Math.max(0, t - 0.7) / 0.3));
          }
          drawShockwaveRing(ctx, targetX, targetY - t * 18, 16 + t * 34, spec.color, spec.accent, 2.5, 1 - t);
        }
      }

      if (t < 1) {
        rafId = requestAnimationFrame(animateHdVfx);
      } else {
        ctx.clearRect(0, 0, 512, 288);
      }
    };

    rafId = requestAnimationFrame(animateHdVfx);

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
