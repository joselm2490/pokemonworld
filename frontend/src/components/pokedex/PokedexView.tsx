import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowLeft,
  Award,
  Sparkles,
  Layers,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { StadiumPokemonSummary, TypeDetail } from '../../types/stadium';
import { PokedexService } from '../../services/pokedexService';
import { StaticPokemonImage } from '../common/StaticPokemonImage';
import { PokedexDetailModal } from './PokedexDetailModal';

interface PokedexViewProps {
  onBack: () => void;
}

export const PokedexView: React.FC<PokedexViewProps> = ({ onBack }) => {
  const [pokemonList, setPokemonList] = useState<StadiumPokemonSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedGen, setSelectedGen] = useState('');
  const [selectedRareza, setSelectedRareza] = useState('');
  const [selectedFase, setSelectedFase] = useState('');
  const [onlyChampions, setOnlyChampions] = useState(false);
  const [typesList, setTypesList] = useState<TypeDetail[]>([]);

  // Selected for Modal
  const [selectedPokemonId, setSelectedPokemonId] = useState<number | string | null>(null);

  // Load types once
  useEffect(() => {
    PokedexService.getTypes()
      .then((data) => setTypesList(data.tipos))
      .catch((err) => console.error(err));
  }, []);

  // Fetch Pokemon when filters change
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      PokedexService.getPokemonList({
        q: query.trim(),
        tipo: selectedType,
        gen: selectedGen,
        rareza: selectedRareza,
        fase: selectedFase,
        campeon: onlyChampions,
        limit: 24,
      })
        .then((data) => {
          if (active) {
            setPokemonList(data.results);
            setTotalCount(data.total);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error(err);
          if (active) setLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, selectedType, selectedGen, selectedRareza, selectedFase, onlyChampions]);

  const handleResetFilters = () => {
    setQuery('');
    setSelectedType('');
    setSelectedGen('');
    setSelectedRareza('');
    setSelectedFase('');
    setOnlyChampions(false);
  };

  return (
    <div className="min-h-screen bg-[#f2f4f7] text-slate-800 flex flex-col font-sans select-none">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-all border border-slate-300 flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver</span>
            </button>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-wider uppercase flex items-center gap-2 text-slate-900">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                Pokédex Nacional Stadium
              </h1>
              <p className="text-[10px] text-slate-500">
                1,082 Pokémon • Formas, Fases Evolutivas y Estadísticas
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              {totalCount} Registros Encontrados
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1 flex flex-col gap-5">
        {/* Filter Controls Card */}
        <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre o número (#001, Charizard, Lucario...)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-amber-500 transition-all shadow-inner"
              />
            </div>

            {/* Quick Champion Toggle */}
            <button
              onClick={() => setOnlyChampions(!onlyChampions)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                onlyChampions
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-100 text-slate-600 border-slate-300 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Solo Campeones</span>
            </button>

            {/* Reset Filters */}
            {(query || selectedType || selectedGen || selectedRareza || selectedFase || onlyChampions) && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpiar</span>
              </button>
            )}
          </div>

          {/* Secondary Filters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {/* Type selector */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-hidden focus:border-amber-500"
            >
              <option value="">Todos los Tipos</option>
              {typesList.map((t) => (
                <option key={t.id} value={t.nombre}>
                  {t.nombre} ({t.nombre_ingles})
                </option>
              ))}
            </select>

            {/* Generation selector */}
            <select
              value={selectedGen}
              onChange={(e) => setSelectedGen(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-hidden focus:border-amber-500"
            >
              <option value="">Todas las Generaciones</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
                <option key={g} value={String(g)}>
                  Generación {g}
                </option>
              ))}
            </select>

            {/* Rareza selector */}
            <select
              value={selectedRareza}
              onChange={(e) => setSelectedRareza(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-hidden focus:border-amber-500"
            >
              <option value="">Cualquier Rareza</option>
              <option value="estandar">Estándar</option>
              <option value="legendario">Legendarios</option>
              <option value="pseudolegendario">Pseudolegendarios</option>
            </select>

            {/* Fase selector */}
            <select
              value={selectedFase}
              onChange={(e) => setSelectedFase(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-hidden focus:border-amber-500"
            >
              <option value="">Cualquier Fase</option>
              <option value="1">Fase 1 (Básica)</option>
              <option value="2">Fase 2 (1ra Evolución)</option>
              <option value="3">Fase 3 (2da Evolución)</option>
            </select>
          </div>
        </section>

        {/* Pokemon Grid */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-500 text-xs uppercase font-bold tracking-widest">
              Consultando catálogo de criaturas...
            </p>
          </div>
        ) : pokemonList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 text-center">
            <Sparkles className="w-10 h-10 text-slate-400 mb-2" />
            <h3 className="text-slate-800 font-bold text-sm">No se encontraron Pokémon</h3>
            <p className="text-slate-500 text-xs mt-1 max-w-sm">
              Prueba cambiando o limpiando los filtros de búsqueda seleccionados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {pokemonList.map((pkmn) => (
              <div
                key={pkmn.id}
                onClick={() => setSelectedPokemonId(pkmn.id)}
                className="group relative bg-white border border-slate-200 hover:border-amber-400 p-3 rounded-2xl flex flex-col items-center justify-between cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-xs hover:shadow-md"
              >
                {/* Top Badges */}
                <div className="w-full flex items-center justify-between text-[10px] mb-1">
                  <span className="font-extrabold text-slate-400 group-hover:text-amber-600 transition-colors">
                    #{String(pkmn.numero_pokedex).padStart(3, '0')}
                  </span>
                  {pkmn.campeon && (
                    <Award className="w-3.5 h-3.5 text-amber-500 drop-shadow-xs" />
                  )}
                  {pkmn.categoria_rareza === 'legendario' && (
                    <span className="w-2 h-2 rounded-full bg-purple-500 shadow-xs shadow-purple-500" />
                  )}
                </div>

                {/* Animated Sprite */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center my-1 relative">
                  <div className="absolute inset-0 bg-radial from-amber-400/5 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <StaticPokemonImage
                    dexNumber={pkmn.numero_pokedex}
                    species={pkmn.species}
                    alt={pkmn.nombre}
                    className="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-[0_4px_10px_rgba(0,0,0,0.15)] group-hover:scale-110 transition-transform"
                  />
                </div>

                {/* Name & Types */}
                <div className="w-full text-center space-y-1.5">
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 uppercase tracking-wide truncate group-hover:text-amber-600 transition-colors">
                    {pkmn.nombre}
                  </h3>

                  {/* Type Badges */}
                  <div className="flex items-center justify-center gap-1 flex-wrap">
                    {pkmn.types_detail.map((t) => (
                      <span
                        key={t.id}
                        style={{ backgroundColor: t.color_hex }}
                        className="px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white uppercase shadow-xs"
                      >
                        {t.nombre}
                      </span>
                    ))}
                  </div>

                  {/* Base Stat Total Footer */}
                  {pkmn.base_stats && (
                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-500">
                      <span>Fase {pkmn.fase}</span>
                      <span className="font-bold text-slate-700">BST: {pkmn.base_stats.total}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedPokemonId !== null && (
        <PokedexDetailModal
          pokemonIdOrName={selectedPokemonId}
          onClose={() => setSelectedPokemonId(null)}
          onSelectPokemon={(id) => setSelectedPokemonId(id)}
        />
      )}
    </div>
  );
};
