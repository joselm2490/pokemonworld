import { BattleState } from '../types/pokemon';
import { SPRITE_CACHE } from '../components/battle/AnimatedPokemonSprite';
import { battleLogger } from './logger';
import { getDuelSpriteMode, resolveLocal2DSpriteKey } from './battleSettings';
import { toShowdownSlug } from './speciesToDex';

const TYPE_TO_ANIMATION_FILE: Record<string, string> = {
  NORMAL: 'normal.png',
  FIRE: 'fire.png',
  WATER: 'water.png',
  ELECTRIC: 'electric.png',
  GRASS: 'grass.png',
  ICE: 'ice.png',
  FIGHTING: 'fighting.png',
  POISON: 'poison.png',
  GROUND: 'ground.png',
  FLYING: 'flying.png',
  PSYCHIC: 'psychic.png',
  BUG: 'bug.png',
  ROCK: 'rock.png',
  GHOST: 'dark.png',
  DARK: 'dark.png',
  DRAGON: 'dragon.png',
  STEEL: 'steel.png',
  FAIRY: 'fairy.png',
};

function preloadSingleImage(url: string, storeInSpriteCache = false): Promise<boolean> {
  if (storeInSpriteCache && SPRITE_CACHE.has(url)) {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
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
 * Preloads ONLY the animated battle sprites (Back for player team, Front for opponent team,
 * Icons for player party) and ONLY the attack animation sheets needed for the moves
 * equipped on the exact Pokémon participating in this battle.
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

  // 1. Only player team Back animated sprites + Party Icons
  for (const pk of playerSide.team) {
    const sp = resolveLocal2DSpriteKey(pk.species);
    if (duelMode === '3d') {
      battleSpriteUrls.add(`https://play.pokemonshowdown.com/sprites/ani-back/${toShowdownSlug(pk.species)}.gif`);
    } else {
      battleSpriteUrls.add(`${apiBase}/sprites/Graphics/Pokemon/Back/${sp}.png`);
    }
    iconUrls.add(`${apiBase}/sprites/Graphics/Pokemon/Icons/${sp}.png`);
  }

  // 2. Only opponent team Front animated sprites
  for (const pk of opponentSide.team) {
    const sp = resolveLocal2DSpriteKey(pk.species);
    if (duelMode === '3d') {
      battleSpriteUrls.add(`https://play.pokemonshowdown.com/sprites/ani/${toShowdownSlug(pk.species)}.gif`);
    } else {
      battleSpriteUrls.add(`${apiBase}/sprites/Graphics/Pokemon/Front/${sp}.png`);
    }
  }

  // 3. Only attack animation sheets actually used by the moves of these Pokémon
  const allBattlers = [...playerSide.team, ...opponentSide.team];
  for (const pk of allBattlers) {
    for (const move of pk.moves || []) {
      const animFile = TYPE_TO_ANIMATION_FILE[move.type?.toUpperCase() || 'NORMAL'] || 'normal.png';
      animUrls.add(`/battle-ui/animations/${animFile}`);
      if (move.category === 'STATUS') {
        animUrls.add('/battle-ui/animations/burst.png');
      }
      if (move.function_code && move.function_code.includes('Heal')) {
        animUrls.add('/battle-ui/animations/heal.png');
      }
    }
  }

  battleLogger.battle(
    `Precargando SOLO los recursos de este duelo: ${battleSpriteUrls.size} sprites animados, ${iconUrls.size} iconos de equipo, ${animUrls.size} hojas de animación`,
    {
      sprites: Array.from(battleSpriteUrls),
      animations: Array.from(animUrls),
    }
  );

  // Prioritize active lead Pokémon sprites first, then the rest in parallel
  const tasks: Promise<boolean>[] = [
    ...Array.from(battleSpriteUrls).map((u) => preloadSingleImage(u, true)),
    ...Array.from(iconUrls).map((u) => preloadSingleImage(u, false)),
    ...Array.from(animUrls).map((u) => preloadSingleImage(u, false)),
  ];

  await Promise.all(tasks);
  const elapsedMs = Math.round(performance.now() - t0);
  battleLogger.battle(`Precarga del duelo completada en ${elapsedMs}ms`);
}
