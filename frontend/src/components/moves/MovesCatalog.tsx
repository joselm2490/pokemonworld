import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowLeft,
  Zap,
  Sword,
  Sparkles,
  Shield,
  Layers,
  Flame,
  Info,
} from 'lucide-react';
import { StadiumMove, TypeDetail } from '../../types/stadium';
import { PokedexService } from '../../services/pokedexService';

interface MovesCatalogProps {
  onBack: () => void;
}

export const MovesCatalog: React.FC<MovesCatalogProps> = ({ onBack }) => {
  const [moves, setMoves] = useState<StadiumMove[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedGen, setSelectedGen] = useState('');
  const [typesList, setTypesList] = useState<TypeDetail[]>([]);

  // Selected Move Detail Modal / Tooltip
  const [activeMove, setActiveMove] = useState<StadiumMove | null>(null);

  useEffect(() => {
    PokedexService.getTypes()
      .then((data) => setTypesList(data.tipos))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      PokedexService.getMovesList({
        q: query.trim(),
        tipo: selectedType,
        clase: selectedClass,
        gen: selectedGen,
        limit: 100,
      })
        .then((data) => {
          if (active) {
            setMoves(data.results);
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
  }, [query, selectedType, selectedClass, selectedGen]);

  return (
    <div className="min-h-screen bg-[#f2f4f7] text-slate-800 flex flex-col font-sans select-none">
      {/* Header */}
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
                <Zap className="w-4 h-4 text-amber-500" />
                Catálogo Oficial de Movimientos
              </h1>
              <p className="text-[10px] text-slate-500">
                953 Movimientos Oficiales (Gen 1 - Gen 9, Movimientos Z y Gigamax)
              </p>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              {totalCount} Movimientos
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1 flex flex-col gap-5">
        {/* Filters Bar */}
        <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar ataque (Lanzallamas, Terremoto, Rayo, Surf...)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-amber-500 transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Quick Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {/* Type selector */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:outline-hidden focus:border-amber-500"
            >
              <option value="">Todos los Tipos Elementales</option>
              {typesList.map((t) => (
                <option key={t.id} value={t.nombre}>
                  {t.nombre} ({t.nombre_ingles})
                </option>
              ))}
            </select>

            {/* Class selector */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:outline-hidden focus:border-amber-500"
            >
              <option value="">Todas las Clases</option>
              <option value="Físico">Físico (Contacto / Fuerza directa)</option>
              <option value="Especial">Especial (Energía elemental)</option>
              <option value="Estado">Estado (Buffs / Debuffs / Alteraciones)</option>
            </select>

            {/* Gen selector */}
            <select
              value={selectedGen}
              onChange={(e) => setSelectedGen(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:outline-hidden focus:border-amber-500"
            >
              <option value="">Todas las Generaciones</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
                <option key={g} value={String(g)}>
                  Generación {g}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Moves Table / Cards Grid */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
              Cargando movimientos...
            </p>
          </div>
        ) : moves.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 text-center">
            <Info className="w-10 h-10 text-slate-400 mb-2" />
            <h3 className="text-slate-800 font-bold text-sm">No se encontraron movimientos</h3>
            <p className="text-slate-500 text-xs mt-1">Prueba con otros términos de búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {moves.map((mv) => (
              <div
                key={mv.id}
                onClick={() => setActiveMove(mv)}
                className="bg-white border border-slate-200 hover:border-amber-400 p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-xs hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5"
              >
                {/* Header Move Card */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                      {mv.nombre}
                    </h3>
                    <span className="text-[10px] text-slate-400 italic">
                      {mv.nombre_ingles} {mv.codigo && `• Cod: ${mv.codigo}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      style={{ backgroundColor: mv.tipo_color }}
                      className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white shadow-xs uppercase tracking-wider"
                    >
                      {mv.tipo}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        mv.clase === 'Físico'
                          ? 'bg-red-100 text-red-700 border border-red-300'
                          : mv.clase === 'Especial'
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {mv.clase}
                    </span>
                  </div>
                </div>

                {/* Metrics Stats */}
                <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200 text-center text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">Potencia</span>
                    <span className="font-bold text-amber-700">
                      {mv.potencia ?? mv.potencia_texto ?? '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">Precisión</span>
                    <span className="font-bold text-slate-800">
                      {mv.precision ? `${mv.precision}%` : mv.precision_texto ?? '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">PP</span>
                    <span className="font-bold text-slate-600">
                      {mv.pp ?? mv.pp_texto ?? '-'}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-xl">
                  {mv.descripcion || 'Sin descripción disponible para este movimiento.'}
                </p>

                {/* Special Tags (Gigamax, Contacto, Z) */}
                <div className="flex items-center gap-1.5 flex-wrap text-[9px]">
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                    Gen {mv.gen}
                  </span>
                  {mv.prioridad !== 0 && (
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md font-bold">
                      Prioridad {mv.prioridad > 0 ? `+${mv.prioridad}` : mv.prioridad}
                    </span>
                  )}
                  {mv.contacto && (
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-semibold">
                      Contacto físico
                    </span>
                  )}
                  {mv.es_gigamax && (
                    <span className="bg-rose-100 text-rose-700 border border-rose-300 px-2 py-0.5 rounded-md font-bold">
                      GIGAMAX
                    </span>
                  )}
                  {mv.es_movimiento_z && (
                    <span className="bg-emerald-100 text-emerald-700 border border-emerald-300 px-2 py-0.5 rounded-md font-bold">
                      MOVIMIENTO Z
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Single Move */}
      {activeMove && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border-2 border-zinc-700 w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-black uppercase text-white">{activeMove.nombre}</h3>
                <span className="text-xs text-zinc-400 italic">
                  {activeMove.nombre_ingles} • Gen {activeMove.gen}
                </span>
              </div>
              <span
                style={{ backgroundColor: activeMove.tipo_color }}
                className="px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-xs uppercase"
              >
                {activeMove.tipo}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-zinc-950 p-3 rounded-2xl border border-zinc-800 text-center">
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase">Potencia</span>
                <span className="font-extrabold text-amber-400 text-sm">
                  {activeMove.potencia ?? activeMove.potencia_texto ?? '-'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase">Precisión</span>
                <span className="font-extrabold text-white text-sm">
                  {activeMove.precision ? `${activeMove.precision}%` : activeMove.precision_texto ?? '-'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase">PP</span>
                <span className="font-extrabold text-zinc-300 text-sm">
                  {activeMove.pp ?? activeMove.pp_texto ?? '-'}
                </span>
              </div>
            </div>

            <div className="bg-zinc-950/80 p-3.5 rounded-2xl border border-zinc-800">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                Efecto en Combate:
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {activeMove.descripcion || 'Sin descripción detallada.'}
              </p>
              {activeMove.efecto_secundario && (
                <p className="text-[11px] text-zinc-400 mt-2 pt-2 border-t border-zinc-800">
                  <strong className="text-zinc-300">Efecto Secundario:</strong> {activeMove.efecto_secundario} (Prob: {activeMove.probabilidad_efecto}%)
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setActiveMove(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
