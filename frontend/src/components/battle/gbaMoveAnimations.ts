export type GbaAnimPattern =
  | 'stream'
  | 'sky_strike'
  | 'slash_claw'
  | 'bite_fang'
  | 'punch_impact'
  | 'orbit_aura'
  | 'burst_explosion'
  | 'wave_surge'
  | 'field_weather'
  | 'meteor_storm'
  | 'drain'
  | 'leech_seed'
  | 'spore_fall';

export interface GbaMoveAnimSpec {
  pattern: GbaAnimPattern;
  particleTag: number;
  secondaryTag?: number;
  color: string;
  accent: string;
  screenTint?: string;
  count?: number;
  scale?: number;
  /** Original 1x frame dimensions (before 4x Scale2x upscaling) */
  frameW?: number;
  frameH?: number;
  frames?: number;
}

const TYPE_DEFAULTS: Record<string, { special: GbaMoveAnimSpec; physical: GbaMoveAnimSpec; status: GbaMoveAnimSpec }> = {
  FIRE: {
    special: { pattern: 'stream', particleTag: 10033, secondaryTag: 10035, color: '#ff5500', accent: '#fff3b0', screenTint: 'rgba(255, 75, 15, 0.16)', count: 12, scale: 1.7, frameW: 16, frameH: 16, frames: 4 },
    physical: { pattern: 'punch_impact', particleTag: 10055, secondaryTag: 10033, color: '#ff5500', accent: '#ffe066', count: 6, scale: 1.8 },
    status: { pattern: 'orbit_aura', particleTag: 10076, color: '#60a5fa', accent: '#e0f2fe', count: 8, scale: 1.5 },
  },
  WATER: {
    special: { pattern: 'stream', particleTag: 10042, secondaryTag: 10113, color: '#0ea5e9', accent: '#bae6fd', screenTint: 'rgba(14, 165, 233, 0.15)', count: 10, scale: 1.6 },
    physical: { pattern: 'wave_surge', particleTag: 10113, secondaryTag: 10042, color: '#0284c7', accent: '#e0f2fe', count: 8, scale: 1.8 },
    status: { pattern: 'orbit_aura', particleTag: 10042, color: '#38bdf8', accent: '#e0f2fe', count: 8, scale: 1.5 },
  },
  ELECTRIC: {
    special: { pattern: 'sky_strike', particleTag: 10037, secondaryTag: 10036, color: '#facc15', accent: '#ffffff', screenTint: 'rgba(250, 204, 21, 0.22)', count: 6, scale: 1.9 },
    physical: { pattern: 'punch_impact', particleTag: 10055, secondaryTag: 10036, color: '#facc15', accent: '#ffffff', count: 6, scale: 1.8 },
    status: { pattern: 'orbit_aura', particleTag: 10001, secondaryTag: 10036, color: '#facc15', accent: '#fef9c3', count: 8, scale: 1.6 },
  },
  GRASS: {
    special: { pattern: 'stream', particleTag: 10309, secondaryTag: 10063, color: '#22c55e', accent: '#bbf7d0', count: 10, scale: 1.6 },
    physical: { pattern: 'slash_claw', particleTag: 10063, secondaryTag: 10319, color: '#22c55e', accent: '#dcfce7', count: 6, scale: 1.8 },
    status: { pattern: 'orbit_aura', particleTag: 10159, secondaryTag: 10031, color: '#4ade80', accent: '#fef08a', count: 10, scale: 1.6 },
  },
  ICE: {
    special: { pattern: 'stream', particleTag: 10043, secondaryTag: 10031, color: '#38bdf8', accent: '#ffffff', screenTint: 'rgba(125, 211, 252, 0.18)', count: 10, scale: 1.6 },
    physical: { pattern: 'sky_strike', particleTag: 10262, secondaryTag: 10043, color: '#38bdf8', accent: '#f0f9ff', count: 8, scale: 1.8 },
    status: { pattern: 'orbit_aura', particleTag: 10043, color: '#7dd3fc', accent: '#ffffff', count: 8, scale: 1.5 },
  },
  FIGHTING: {
    special: { pattern: 'stream', particleTag: 10308, secondaryTag: 10084, color: '#3b82f6', accent: '#e0f2fe', count: 8, scale: 1.9 },
    physical: { pattern: 'punch_impact', particleTag: 10055, secondaryTag: 10035, color: '#ef4444', accent: '#fde047', count: 6, scale: 1.9 },
    status: { pattern: 'orbit_aura', particleTag: 10031, color: '#f97316', accent: '#fef08a', count: 8, scale: 1.6 },
  },
  POISON: {
    special: { pattern: 'stream', particleTag: 10123, secondaryTag: 10150, color: '#a855f7', accent: '#f0abfc', screenTint: 'rgba(147, 51, 234, 0.16)', count: 10, scale: 1.6 },
    physical: { pattern: 'slash_claw', particleTag: 10123, secondaryTag: 10215, color: '#a855f7', accent: '#f5d0fe', count: 6, scale: 1.8 },
    status: { pattern: 'spore_fall', particleTag: 10065, secondaryTag: 10123, color: '#a855f7', accent: '#f0abfc', count: 10, scale: 1.7, frameW: 16, frameH: 16, frames: 4 },
  },
  GROUND: {
    special: { pattern: 'sky_strike', particleTag: 10083, secondaryTag: 10300, color: '#d97706', accent: '#fde68a', count: 8, scale: 1.8 },
    physical: { pattern: 'wave_surge', particleTag: 10300, secondaryTag: 10114, color: '#d97706', accent: '#fde68a', count: 10, scale: 1.9 },
    status: { pattern: 'orbit_aura', particleTag: 10114, color: '#d97706', accent: '#fde68a', count: 8, scale: 1.6 },
  },
  FLYING: {
    special: { pattern: 'wave_surge', particleTag: 10009, color: '#7dd3fc', accent: '#ffffff', count: 8, scale: 1.9 },
    physical: { pattern: 'slash_claw', particleTag: 10075, secondaryTag: 10270, color: '#7dd3fc', accent: '#ffffff', count: 6, scale: 1.8 },
    status: { pattern: 'orbit_aura', particleTag: 10270, color: '#7dd3fc', accent: '#ffffff', count: 8, scale: 1.6 },
  },
  PSYCHIC: {
    special: { pattern: 'orbit_aura', particleTag: 10196, secondaryTag: 10031, color: '#ec4899', accent: '#fbcfe8', screenTint: 'rgba(236, 72, 153, 0.18)', count: 6, scale: 1.7 },
    physical: { pattern: 'slash_claw', particleTag: 10075, secondaryTag: 10196, color: '#ec4899', accent: '#fbcfe8', count: 6, scale: 1.8 },
    status: { pattern: 'orbit_aura', particleTag: 10196, color: '#ec4899', accent: '#fbcfe8', count: 6, scale: 1.6 },
  },
  BUG: {
    special: { pattern: 'stream', particleTag: 10089, secondaryTag: 10031, color: '#84cc16', accent: '#ecfccb', count: 10, scale: 1.6 },
    physical: { pattern: 'slash_claw', particleTag: 10285, color: '#84cc16', accent: '#ecfccb', count: 6, scale: 2.0 },
    status: { pattern: 'orbit_aura', particleTag: 10098, color: '#e2e8f0', accent: '#ffffff', count: 6, scale: 1.7 },
  },
  ROCK: {
    special: { pattern: 'stream', particleTag: 10114, color: '#a8a29e', accent: '#fde68a', count: 10, scale: 1.8 },
    physical: { pattern: 'sky_strike', particleTag: 10300, secondaryTag: 10114, color: '#a8a29e', accent: '#fde68a', count: 10, scale: 1.9 },
    status: { pattern: 'orbit_aura', particleTag: 10114, color: '#a8a29e', accent: '#fde68a', count: 8, scale: 1.6 },
  },
  GHOST: {
    special: { pattern: 'stream', particleTag: 10176, secondaryTag: 10200, color: '#7c3aed', accent: '#ddd6fe', screenTint: 'rgba(30, 10, 60, 0.28)', count: 10, scale: 1.8 },
    physical: { pattern: 'slash_claw', particleTag: 10193, secondaryTag: 10215, color: '#7c3aed', accent: '#ddd6fe', screenTint: 'rgba(30, 10, 60, 0.22)', count: 6, scale: 2.0 },
    status: { pattern: 'orbit_aura', particleTag: 10200, color: '#7c3aed', accent: '#ddd6fe', screenTint: 'rgba(30, 10, 60, 0.24)', count: 6, scale: 1.8 },
  },
  DRAGON: {
    special: { pattern: 'stream', particleTag: 10128, secondaryTag: 10256, color: '#6366f1', accent: '#c7d2fe', screenTint: 'rgba(79, 70, 229, 0.18)', count: 10, scale: 1.8 },
    physical: { pattern: 'slash_claw', particleTag: 10215, secondaryTag: 10128, color: '#6366f1', accent: '#c7d2fe', count: 6, scale: 2.0 },
    status: { pattern: 'orbit_aura', particleTag: 10128, color: '#6366f1', accent: '#c7d2fe', count: 8, scale: 1.7 },
  },
  DARK: {
    special: { pattern: 'burst_explosion', particleTag: 10176, color: '#4c1d95', accent: '#e9d5ff', screenTint: 'rgba(15, 10, 30, 0.28)', count: 10, scale: 1.9 },
    physical: { pattern: 'bite_fang', particleTag: 10104, color: '#4c1d95', accent: '#e9d5ff', screenTint: 'rgba(15, 10, 30, 0.22)', count: 6, scale: 1.9 },
    status: { pattern: 'orbit_aura', particleTag: 10176, color: '#4c1d95', accent: '#e9d5ff', count: 6, scale: 1.7 },
  },
  STEEL: {
    special: { pattern: 'stream', particleTag: 10301, secondaryTag: 10031, color: '#94a3b8', accent: '#f8fafc', count: 10, scale: 1.7 },
    physical: { pattern: 'slash_claw', particleTag: 10018, secondaryTag: 10035, color: '#94a3b8', accent: '#f8fafc', count: 6, scale: 2.0 },
    status: { pattern: 'orbit_aura', particleTag: 10301, color: '#94a3b8', accent: '#f8fafc', count: 6, scale: 1.7 },
  },
  FAIRY: {
    special: { pattern: 'stream', particleTag: 10191, secondaryTag: 10027, color: '#f472b6', accent: '#fdf2f8', screenTint: 'rgba(244, 114, 182, 0.18)', count: 10, scale: 1.6 },
    physical: { pattern: 'punch_impact', particleTag: 10027, secondaryTag: 10210, color: '#f472b6', accent: '#fdf2f8', count: 8, scale: 1.7 },
    status: { pattern: 'orbit_aura', particleTag: 10159, secondaryTag: 10031, color: '#f472b6', accent: '#fdf2f8', count: 10, scale: 1.6 },
  },
  NORMAL: {
    special: { pattern: 'stream', particleTag: 10084, secondaryTag: 10027, color: '#e2e8f0', accent: '#ffffff', count: 10, scale: 1.7 },
    physical: { pattern: 'punch_impact', particleTag: 10035, secondaryTag: 10055, color: '#e2e8f0', accent: '#ffffff', count: 6, scale: 1.9 },
    status: { pattern: 'orbit_aura', particleTag: 10031, color: '#e2e8f0', accent: '#ffffff', count: 8, scale: 1.6 },
  },
};

const ICONIC_MOVES: Record<string, GbaMoveAnimSpec> = {
  // Leech Seed / Drain
  'leech seed': { pattern: 'leech_seed', particleTag: 10334, secondaryTag: 10089, color: '#22c55e', accent: '#bbf7d0', count: 8, scale: 1.7 },
  'giga drain': { pattern: 'drain', particleTag: 10309, secondaryTag: 10063, color: '#22c55e', accent: '#bbf7d0', count: 12, scale: 1.5 },
  'mega drain': { pattern: 'drain', particleTag: 10309, color: '#22c55e', accent: '#bbf7d0', count: 10, scale: 1.4 },
  absorb: { pattern: 'drain', particleTag: 10309, color: '#22c55e', accent: '#bbf7d0', count: 8, scale: 1.4 },
  'leech life': { pattern: 'drain', particleTag: 10309, secondaryTag: 10104, color: '#84cc16', accent: '#ecfccb', count: 10, scale: 1.5 },
  'drain punch': { pattern: 'drain', particleTag: 10055, secondaryTag: 10309, color: '#f97316', accent: '#fef08a', count: 10, scale: 1.6 },
  'horn leech': { pattern: 'drain', particleTag: 10309, secondaryTag: 10334, color: '#22c55e', accent: '#bbf7d0', count: 10, scale: 1.6 },
  'draining kiss': { pattern: 'drain', particleTag: 10210, secondaryTag: 10309, color: '#f472b6', accent: '#fdf2f8', count: 10, scale: 1.6 },

  // Spores (Yellow Stun Spore vs Purple Poison Powder vs Sleep)
  'stun spore': { pattern: 'spore_fall', particleTag: 10068, secondaryTag: 10036, color: '#facc15', accent: '#ffffff', count: 12, scale: 1.7, frameW: 16, frameH: 16, frames: 4 },
  'poison powder': { pattern: 'spore_fall', particleTag: 10065, secondaryTag: 10123, color: '#a855f7', accent: '#f0abfc', count: 12, scale: 1.7, frameW: 16, frameH: 16, frames: 4 },
  'sleep powder': { pattern: 'spore_fall', particleTag: 10067, secondaryTag: 10059, color: '#4ade80', accent: '#dcfce7', count: 12, scale: 1.7, frameW: 16, frameH: 16, frames: 4 },
  spore: { pattern: 'spore_fall', particleTag: 10068, secondaryTag: 10059, color: '#fde047', accent: '#ffffff', count: 12, scale: 1.7, frameW: 16, frameH: 16, frames: 4 },

  // Fire
  flamethrower: { pattern: 'stream', particleTag: 10033, secondaryTag: 10035, color: '#ff5500', accent: '#fff3b0', screenTint: 'rgba(255, 85, 20, 0.18)', count: 14, scale: 1.7, frameW: 16, frameH: 16, frames: 4 },
  'fire blast': { pattern: 'burst_explosion', particleTag: 10033, secondaryTag: 10256, color: '#ff4500', accent: '#fff3b0', screenTint: 'rgba(255, 70, 15, 0.24)', count: 14, scale: 1.9, frameW: 16, frameH: 16, frames: 4 },
  ember: { pattern: 'stream', particleTag: 10033, color: '#ff6b1a', accent: '#ffe066', count: 6, scale: 1.4, frameW: 16, frameH: 16, frames: 4 },
  'flare blitz': { pattern: 'punch_impact', particleTag: 10256, secondaryTag: 10033, color: '#ff4d00', accent: '#fff3b0', screenTint: 'rgba(255, 80, 15, 0.22)', count: 10, scale: 1.6 },
  'fire punch': { pattern: 'punch_impact', particleTag: 10055, secondaryTag: 10033, color: '#ff5500', accent: '#ffe066', count: 8, scale: 1.8 },
  'fire fang': { pattern: 'bite_fang', particleTag: 10104, secondaryTag: 10033, color: '#ff5500', accent: '#ffe066', count: 6, scale: 1.8 },
  'will-o-wisp': { pattern: 'orbit_aura', particleTag: 10076, color: '#60a5fa', accent: '#e0f2fe', screenTint: 'rgba(30, 10, 50, 0.25)', count: 6, scale: 1.5 },
  eruption: { pattern: 'sky_strike', particleTag: 10083, secondaryTag: 10033, color: '#ff3b00', accent: '#fde047', screenTint: 'rgba(255, 60, 10, 0.22)', count: 10, scale: 1.8 },
  'heat wave': { pattern: 'wave_surge', particleTag: 10033, color: '#ff6b00', accent: '#fef08a', screenTint: 'rgba(255, 100, 30, 0.20)', count: 12, scale: 1.7, frameW: 16, frameH: 16, frames: 4 },

  // Electric
  thunderbolt: { pattern: 'sky_strike', particleTag: 10037, secondaryTag: 10036, color: '#facc15', accent: '#ffffff', screenTint: 'rgba(255, 240, 70, 0.22)', count: 8, scale: 2.0 },
  thunder: { pattern: 'sky_strike', particleTag: 10037, secondaryTag: 10001, color: '#eab308', accent: '#ffffff', screenTint: 'rgba(255, 245, 90, 0.30)', count: 10, scale: 2.2 },
  'thunder punch': { pattern: 'punch_impact', particleTag: 10055, secondaryTag: 10036, color: '#facc15', accent: '#ffffff', count: 8, scale: 1.8 },
  'thunder fang': { pattern: 'bite_fang', particleTag: 10104, secondaryTag: 10036, color: '#facc15', accent: '#ffffff', count: 6, scale: 1.8 },
  'thunder wave': { pattern: 'orbit_aura', particleTag: 10001, secondaryTag: 10036, color: '#facc15', accent: '#fef9c3', screenTint: 'rgba(255, 230, 60, 0.16)', count: 8, scale: 1.7 },
  spark: { pattern: 'burst_explosion', particleTag: 10001, secondaryTag: 10036, color: '#facc15', accent: '#ffffff', count: 8, scale: 1.6 },

  // Water
  'hydro pump': { pattern: 'stream', particleTag: 10113, secondaryTag: 10042, color: '#0284c7', accent: '#e0f2fe', screenTint: 'rgba(30, 120, 255, 0.18)', count: 12, scale: 1.9 },
  surf: { pattern: 'wave_surge', particleTag: 10113, secondaryTag: 10042, color: '#0ea5e9', accent: '#e0f2fe', screenTint: 'rgba(20, 130, 255, 0.20)', count: 12, scale: 1.9 },
  'water gun': { pattern: 'stream', particleTag: 10298, secondaryTag: 10042, color: '#38bdf8', accent: '#f0f9ff', count: 10, scale: 1.7 },
  scald: { pattern: 'stream', particleTag: 10262, secondaryTag: 10058, color: '#0ea5e9', accent: '#fecaca', count: 10, scale: 1.7 },
  'bubble beam': { pattern: 'stream', particleTag: 10042, color: '#60a5fa', accent: '#ffffff', count: 12, scale: 1.5 },
  waterfall: { pattern: 'wave_surge', particleTag: 10113, color: '#2563eb', accent: '#bae6fd', count: 10, scale: 1.9 },

  // Ice
  'ice beam': { pattern: 'stream', particleTag: 10043, secondaryTag: 10031, color: '#38bdf8', accent: '#ffffff', screenTint: 'rgba(130, 225, 255, 0.20)', count: 12, scale: 1.6 },
  // Weather & Full-Field Moves
  blizzard: { pattern: 'field_weather', particleTag: 10093, secondaryTag: 10043, color: '#7dd3fc', accent: '#ffffff', screenTint: 'rgba(130, 215, 255, 0.32)', count: 22, scale: 1.6, frameW: 32, frameH: 32, frames: 4 },
  sandstorm: { pattern: 'field_weather', particleTag: 10261, secondaryTag: 10114, color: '#d97706', accent: '#fde68a', screenTint: 'rgba(194, 138, 62, 0.38)', count: 20, scale: 1.8 },
  'rain dance': { pattern: 'field_weather', particleTag: 10107, secondaryTag: 10298, color: '#38bdf8', accent: '#e0f2fe', screenTint: 'rgba(20, 90, 180, 0.30)', count: 24, scale: 1.6 },
  'sunny day': { pattern: 'field_weather', particleTag: 10031, secondaryTag: 10135, color: '#facc15', accent: '#fef9c3', screenTint: 'rgba(255, 195, 45, 0.28)', count: 16, scale: 1.8 },
  hail: { pattern: 'field_weather', particleTag: 10043, secondaryTag: 10093, color: '#7dd3fc', accent: '#ffffff', screenTint: 'rgba(150, 225, 255, 0.26)', count: 20, scale: 1.5 },
  snowscape: { pattern: 'field_weather', particleTag: 10093, secondaryTag: 10043, color: '#bae6fd', accent: '#ffffff', screenTint: 'rgba(165, 230, 255, 0.26)', count: 20, scale: 1.5, frameW: 32, frameH: 32, frames: 4 },
  'ice punch': { pattern: 'punch_impact', particleTag: 10055, secondaryTag: 10043, color: '#38bdf8', accent: '#f0f9ff', count: 8, scale: 1.8 },
  'ice fang': { pattern: 'bite_fang', particleTag: 10104, secondaryTag: 10043, color: '#38bdf8', accent: '#f0f9ff', count: 6, scale: 1.8 },
  'icicle crash': { pattern: 'sky_strike', particleTag: 10262, secondaryTag: 10043, color: '#38bdf8', accent: '#ffffff', count: 10, scale: 1.9 },
  'ice shard': { pattern: 'stream', particleTag: 10262, color: '#7dd3fc', accent: '#ffffff', count: 8, scale: 1.7 },

  // Grass
  'solar beam': { pattern: 'stream', particleTag: 10309, secondaryTag: 10031, color: '#4ade80', accent: '#fef9c3', screenTint: 'rgba(180, 255, 100, 0.20)', count: 12, scale: 1.8 },
  'energy ball': { pattern: 'stream', particleTag: 10309, secondaryTag: 10063, color: '#22c55e', accent: '#dcfce7', count: 10, scale: 1.7 },
  'razor leaf': { pattern: 'stream', particleTag: 10063, color: '#16a34a', accent: '#bbf7d0', count: 10, scale: 1.8 },
  'leaf blade': { pattern: 'slash_claw', particleTag: 10063, secondaryTag: 10075, color: '#22c55e', accent: '#ecfccb', count: 6, scale: 2.0 },
  'petal dance': { pattern: 'burst_explosion', particleTag: 10159, color: '#f472b6', accent: '#fbcfe8', count: 12, scale: 1.8 },
  'petal blizzard': { pattern: 'wave_surge', particleTag: 10159, color: '#f472b6', accent: '#fdf2f8', count: 14, scale: 1.8 },
  synthesis: { pattern: 'orbit_aura', particleTag: 10031, secondaryTag: 10159, color: '#4ade80', accent: '#fef08a', count: 10, scale: 1.5 },

  // Ghost & Dark
  'shadow ball': { pattern: 'stream', particleTag: 10176, secondaryTag: 10171, color: '#7c3aed', accent: '#ddd6fe', screenTint: 'rgba(20, 10, 45, 0.30)', count: 10, scale: 1.9 },
  'shadow claw': { pattern: 'slash_claw', particleTag: 10193, secondaryTag: 10215, color: '#7c3aed', accent: '#e9d5ff', screenTint: 'rgba(25, 10, 45, 0.24)', count: 6, scale: 2.0 },
  'dark pulse': { pattern: 'burst_explosion', particleTag: 10176, color: '#581c87', accent: '#d8b4fe', screenTint: 'rgba(15, 10, 30, 0.32)', count: 12, scale: 2.0 },
  'night slash': { pattern: 'slash_claw', particleTag: 10304, secondaryTag: 10215, color: '#6b21a8', accent: '#f3e8ff', screenTint: 'rgba(15, 10, 30, 0.26)', count: 6, scale: 2.0 },
  crunch: { pattern: 'bite_fang', particleTag: 10104, color: '#a855f7', accent: '#ffffff', screenTint: 'rgba(20, 15, 25, 0.20)', count: 6, scale: 2.0 },
  bite: { pattern: 'bite_fang', particleTag: 10104, color: '#cbd5e1', accent: '#ffffff', count: 4, scale: 1.8 },

  // Psychic & Fairy
  psychic: { pattern: 'orbit_aura', particleTag: 10196, color: '#ec4899', accent: '#fbcfe8', screenTint: 'rgba(220, 70, 220, 0.20)', count: 6, scale: 1.8 },
  psyshock: { pattern: 'sky_strike', particleTag: 10196, secondaryTag: 10027, color: '#ec4899', accent: '#ffffff', screenTint: 'rgba(220, 80, 220, 0.18)', count: 8, scale: 1.7 },
  'calm mind': { pattern: 'orbit_aura', particleTag: 10031, secondaryTag: 10196, color: '#a855f7', accent: '#e9d5ff', count: 10, scale: 1.6 },
  moonblast: { pattern: 'stream', particleTag: 10191, secondaryTag: 10159, color: '#f472b6', accent: '#fff1f2', screenTint: 'rgba(255, 140, 220, 0.20)', count: 10, scale: 1.6 },
  'dazzling gleam': { pattern: 'burst_explosion', particleTag: 10027, secondaryTag: 10031, color: '#f9a8d4', accent: '#ffffff', screenTint: 'rgba(255, 200, 255, 0.24)', count: 14, scale: 1.7 },
  'play rough': { pattern: 'punch_impact', particleTag: 10027, secondaryTag: 10210, color: '#f472b6', accent: '#ffffff', count: 10, scale: 1.7 },

  // Fighting
  'close combat': { pattern: 'punch_impact', particleTag: 10055, secondaryTag: 10035, color: '#ef4444', accent: '#fef08a', screenTint: 'rgba(220, 60, 40, 0.18)', count: 10, scale: 1.9 },
  'aura sphere': { pattern: 'stream', particleTag: 10308, secondaryTag: 10084, color: '#3b82f6', accent: '#e0f2fe', screenTint: 'rgba(70, 160, 255, 0.18)', count: 8, scale: 1.9 },
  'focus blast': { pattern: 'stream', particleTag: 10084, secondaryTag: 10035, color: '#f97316', accent: '#fef08a', screenTint: 'rgba(255, 140, 50, 0.20)', count: 10, scale: 2.0 },
  'brick break': { pattern: 'punch_impact', particleTag: 10052, secondaryTag: 10035, color: '#f97316', accent: '#ffffff', count: 6, scale: 1.9 },
  'mach punch': { pattern: 'punch_impact', particleTag: 10055, color: '#ef4444', accent: '#ffffff', count: 6, scale: 1.8 },
  'sacred sword': { pattern: 'slash_claw', particleTag: 10018, secondaryTag: 10075, color: '#38bdf8', accent: '#ffffff', count: 6, scale: 2.1 },

  // Dragon
  'draco meteor': { pattern: 'meteor_storm', particleTag: 10256, secondaryTag: 10035, color: '#8b5cf6', accent: '#fde047', screenTint: 'rgba(30, 12, 70, 0.42)', count: 10, scale: 1.7 },
  'dragon pulse': { pattern: 'stream', particleTag: 10128, secondaryTag: 10308, color: '#6366f1', accent: '#e0e7ff', screenTint: 'rgba(110, 60, 230, 0.20)', count: 10, scale: 1.8 },
  'dragon claw': { pattern: 'slash_claw', particleTag: 10215, secondaryTag: 10128, color: '#6366f1', accent: '#c7d2fe', count: 6, scale: 2.0 },
  'dragon dance': { pattern: 'orbit_aura', particleTag: 10128, secondaryTag: 10031, color: '#818cf8', accent: '#ffffff', count: 10, scale: 1.7 },

  // Ground & Rock
  earthquake: { pattern: 'wave_surge', particleTag: 10300, secondaryTag: 10114, color: '#d97706', accent: '#fde68a', screenTint: 'rgba(140, 95, 45, 0.18)', count: 14, scale: 1.9 },
  'earth power': { pattern: 'sky_strike', particleTag: 10083, secondaryTag: 10300, color: '#ea580c', accent: '#fef08a', count: 10, scale: 1.9 },
  'rock slide': { pattern: 'sky_strike', particleTag: 10114, secondaryTag: 10300, color: '#a8a29e', accent: '#fef3c7', count: 10, scale: 1.9 },
  'stone edge': { pattern: 'sky_strike', particleTag: 10300, secondaryTag: 10035, color: '#78716c', accent: '#fde68a', count: 10, scale: 2.0 },

  // Flying, Bug, Poison, Steel, Normal
  hurricane: { pattern: 'wave_surge', particleTag: 10009, color: '#7dd3fc', accent: '#ffffff', screenTint: 'rgba(170, 210, 255, 0.18)', count: 10, scale: 2.0 },
  'brave bird': { pattern: 'punch_impact', particleTag: 10270, secondaryTag: 10075, color: '#38bdf8', accent: '#ffffff', screenTint: 'rgba(100, 180, 255, 0.18)', count: 10, scale: 1.9 },
  'air slash': { pattern: 'slash_claw', particleTag: 10075, color: '#bae6fd', accent: '#ffffff', count: 6, scale: 1.9 },
  'x-scissor': { pattern: 'slash_claw', particleTag: 10285, color: '#a3e635', accent: '#ffffff', count: 6, scale: 2.1 },
  'sludge bomb': { pattern: 'stream', particleTag: 10123, secondaryTag: 10150, color: '#a855f7', accent: '#f5d0fe', screenTint: 'rgba(130, 40, 160, 0.18)', count: 10, scale: 1.7 },
  toxic: { pattern: 'orbit_aura', particleTag: 10123, secondaryTag: 10150, color: '#9333ea', accent: '#f0abfc', count: 10, scale: 1.6 },
  'flash cannon': { pattern: 'stream', particleTag: 10301, secondaryTag: 10084, color: '#cbd5e1', accent: '#ffffff', screenTint: 'rgba(200, 220, 255, 0.20)', count: 10, scale: 1.8 },
  'swords dance': { pattern: 'orbit_aura', particleTag: 10018, secondaryTag: 10031, color: '#e2e8f0', accent: '#ffffff', count: 8, scale: 2.0 },
  recover: { pattern: 'orbit_aura', particleTag: 10031, secondaryTag: 10271, color: '#4ade80', accent: '#ffffff', count: 12, scale: 1.6 },
  roost: { pattern: 'orbit_aura', particleTag: 10270, secondaryTag: 10031, color: '#7dd3fc', accent: '#ffffff', count: 10, scale: 1.7 },
  protect: { pattern: 'orbit_aura', particleTag: 10166, color: '#38bdf8', accent: '#ffffff', count: 4, scale: 1.7 },
  'light screen': { pattern: 'orbit_aura', particleTag: 10167, color: '#facc15', accent: '#ffffff', count: 4, scale: 1.7 },
  reflect: { pattern: 'orbit_aura', particleTag: 10168, color: '#f472b6', accent: '#ffffff', count: 4, scale: 1.7 },
  'hyper beam': { pattern: 'stream', particleTag: 10084, secondaryTag: 10035, color: '#f59e0b', accent: '#ffffff', screenTint: 'rgba(255, 220, 140, 0.24)', count: 14, scale: 1.9 },
  swift: { pattern: 'stream', particleTag: 10027, color: '#fde047', accent: '#ffffff', count: 10, scale: 1.6 },
  explosion: { pattern: 'burst_explosion', particleTag: 10058, secondaryTag: 10035, color: '#f97316', accent: '#ffffff', screenTint: 'rgba(255, 200, 120, 0.28)', count: 14, scale: 2.0 },
  slash: { pattern: 'slash_claw', particleTag: 10215, color: '#f8fafc', accent: '#ffffff', count: 4, scale: 2.0 },
};

const SPANISH_ALIASES: Record<string, string> = {
  drenadoras: 'leech seed',
  paralizador: 'stun spore',
  'polvo veneno': 'poison powder',
  somnifero: 'sleep powder',
  espora: 'spore',
  lanzallamas: 'flamethrower',
  llamarada: 'fire blast',
  ascuas: 'ember',
  'envite igneo': 'flare blitz',
  'puno fuego': 'fire punch',
  'colmillo igneo': 'fire fang',
  'fuego fatuo': 'will-o-wisp',
  estallido: 'eruption',
  'onda ignea': 'heat wave',
  rayo: 'thunderbolt',
  trueno: 'thunder',
  'puno trueno': 'thunder punch',
  'colmillo rayo': 'thunder fang',
  'onda trueno': 'thunder wave',
  chispa: 'spark',
  hidrobomba: 'hydro pump',
  'pistola agua': 'water gun',
  escaldar: 'scald',
  'rayo burbuja': 'bubble beam',
  cascada: 'waterfall',
  'tormenta arena': 'sandstorm',
  'tormenta de arena': 'sandstorm',
  'danza lluvia': 'rain dance',
  'dia soleado': 'sunny day',
  granizo: 'hail',
  'paisaje nevado': 'snowscape',
  'rayo hielo': 'ice beam',
  ventisca: 'blizzard',
  'puno hielo': 'ice punch',
  'colmillo hielo': 'ice fang',
  chuzos: 'icicle crash',
  'canto helado': 'ice shard',
  'rayo solar': 'solar beam',
  energibola: 'energy ball',
  'hoja afilada': 'razor leaf',
  'hoja aguda': 'leaf blade',
  gigadrenado: 'giga drain',
  megadrenado: 'mega drain',
  absorber: 'absorb',
  megaagotar: 'mega drain',
  chupavidas: 'leech life',
  'puno drenaje': 'drain punch',
  'asta drenaje': 'horn leech',
  'beso drenaje': 'draining kiss',
  deseo: 'recover',
  'luz lunar': 'synthesis',
  'sol matinal': 'synthesis',
  relajo: 'recover',
  amortiguador: 'recover',
  'danza petalo': 'petal dance',
  'tormenta floral': 'petal blizzard',
  sintesis: 'synthesis',
  'bola sombra': 'shadow ball',
  'garra umbria': 'shadow claw',
  'pulso umbrio': 'dark pulse',
  'tajo umbrio': 'night slash',
  triturar: 'crunch',
  mordisco: 'bite',
  psiquico: 'psychic',
  psicocarga: 'psyshock',
  'paz mental': 'calm mind',
  'fuerza lunar': 'moonblast',
  'brillo magico': 'dazzling gleam',
  carantona: 'play rough',
  'cuerpo a cuerpo': 'close combat',
  'esfera aural': 'aura sphere',
  'onda certera': 'focus blast',
  demolicion: 'brick break',
  ultrapuno: 'mach punch',
  'espada santa': 'sacred sword',
  'cometa draco': 'draco meteor',
  'pulso dragon': 'dragon pulse',
  'garra dragon': 'dragon claw',
  'danza dragon': 'dragon dance',
  terremoto: 'earthquake',
  'tierra viva': 'earth power',
  avalancha: 'rock slide',
  'roca afilada': 'stone edge',
  vendaval: 'hurricane',
  'pajaro osado': 'brave bird',
  'tajo aereo': 'air slash',
  'tijera x': 'x-scissor',
  'bomba lodo': 'sludge bomb',
  lanzamugre: 'sludge bomb',
  toxico: 'toxic',
  'foco resplandor': 'flash cannon',
  'danza espada': 'swords dance',
  recuperacion: 'recover',
  respiro: 'roost',
  proteccion: 'protect',
  'pantalla de luz': 'light screen',
  reflejo: 'reflect',
  hiperrayo: 'hyper beam',
  rapidez: 'swift',
  explosion: 'explosion',
  cuchillada: 'slash',
};

function normalizeMoveKey(raw?: string): string {
  return (raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n');
}

export function resolveGbaMoveAnimation(
  moveName?: string,
  moveType?: string,
  category?: string
): GbaMoveAnimSpec {
  const rawName = normalizeMoveKey(moveName);
  const name = SPANISH_ALIASES[rawName] || rawName;
  if (name && ICONIC_MOVES[name]) {
    return ICONIC_MOVES[name];
  }

  const typeKey = (moveType || 'NORMAL').toUpperCase();
  const typeEntry = TYPE_DEFAULTS[typeKey] || TYPE_DEFAULTS.NORMAL;

  if (name) {
    if (name.includes('punch') || name.includes('hammer') || name.includes('fist') || name.includes('puno') || name.includes('martillo')) {
      return { ...typeEntry.physical, pattern: 'punch_impact', particleTag: 10055, secondaryTag: typeEntry.special.particleTag };
    }
    if (name.includes('fang') || name.includes('bite') || name.includes('crunch') || name.includes('colmillo') || name.includes('mord')) {
      return { ...typeEntry.physical, pattern: 'bite_fang', particleTag: 10104, secondaryTag: typeEntry.special.particleTag };
    }
    if (name.includes('claw') || name.includes('slash') || name.includes('cut') || name.includes('sword') || name.includes('blade') || name.includes('garra') || name.includes('tajo') || name.includes('corte') || name.includes('espada')) {
      return { ...typeEntry.physical, pattern: 'slash_claw', particleTag: name.includes('sword') || name.includes('espada') ? 10018 : 10215, secondaryTag: 10075 };
    }
    if (name.includes('beam') || name.includes('pulse') || name.includes('ball') || name.includes('cannon') || name.includes('bomb') || name.includes('rayo') || name.includes('pulso') || name.includes('bola') || name.includes('canon') || name.includes('bomba')) {
      return { ...typeEntry.special, pattern: 'stream' };
    }
    if (name.includes('dance') || name.includes('heal') || name.includes('recover') || name.includes('wish') || name.includes('veil') || name.includes('danza') || name.includes('cura') || name.includes('velo')) {
      return { ...typeEntry.status, pattern: 'orbit_aura', particleTag: 10031, secondaryTag: 10271 };
    }
  }

  const cat = (category || 'SPECIAL').toUpperCase();
  if (cat === 'STATUS') return typeEntry.status;
  if (cat === 'PHYSICAL') return typeEntry.physical;
  return typeEntry.special;
}
