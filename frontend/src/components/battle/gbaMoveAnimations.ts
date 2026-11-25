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
  particleTag: number;
  secondaryTag?: number;
  screenTint?: string;
  count?: number;
  scale?: number;
  /** Optional explicit frame geometry when sheet isn't 1-column vertical strip */
  frameW?: number;
  frameH?: number;
  frames?: number;
}

const ICONIC_MOVES: Record<string, GbaMoveAnimSpec> = {
  // Fire
  flamethrower: { pattern: 'stream', particleTag: 10033, secondaryTag: 10035, screenTint: 'rgba(255, 85, 20, 0.20)', count: 14, scale: 1.6, frameW: 16, frameH: 16, frames: 4 },
  'fire blast': { pattern: 'burst_explosion', particleTag: 10033, secondaryTag: 10256, screenTint: 'rgba(255, 70, 15, 0.28)', count: 14, scale: 2.0, frameW: 16, frameH: 16, frames: 4 },
  ember: { pattern: 'stream', particleTag: 10033, count: 6, scale: 1.3, frameW: 16, frameH: 16, frames: 4 },
  'flare blitz': { pattern: 'punch_impact', particleTag: 10256, secondaryTag: 10033, screenTint: 'rgba(255, 90, 20, 0.25)', count: 10, scale: 1.6 },
  'fire punch': { pattern: 'punch_impact', particleTag: 10055, secondaryTag: 10033, count: 8, scale: 1.8 },
  'fire fang': { pattern: 'bite_fang', particleTag: 10104, secondaryTag: 10033, count: 6, scale: 1.8 },
  'will-o-wisp': { pattern: 'orbit_aura', particleTag: 10076, screenTint: 'rgba(30, 10, 50, 0.30)', count: 6, scale: 1.5 },
  eruption: { pattern: 'sky_strike', particleTag: 10083, secondaryTag: 10033, screenTint: 'rgba(255, 60, 10, 0.25)', count: 10, scale: 1.8 },
  'heat wave': { pattern: 'wave_surge', particleTag: 10033, screenTint: 'rgba(255, 100, 30, 0.24)', count: 12, scale: 1.7, frameW: 16, frameH: 16, frames: 4 },

  // Electric
  thunderbolt: { pattern: 'sky_strike', particleTag: 10037, secondaryTag: 10036, screenTint: 'rgba(255, 240, 70, 0.26)', count: 8, scale: 2.0 },
  thunder: { pattern: 'sky_strike', particleTag: 10037, secondaryTag: 10001, screenTint: 'rgba(255, 245, 90, 0.35)', count: 12, scale: 2.4 },
  'thunder punch': { pattern: 'punch_impact', particleTag: 10055, secondaryTag: 10036, count: 8, scale: 1.8 },
  'thunder fang': { pattern: 'bite_fang', particleTag: 10104, secondaryTag: 10036, count: 6, scale: 1.8 },
  'thunder wave': { pattern: 'orbit_aura', particleTag: 10001, secondaryTag: 10036, screenTint: 'rgba(255, 230, 60, 0.18)', count: 8, scale: 1.7 },
  volt: { pattern: 'stream', particleTag: 10036, secondaryTag: 10001, screenTint: 'rgba(255, 235, 60, 0.22)', count: 10, scale: 1.5, frameW: 32, frameH: 32, frames: 4 },
  spark: { pattern: 'burst_explosion', particleTag: 10001, secondaryTag: 10036, count: 8, scale: 1.6 },

  // Water
  'hydro pump': { pattern: 'stream', particleTag: 10113, secondaryTag: 10042, screenTint: 'rgba(30, 120, 255, 0.20)', count: 12, scale: 1.9 },
  surf: { pattern: 'wave_surge', particleTag: 10113, secondaryTag: 10042, screenTint: 'rgba(20, 130, 255, 0.24)', count: 12, scale: 2.0 },
  'water gun': { pattern: 'stream', particleTag: 10298, secondaryTag: 10042, count: 10, scale: 1.7 },
  scald: { pattern: 'stream', particleTag: 10262, secondaryTag: 10058, count: 10, scale: 1.7 },
  'bubble beam': { pattern: 'stream', particleTag: 10042, count: 12, scale: 1.5 },
  waterfall: { pattern: 'wave_surge', particleTag: 10113, count: 10, scale: 1.9 },

  // Ice
  'ice beam': { pattern: 'stream', particleTag: 10043, secondaryTag: 10031, screenTint: 'rgba(130, 225, 255, 0.22)', count: 12, scale: 1.6 },
  blizzard: { pattern: 'wave_surge', particleTag: 10093, secondaryTag: 10043, screenTint: 'rgba(160, 235, 255, 0.28)', count: 14, scale: 1.5, frameW: 32, frameH: 32, frames: 4 },
  'ice punch': { pattern: 'punch_impact', particleTag: 10055, secondaryTag: 10043, count: 8, scale: 1.8 },
  'ice fang': { pattern: 'bite_fang', particleTag: 10104, secondaryTag: 10043, count: 6, scale: 1.8 },
  'icicle crash': { pattern: 'sky_strike', particleTag: 10262, secondaryTag: 10043, count: 10, scale: 1.9 },
  'ice shard': { pattern: 'stream', particleTag: 10262, count: 8, scale: 1.7 },

  // Grass
  'solar beam': { pattern: 'stream', particleTag: 10309, secondaryTag: 10031, screenTint: 'rgba(180, 255, 100, 0.24)', count: 12, scale: 1.8 },
  'energy ball': { pattern: 'stream', particleTag: 10309, secondaryTag: 10063, count: 10, scale: 1.7 },
  'razor leaf': { pattern: 'stream', particleTag: 10063, count: 10, scale: 1.8 },
  'leaf blade': { pattern: 'slash_claw', particleTag: 10063, secondaryTag: 10075, count: 8, scale: 2.0 },
  'giga drain': { pattern: 'drain', particleTag: 10309, secondaryTag: 10063, screenTint: 'rgba(40, 180, 80, 0.18)', count: 12, scale: 1.5 },
  'mega drain': { pattern: 'drain', particleTag: 10309, count: 10, scale: 1.4 },
  'petal dance': { pattern: 'burst_explosion', particleTag: 10159, count: 14, scale: 1.8 },
  'petal blizzard': { pattern: 'wave_surge', particleTag: 10159, count: 16, scale: 1.8 },
  synthesis: { pattern: 'orbit_aura', particleTag: 10031, secondaryTag: 10159, screenTint: 'rgba(120, 255, 120, 0.18)', count: 10, scale: 1.5 },

  // Ghost & Dark
  'shadow ball': { pattern: 'stream', particleTag: 10176, secondaryTag: 10171, screenTint: 'rgba(20, 10, 45, 0.40)', count: 10, scale: 1.9 },
  'shadow claw': { pattern: 'slash_claw', particleTag: 10193, secondaryTag: 10215, screenTint: 'rgba(25, 10, 45, 0.32)', count: 6, scale: 2.1 },
  'dark pulse': { pattern: 'burst_explosion', particleTag: 10176, screenTint: 'rgba(15, 10, 30, 0.42)', count: 12, scale: 2.0 },
  'night slash': { pattern: 'slash_claw', particleTag: 10304, secondaryTag: 10215, screenTint: 'rgba(15, 10, 30, 0.32)', count: 6, scale: 2.0 },
  crunch: { pattern: 'bite_fang', particleTag: 10104, screenTint: 'rgba(20, 15, 25, 0.25)', count: 6, scale: 2.0 },
  bite: { pattern: 'bite_fang', particleTag: 10104, count: 4, scale: 1.8 },

  // Psychic & Fairy
  psychic: { pattern: 'orbit_aura', particleTag: 10196, screenTint: 'rgba(220, 70, 220, 0.25)', count: 8, scale: 2.0 },
  psyshock: { pattern: 'sky_strike', particleTag: 10196, secondaryTag: 10027, screenTint: 'rgba(220, 80, 220, 0.22)', count: 8, scale: 1.8 },
  'calm mind': { pattern: 'orbit_aura', particleTag: 10031, secondaryTag: 10196, screenTint: 'rgba(180, 110, 255, 0.18)', count: 10, scale: 1.6 },
  moonblast: { pattern: 'stream', particleTag: 10191, secondaryTag: 10159, screenTint: 'rgba(255, 140, 220, 0.25)', count: 10, scale: 1.6 },
  'dazzling gleam': { pattern: 'burst_explosion', particleTag: 10027, secondaryTag: 10031, screenTint: 'rgba(255, 200, 255, 0.30)', count: 14, scale: 1.7 },
  'play rough': { pattern: 'punch_impact', particleTag: 10027, secondaryTag: 10210, count: 10, scale: 1.7 },

  // Fighting
  'close combat': { pattern: 'punch_impact', particleTag: 10055, secondaryTag: 10035, screenTint: 'rgba(220, 60, 40, 0.20)', count: 10, scale: 1.9 },
  'aura sphere': { pattern: 'stream', particleTag: 10308, secondaryTag: 10084, screenTint: 'rgba(70, 160, 255, 0.22)', count: 8, scale: 2.0 },
  'focus blast': { pattern: 'stream', particleTag: 10084, secondaryTag: 10035, screenTint: 'rgba(255, 140, 50, 0.24)', count: 10, scale: 2.1 },
  'brick break': { pattern: 'punch_impact', particleTag: 10052, secondaryTag: 10035, count: 6, scale: 2.0 },
  'mach punch': { pattern: 'punch_impact', particleTag: 10055, count: 6, scale: 1.8 },
  'sacred sword': { pattern: 'slash_claw', particleTag: 10018, secondaryTag: 10075, count: 6, scale: 2.2 },

  // Dragon
  'draco meteor': { pattern: 'sky_strike', particleTag: 10256, secondaryTag: 10035, screenTint: 'rgba(90, 40, 180, 0.30)', count: 10, scale: 1.9 },
  'dragon pulse': { pattern: 'stream', particleTag: 10128, secondaryTag: 10308, screenTint: 'rgba(110, 60, 230, 0.24)', count: 10, scale: 1.8 },
  'dragon claw': { pattern: 'slash_claw', particleTag: 10215, secondaryTag: 10128, count: 6, scale: 2.1 },
  'dragon dance': { pattern: 'orbit_aura', particleTag: 10128, secondaryTag: 10031, screenTint: 'rgba(100, 60, 220, 0.20)', count: 10, scale: 1.7 },

  // Ground & Rock
  earthquake: { pattern: 'wave_surge', particleTag: 10300, secondaryTag: 10114, screenTint: 'rgba(140, 95, 45, 0.22)', count: 14, scale: 2.0 },
  'earth power': { pattern: 'sky_strike', particleTag: 10083, secondaryTag: 10300, count: 10, scale: 1.9 },
  'rock slide': { pattern: 'sky_strike', particleTag: 10114, secondaryTag: 10300, count: 10, scale: 2.0 },
  'stone edge': { pattern: 'sky_strike', particleTag: 10300, secondaryTag: 10035, count: 10, scale: 2.1 },

  // Flying, Bug, Poison, Steel, Normal
  hurricane: { pattern: 'wave_surge', particleTag: 10009, screenTint: 'rgba(170, 210, 255, 0.22)', count: 10, scale: 2.1 },
  'brave bird': { pattern: 'punch_impact', particleTag: 10270, secondaryTag: 10075, screenTint: 'rgba(100, 180, 255, 0.22)', count: 10, scale: 1.9 },
  'air slash': { pattern: 'slash_claw', particleTag: 10075, count: 6, scale: 1.9 },
  'x-scissor': { pattern: 'slash_claw', particleTag: 10285, count: 6, scale: 2.2 },
  'sludge bomb': { pattern: 'stream', particleTag: 10123, secondaryTag: 10150, screenTint: 'rgba(130, 40, 160, 0.22)', count: 10, scale: 1.7 },
  toxic: { pattern: 'orbit_aura', particleTag: 10123, secondaryTag: 10150, screenTint: 'rgba(130, 40, 160, 0.20)', count: 10, scale: 1.6 },
  'flash cannon': { pattern: 'stream', particleTag: 10301, secondaryTag: 10084, screenTint: 'rgba(200, 220, 255, 0.25)', count: 10, scale: 1.8 },
  'swords dance': { pattern: 'orbit_aura', particleTag: 10018, secondaryTag: 10031, count: 8, scale: 2.0 },
  recover: { pattern: 'orbit_aura', particleTag: 10031, secondaryTag: 10271, screenTint: 'rgba(120, 255, 180, 0.18)', count: 12, scale: 1.6 },
  roost: { pattern: 'orbit_aura', particleTag: 10270, secondaryTag: 10031, count: 10, scale: 1.7 },
  protect: { pattern: 'orbit_aura', particleTag: 10166, count: 4, scale: 1.7 },
  'light screen': { pattern: 'orbit_aura', particleTag: 10167, count: 4, scale: 1.7 },
  reflect: { pattern: 'orbit_aura', particleTag: 10168, count: 4, scale: 1.7 },
  'hyper beam': { pattern: 'stream', particleTag: 10084, secondaryTag: 10035, screenTint: 'rgba(255, 220, 140, 0.30)', count: 16, scale: 2.0 },
  swift: { pattern: 'stream', particleTag: 10027, count: 10, scale: 1.6 },
  explosion: { pattern: 'burst_explosion', particleTag: 10058, secondaryTag: 10035, screenTint: 'rgba(255, 200, 120, 0.35)', count: 16, scale: 2.2 },
  slash: { pattern: 'slash_claw', particleTag: 10215, count: 4, scale: 2.0 },
};

const TYPE_DEFAULTS: Record<string, { special: GbaMoveAnimSpec; physical: GbaMoveAnimSpec; status: GbaMoveAnimSpec }> = {
  FIRE: {
    special: { pattern: 'stream', particleTag: 10033, secondaryTag: 10035, screenTint: 'rgba(255, 80, 20, 0.18)', count: 10, scale: 1.6, frameW: 16, frameH: 16, frames: 4 },
    physical: { pattern: 'punch_impact', particleTag: 10055, secondaryTag: 10033, count: 8, scale: 1.8 },
    status: { pattern: 'orbit_aura', particleTag: 10076, count: 8, scale: 1.5 },
  },
  WATER: {
    special: { pattern: 'stream', particleTag: 10042, secondaryTag: 10113, screenTint: 'rgba(40, 130, 255, 0.18)', count: 10, scale: 1.6 },
    physical: { pattern: 'wave_surge', particleTag: 10113, secondaryTag: 10042, count: 8, scale: 1.8 },
    status: { pattern: 'orbit_aura', particleTag: 10042, count: 8, scale: 1.5 },
  },
  ELECTRIC: {
    special: { pattern: 'sky_strike', particleTag: 10037, secondaryTag: 10036, screenTint: 'rgba(255, 235, 60, 0.22)', count: 8, scale: 1.9 },
    physical: { pattern: 'punch_impact', particleTag: 10036, secondaryTag: 10001, count: 8, scale: 1.7, frameW: 32, frameH: 32, frames: 4 },
    status: { pattern: 'orbit_aura', particleTag: 10001, count: 8, scale: 1.6 },
  },
  GRASS: {
    special: { pattern: 'stream', particleTag: 10309, secondaryTag: 10063, count: 10, scale: 1.6 },
    physical: { pattern: 'slash_claw', particleTag: 10063, secondaryTag: 10319, count: 8, scale: 1.8 },
    status: { pattern: 'orbit_aura', particleTag: 10159, secondaryTag: 10031, count: 10, scale: 1.6 },
  },
  ICE: {
    special: { pattern: 'stream', particleTag: 10043, secondaryTag: 10031, screenTint: 'rgba(130, 225, 255, 0.20)', count: 10, scale: 1.6 },
    physical: { pattern: 'sky_strike', particleTag: 10262, secondaryTag: 10043, count: 8, scale: 1.8 },
    status: { pattern: 'orbit_aura', particleTag: 10043, count: 8, scale: 1.5 },
  },
  FIGHTING: {
    special: { pattern: 'stream', particleTag: 10308, secondaryTag: 10084, count: 8, scale: 1.9 },
    physical: { pattern: 'punch_impact', particleTag: 10055, secondaryTag: 10035, count: 8, scale: 1.9 },
    status: { pattern: 'orbit_aura', particleTag: 10055, secondaryTag: 10031, count: 6, scale: 1.7 },
  },
  POISON: {
    special: { pattern: 'stream', particleTag: 10123, secondaryTag: 10150, screenTint: 'rgba(140, 50, 170, 0.18)', count: 10, scale: 1.6 },
    physical: { pattern: 'slash_claw', particleTag: 10123, secondaryTag: 10215, count: 8, scale: 1.7 },
    status: { pattern: 'orbit_aura', particleTag: 10123, count: 8, scale: 1.6 },
  },
  GROUND: {
    special: { pattern: 'sky_strike', particleTag: 10083, secondaryTag: 10300, count: 10, scale: 1.8 },
    physical: { pattern: 'wave_surge', particleTag: 10300, secondaryTag: 10114, count: 10, scale: 1.9 },
    status: { pattern: 'orbit_aura', particleTag: 10114, count: 8, scale: 1.6 },
  },
  FLYING: {
    special: { pattern: 'wave_surge', particleTag: 10009, count: 8, scale: 2.0 },
    physical: { pattern: 'slash_claw', particleTag: 10075, secondaryTag: 10270, count: 8, scale: 1.8 },
    status: { pattern: 'orbit_aura', particleTag: 10270, count: 8, scale: 1.6 },
  },
  PSYCHIC: {
    special: { pattern: 'orbit_aura', particleTag: 10196, secondaryTag: 10031, screenTint: 'rgba(220, 80, 220, 0.22)', count: 8, scale: 1.8 },
    physical: { pattern: 'slash_claw', particleTag: 10075, secondaryTag: 10196, count: 6, scale: 1.8 },
    status: { pattern: 'orbit_aura', particleTag: 10196, count: 6, scale: 1.7 },
  },
  BUG: {
    special: { pattern: 'stream', particleTag: 10089, secondaryTag: 10031, count: 10, scale: 1.6 },
    physical: { pattern: 'slash_claw', particleTag: 10285, count: 6, scale: 2.0 },
    status: { pattern: 'orbit_aura', particleTag: 10098, count: 6, scale: 1.8 },
  },
  ROCK: {
    special: { pattern: 'stream', particleTag: 10114, count: 10, scale: 1.8 },
    physical: { pattern: 'sky_strike', particleTag: 10300, secondaryTag: 10114, count: 10, scale: 1.9 },
    status: { pattern: 'orbit_aura', particleTag: 10114, count: 8, scale: 1.6 },
  },
  GHOST: {
    special: { pattern: 'stream', particleTag: 10176, secondaryTag: 10200, screenTint: 'rgba(20, 10, 45, 0.35)', count: 10, scale: 1.8 },
    physical: { pattern: 'slash_claw', particleTag: 10193, secondaryTag: 10215, screenTint: 'rgba(25, 10, 45, 0.28)', count: 6, scale: 2.0 },
    status: { pattern: 'orbit_aura', particleTag: 10200, screenTint: 'rgba(20, 10, 45, 0.30)', count: 6, scale: 1.8 },
  },
  DRAGON: {
    special: { pattern: 'stream', particleTag: 10128, secondaryTag: 10256, screenTint: 'rgba(90, 50, 210, 0.22)', count: 10, scale: 1.8 },
    physical: { pattern: 'slash_claw', particleTag: 10215, secondaryTag: 10128, count: 6, scale: 2.0 },
    status: { pattern: 'orbit_aura', particleTag: 10128, count: 8, scale: 1.7 },
  },
  DARK: {
    special: { pattern: 'burst_explosion', particleTag: 10176, screenTint: 'rgba(15, 10, 30, 0.38)', count: 10, scale: 1.9 },
    physical: { pattern: 'bite_fang', particleTag: 10104, screenTint: 'rgba(15, 10, 30, 0.28)', count: 6, scale: 1.9 },
    status: { pattern: 'orbit_aura', particleTag: 10176, screenTint: 'rgba(15, 10, 30, 0.30)', count: 6, scale: 1.7 },
  },
  STEEL: {
    special: { pattern: 'stream', particleTag: 10301, secondaryTag: 10031, count: 10, scale: 1.7 },
    physical: { pattern: 'slash_claw', particleTag: 10018, secondaryTag: 10035, count: 6, scale: 2.0 },
    status: { pattern: 'orbit_aura', particleTag: 10301, count: 6, scale: 1.7 },
  },
  FAIRY: {
    special: { pattern: 'stream', particleTag: 10191, secondaryTag: 10027, screenTint: 'rgba(255, 150, 220, 0.22)', count: 10, scale: 1.6 },
    physical: { pattern: 'punch_impact', particleTag: 10027, secondaryTag: 10210, count: 8, scale: 1.7 },
    status: { pattern: 'orbit_aura', particleTag: 10159, secondaryTag: 10031, count: 10, scale: 1.6 },
  },
  NORMAL: {
    special: { pattern: 'stream', particleTag: 10084, secondaryTag: 10027, count: 10, scale: 1.7 },
    physical: { pattern: 'punch_impact', particleTag: 10035, secondaryTag: 10055, count: 6, scale: 1.9 },
    status: { pattern: 'orbit_aura', particleTag: 10031, count: 8, scale: 1.6 },
  },
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
  'chuzos': 'icicle crash',
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
  'ultrapuno': 'mach punch',
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

  // Keyword heuristics for the rest of the 950+ moves (EN + ES)
  if (name) {
    if (name.includes('punch') || name.includes('hammer') || name.includes('fist') || name.includes('puno') || name.includes('martillo')) {
      const base = TYPE_DEFAULTS[(moveType || 'NORMAL').toUpperCase()] || TYPE_DEFAULTS.NORMAL;
      return { ...base.physical, pattern: 'punch_impact', particleTag: 10055, secondaryTag: base.special.particleTag };
    }
    if (name.includes('fang') || name.includes('bite') || name.includes('crunch') || name.includes('colmillo') || name.includes('mord')) {
      const base = TYPE_DEFAULTS[(moveType || 'NORMAL').toUpperCase()] || TYPE_DEFAULTS.NORMAL;
      return { pattern: 'bite_fang', particleTag: 10104, secondaryTag: base.special.particleTag, count: 6, scale: 1.9 };
    }
    if (name.includes('claw') || name.includes('slash') || name.includes('cut') || name.includes('sword') || name.includes('blade') || name.includes('garra') || name.includes('tajo') || name.includes('corte') || name.includes('espada')) {
      return { pattern: 'slash_claw', particleTag: name.includes('sword') || name.includes('espada') ? 10018 : 10215, secondaryTag: 10075, count: 6, scale: 2.0 };
    }
    if (name.includes('beam') || name.includes('pulse') || name.includes('ball') || name.includes('cannon') || name.includes('bomb') || name.includes('rayo') || name.includes('pulso') || name.includes('bola') || name.includes('canon') || name.includes('bomba')) {
      const base = TYPE_DEFAULTS[(moveType || 'NORMAL').toUpperCase()] || TYPE_DEFAULTS.NORMAL;
      return { ...base.special, pattern: 'stream' };
    }
    if (name.includes('dance') || name.includes('heal') || name.includes('recover') || name.includes('wish') || name.includes('veil') || name.includes('danza') || name.includes('cura') || name.includes('velo')) {
      return { pattern: 'orbit_aura', particleTag: 10031, secondaryTag: 10271, count: 10, scale: 1.6 };
    }
  }

  const typeKey = (moveType || 'NORMAL').toUpperCase();
  const typeEntry = TYPE_DEFAULTS[typeKey] || TYPE_DEFAULTS.NORMAL;
  const cat = (category || 'SPECIAL').toUpperCase();
  if (cat === 'STATUS') return typeEntry.status;
  if (cat === 'PHYSICAL') return typeEntry.physical;
  return typeEntry.special;
}
