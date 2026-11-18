import React, { useEffect, useState } from 'react';
import {
  X,
  Shield,
  Zap,
  Flame,
  Award,
  Layers,
  Sparkles,
  ChevronRight,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { StadiumPokemonDetail } from '../../types/stadium';
import { PokedexService } from '../../services/pokedexService';
import { StaticPokemonImage } from '../common/StaticPokemonImage';

interface PokedexDetailModalProps {
  pokemonIdOrName: number | string;
  onClose: () => void;
  onSelectPokemon: (idOrName: number | string) => void;
}

export const PokedexDetailModal: React.FC<PokedexDetailModalProps> = ({
  pokemonIdOrName,
  onClose,
  onSelectPokemon,
}) => {
  const [pokemon, setPokemon] = useState<StadiumPokemonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'moves' | 'learnset'>('stats');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    PokedexService.getPokemonDetail(pokemonIdOrName)
      .then((data) => {
        if (isMounted) {
          setPokemon(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [pokemonIdOrName]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-zinc-900 border-2 border-amber-500/50 p-6 rounded-2xl flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-amber-400 text-xs font-bold uppercase tracking-widest">
            Accediendo a la Pokédex...
          </p>
        </div>
      </div>
    );
  }

  if (!pokemon) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-red-500/50 p-6 rounded-2xl text-center max-w-sm">
          <p className="text-red-400 text-sm font-bold mb-4">No se pudo cargar la información del Pokémon.</p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const stats = pokemon.base_stats;
  const maxStat = 255;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none font-game animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border-2 border-zinc-700 w-full max-w-3xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-800/80 border-b border-zinc-700/80">
          <div className="flex items-center gap-3">
            <span className="text-amber-400 font-extrabold text-sm sm:text-base tracking-wider">
              #{String(pokemon.numero_pokedex).padStart(3, '0')}
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-wide text-white uppercase">
              {pokemon.nombre}
            </h2>
            <span className="text-zinc-400 text-xs italic hidden sm:inline">
              ({pokemon.nombre_ingles})
            </span>
            {pokemon.campeon && (
              <span className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold">
                <Award className="w-3 h-3 text-amber-400" />
                CAMPEÓN
              </span>
            )}
            {pokemon.categoria_rareza !== 'estandar' && (
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  pokemon.categoria_rareza === 'legendario'
                    ? 'bg-purple-900/60 text-purple-300 border border-purple-500/50'
                    : 'bg-blue-900/60 text-blue-300 border border-blue-500/50'
                }`}
              >
                {pokemon.categoria_rareza}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* Top Hero Section: Sprites + General Info */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-zinc-800/40 border border-zinc-700/50 rounded-2xl p-4">
            {/* Sprites (Front & Back) */}
            <div className="sm:col-span-5 flex flex-col items-center justify-center gap-2">
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center bg-radial from-white/10 to-transparent rounded-2xl p-2">
                <StaticPokemonImage
                  dexNumber={pokemon.numero_pokedex}
                  species={pokemon.species}
                  alt={pokemon.nombre}
                  className="w-36 h-36 sm:w-44 sm:h-44 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
                />
              </div>
              {/* Type Pills */}
              <div className="flex gap-2">
                {pokemon.types_detail.map((t) => (
                  <span
                    key={t.id}
                    style={{ backgroundColor: t.color_hex }}
                    className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-md uppercase tracking-wider border border-white/20"
                  >
                    {t.nombre}
                  </span>
                ))}
              </div>
            </div>

            {/* Attributes & Metrics */}
            <div className="sm:col-span-7 flex flex-col justify-center space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-700/40">
                  <span className="text-zinc-400 block text-[10px] uppercase">Generación</span>
                  <span className="font-bold text-white text-sm">Gen {pokemon.gen}</span>
                </div>
                <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-700/40">
                  <span className="text-zinc-400 block text-[10px] uppercase">Fase Evolutiva</span>
                  <span className="font-bold text-white text-sm">Fase {pokemon.fase}</span>
                </div>
                <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-700/40">
                  <span className="text-zinc-400 block text-[10px] uppercase">Peso</span>
                  <span className="font-bold text-white text-sm">{pokemon.peso_kg ?? '?'} kg</span>
                </div>
                <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-700/40">
                  <span className="text-zinc-400 block text-[10px] uppercase">Altura</span>
                  <span className="font-bold text-white text-sm">{pokemon.altura_m ?? '?'} m</span>
                </div>
              </div>

              {/* Habilidades con Hover Descriptivo */}
              {pokemon.habilidades && pokemon.habilidades.length > 0 && (
                <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-700/50 space-y-1.5">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" /> Habilidades Pasivas
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {pokemon.habilidades.map((hab) => (
                      <div key={hab.id} className="relative group">
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600/80 hover:border-amber-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-help"
                        >
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>{hab.nombre}</span>
                        </button>

                        {/* Tooltip Hover Descriptivo */}
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 w-64 p-3 bg-zinc-950 border-2 border-amber-400/90 rounded-2xl shadow-2xl text-left pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex items-center justify-between border-b border-zinc-800 pb-1 mb-1.5">
                            <span className="font-extrabold text-xs text-amber-300">
                              {hab.nombre}
                            </span>
                            <span className="text-[10px] text-zinc-400 italic">
                              {hab.nombre_ingles}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                            {hab.descripcion || 'Sin descripción disponible para esta habilidad.'}
                          </p>
                          <div className="w-2 h-2 bg-zinc-950 border-r-2 border-b-2 border-amber-400/90 rotate-45 absolute -bottom-1.5 left-6" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evolution Chain Section */}
              <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-700/50">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Cadena Evolutiva
                </span>
                <div className="flex items-center justify-between text-xs gap-1 sm:gap-2">
                  {/* Preevolución */}
                  {pokemon.evoluciones.preevolucion ? (
                    <button
                      onClick={() => onSelectPokemon(pokemon.evoluciones.preevolucion!.id)}
                      className="flex-1 flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 p-1.5 rounded-lg border border-zinc-600 transition-all text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden">
                        <img
                          src={pokemon.evoluciones.preevolucion.icon_url}
                          alt=""
                          className="w-full h-full object-contain"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-[9px] text-zinc-400 block">Pre-evo</span>
                        <span className="font-bold truncate text-[11px] block">
                          {pokemon.evoluciones.preevolucion.nombre}
                        </span>
                      </div>
                    </button>
                  ) : (
                    <div className="flex-1 bg-zinc-950/40 p-2 rounded-lg text-center text-[10px] text-zinc-500 border border-zinc-800">
                      Forma básica
                    </div>
                  )}

                  <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />

                  {/* Actual */}
                  <div className="flex-1 bg-amber-500/20 border border-amber-500/50 p-1.5 rounded-lg text-center">
                    <span className="text-[9px] text-amber-400 font-bold block">Actual (Fase {pokemon.fase})</span>
                    <span className="font-black text-[11px] text-white truncate block">
                      {pokemon.nombre}
                    </span>
                  </div>

                  <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />

                  {/* Evolución */}
                  {pokemon.evoluciones.evolucion ? (
                    <button
                      onClick={() => onSelectPokemon(pokemon.evoluciones.evolucion!.id)}
                      className="flex-1 flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 p-1.5 rounded-lg border border-zinc-600 transition-all text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden">
                        <img
                          src={pokemon.evoluciones.evolucion.icon_url}
                          alt=""
                          className="w-full h-full object-contain"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-[9px] text-zinc-400 block">Evoluciona a</span>
                        <span className="font-bold truncate text-[11px] block">
                          {pokemon.evoluciones.evolucion.nombre}
                        </span>
                      </div>
                    </button>
                  ) : (
                    <div className="flex-1 bg-zinc-950/40 p-2 rounded-lg text-center text-[10px] text-amber-400/80 font-bold border border-amber-500/30">
                      {pokemon.campeon ? '👑 Fase Final' : 'Sin evolución'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="flex border-b border-zinc-700 gap-2">
            <button
              onClick={() => setActiveTab('stats')}
              className={`pb-2 px-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === 'stats'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Estadísticas y Debilidades
            </button>
            <button
              onClick={() => setActiveTab('moves')}
              className={`pb-2 px-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === 'moves'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Movimientos Predeterminados (4)
            </button>
            <button
              onClick={() => setActiveTab('learnset')}
              className={`pb-2 px-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === 'learnset'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Movimientos que Aprende
            </button>
          </div>

          {/* TAB 1: STATS & TYPE EFFECTIVENESS */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              {/* Stats Bars */}
              {stats && (
                <div className="bg-zinc-900/80 border border-zinc-700/60 rounded-2xl p-4 space-y-2.5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Estadísticas Base
                    </span>
                    <span className="text-xs font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                      BST Total: {stats.total}
                    </span>
                  </div>

                  {[
                    { label: 'PS (HP)', val: stats.hp, color: 'bg-emerald-500' },
                    { label: 'Ataque', val: stats.attack, color: 'bg-red-500' },
                    { label: 'Defensa', val: stats.defense, color: 'bg-blue-500' },
                    { label: 'Atq. Esp.', val: stats.sp_attack, color: 'bg-amber-500' },
                    { label: 'Def. Esp.', val: stats.sp_defense, color: 'bg-purple-500' },
                    { label: 'Velocidad', val: stats.speed, color: 'bg-pink-500' },
                  ].map((s) => {
                    const pct = Math.min(100, Math.round((s.val / maxStat) * 100));
                    return (
                      <div key={s.label} className="grid grid-cols-12 gap-2 items-center text-xs">
                        <span className="col-span-3 text-zinc-300 font-semibold">{s.label}</span>
                        <span className="col-span-2 text-right font-bold text-white">{s.val}</span>
                        <div className="col-span-7 bg-zinc-800 h-2.5 rounded-full overflow-hidden border border-zinc-700">
                          <div
                            className={`h-full ${s.color} transition-all duration-500 rounded-full`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Type Effectiveness (Debilidades y Resistencias) */}
              <div className="bg-zinc-900/80 border border-zinc-700/60 rounded-2xl p-4">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-3">
                  Tabla de Debilidades y Resistencias Defensivas
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[10px]">
                  {Object.entries(pokemon.efectividades).map(([key, item]) => {
                    let badgeColor = 'bg-zinc-800 text-zinc-300';
                    let multiplierText = '1x';
                    if (item.multiplicador === 0) {
                      badgeColor = 'bg-zinc-950 text-zinc-500 border border-zinc-700';
                      multiplierText = '0x Inmune';
                    } else if (item.multiplicador >= 4) {
                      badgeColor = 'bg-red-900/80 text-red-200 border border-red-500 font-black';
                      multiplierText = '4x Crítico';
                    } else if (item.multiplicador >= 2) {
                      badgeColor = 'bg-red-800/50 text-red-300 border border-red-500/50 font-bold';
                      multiplierText = '2x Débil';
                    } else if (item.multiplicador <= 0.25) {
                      badgeColor = 'bg-emerald-900/80 text-emerald-200 border border-emerald-500 font-black';
                      multiplierText = '0.25x Súper Res.';
                    } else if (item.multiplicador <= 0.5) {
                      badgeColor = 'bg-emerald-800/50 text-emerald-300 border border-emerald-500/50 font-bold';
                      multiplierText = '0.5x Resiste';
                    }

                    return (
                      <div
                        key={key}
                        className="p-1.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col items-center gap-1"
                      >
                        <span
                          style={{ backgroundColor: item.color_hex }}
                          className="px-2 py-0.5 rounded-full text-white font-bold text-[9px] shadow-xs"
                        >
                          {item.tipo}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${badgeColor}`}>
                          {multiplierText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEFAULT MOVES (4 MOVES) */}
          {activeTab === 'moves' && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400">
                Estos son los 4 movimientos asignados por defecto según el catálogo oficial de Pokémon Stadium World:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pokemon.movimientos_predeterminados_data.map((mv) => (
                  <div
                    key={mv.id}
                    className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 hover:border-zinc-500 transition-all flex flex-col justify-between gap-2 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm">{mv.nombre}</h4>
                      <span
                        style={{ backgroundColor: mv.tipo_color }}
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs"
                      >
                        {mv.tipo}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-300">
                      <span className="bg-zinc-800 px-2 py-0.5 rounded-md text-[10px]">
                        Clase: <strong className="text-white">{mv.clase}</strong>
                      </span>
                      <span>
                        Potencia: <strong className="text-amber-400">{mv.potencia ?? '-'}</strong>
                      </span>
                      <span>
                        Precisión: <strong className="text-white">{mv.precision ? `${mv.precision}%` : '-'}</strong>
                      </span>
                      <span>
                        PP: <strong className="text-zinc-400">{mv.pp ?? '-'}</strong>
                      </span>
                    </div>

                    {mv.descripcion && (
                      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed bg-zinc-950/50 p-2 rounded-lg">
                        {mv.descripcion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LEARNSET */}
          {activeTab === 'learnset' && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-400 mb-2">
                Aprende {pokemon.learnset.length} movimientos a lo largo de su entrenamiento (por nivel, MT y tutor):
              </p>
              <div className="divide-y divide-zinc-800 max-h-72 overflow-y-auto rounded-xl bg-zinc-900/60 border border-zinc-800 p-2 custom-scrollbar">
                {pokemon.learnset.map((item, idx) => (
                  <div key={idx} className="py-2 px-2 flex items-center justify-between text-xs hover:bg-zinc-800/40 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-zinc-800 text-amber-400 font-bold px-1.5 py-0.5 rounded uppercase">
                        {item.metodo === 'nivel' ? `Nv. ${item.nivel}` : item.metodo}
                      </span>
                      <span className="font-bold text-white">{item.movimiento.nombre}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        style={{ backgroundColor: item.movimiento.tipo_color }}
                        className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white"
                      >
                        {item.movimiento.tipo}
                      </span>
                      <span className="text-zinc-400 text-[10px] w-12 text-right">
                        Pot: {item.movimiento.potencia ?? '-'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-900 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            Cerrar Pokédex
          </button>
        </div>
      </div>
    </div>
  );
};
