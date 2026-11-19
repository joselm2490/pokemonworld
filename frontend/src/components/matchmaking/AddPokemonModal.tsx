import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Plus,
  Check,
  Shield,
  Sparkles,
  Filter,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { StadiumPokemonSummary } from '../../types/stadium';
import { PokedexService } from '../../services/pokedexService';
import { StaticPokemonImage } from '../common/StaticPokemonImage';

interface AddPokemonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPokemon: (species: string) => void;
  currentTeam: string[];
}

export const AddPokemonModal: React.FC<AddPokemonModalProps> = ({
  isOpen,
  onClose,
  onAddPokemon,
  currentTeam,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('todos');
  const [onlyFinalStage, setOnlyFinalStage] = useState(false);
  const [pokemonList, setPokemonList] = useState<StadiumPokemonSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const limit = 24;

  const loadPokemon = () => {
    setLoading(true);
    PokedexService.getPokemonList({
      q: searchTerm.trim() || undefined,
      tipo: selectedType !== 'todos' ? selectedType : undefined,
      campeon: onlyFinalStage ? true : undefined,
      limit,
      offset: page * limit,
    })
      .then((data) => {
        setPokemonList(data.results || []);
        setTotalCount(data.total || 0);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen) {
      loadPokemon();
    }
  }, [isOpen, page, selectedType, onlyFinalStage]);

  // Handle search submit or debounce
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      setPage(0);
      loadPokemon();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  if (!isOpen) return null;

  const maxPages = Math.ceil(totalCount / limit);
  const canAddMore = currentTeam.length < 6;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none font-game animate-in fade-in duration-150">
      <div className="bg-gradient-to-b from-[#111822] via-[#0d121a] to-[#070a0e] border-2 border-emerald-500/50 w-full max-w-2xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#16202c]/90 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                Añadir Pokémon al Escuadrón
              </h2>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Ranura activa: <span className="text-emerald-400 font-bold">{currentTeam.length + 1}/6</span> • Selección directa desde la Pokédex
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-3 bg-slate-900/60 border-b border-slate-800 space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="BUSCAR POR NOMBRE O ESPECIE..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-400 uppercase font-mono"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={() => {
                setOnlyFinalStage((prev) => !prev);
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 shrink-0 ${
                onlyFinalStage
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <span>👑 Solo Fase Final</span>
            </button>
          </div>
        </div>

        {/* Pokémon Grid */}
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-mono">
                Buscando especímenes en la base de datos...
              </p>
            </div>
          ) : pokemonList.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs italic">
              No se encontraron Pokémon con los criterios de búsqueda.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {pokemonList.map((pk) => {
                const cleanSpecies = (pk.nombre_ingles || pk.species || pk.nombre).toUpperCase().replace(/\s+/g, '_');
                const isInTeam = currentTeam.some(
                  (s) => s.toUpperCase().replace(/\s+/g, '_') === cleanSpecies
                );

                return (
                  <div
                    key={pk.id}
                    onClick={() => {
                      if (!isInTeam && canAddMore) {
                        onAddPokemon(cleanSpecies);
                        onClose();
                      }
                    }}
                    className={`p-2.5 rounded-2xl border transition-all flex flex-col items-center relative group text-center ${
                      isInTeam
                        ? 'bg-slate-900/40 border-slate-800 opacity-60 cursor-default'
                        : 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-700 hover:border-emerald-400/80 cursor-pointer shadow-md'
                    }`}
                  >
                    {/* Number & Stage */}
                    <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 mb-1">
                      <span>#{String(pk.numero_pokedex).padStart(3, '0')}</span>
                      {pk.campeon && <span className="text-amber-400 text-[8px] font-bold">FASE FINAL</span>}
                    </div>

                    {/* Image */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center my-1">
                      <StaticPokemonImage
                        species={cleanSpecies}
                        alt={pk.nombre}
                        className="w-14 h-14 sm:w-16 sm:h-16 object-contain group-hover:scale-110 transition-transform"
                      />
                    </div>

                    {/* Name */}
                    <h4 className="font-black text-xs text-white uppercase truncate max-w-full">
                      {pk.nombre}
                    </h4>

                    {/* Types */}
                    <div className="flex items-center gap-1 my-1">
                      {pk.types_detail?.map((t) => (
                        <span
                          key={t.id}
                          style={{ backgroundColor: t.color_hex }}
                          className="px-2 py-0.2 rounded-full text-[8px] font-bold text-white uppercase"
                        >
                          {t.nombre}
                        </span>
                      ))}
                    </div>

                    {/* Stat BST */}
                    <div className="w-full flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-800 pt-1 mt-1 font-mono">
                      <span>BST:</span>
                      <strong className="text-amber-300">{pk.base_stats?.total || '—'}</strong>
                    </div>

                    {/* Status Button */}
                    <div className="mt-2 w-full">
                      {isInTeam ? (
                        <span className="w-full py-1 rounded-lg bg-slate-800 text-slate-400 text-[9px] font-bold flex items-center justify-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" /> En Equipo
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAddMore}
                          className="w-full py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-bold tracking-wider uppercase flex items-center justify-center gap-1 transition-all shadow-xs"
                        >
                          <Plus className="w-3 h-3" /> Añadir
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-2.5 bg-[#141d27] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[10px] font-mono">
            Total disponibles: <strong className="text-white">{totalCount}</strong> Pokémon
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono">
              Página {page + 1} de {Math.max(1, maxPages)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(maxPages - 1, p + 1))}
              disabled={page >= maxPages - 1 || loading}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
