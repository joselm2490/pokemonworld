import { StadiumPokemonDetail, TypeDetail } from '../types/stadium';

export interface Lv100StatPack {
  hp: number;
  attack: number;
  defense: number;
  sp_attack: number;
  sp_defense: number;
  speed: number;
  total: number;
  ability?: string;
}

export const DEFAULT_POKEMON_TYPES: Record<string, Array<{ id: number; nombre: string; nombre_ingles: string; color_hex: string }>> = {
  CHARIZARD: [
    { id: 10, nombre: 'Fuego', nombre_ingles: 'Fire', color_hex: '#f08030' },
    { id: 3, nombre: 'Volador', nombre_ingles: 'Flying', color_hex: '#a890f0' },
  ],
  PIKACHU: [
    { id: 13, nombre: 'Eléctrico', nombre_ingles: 'Electric', color_hex: '#f8d030' },
  ],
  BLASTOISE: [
    { id: 11, nombre: 'Agua', nombre_ingles: 'Water', color_hex: '#6890f0' },
  ],
  LUCARIO: [
    { id: 2, nombre: 'Lucha', nombre_ingles: 'Fighting', color_hex: '#c03028' },
    { id: 9, nombre: 'Acero', nombre_ingles: 'Steel', color_hex: '#b8b8d0' },
  ],
  GENGAR: [
    { id: 8, nombre: 'Fantasma', nombre_ingles: 'Ghost', color_hex: '#705598' },
    { id: 4, nombre: 'Veneno', nombre_ingles: 'Poison', color_hex: '#a040a0' },
  ],
  GARCHOMP: [
    { id: 16, nombre: 'Dragón', nombre_ingles: 'Dragon', color_hex: '#7038f8' },
    { id: 5, nombre: 'Tierra', nombre_ingles: 'Ground', color_hex: '#e0c068' },
  ],
  GROWLITHE: [
    { id: 10, nombre: 'Fuego', nombre_ingles: 'Fire', color_hex: '#f08030' },
  ],
  VENUSAUR: [
    { id: 12, nombre: 'Planta', nombre_ingles: 'Grass', color_hex: '#78c850' },
    { id: 4, nombre: 'Veneno', nombre_ingles: 'Poison', color_hex: '#a040a0' },
  ],
  SHEDINJA: [
    { id: 7, nombre: 'Bicho', nombre_ingles: 'Bug', color_hex: '#a8b820' },
    { id: 8, nombre: 'Fantasma', nombre_ingles: 'Ghost', color_hex: '#705598' },
  ],
};

export const LV100_FALLBACKS: Record<string, Lv100StatPack> = {
  CHARIZARD: { hp: 360, attack: 293, defense: 280, sp_attack: 348, sp_defense: 295, speed: 328, total: 1904, ability: 'Mar Llamas' },
  PIKACHU: { hp: 274, attack: 229, defense: 196, sp_attack: 218, sp_defense: 218, speed: 306, total: 1441, ability: 'Electricidad Estática' },
  BLASTOISE: { hp: 362, attack: 291, defense: 328, sp_attack: 295, sp_defense: 339, speed: 280, total: 1895, ability: 'Torrente' },
  LUCARIO: { hp: 344, attack: 350, defense: 262, sp_attack: 361, sp_defense: 262, speed: 306, total: 1885, ability: 'Impasible' },
  GENGAR: { hp: 324, attack: 251, defense: 240, sp_attack: 394, sp_defense: 273, speed: 350, total: 1832, ability: 'Cuerpo Maldito' },
  GARCHOMP: { hp: 420, attack: 394, defense: 317, sp_attack: 284, sp_defense: 295, speed: 333, total: 2043, ability: 'Velo Arena' },
  GROWLITHE: { hp: 314, attack: 262, defense: 207, sp_attack: 262, sp_defense: 218, speed: 240, total: 1503, ability: 'Intimidación' },
  VENUSAUR: { hp: 364, attack: 289, defense: 291, sp_attack: 328, sp_defense: 328, speed: 284, total: 1884, ability: 'Espesura' },
  SHEDINJA: { hp: 1, attack: 306, defense: 207, sp_attack: 174, sp_defense: 174, speed: 196, total: 1058, ability: 'Superguarda' },
};

export function getResolvedLv100Stats(species: string, detail?: StadiumPokemonDetail | null): Lv100StatPack {
  const key = species.toUpperCase().replace(/\s+/g, '_');
  const apiStats = detail?.base_stats;

  if (apiStats && apiStats.total > 800) {
    return {
      hp: apiStats.hp,
      attack: apiStats.attack,
      defense: apiStats.defense,
      sp_attack: apiStats.sp_attack,
      sp_defense: apiStats.sp_defense,
      speed: apiStats.speed,
      total: apiStats.total,
      ability: detail?.habilidades?.[0]?.nombre,
    };
  }

  if (apiStats) {
    const isShed = key.includes('SHEDINJA') || apiStats.hp === 1;
    const hp = isShed ? 1 : 2 * apiStats.hp + 204;
    const attack = Math.floor((2 * apiStats.attack + 99) * 1.1);
    const defense = Math.floor((2 * apiStats.defense + 99) * 1.1);
    const sp_attack = Math.floor((2 * apiStats.sp_attack + 99) * 1.1);
    const sp_defense = Math.floor((2 * apiStats.sp_defense + 99) * 1.1);
    const speed = Math.floor((2 * apiStats.speed + 99) * 1.1);
    const total = hp + attack + defense + sp_attack + sp_defense + speed;
    return {
      hp,
      attack,
      defense,
      sp_attack,
      sp_defense,
      speed,
      total,
      ability: detail?.habilidades?.[0]?.nombre,
    };
  }

  if (LV100_FALLBACKS[key]) {
    return LV100_FALLBACKS[key];
  }

  return { hp: 314, attack: 262, defense: 207, sp_attack: 262, sp_defense: 218, speed: 240, total: 1503, ability: 'Presión' };
}

export function getResolvedTypes(species: string, detail?: StadiumPokemonDetail | null): Array<{ id?: number; nombre: string; color_hex: string }> {
  if (detail?.types_detail && detail.types_detail.length > 0) {
    return detail.types_detail;
  }
  const key = species.toUpperCase().replace(/\s+/g, '_');
  if (DEFAULT_POKEMON_TYPES[key]) {
    return DEFAULT_POKEMON_TYPES[key];
  }
  return [{ nombre: 'Normal', color_hex: '#a8a878' }];
}
