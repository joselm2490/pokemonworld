import { PokemonType } from '../types/pokemon';

export const TYPE_COLORS: Record<PokemonType, { bg: string; text: string; border: string }> = {
  NORMAL: { bg: 'bg-stone-500', text: 'text-stone-100', border: 'border-stone-400' },
  FIRE: { bg: 'bg-orange-600', text: 'text-orange-100', border: 'border-orange-500' },
  WATER: { bg: 'bg-blue-600', text: 'text-blue-100', border: 'border-blue-400' },
  GRASS: { bg: 'bg-emerald-600', text: 'text-emerald-100', border: 'border-emerald-400' },
  ELECTRIC: { bg: 'bg-yellow-500', text: 'text-yellow-950', border: 'border-yellow-400' },
  ICE: { bg: 'bg-cyan-500', text: 'text-cyan-950', border: 'border-cyan-300' },
  FIGHTING: { bg: 'bg-red-700', text: 'text-red-100', border: 'border-red-600' },
  POISON: { bg: 'bg-purple-600', text: 'text-purple-100', border: 'border-purple-400' },
  GROUND: { bg: 'bg-amber-700', text: 'text-amber-100', border: 'border-amber-600' },
  FLYING: { bg: 'bg-indigo-400', text: 'text-indigo-950', border: 'border-indigo-300' },
  PSYCHIC: { bg: 'bg-pink-600', text: 'text-pink-100', border: 'border-pink-400' },
  BUG: { bg: 'bg-lime-600', text: 'text-lime-100', border: 'border-lime-400' },
  ROCK: { bg: 'bg-yellow-800', text: 'text-yellow-100', border: 'border-yellow-700' },
  GHOST: { bg: 'bg-indigo-800', text: 'text-indigo-100', border: 'border-indigo-600' },
  DRAGON: { bg: 'bg-violet-800', text: 'text-violet-100', border: 'border-violet-600' },
  STEEL: { bg: 'bg-slate-500', text: 'text-slate-100', border: 'border-slate-400' },
  FAIRY: { bg: 'bg-pink-400', text: 'text-pink-950', border: 'border-pink-300' },
  DARK: { bg: 'bg-neutral-800', text: 'text-neutral-100', border: 'border-neutral-600' },
};

