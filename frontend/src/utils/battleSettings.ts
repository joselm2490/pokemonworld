export type DuelSpriteMode = '2d' | '3d';

const DUEL_SPRITE_MODE_KEY = 'pokemon_duel_sprite_mode';
const DUEL_SPRITE_EVENT = 'pokemon-duel-sprite-mode-changed';

export function getDuelSpriteMode(): DuelSpriteMode {
  try {
    const val = localStorage.getItem(DUEL_SPRITE_MODE_KEY);
    return val === '3d' ? '3d' : '2d';
  } catch {
    return '2d';
  }
}

export function setDuelSpriteMode(mode: DuelSpriteMode): void {
  try {
    localStorage.setItem(DUEL_SPRITE_MODE_KEY, mode);
    window.dispatchEvent(new CustomEvent(DUEL_SPRITE_EVENT, { detail: mode }));
  } catch {
    // ignore storage errors
  }
}

export function subscribeDuelSpriteMode(cb: (mode: DuelSpriteMode) => void): () => void {
  const onCustom = (e: Event) => {
    const detail = (e as CustomEvent<DuelSpriteMode>).detail;
    cb(detail === '3d' ? '3d' : '2d');
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key === DUEL_SPRITE_MODE_KEY) {
      cb(e.newValue === '3d' ? '3d' : '2d');
    }
  };
  window.addEventListener(DUEL_SPRITE_EVENT, onCustom);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(DUEL_SPRITE_EVENT, onCustom);
    window.removeEventListener('storage', onStorage);
  };
}

const REGIONAL_FORM_EXCEPTIONS: Record<string, string> = {
  MEOWTH_GALAR: 'MEOWTH_2',
  SLOWBRO_GALAR: 'SLOWBRO_2',
  DARUMAKA_GALAR: 'DARUMAKA_2',
  DARMANITAN_GALAR: 'DARMANITAN_2',
  TAUROS_PALDEA_COMBAT: 'TAUROS_1',
  TAUROS_PALDEA_BLAZE: 'TAUROS_2',
  TAUROS_PALDEA_AQUA: 'TAUROS_3',
  'FARFETCH’D_GALAR': 'FARFETCHD_1',
  "FARFETCH'D_GALAR": 'FARFETCHD_1',
  FARFETCHD_GALAR: 'FARFETCHD_1',
  'MR._MIME_GALAR': 'MRMIME_1',
  MR_MIME_GALAR: 'MRMIME_1',
};

/**
 * Resolves a species string (including regional forms like RATICATE-ALOLA / RATICATE_ALOLA)
 * to the corresponding local Animated Pokemon Sprites filename key (e.g. RATICATE_1).
 */
export function resolveLocal2DSpriteKey(species: string): string {
  const normalized = species
    .toUpperCase()
    .trim()
    .replace(/[\s-]+/g, '_');

  if (REGIONAL_FORM_EXCEPTIONS[normalized]) {
    return REGIONAL_FORM_EXCEPTIONS[normalized];
  }

  const regionalMatch = normalized.match(/^(.+)_(ALOLA|GALAR|HISUI|PALDEA)$/);
  if (regionalMatch) {
    const base = regionalMatch[1].replace(/[’'.]/g, '');
    return `${base}_1`;
  }

  return normalized;
}
