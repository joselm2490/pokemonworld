import React, { useEffect, useState } from 'react';
import {
  X,
  Sparkles,
  Crown,
  Activity,
  Crosshair,
} from 'lucide-react';
import { StadiumPokemonDetail, StadiumMove } from '../../types/stadium';
import { PokedexService } from '../../services/pokedexService';
import { StaticPokemonImage } from '../common/StaticPokemonImage';
import { getResolvedLv100Stats, getResolvedTypes } from '../../utils/pokemonStats';

interface PokemonDetailSheetProps {
  species: string;
  onClose: () => void;
  onRemoveFromTeam?: (species: string) => void;
  canRemove?: boolean;
  isLeader?: boolean;
  onSetLeader?: (species: string) => void;
  teamCount?: number;
}

export const PokemonDetailSheet: React.FC<PokemonDetailSheetProps> = ({
  species,
  onClose,
  isLeader = false,
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

  const resolved = getResolvedLv100Stats(species, pokemon);
  const types = getResolvedTypes(species, pokemon);

  const statConfigs = [
    { label: 'PS', val: resolved.hp, bonus: '+0' },
    { label: 'ATQ', val: resolved.attack, bonus: '+0' },
    { label: 'DEF', val: resolved.defense, bonus: '+0' },
    { label: 'SPA', val: resolved.sp_attack, bonus: '+0' },
    { label: 'SPD', val: resolved.sp_defense, bonus: '+0' },
    { label: 'VEL', val: resolved.speed, bonus: '+0' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 select-none font-sans animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden pb-3 max-h-[85vh]">
        {/* Top Header: Solid Black Bar with Chamfered Title Ribbon */}
        <div className="bg-[#14171a] text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#00ff9d] tracking-widest uppercase">
              FICHA TÉCNICA
            </span>
            <span className="text-sm font-black text-white uppercase tracking-wider">
              {pokemon?.nombre || species}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isLeader && (
              <span className="px-2.5 py-0.5 rounded bg-amber-400/20 border border-amber-400/50 text-amber-300 text-[9px] font-bold flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" />
                <span>Líder</span>
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 ml-1"
              title="Cerrar Ficha"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-3.5 space-y-3 overflow-y-auto custom-scrollbar flex-1">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2.5">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">
                Cargando diagnóstico técnico...
              </p>
            </div>
          ) : error || !pokemon ? (
            <div className="py-12 text-center text-rose-500 text-xs font-bold">
              {error || 'Error al cargar'}
            </div>
          ) : (
            <>
              {/* Card 1: Character Hero Card with Grey Tech-Grid & Chamfered Header */}
              <div className="relative rounded-xl bg-[#535962] border border-[#3e434a] shadow-md p-3 text-white overflow-hidden">
                {/* 10px White Tech-Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />

                {/* Black Chamfered Title Ribbon & Total Counter */}
                <div className="relative z-10 flex items-center justify-between mb-2">
                  <div
                    className="bg-[#15171b] text-white px-3 py-1 pr-6 text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5"
                    style={{ clipPath: 'polygon(0 0, 90% 0, 100% 100%, 0 100%)' }}
                  >
                    <span>{pokemon.nombre}</span>
                    <span className="text-[9px] font-mono text-slate-400 italic">
                      #{String(pokemon.numero_pokedex).padStart(3, '0')}
                    </span>
                  </div>

                  <div className="text-right leading-none flex items-baseline justify-end gap-1">
                    <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider font-mono">
                      total:
                    </span>
                    <span className="text-base font-black font-mono text-[#00ff9d] tracking-tight">
                      {resolved.total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Sprite & Info Details (sin iniciales ni rangos) */}
                <div className="relative z-10 flex items-center gap-3">
                  <div className="relative flex flex-col items-center">
                    <div className="w-24 h-24 flex items-center justify-center">
                      <StaticPokemonImage
                        species={species}
                        alt={pokemon.nombre}
                        className="w-22 h-22 object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.7)]"
                      />
                    </div>
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div className="text-[10px] text-slate-300">
                      <span className="text-slate-400 font-mono">Nombre:</span>{' '}
                      <strong className="text-white">{pokemon.nombre_ingles}</strong>
                    </div>

                    {/* Tipos completos con palabra entera en español */}
                    <div className="flex items-center gap-1 flex-wrap">
                      {types.map((t) => (
                        <span
                          key={t.nombre}
                          style={{ backgroundColor: t.color_hex }}
                          className="px-2 py-0.5 rounded-full text-[8px] font-bold text-white uppercase shadow-2xs tracking-wide"
                        >
                          {t.nombre}
                        </span>
                      ))}
                      <span className="text-[9px] font-mono text-slate-300 bg-black/40 px-1.5 py-0.2 rounded">
                        Gen {pokemon.gen}
                      </span>
                    </div>

                    {/* Ability */}
                    {pokemon.habilidades && pokemon.habilidades.length > 0 ? (
                      <div className="bg-black/35 rounded p-1.5 border border-slate-600">
                        <div className="flex items-center gap-1 text-[8px] text-amber-300 font-bold uppercase">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Habilidad: {pokemon.habilidades[0].nombre}</span>
                        </div>
                        <p className="text-[8px] text-slate-300 leading-tight mt-0.5 line-clamp-2">
                          {pokemon.habilidades[0].descripcion || 'Sin descripción disponible.'}
                        </p>
                      </div>
                    ) : resolved.ability ? (
                      <div className="bg-black/35 rounded p-1.5 border border-slate-600">
                        <div className="flex items-center gap-1 text-[8px] text-amber-300 font-bold uppercase">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Habilidad: {resolved.ability}</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Card 2: 6 Base Stats with Black Pills & Neon Green Bonuses */}
              <div className="rounded-xl bg-[#535962] border border-[#3e434a] p-3 text-white shadow-md relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between pb-1.5 mb-2 border-b border-slate-500/80">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-200 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-[#00ff9d]" />
                    Estadísticas Nivel 100 Favorable
                  </span>
                  <div className="flex items-baseline gap-1 bg-black/40 px-2 py-0.5 rounded border border-slate-600 font-mono">
                    <span className="text-[8px] font-bold text-slate-300 uppercase">total:</span>
                    <span className="text-[10px] font-black text-[#00ff9d]">
                      {resolved.total.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="relative z-10 grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                  {statConfigs.map((s) => (
                    <div
                      key={s.label}
                      className="flex items-center justify-between bg-black/35 px-2 py-1 rounded border border-slate-600"
                    >
                      <span className="text-slate-300 font-bold text-[9px]">{s.label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white">{s.val}</span>
                        <span className="bg-[#181c20] text-[#00ff9d] text-[8px] font-black px-1 py-0.2 rounded-full border border-slate-700">
                          {s.bonus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: 4 Battle Moves */}
              <div className="rounded-xl bg-[#535962] border border-[#3e434a] p-3 text-white shadow-md relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between pb-1.5 mb-2 border-b border-slate-500/80">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-200 flex items-center gap-1">
                    <Crosshair className="w-3.5 h-3.5 text-rose-400" />
                    Movimientos de Combate (4 Ataques)
                  </span>
                  <span className="text-[8px] font-mono text-slate-300">Oficial</span>
                </div>

                <div className="relative z-10 space-y-1.5">
                  {pokemon.movimientos_predeterminados_data && pokemon.movimientos_predeterminados_data.length > 0 ? (
                    pokemon.movimientos_predeterminados_data.slice(0, 4).map((mv: StadiumMove) => (
                      <div
                        key={mv.id || mv.codigo}
                        className="bg-black/35 border border-slate-600 rounded p-2 flex flex-col gap-1 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">{mv.nombre}</span>
                          <span
                            style={{ backgroundColor: mv.tipo_color }}
                            className="px-2 py-0.2 rounded-full text-[8px] font-bold text-white uppercase"
                          >
                            {mv.tipo}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[9px] text-slate-300 font-mono">
                          <span className="bg-[#181c20] px-1 py-0.2 rounded text-[8px] text-slate-300 border border-slate-700">
                            {mv.clase}
                          </span>
                          <span>
                            Pot: <strong className="text-amber-300">{mv.potencia ?? '—'}</strong>
                          </span>
                          <span>
                            Prec: <strong className="text-white">{mv.precision ? `${mv.precision}%` : '—'}</strong>
                          </span>
                          <span>
                            PP: <strong className="text-slate-300">{mv.pp ?? '—'}</strong>
                          </span>
                        </div>

                        {mv.descripcion && (
                          <p className="text-[8px] text-slate-300 leading-snug line-clamp-2 font-sans bg-black/20 p-1 rounded">
                            {mv.descripcion}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-slate-400 text-xs py-2 italic">
                      Movimientos estándar asignados.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Close Button */}
        <div className="flex justify-center pt-2 pb-1">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 uppercase tracking-wider flex items-center gap-1.5 py-1.5 px-4 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cerrar Ficha</span>
          </button>
        </div>
      </div>
    </div>
  );
};
