import React from 'react';

interface PokeBallGraphicProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export const PokeBallGraphic: React.FC<PokeBallGraphicProps> = ({
  className = 'w-24 h-24',
  size = 96,
  glow = true,
}) => {
  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer Glow */}
      {glow && (
        <div className="absolute inset-0 rounded-full bg-red-500/20 blur-md pointer-events-none transform scale-110" />
      )}

      {/* Pokéball SVG */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)] transform -rotate-12 hover:rotate-0 transition-transform duration-500"
      >
        <defs>
          {/* Top Red Dome Gradient */}
          <radialGradient id="pokeTopGrad" cx="35%" cy="25%" r="70%">
            <stop offset="0%" stopColor="#ff5a5a" />
            <stop offset="45%" stopColor="#e31a1a" />
            <stop offset="85%" stopColor="#a80b0b" />
            <stop offset="100%" stopColor="#750000" />
          </radialGradient>

          {/* Bottom White Dome Gradient */}
          <radialGradient id="pokeBottomGrad" cx="40%" cy="75%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#f0f2f5" />
            <stop offset="85%" stopColor="#d1d5db" />
            <stop offset="100%" stopColor="#9ca3af" />
          </radialGradient>

          {/* Button Outer Ring Gradient */}
          <linearGradient id="buttonRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2c3036" />
            <stop offset="100%" stopColor="#14171a" />
          </linearGradient>

          {/* Inner Button Glow */}
          <radialGradient id="innerButton" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#e5e7eb" />
            <stop offset="100%" stopColor="#9ca3af" />
          </radialGradient>
        </defs>

        {/* Outer Shadow Ring */}
        <circle cx="50" cy="50" r="48" fill="#111417" />

        {/* Top Half (Red) */}
        <path
          d="M 4 50 A 46 46 0 0 1 96 50 Z"
          fill="url(#pokeTopGrad)"
        />

        {/* Top Dome Specular Highlight Reflection */}
        <ellipse
          cx="38"
          cy="26"
          rx="18"
          ry="9"
          fill="#ffffff"
          opacity="0.45"
          transform="rotate(-20 38 26)"
        />

        {/* Bottom Half (White) */}
        <path
          d="M 4 50 A 46 46 0 0 0 96 50 Z"
          fill="url(#pokeBottomGrad)"
        />

        {/* Horizontal Black Belt Line */}
        <rect x="4" y="46" width="92" height="8" fill="#14171a" />

        {/* Center Button Ring (Black Band Border) */}
        <circle cx="50" cy="50" r="16" fill="url(#buttonRing)" />
        <circle cx="50" cy="50" r="15" fill="none" stroke="#33383f" strokeWidth="1" />

        {/* Center Button Inner Ring */}
        <circle cx="50" cy="50" r="10" fill="#14171a" />

        {/* Center White Trigger Button */}
        <circle cx="50" cy="50" r="7.5" fill="url(#innerButton)" />

        {/* Small Button Highlight */}
        <circle cx="48" cy="48" r="2.5" fill="#ffffff" opacity="0.8" />
      </svg>
    </div>
  );
};
