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
        { label: 'HP', val: pokemon.base_stats.hp, bonus: '+0', max: 255 },
        { label: 'ATK', val: pokemon.base_stats.attack, bonus: '+0', max: 255 },
        { label: 'DEF', val: pokemon.base_stats.defense, bonus: '+0', max: 255 },
        { label: 'SPA', val: pokemon.base_stats.sp_attack, bonus: '+0', max: 255 },
        { label: 'SPD', val: pokemon.base_stats.sp_defense, bonus: '+0', max: 255 },
        { label: 'SPE', val: pokemon.base_stats.speed, bonus: '+0', max: 255 },
      ]
    : [];

  const types = pokemon?.types_detail || [];
  const typeAbbr = types[0] ? types[0].nombre.slice(0, 2) : 'No';
  const typeColor = types[0]?.color_hex || '#10b981';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 select-none font-sans animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden pb-12 max-h-[85vh]">
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
            {!isLeader && (
              <button
                onClick={() => onSetLeader(species)}
                className="px-2.5 py-0.5 rounded bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/50 text-amber-300 text-[9px] font-bold transition-all flex items-center gap-1"
                title="Mover a la posición #01"
              >
                <Crown className="w-3 h-3 text-amber-400" />
                <span>Líder</span>
              </button>
            )}

            <button
              onClick={handleRemove}
              disabled={!canRemove}
              className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                canRemove
                  ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
              }`}
              title={canRemove ? 'Quitar del equipo' : 'El equipo debe tener al menos 1 Pokémon'}
            >
              <Trash2 className="w-3 h-3" />
              <span>Quitar</span>
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

                {/* Black Chamfered Title Ribbon & Vitals Counter */}
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

                  <div className="text-right leading-none">
                    <span className="text-[8px] text-slate-300 font-mono block">Vitals</span>
                    <span className="text-base font-black font-mono text-[#00ff9d] tracking-tight">
                      {pokemon.base_stats?.hp || 164}
                      <span className="text-[9px] text-slate-300 font-normal"> /9,999</span>
                    </span>
                  </div>
                </div>

                {/* Sprite & Type Badges */}
                <div className="relative z-10 flex items-center gap-3">
                  <div className="relative flex flex-col items-center">
                    <div className="flex items-center gap-1 mb-1">
                      <div
                        style={{ backgroundColor: typeColor }}
                        className="w-5 h-5 rounded-full border border-white/80 flex items-center justify-center text-[9px] font-black text-white shadow-xs capitalize"
                      >
                        {typeAbbr}
                      </div>
                      <div className="bg-[#30343a] border border-slate-500 rounded px-1 py-0.2 text-[8px] font-black text-amber-300">
                        {isLeader ? 'Rank S' : 'Rank D'}
                      </div>
                    </div>

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

                    {/* Types */}
                    <div className="flex items-center gap-1">
                      {types.map((t) => (
                        <span
                          key={t.id}
                          style={{ backgroundColor: t.color_hex }}
                          className="px-2 py-0.2 rounded-full text-[8px] font-bold text-white uppercase shadow-2xs"
                        >
                          {t.nombre}
                        </span>
                      ))}
                      <span className="text-[9px] font-mono text-slate-300 bg-black/40 px-1.5 py-0.2 rounded">
                        Gen {pokemon.gen}
                      </span>
                    </div>

                    {/* Ability */}
                    {pokemon.habilidades && pokemon.habilidades.length > 0 && (
                      <div className="bg-black/35 rounded p-1.5 border border-slate-600">
                        <div className="flex items-center gap-1 text-[8px] text-amber-300 font-bold uppercase">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Habilidad: {pokemon.habilidades[0].nombre}</span>
                        </div>
                        <p className="text-[8px] text-slate-300 leading-tight mt-0.5 line-clamp-2">
                          {pokemon.habilidades[0].descripcion || 'Sin descripción disponible.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 2: 6 Base Stats with Black Pills & Neon Green Bonuses */}
              <div className="rounded-xl bg-[#535962] border border-[#3e434a] p-3 text-white shadow-md relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between pb-1.5 mb-2 border-b border-slate-500/80">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-200 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-[#00ff9d]" />
                    Estadísticas Base (6 Atributos)
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#00ff9d] bg-black/40 px-2 py-0.2 rounded border border-slate-600">
                    BST: {pokemon.base_stats?.total || 0}
                  </span>
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

        {/* Floating Circular Dark Close Button overlapping bottom center */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-[#1b1f24] hover:bg-black border-3 border-white text-white flex items-center justify-center shadow-2xl transition-transform active:scale-90 cursor-pointer z-20"
          title="Cerrar Ficha"
        >
          <X className="w-5 h-5 text-white" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};
