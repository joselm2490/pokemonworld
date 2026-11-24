import React, { useState, useEffect } from 'react';
import {
  Search,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Zap,
  Info,
  Layers,
} from 'lucide-react';
import { AbilityDetail } from '../../types/stadium';
import { PokedexService } from '../../services/pokedexService';

interface AbilitiesCatalogProps {
  onBack: () => void;
  embedded?: boolean;
}

export const AbilitiesCatalog: React.FC<AbilitiesCatalogProps> = ({ onBack, embedded = false }) => {
  const [abilities, setAbilities] = useState<AbilityDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [query, setQuery] = useState('');
  const [selectedAbility, setSelectedAbility] = useState<AbilityDetail | null>(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      PokedexService.getHabilidadesList({ q: query.trim() })
        .then((data) => {
          if (active) {
            setAbilities(data.results || []);
            setTotalCount(data.total || 0);
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
  }, [query]);

  if (embedded && selectedAbility) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden text-slate-800 font-sans select-none">
        {/* Compact Light Header */}
        <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setSelectedAbility(null)}
              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1 text-[11px] font-bold cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver</span>
            </button>
            <h2 className="text-xs sm:text-sm font-black uppercase text-slate-900 truncate">
              {selectedAbility.nombre}
            </h2>
          </div>

          <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
            #{selectedAbility.id}
          </span>
        </div>

        {/* Scrollable Detail Content */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-slate-900 truncate">
                {selectedAbility.nombre}
              </h3>
              {selectedAbility.nombre_ingles && (
                <span className="text-xs font-mono text-emerald-700 block truncate">
                  {selectedAbility.nombre_ingles}
                </span>
              )}
              <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                Habilidad Pasiva
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1.5">
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">
              Efecto en Combate
            </span>
            <p className="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200">
              {selectedAbility.descripcion || 'Sin descripción detallada registrada.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        embedded
          ? 'flex-1 flex flex-col overflow-hidden text-slate-800 font-sans select-none'
          : 'min-h-screen bg-[#f2f4f7] text-slate-800 flex flex-col font-sans select-none'
      }
    >
      {/* Header */}
      {embedded ? (
        <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1 text-[11px] font-bold cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver</span>
            </button>
            <h1 className="text-xs font-black tracking-wide uppercase flex items-center gap-1.5 text-slate-900 truncate">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">Habilidades</span>
            </h1>
          </div>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
            {totalCount}
          </span>
        </div>
      ) : (
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
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Catálogo Oficial de Habilidades
                </h1>
                <p className="text-[10px] text-slate-500">
                  Efectos pasivos, sinergias y talentos de combate
                </p>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {totalCount} Habilidades
              </span>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main
        className={
          embedded
            ? 'flex-1 flex flex-col gap-2 overflow-hidden'
            : 'max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1 flex flex-col gap-5'
        }
      >
        {/* Search Bar */}
        <section
          className={
            embedded
              ? 'bg-slate-50 border border-slate-200 rounded-xl p-2 shrink-0'
              : 'bg-white border border-slate-200 rounded-2xl p-4 shadow-sm'
          }
        >
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar habilidad (Mar Llamas, Intimidación, Clorofila, Robustez...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 transition-all shadow-inner"
            />
          </div>
        </section>

        {/* Abilities Grid */}
        <section className={embedded ? 'flex-1 flex flex-col overflow-hidden' : 'flex-1'}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
              <Sparkles className="w-8 h-8 text-emerald-500 animate-spin" />
              <span className="text-xs uppercase tracking-widest font-mono">
                Consultando Habilidades...
              </span>
            </div>
          ) : abilities.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">
                No se encontraron habilidades
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Prueba con otro término de búsqueda.
              </p>
            </div>
          ) : (
            <div
              className={
                embedded
                  ? 'flex-1 overflow-y-auto pr-1 custom-scrollbar grid grid-cols-1 gap-2 content-start'
                  : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5'
              }
            >
              {abilities.map((ab) => (
                <div
                  key={ab.id}
                  onClick={() => setSelectedAbility(ab)}
                  className={`bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-400 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-md ${
                    embedded ? 'p-3' : 'p-4'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {ab.nombre}
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        #{ab.id}
                      </span>
                    </div>

                    {ab.nombre_ingles && (
                      <span className="text-[10px] text-slate-400 font-mono block mb-2 italic">
                        {ab.nombre_ingles}
                      </span>
                    )}

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {ab.descripcion || 'Sin descripción disponible.'}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="uppercase tracking-wider font-bold text-emerald-600">
                      Habilidad Pasiva
                    </span>
                    <span className="text-slate-500 group-hover:text-slate-900 transition-colors">
                      Ver detalle →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Detail Modal (non-embedded mode) */}
      {!embedded && selectedAbility && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedAbility(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  {selectedAbility.nombre}
                </h3>
                <span className="text-xs font-mono text-emerald-400">
                  {selectedAbility.nombre_ingles}
                </span>
              </div>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs text-zinc-300 leading-relaxed my-3">
              {selectedAbility.descripcion || 'Sin descripción detallada registrada.'}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAbility(null)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
