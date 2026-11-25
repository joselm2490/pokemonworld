export type GbaAnimPattern =
  | 'stream'
  | 'sky_strike'
  | 'slash_claw'
  | 'bite_fang'
  | 'punch_impact'
  | 'orbit_aura'
  | 'burst_explosion'
  | 'wave_surge'
  | 'drain';

export interface GbaMoveAnimSpec {
  pattern: GbaAnimPattern;
  /** Primary glowing color */
  color: string;
  /** Secondary / core accent color */
  accent: string;
  /** Optional subtle screen flash/tint */
  screenTint?: string;
  /** Visual style hint for procedural HD rendering */
  style:
    | 'flame'
    | 'water'
    | 'bolt'
    | 'ice'
    | 'leaf'
    | 'orb'
    | 'slash'
    | 'fang'
    | 'punch'
    | 'rock'
    | 'psychic'
    | 'dark'
    | 'fairy'
    | 'poison'
    | 'heal'
    | 'shield'
    | 'wind';
  count?: number;
}

const TYPE_PALETTES: Record<string, { color: string; accent: string; tint: string }> = {
  FIRE: { color: '#ff5500', accent: '#ffe066', tint: 'rgba(255, 70, 10, 0.16)' },
  WATER: { color: '#0ea5e9', accent: '#bae6fd', tint: 'rgba(14, 165, 233, 0.15)' },
  ELECTRIC: { color: '#facc15', accent: '#ffffff', tint: 'rgba(250, 204, 21, 0.18)' },
  GRASS: { color: '#22c55e', accent: '#bbf7d0', tint: 'rgba(34, 197, 94, 0.14)' },
  ICE: { color: '#38bdf8', accent: '#f0f9ff', tint: 'rgba(125, 211, 252, 0.18)' },
  FIGHTING: { color: '#ef4444', accent: '#fde047', tint: 'rgba(239, 68, 68, 0.16)' },
  POISON: { color: '#a855f7', accent: '#f0abfc', tint: 'rgba(147, 51, 234, 0.16)' },
  GROUND: { color: '#d97706', accent: '#fde68a', tint: 'rgba(180, 83, 9, 0.16)' },
  FLYING: { color: '#7dd3fc', accent: '#ffffff', tint: 'rgba(125, 211, 252, 0.14)' },
  PSYCHIC: { color: '#ec4899', accent: '#fbcfe8', tint: 'rgba(236, 72, 153, 0.18)' },
  BUG: { color: '#84cc16', accent: '#ecfccb', tint: 'rgba(132, 204, 22, 0.14)' },
  ROCK: { color: '#a8a29e', accent: '#fde68a', tint: 'rgba(120, 113, 108, 0.16)' },
  GHOST: { color: '#7c3aed', accent: '#ddd6fe', tint: 'rgba(46, 16, 101, 0.28)' },
  DRAGON: { color: '#6366f1', accent: '#c7d2fe', tint: 'rgba(79, 70, 229, 0.20)' },
  DARK: { color: '#4c1d95', accent: '#e9d5ff', tint: 'rgba(15, 10, 30, 0.30)' },
  STEEL: { color: '#94a3b8', accent: '#f8fafc', tint: 'rgba(148, 163, 184, 0.16)' },
  FAIRY: { color: '#f472b6', accent: '#fdf2f8', tint: 'rgba(244, 114, 182, 0.18)' },
  NORMAL: { color: '#e2e8f0', accent: '#ffffff', tint: 'rgba(255, 255, 255, 0.12)' },
};

const ICONIC_MOVES: Record<string, GbaMoveAnimSpec> = {
  // Fire
  flamethrower: { pattern: 'stream', style: 'flame', color: '#ff5500', accent: '#fff3b0', screenTint: 'rgba(255, 80, 15, 0.18)', count: 18 },
  'fire blast': { pattern: 'burst_explosion', style: 'flame', color: '#ff4500', accent: '#fff3b0', screenTint: 'rgba(255, 65, 10, 0.24)', count: 22 },
  ember: { pattern: 'stream', style: 'flame', color: '#ff6b1a', accent: '#ffe066', count: 10 },
  'flare blitz': { pattern: 'punch_impact', style: 'flame', color: '#ff4d00', accent: '#fff3b0', screenTint: 'rgba(255, 80, 15, 0.22)', count: 16 },
  'fire punch': { pattern: 'punch_impact', style: 'flame', color: '#ff5500', accent: '#ffe066', count: 12 },
  'fire fang': { pattern: 'bite_fang', style: 'fang', color: '#ff5500', accent: '#ffe066', count: 10 },
  'will-o-wisp': { pattern: 'orbit_aura', style: 'flame', color: '#60a5fa', accent: '#e0f2fe', screenTint: 'rgba(20, 15, 45, 0.25)', count: 8 },
  eruption: { pattern: 'sky_strike', style: 'flame', color: '#ff3b00', accent: '#fde047', screenTint: 'rgba(255, 50, 0, 0.22)', count: 16 },
  'heat wave': { pattern: 'wave_surge', style: 'flame', color: '#ff6b00', accent: '#fef08a', screenTint: 'rgba(255, 90, 20, 0.20)', count: 16 },

  // Electric
  thunderbolt: { pattern: 'sky_strike', style: 'bolt', color: '#facc15', accent: '#ffffff', screenTint: 'rgba(250, 204, 21, 0.22)', count: 10 },
  thunder: { pattern: 'sky_strike', style: 'bolt', color: '#eab308', accent: '#ffffff', screenTint: 'rgba(250, 204, 21, 0.30)', count: 14 },
  'thunder punch': { pattern: 'punch_impact', style: 'bolt', color: '#facc15', accent: '#ffffff', count: 12 },
  'thunder fang': { pattern: 'bite_fang', style: 'fang', color: '#facc15', accent: '#ffffff', count: 10 },
  'thunder wave': { pattern: 'orbit_aura', style: 'bolt', color: '#facc15', accent: '#fef9c3', screenTint: 'rgba(250, 204, 21, 0.14)', count: 10 },
  spark: { pattern: 'burst_explosion', style: 'bolt', color: '#facc15', accent: '#ffffff', count: 14 },

  // Water
  'hydro pump': { pattern: 'stream', style: 'water', color: '#0284c7', accent: '#e0f2fe', screenTint: 'rgba(14, 165, 233, 0.18)', count: 20 },
  surf: { pattern: 'wave_surge', style: 'water', color: '#0ea5e9', accent: '#e0f2fe', screenTint: 'rgba(14, 165, 233, 0.20)', count: 18 },
  'water gun': { pattern: 'stream', style: 'water', color: '#38bdf8', accent: '#f0f9ff', count: 12 },
  scald: { pattern: 'stream', style: 'water', color: '#0ea5e9', accent: '#fecaca', count: 16 },
  'bubble beam': { pattern: 'stream', style: 'water', color: '#60a5fa', accent: '#ffffff', count: 14 },
  waterfall: { pattern: 'wave_surge', style: 'water', color: '#2563eb', accent: '#bae6fd', count: 14 },

  // Ice
  'ice beam': { pattern: 'stream', style: 'ice', color: '#38bdf8', accent: '#ffffff', screenTint: 'rgba(125, 211, 252, 0.20)', count: 16 },
  blizzard: { pattern: 'wave_surge', style: 'ice', color: '#7dd3fc', accent: '#ffffff', screenTint: 'rgba(186, 230, 253, 0.24)', count: 22 },
  'ice punch': { pattern: 'punch_impact', style: 'ice', color: '#38bdf8', accent: '#f0f9ff', count: 12 },
  'ice fang': { pattern: 'bite_fang', style: 'fang', color: '#38bdf8', accent: '#f0f9ff', count: 10 },
  'icicle crash': { pattern: 'sky_strike', style: 'ice', color: '#38bdf8', accent: '#ffffff', count: 14 },
  'ice shard': { pattern: 'stream', style: 'ice', color: '#7dd3fc', accent: '#ffffff', count: 10 },

  // Grass
  'solar beam': { pattern: 'stream', style: 'orb', color: '#4ade80', accent: '#fef9c3', screenTint: 'rgba(134, 239, 172, 0.22)', count: 18 },
  'energy ball': { pattern: 'stream', style: 'orb', color: '#22c55e', accent: '#dcfce7', count: 14 },
  'razor leaf': { pattern: 'stream', style: 'leaf', color: '#16a34a', accent: '#bbf7d0', count: 14 },
  'leaf blade': { pattern: 'slash_claw', style: 'slash', color: '#22c55e', accent: '#ecfccb', count: 8 },
  'giga drain': { pattern: 'drain', style: 'heal', color: '#22c55e', accent: '#bbf7d0', screenTint: 'rgba(34, 197, 94, 0.14)', count: 16 },
  'mega drain': { pattern: 'drain', style: 'heal', color: '#22c55e', accent: '#bbf7d0', count: 12 },
  'petal dance': { pattern: 'burst_explosion', style: 'leaf', color: '#f472b6', accent: '#fbcfe8', count: 18 },
  'petal blizzard': { pattern: 'wave_surge', style: 'leaf', color: '#f472b6', accent: '#fdf2f8', count: 22 },
  synthesis: { pattern: 'orbit_aura', style: 'heal', color: '#4ade80', accent: '#fef08a', count: 14 },

  // Ghost & Dark
  'shadow ball': { pattern: 'stream', style: 'dark', color: '#7c3aed', accent: '#ddd6fe', screenTint: 'rgba(30, 10, 60, 0.30)', count: 14 },
  'shadow claw': { pattern: 'slash_claw', style: 'slash', color: '#7c3aed', accent: '#e9d5ff', screenTint: 'rgba(30, 10, 60, 0.24)', count: 6 },
  'dark pulse': { pattern: 'burst_explosion', style: 'dark', color: '#581c87', accent: '#d8b4fe', screenTint: 'rgba(15, 10, 30, 0.32)', count: 16 },
  'night slash': { pattern: 'slash_claw', style: 'slash', color: '#6b21a8', accent: '#f3e8ff', screenTint: 'rgba(15, 10, 30, 0.26)', count: 6 },
  crunch: { pattern: 'bite_fang', style: 'fang', color: '#a855f7', accent: '#ffffff', screenTint: 'rgba(20, 10, 35, 0.20)', count: 10 },
  bite: { pattern: 'bite_fang', style: 'fang', color: '#cbd5e1', accent: '#ffffff', count: 8 },

  // Psychic & Fairy
  psychic: { pattern: 'orbit_aura', style: 'psychic', color: '#ec4899', accent: '#fbcfe8', screenTint: 'rgba(236, 72, 153, 0.22)', count: 10 },
  psyshock: { pattern: 'sky_strike', style: 'psychic', color: '#ec4899', accent: '#ffffff', screenTint: 'rgba(236, 72, 153, 0.20)', count: 12 },
  'calm mind': { pattern: 'orbit_aura', style: 'psychic', color: '#a855f7', accent: '#e9d5ff', count: 12 },
  moonblast: { pattern: 'stream', style: 'fairy', color: '#f472b6', accent: '#fff1f2', screenTint: 'rgba(244, 114, 182, 0.22)', count: 16 },
  'dazzling gleam': { pattern: 'burst_explosion', style: 'fairy', color: '#f9a8d4', accent: '#ffffff', screenTint: 'rgba(255, 220, 245, 0.26)', count: 20 },
  'play rough': { pattern: 'punch_impact', style: 'fairy', color: '#f472b6', accent: '#ffffff', count: 12 },

  // Fighting
  'close combat': { pattern: 'punch_impact', style: 'punch', color: '#ef4444', accent: '#fef08a', screenTint: 'rgba(220, 38, 38, 0.18)', count: 14 },
  'aura sphere': { pattern: 'stream', style: 'orb', color: '#3b82f6', accent: '#e0f2fe', screenTint: 'rgba(59, 130, 246, 0.18)', count: 14 },
  'focus blast': { pattern: 'stream', style: 'orb', color: '#f97316', accent: '#fef08a', screenTint: 'rgba(249, 115, 22, 0.20)', count: 16 },
  'brick break': { pattern: 'punch_impact', style: 'punch', color: '#f97316', accent: '#ffffff', count: 10 },
  'mach punch': { pattern: 'punch_impact', style: 'punch', color: '#ef4444', accent: '#ffffff', count: 10 },
  'sacred sword': { pattern: 'slash_claw', style: 'slash', color: '#38bdf8', accent: '#ffffff', count: 6 },

  // Dragon
  'draco meteor': { pattern: 'sky_strike', style: 'flame', color: '#8b5cf6', accent: '#fde047', screenTint: 'rgba(88, 28, 135, 0.26)', count: 14 },
  'dragon pulse': { pattern: 'stream', style: 'orb', color: '#6366f1', accent: '#e0e7ff', screenTint: 'rgba(99, 102, 241, 0.20)', count: 16 },
  'dragon claw': { pattern: 'slash_claw', style: 'slash', color: '#6366f1', accent: '#c7d2fe', count: 6 },
  'dragon dance': { pattern: 'orbit_aura', style: 'orb', color: '#818cf8', accent: '#ffffff', count: 12 },

  // Ground & Rock
  earthquake: { pattern: 'wave_surge', style: 'rock', color: '#d97706', accent: '#fde68a', screenTint: 'rgba(146, 64, 14, 0.18)', count: 16 },
  'earth power': { pattern: 'sky_strike', style: 'rock', color: '#ea580c', accent: '#fef08a', count: 14 },
  'rock slide': { pattern: 'sky_strike', style: 'rock', color: '#a8a29e', accent: '#fef3c7', count: 14 },
  'stone edge': { pattern: 'sky_strike', style: 'rock', color: '#78716c', accent: '#fde68a', count: 14 },

  // Flying, Bug, Poison, Steel, Normal
  hurricane: { pattern: 'wave_surge', style: 'wind', color: '#7dd3fc', accent: '#ffffff', screenTint: 'rgba(125, 211, 252, 0.18)', count: 16 },
  'brave bird': { pattern: 'punch_impact', style: 'wind', color: '#38bdf8', accent: '#ffffff', screenTint: 'rgba(56, 189, 248, 0.18)', count: 14 },
  'air slash': { pattern: 'slash_claw', style: 'slash', color: '#bae6fd', accent: '#ffffff', count: 6 },
  'x-scissor': { pattern: 'slash_claw', style: 'slash', color: '#a3e635', accent: '#ffffff', count: 6 },
  'sludge bomb': { pattern: 'stream', style: 'poison', color: '#a855f7', accent: '#f5d0fe', screenTint: 'rgba(126, 34, 206, 0.18)', count: 14 },
  toxic: { pattern: 'orbit_aura', style: 'poison', color: '#9333ea', accent: '#f0abfc', count: 12 },
  'flash cannon': { pattern: 'stream', style: 'orb', color: '#cbd5e1', accent: '#ffffff', screenTint: 'rgba(203, 213, 225, 0.22)', count: 16 },
  'swords dance': { pattern: 'orbit_aura', style: 'slash', color: '#e2e8f0', accent: '#ffffff', count: 10 },
  recover: { pattern: 'orbit_aura', style: 'heal', color: '#4ade80', accent: '#ffffff', count: 14 },
  roost: { pattern: 'orbit_aura', style: 'heal', color: '#7dd3fc', accent: '#ffffff', count: 12 },
  protect: { pattern: 'orbit_aura', style: 'shield', color: '#38bdf8', accent: '#ffffff', count: 6 },
  'light screen': { pattern: 'orbit_aura', style: 'shield', color: '#facc15', accent: '#ffffff', count: 6 },
  reflect: { pattern: 'orbit_aura', style: 'shield', color: '#f472b6', accent: '#ffffff', count: 6 },
  'hyper beam': { pattern: 'stream', style: 'orb', color: '#f59e0b', accent: '#ffffff', screenTint: 'rgba(251, 191, 36, 0.24)', count: 22 },
  swift: { pattern: 'stream', style: 'fairy', color: '#fde047', accent: '#ffffff', count: 14 },
  explosion: { pattern: 'burst_explosion', style: 'flame', color: '#f97316', accent: '#ffffff', screenTint: 'rgba(255, 220, 150, 0.30)', count: 24 },
  slash: { pattern: 'slash_claw', style: 'slash', color: '#f8fafc', accent: '#ffffff', count: 6 },
};

const SPANISH_ALIASES: Record<string, string> = {
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
  const pal = TYPE_PALETTES[typeKey] || TYPE_PALETTES.NORMAL;

  if (name) {
    if (name.includes('punch') || name.includes('hammer') || name.includes('fist') || name.includes('puno') || name.includes('martillo')) {
      return { pattern: 'punch_impact', style: 'punch', color: pal.color, accent: pal.accent, screenTint: pal.tint, count: 12 };
    }
    if (name.includes('fang') || name.includes('bite') || name.includes('crunch') || name.includes('colmillo') || name.includes('mord')) {
      return { pattern: 'bite_fang', style: 'fang', color: pal.color, accent: pal.accent, screenTint: pal.tint, count: 10 };
    }
    if (name.includes('claw') || name.includes('slash') || name.includes('cut') || name.includes('sword') || name.includes('blade') || name.includes('garra') || name.includes('tajo') || name.includes('corte') || name.includes('espada')) {
      return { pattern: 'slash_claw', style: 'slash', color: pal.color, accent: pal.accent, screenTint: pal.tint, count: 6 };
    }
    if (name.includes('beam') || name.includes('pulse') || name.includes('ball') || name.includes('cannon') || name.includes('bomb') || name.includes('rayo') || name.includes('pulso') || name.includes('bola') || name.includes('canon') || name.includes('bomba')) {
      return { pattern: 'stream', style: 'orb', color: pal.color, accent: pal.accent, screenTint: pal.tint, count: 14 };
    }
    if (name.includes('dance') || name.includes('heal') || name.includes('recover') || name.includes('wish') || name.includes('veil') || name.includes('danza') || name.includes('cura') || name.includes('velo')) {
      return { pattern: 'orbit_aura', style: 'heal', color: pal.color, accent: pal.accent, count: 12 };
    }
  }

  const cat = (category || 'SPECIAL').toUpperCase();
  if (cat === 'STATUS') {
    return { pattern: 'orbit_aura', style: 'orb', color: pal.color, accent: pal.accent, count: 10 };
  }
  if (cat === 'PHYSICAL') {
    return { pattern: 'punch_impact', style: 'punch', color: pal.color, accent: pal.accent, screenTint: pal.tint, count: 10 };
  }
  return { pattern: 'stream', style: 'orb', color: pal.color, accent: pal.accent, screenTint: pal.tint, count: 14 };
}
