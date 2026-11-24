import { BattleState } from '../types/pokemon';
import { SPRITE_CACHE } from '../components/battle/AnimatedPokemonSprite';
import { resolveGbaMoveAnimation } from '../components/battle/gbaMoveAnimations';
import { battleLogger } from './logger';
import { getDuelSpriteMode, resolveLocal2DSpriteKey } from './battleSettings';
import { toShowdownSlug } from './speciesToDex';

function preloadSingleImage(
  url: string,
  storeInSpriteCache = false,
  fallbackUrl?: string
): Promise<boolean> {
  if (storeInSpriteCache && SPRITE_CACHE.has(url)) {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    const img = new Image();
    // Showdown CDN does not send CORS headers; only set crossOrigin for backend/local canvas sprites
    if (!url.startsWith('https://play.pokemonshowdown.com')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      if (storeInSpriteCache) {
        SPRITE_CACHE.set(url, img);
      }
      resolve(true);
    };
    img.onerror = () => {
      battleLogger.warn('PRELOAD', `No se pudo precargar ${url}`);
      if (fallbackUrl && fallbackUrl !== url) {
        preloadSingleImage(fallbackUrl, storeInSpriteCache).then(resolve);
      } else {
        resolve(false);
      }
    };
    img.src = url;
  });
}

/**
 * Preloads ALL 12 Pokémon animated battle sprites (6 player + 6 opponent),
 * their party icons, and all GBA particle sheets needed for the moves in this duel.
 * Never resolves until every single asset has finished loading (or fallen back).
 */
export async function preloadBattleAssets(
  state: BattleState,
  playerRole: 'p1' | 'p2'
): Promise<void> {
  const t0 = performance.now();
  const apiBase = import.meta.env.VITE_BACKEND_API_URL || '';

  const playerSide = playerRole === 'p1' ? state.p1 : state.p2;
  const opponentSide = playerRole === 'p1' ? state.p2 : state.p1;

  const spriteEntries: Array<{ url: string; fallback?: string }> = [];
  const iconUrls = new Set<string>();
  const animUrls = new Set<string>([
    '/battle-ui/animations/ball_POKEBALL.png',
    '/battle-ui/animations/ball_POKEBALL_open.png',
    '/battle-ui/animations/ballBurst_star.png',
  ]);

  const duelMode = getDuelSpriteMode();

  // 1. All 6 player team Back animated sprites + Party Icons
  for (const pk of playerSide.team) {
    const sp = resolveLocal2DSpriteKey(pk.species);
    const slug = toShowdownSlug(pk.species);
    if (duelMode === '3d') {
      spriteEntries.push({
        url: `https://play.pokemonshowdown.com/sprites/ani-back/${slug}.gif`,
        fallback: `https://play.pokemonshowdown.com/sprites/gen5-back/${slug}.png`,
      });
    } else {
      spriteEntries.push({
        url: `${apiBase}/sprites/Graphics/Pokemon/Back/${sp}.png`,
      });
    }
    iconUrls.add(`/HOMENatDexIcons-main/${slug}.png`);
  }

  // 2. All 6 opponent team Front animated sprites
  for (const pk of opponentSide.team) {
    const sp = resolveLocal2DSpriteKey(pk.species);
    const slug = toShowdownSlug(pk.species);
    if (duelMode === '3d') {
      spriteEntries.push({
        url: `https://play.pokemonshowdown.com/sprites/ani/${slug}.gif`,
        fallback: `https://play.pokemonshowdown.com/sprites/gen5/${slug}.png`,
      });
    } else {
      spriteEntries.push({
        url: `${apiBase}/sprites/Graphics/Pokemon/Front/${sp}.png`,
      });
    }
  }

  // 3. GBA particle sheets actually used by the moves of all 12 Pokémon
  const allBattlers = [...playerSide.team, ...opponentSide.team];
  for (const pk of allBattlers) {
    for (const move of pk.moves || []) {
      const spec = resolveGbaMoveAnimation(move.name, move.type, move.category);
      animUrls.add(`/battle-ui/gba-particles/${spec.particleTag}.png`);
      if (spec.secondaryTag) {
        animUrls.add(`/battle-ui/gba-particles/${spec.secondaryTag}.png`);
      }
    }
  }

  // Deduplicate sprite URLs
  const uniqueSprites = new Map<string, string | undefined>();
  for (const entry of spriteEntries) {
    if (!uniqueSprites.has(entry.url)) {
      uniqueSprites.set(entry.url, entry.fallback);
    }
  }

  battleLogger.battle(
    `Precargando TODOS los recursos del duelo (${duelMode.toUpperCase()}): ${uniqueSprites.size} sprites (6 tuyos + 6 rival), ${iconUrls.size} iconos, ${animUrls.size} partículas GBA`,
    {
      mode: duelMode,
      sprites: Array.from(uniqueSprites.keys()),
      animations: Array.from(animUrls),
    }
  );

  // Store local 2D sprites in SPRITE_CACHE; 3D GIFs use browser cache without crossOrigin
  const storeSpritesInCache = duelMode === '2d';
  const tasks = [
    ...Array.from(uniqueSprites.entries()).map(([u, fb]) =>
      preloadSingleImage(u, storeSpritesInCache, fb)
    ),
    ...Array.from(iconUrls).map((u) => preloadSingleImage(u, false)),
    ...Array.from(animUrls).map((u) => preloadSingleImage(u, false)),
  ];

  // Wait for ALL 12 Pokémon sprites, icons, and move animations before starting the duel
  await Promise.all(tasks);

  const elapsed = Math.round(performance.now() - t0);
  battleLogger.battle(`Precarga completa del duelo finalizada en ${elapsed}ms`);
}
