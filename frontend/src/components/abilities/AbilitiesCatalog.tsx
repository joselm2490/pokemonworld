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
}

export const AbilitiesCatalog: React.FC<AbilitiesCatalogProps> = ({ onBack }) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#181c2b] via-[#101421] to-[#0a0d17] text-white flex flex-col font-game select-none">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3 sm:px-6 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all border border-zinc-700 flex items-center gap-1.5 text-xs font-bold shadow-md cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver</span>
            </button>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-wider uppercase flex items-center gap-2 text-white">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Catálogo Oficial de Habilidades
              </h1>
              <p className="text-[10px] text-zinc-400">
                Efectos pasivos, sinergias y talentos de combate
              </p>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/30">
              {totalCount} Habilidades
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1 flex flex-col gap-5">
        {/* Search Bar */}
        <section className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-lg">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar habilidad (Mar Llamas, Intimidación, Clorofila, Robustez...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-hidden focus:border-emerald-400 transition-all shadow-inner"
            />
          </div>
        </section>

        {/* Abilities Grid */}
        <section className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-400 gap-3">
              <Sparkles className="w-8 h-8 text-emerald-400 animate-spin" />
              <span className="text-xs uppercase tracking-widest font-mono">
                Consultando Habilidades...
              </span>
            </div>
          ) : abilities.length === 0 ? (
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-12 text-center text-zinc-400">
              <ShieldCheck className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm font-bold text-zinc-300">
                No se encontraron habilidades
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Prueba con otro término de búsqueda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {abilities.map((ab) => (
                <div
                  key={ab.id}
                  onClick={() => setSelectedAbility(ab)}
                  className="bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between group shadow-md hover:shadow-emerald-500/10"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <h3 className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors">
                          {ab.nombre}
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                        #{ab.id}
                      </span>
                    </div>

                    {ab.nombre_ingles && (
                      <span className="text-[10px] text-zinc-400 font-mono block mb-2 italic">
                        {ab.nombre_ingles}
                      </span>
                    )}

                    <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed">
                      {ab.descripcion || 'Sin descripción disponible.'}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500">
                    <span className="uppercase tracking-wider font-bold text-emerald-500/80">
                      Habilidad Pasiva
                    </span>
                    <span className="text-zinc-400 group-hover:text-white transition-colors">
                      Ver detalle →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Detail Modal */}
      {selectedAbility && (
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
