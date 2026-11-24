import { BattleState } from '../types/pokemon';
import { SPRITE_CACHE } from '../components/battle/AnimatedPokemonSprite';
import { resolveGbaMoveAnimation } from '../components/battle/gbaMoveAnimations';
import { battleLogger } from './logger';
import { getDuelSpriteMode, resolveLocal2DSpriteKey } from './battleSettings';
import { toShowdownSlug } from './speciesToDex';

function preloadSingleImage(url: string, storeInSpriteCache = false): Promise<boolean> {
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
      resolve(false);
    };
    img.src = url;
  });
}

/**
 * Preloads ONLY the animated battle sprites (2D or 3D depending on active setting)
 * and ONLY the GBA particle sheets needed for the moves equipped in this battle.
 */
export async function preloadBattleAssets(
  state: BattleState,
  playerRole: 'p1' | 'p2'
): Promise<void> {
  const t0 = performance.now();
  const apiBase = import.meta.env.VITE_BACKEND_API_URL || '';

  const playerSide = playerRole === 'p1' ? state.p1 : state.p2;
  const opponentSide = playerRole === 'p1' ? state.p2 : state.p1;

  const battleSpriteUrls = new Set<string>();
  const iconUrls = new Set<string>();
  const animUrls = new Set<string>([
    '/battle-ui/animations/ball_POKEBALL.png',
    '/battle-ui/animations/ball_POKEBALL_open.png',
    '/battle-ui/animations/ballBurst_star.png',
  ]);

  const duelMode = getDuelSpriteMode();

  // 1. Player team Back animated sprites + Party Icons
  for (const pk of playerSide.team) {
    const sp = resolveLocal2DSpriteKey(pk.species);
    if (duelMode === '3d') {
      battleSpriteUrls.add(`https://play.pokemonshowdown.com/sprites/ani-back/${toShowdownSlug(pk.species)}.gif`);
    } else {
      battleSpriteUrls.add(`${apiBase}/sprites/Graphics/Pokemon/Back/${sp}.png`);
    }
    iconUrls.add(`/HOMENatDexIcons-main/${toShowdownSlug(pk.species)}.png`);
  }

  // 2. Opponent team Front animated sprites
  for (const pk of opponentSide.team) {
    const sp = resolveLocal2DSpriteKey(pk.species);
    if (duelMode === '3d') {
      battleSpriteUrls.add(`https://play.pokemonshowdown.com/sprites/ani/${toShowdownSlug(pk.species)}.gif`);
    } else {
      battleSpriteUrls.add(`${apiBase}/sprites/Graphics/Pokemon/Front/${sp}.png`);
    }
  }

  // 3. GBA particle sheets actually used by the moves of these Pokémon
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

  battleLogger.battle(
    `Precargando recursos del duelo (${duelMode.toUpperCase()}): ${battleSpriteUrls.size} sprites, ${iconUrls.size} iconos, ${animUrls.size} partículas GBA`,
    {
      mode: duelMode,
      sprites: Array.from(battleSpriteUrls),
      animations: Array.from(animUrls),
    }
  );

  // Store local 2D sprites in SPRITE_CACHE; 3D GIFs use browser cache without crossOrigin
  const storeSpritesInCache = duelMode === '2d';
  const tasks = [
    ...Array.from(battleSpriteUrls).map((u) => preloadSingleImage(u, storeSpritesInCache)),
    ...Array.from(iconUrls).map((u) => preloadSingleImage(u, false)),
    ...Array.from(animUrls).map((u) => preloadSingleImage(u, false)),
  ];

  // Safety timeout (8s) so a flaky CDN image never freezes the loading screen forever
  await Promise.race([
    Promise.all(tasks),
    new Promise<void>((resolve) => setTimeout(resolve, 8000)),
  ]);

  const elapsed = Math.round(performance.now() - t0);
  battleLogger.battle(`Precarga del duelo completada en ${elapsed}ms`);
}
