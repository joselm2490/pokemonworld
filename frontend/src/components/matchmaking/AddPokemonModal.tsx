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

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      setPage(0);
      loadPokemon();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  if (!isOpen) return null;

  const maxPages = Math.ceil(totalCount / limit);
  const canAddMore = currentTeam.length < 6;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 select-none font-sans animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden pb-3 max-h-[85vh]">
        {/* Header: Solid Black with Chamfered Accent */}
        <div className="bg-[#14171a] text-white px-5 py-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00ff9d]" />
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                Añadir al Escuadrón
              </h2>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Ranura activa: <span className="text-[#00ff9d] font-bold">{currentTeam.length + 1}/6</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Cerrar"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="BUSCAR POKÉMON..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 uppercase font-mono shadow-2xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 text-xs"
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
              className={`px-2.5 py-1.5 rounded-xl border text-[9px] font-bold tracking-wider uppercase transition-all flex items-center gap-1 shrink-0 ${
                onlyFinalStage
                  ? 'bg-amber-100 border-amber-400 text-amber-800'
                  : 'bg-white border-slate-300 text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>👑 Fase Final</span>
            </button>
          </div>
        </div>

        {/* Grid of Pokemon Cards */}
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2.5">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                Buscando especímenes...
              </p>
            </div>
          ) : pokemonList.length === 0 ? (
            <div className="py-14 text-center text-slate-400 text-xs italic">
              No se encontraron Pokémon.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
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
                    className={`p-2 rounded-xl border transition-all flex flex-col items-center text-center relative group ${
                      isInTeam
                        ? 'bg-slate-100 border-slate-200 opacity-60 cursor-default'
                        : 'bg-white hover:bg-emerald-50/50 border-slate-200 hover:border-emerald-400 cursor-pointer shadow-xs'
                    }`}
                  >
                    <div className="w-full flex items-center justify-between text-[8px] font-mono text-slate-400 mb-0.5">
                      <span>#{String(pk.numero_pokedex).padStart(3, '0')}</span>
                      {pk.campeon && <span className="text-amber-500 font-bold">FASE FINAL</span>}
                    </div>

                    <div className="w-14 h-14 flex items-center justify-center my-0.5">
                      <StaticPokemonImage
                        species={cleanSpecies}
                        alt={pk.nombre}
                        className="w-12 h-12 object-contain group-hover:scale-110 transition-transform"
                      />
                    </div>

                    <h4 className="font-bold text-xs text-slate-800 uppercase truncate max-w-full">
                      {pk.nombre}
                    </h4>

                    <div className="flex items-center gap-1 my-1">
                      {pk.types_detail?.map((t) => (
                        <span
                          key={t.id}
                          style={{ backgroundColor: t.color_hex }}
                          className="px-1.5 py-0.2 rounded-full text-[7px] font-bold text-white uppercase"
                        >
                          {t.nombre}
                        </span>
                      ))}
                    </div>

                    <div className="w-full flex items-center justify-between text-[8px] text-slate-500 border-t border-slate-100 pt-0.5 font-mono">
                      <span>BST:</span>
                      <strong className="text-slate-800">{pk.base_stats?.total || '—'}</strong>
                    </div>

                    <div className="mt-1.5 w-full">
                      {isInTeam ? (
                        <span className="w-full py-0.5 rounded bg-slate-200 text-slate-500 text-[8px] font-bold flex items-center justify-center gap-1">
                          <Check className="w-2.5 h-2.5 text-emerald-600" /> En Equipo
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAddMore}
                          className="w-full py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-bold tracking-wider uppercase flex items-center justify-center gap-1 transition-all shadow-xs"
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
        <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-600">
          <span className="font-mono">
            Total: <strong>{totalCount}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="p-1 rounded bg-white hover:bg-slate-200 disabled:opacity-40 text-slate-700 border border-slate-300"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[9px]">
              {page + 1} / {Math.max(1, maxPages)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(maxPages - 1, p + 1))}
              disabled={page >= maxPages - 1 || loading}
              className="p-1 rounded bg-white hover:bg-slate-200 disabled:opacity-40 text-slate-700 border border-slate-300"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Footer Close Button */}
        <div className="flex justify-center pt-2 pb-1">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 uppercase tracking-wider flex items-center gap-1.5 py-1.5 px-4 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cerrar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
