import React, { useEffect, useState } from 'react';
import {
  X,
  Shield,
  Zap,
  Flame,
  Award,
  Layers,
  Sparkles,
  Crown,
  Trash2,
  AlertTriangle,
  ArrowUp,
  Activity,
  Crosshair,
} from 'lucide-react';
import { StadiumPokemonDetail, StadiumMove } from '../../types/stadium';
import { PokedexService } from '../../services/pokedexService';
import { StaticPokemonImage } from '../common/StaticPokemonImage';

interface PokemonDetailSheetProps {
  species: string;
  onClose: () => void;
  onRemoveFromTeam: (species: string) => void;
  canRemove: boolean;
  isLeader: boolean;
  onSetLeader: (species: string) => void;
  teamCount: number;
}

export const PokemonDetailSheet: React.FC<PokemonDetailSheetProps> = ({
  species,
  onClose,
  onRemoveFromTeam,
  canRemove,
  isLeader,
  onSetLeader,
  teamCount,
}) => {
  const [pokemon, setPokemon] = useState<StadiumPokemonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    PokedexService.getPokemonDetail(species)
      .then((data) => {
        if (isMounted) {
          setPokemon(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) {
          setError('No se pudo cargar la información del Pokémon.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [species]);

  const handleRemove = () => {
    if (!canRemove) return;
    onRemoveFromTeam(species);
    onClose();
  };

  const statConfigs = pokemon?.base_stats
    ? [
        { key: 'hp', label: 'PS (HP)', val: pokemon.base_stats.hp, max: 255, color: 'bg-emerald-500' },
        { key: 'atk', label: 'ATAQUE', val: pokemon.base_stats.attack, max: 255, color: 'bg-rose-500' },
        { key: 'def', label: 'DEFENSA', val: pokemon.base_stats.defense, max: 255, color: 'bg-blue-500' },
        { key: 'spa', label: 'ATQ. ESP', val: pokemon.base_stats.sp_attack, max: 255, color: 'bg-purple-500' },
        { key: 'spd', label: 'DEF. ESP', val: pokemon.base_stats.sp_defense, max: 255, color: 'bg-amber-500' },
        { key: 'spe', label: 'VELOCIDAD', val: pokemon.base_stats.speed, max: 255, color: 'bg-cyan-400' },
      ]
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none font-game animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-[#111822] via-[#0d121a] to-[#070a0e] border-t-2 sm:border-2 border-emerald-500/50 w-full sm:max-w-xl max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#16202c]/90 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-bold"
              title="Cerrar ficha"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar</span>
            </button>
            <div className="flex flex-col">
              <span className="text-[9px] font-mono tracking-widest text-emerald-400 uppercase">
                DIAGNÓSTICO TÁCTICO // {isLeader ? 'LÍDER #01' : 'MIEMBRO ESCUADRÓN'}
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-slate-100">
                {pokemon?.nombre || species}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isLeader && (
              <button
                onClick={() => onSetLeader(species)}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-[10px] font-bold transition-all flex items-center gap-1"
                title="Mover a la posición #01 de combate"
              >
                <Crown className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">Hacer Líder</span>
              </button>
            )}

            <button
              onClick={handleRemove}
              disabled={!canRemove}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                canRemove
                  ? 'bg-rose-950/80 hover:bg-rose-900 border border-rose-600/60 text-rose-200 hover:text-white cursor-pointer'
                  : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              }`}
              title={canRemove ? 'Retirar del equipo y enviar a la Caja PC' : 'El equipo no puede quedar vacío'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Quitar</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">
                Cargando datos técnicos de {species}...
              </p>
            </div>
          ) : error || !pokemon ? (
            <div className="py-12 text-center text-rose-400">
              <p className="font-bold mb-3">{error || 'Pokémon no encontrado'}</p>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-800 rounded-lg text-xs font-bold text-white"
              >
                Volver
              </button>
            </div>
          ) : (
            <>
              {/* Pokémon Hero Header */}
              <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/10 border border-emerald-500/30 animate-pulse" />
                  <StaticPokemonImage
                    species={species}
                    alt={pokemon.nombre}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] z-10"
                  />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      #{String(pokemon.numero_pokedex).padStart(3, '0')}
                    </span>
                    <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      Nivel 50
                    </span>
                    {isLeader && (
                      <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                        <Crown className="w-3 h-3 text-amber-400" /> Líder
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-white tracking-wide uppercase">
                    {pokemon.nombre}
                  </h3>
                  <p className="text-[10px] text-slate-400 italic">
                    {pokemon.nombre_ingles} • Gen {pokemon.gen}
                  </p>

                  {/* Type Badges */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {pokemon.types_detail.map((t) => (
                      <span
                        key={t.id}
                        style={{ backgroundColor: t.color_hex }}
                        className="px-2.5 py-0.5 rounded-full text-white text-[9px] font-black uppercase tracking-wider shadow-xs"
                      >
                        {t.nombre}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ability Badge */}
              {pokemon.habilidades && pokemon.habilidades.length > 0 && (
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Habilidad de Combate: {pokemon.habilidades[0].nombre}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                    {pokemon.habilidades[0].descripcion || 'Otorga ventajas tácticas durante el combate.'}
                  </p>
                </div>
              )}

              {/* All 6 Base Stats */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    Estadísticas Base (6 Atributos)
                  </span>
                  <span className="text-xs font-mono font-black text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/30">
                    BST: {pokemon.base_stats?.total || 0}
                  </span>
                </div>

                <div className="space-y-2">
                  {statConfigs.map((s) => {
                    const pct = Math.min(100, Math.round((s.val / 200) * 100));
                    return (
                      <div key={s.key} className="grid grid-cols-12 items-center gap-2 text-xs">
                        <span className="col-span-3 text-[10px] font-bold text-slate-400 tracking-wide">
                          {s.label}
                        </span>
                        <span className="col-span-2 font-mono font-bold text-white text-right">
                          {s.val}
                        </span>
                        <div className="col-span-7 bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
                          <div
                            className={`h-full ${s.color} rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4 Combat Moves Section */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Crosshair className="w-3.5 h-3.5 text-rose-400" />
                    Set de Movimientos Asignados (4 Ataques)
                  </span>
                  <span className="text-[10px] font-sans text-slate-500">
                    Reglas Oficiales
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {pokemon.movimientos_predeterminados_data && pokemon.movimientos_predeterminados_data.length > 0 ? (
                    pokemon.movimientos_predeterminados_data.slice(0, 4).map((mv: StadiumMove) => (
                      <div
                        key={mv.id || mv.codigo}
                        className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between gap-1.5 shadow-md hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs truncate max-w-[150px]">
                            {mv.nombre}
                          </span>
                          <span
                            style={{ backgroundColor: mv.tipo_color }}
                            className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white"
                          >
                            {mv.tipo}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-300 font-sans">
                          <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[9px] text-slate-300">
                            {mv.clase}
                          </span>
                          <span>
                            Pot: <strong className="text-amber-400 font-mono">{mv.potencia ?? '—'}</strong>
                          </span>
                          <span>
                            Prec: <strong className="text-slate-100 font-mono">{mv.precision ? `${mv.precision}%` : '—'}</strong>
                          </span>
                          <span>
                            PP: <strong className="text-slate-300 font-mono">{mv.pp ?? '—'}</strong>
                          </span>
                        </div>

                        {mv.descripcion && (
                          <p className="text-[9px] text-slate-400 leading-snug line-clamp-2 bg-slate-900/60 p-1.5 rounded-md font-sans">
                            {mv.descripcion}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 py-4 text-center text-slate-500 text-xs italic">
                      Movimientos estándar de torneo asignados.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-[#131b24] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
          {!canRemove && (
            <div className="flex items-center gap-1.5 text-amber-400 text-[10px]">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>El escuadrón debe mantener al menos 1 Pokémon (actual: {teamCount}/6).</span>
            </div>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
            <button
              onClick={handleRemove}
              disabled={!canRemove}
              className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                canRemove
                  ? 'bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white shadow-md cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Quitar del Equipo (Enviar a Caja PC)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
