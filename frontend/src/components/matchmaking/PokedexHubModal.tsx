import React from 'react';
import {
  BookOpen,
  X,
  Zap,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  ShieldCheck,
  Swords,
  Flame,
} from 'lucide-react';
import { PokeBallGraphic } from '../common/PokeBallGraphic';

interface PokedexHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (option: 'pokemon' | 'moves' | 'abilities') => void;
}

export const PokedexHubModal: React.FC<PokedexHubModalProps> = ({
  isOpen,
  onClose,
  onSelectOption,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 select-none font-sans animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden pb-4">
        {/* Top Header: Solid Black with Book / Pokédex Icon & Top-Right Close Button */}
        <div className="bg-[#14171a] text-white px-5 py-3.5 flex items-center justify-between relative">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-[#ef4444]" />
            <h2 className="text-xl font-black uppercase tracking-wider font-sans text-white">
              POKÉDEX
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Cerrar Pokédex"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* Modal Scrollable Content: 4 Banners */}
        <div className="p-3.5 space-y-3 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* ================= TARJETA 1: POKÉMONES (ROJA) ================= */}
          <div
            onClick={() => {
              onClose();
              onSelectOption('pokemon');
            }}
            className="relative h-26 rounded-xl overflow-hidden bg-gradient-to-r from-[#ef4444] via-[#dc2626] to-[#b91c1c] border-2 border-[#991b1b] shadow-md cursor-pointer group hover:brightness-105 active:scale-[0.99] transition-all flex items-center px-4"
          >
            {/* Tech Dots Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff30_1.5px,transparent_1.5px)] [background-size:12px_12px] opacity-40 pointer-events-none" />

            {/* Left Content */}
            <div className="relative z-10 flex flex-col justify-between h-full py-2.5">
              <div>
                <div className="inline-block bg-[#162024] text-[#ff8080] text-[8px] font-black tracking-widest px-2 py-0.5 rounded-sm uppercase">
                  ENCICLOPEDIA NACIONAL
                </div>
                <h3 className="text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] tracking-tighter uppercase italic leading-none pt-1">
                  POKÉMONES
                </h3>
              </div>

              {/* Bottom Ribbon */}
              <div className="bg-black/80 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm flex items-center gap-1.5 w-fit shadow-xs border border-red-900/60">
                <span className="w-2 h-2 rounded-full bg-[#ff5252] animate-pulse" />
                <span>1025 ESPECIES • STATS & TIPOS</span>
              </div>
            </div>

            {/* Pokéball Graphic on Right */}
            <div className="absolute right-2 -bottom-1 w-24 h-24 flex items-center justify-center pointer-events-none group-hover:scale-110 transition-transform duration-300">
              <PokeBallGraphic size={84} glow={true} />
            </div>
          </div>

          {/* ================= TARJETA 2: MOVIMIENTOS (NARANJA / ÁMBAR) ================= */}
          <div
            onClick={() => {
              onClose();
              onSelectOption('moves');
            }}
            className="relative h-26 rounded-xl overflow-hidden bg-gradient-to-r from-[#f59e0b] via-[#ea580c] to-[#c2410c] border-2 border-[#9a3412] shadow-md cursor-pointer group hover:brightness-105 active:scale-[0.99] transition-all flex items-center px-4"
          >
            {/* Tech Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff25_1px,transparent_1px),linear-gradient(to_bottom,#ffffff25_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />

            {/* Left Content */}
            <div className="relative z-10 flex flex-col justify-between h-full py-2.5">
              <div>
                <div className="inline-block bg-[#162024] text-amber-300 text-[8px] font-black tracking-widest px-2 py-0.5 rounded-sm uppercase">
                  ARSENAL TÁCTICO
                </div>
                <h3 className="text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] tracking-tighter uppercase italic leading-none pt-1">
                  MOVIMIENTOS
                </h3>
              </div>

              {/* Bottom Ribbon */}
              <div className="bg-black/80 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm flex items-center gap-1.5 w-fit shadow-xs border border-orange-950">
                <Zap className="w-2.5 h-2.5 text-amber-400" />
                <span>953 ATAQUES • POTENCIA & PP</span>
              </div>
            </div>

            {/* Right Emblem Icons */}
            <div className="absolute right-4 flex items-center gap-2 pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-white/15 border-2 border-white/80 flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform">
                <Swords className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* ================= TARJETA 3: HABILIDADES (VERDE ESMERALDA) ================= */}
          <div
            onClick={() => {
              onClose();
              onSelectOption('abilities');
            }}
            className="relative h-26 rounded-xl overflow-hidden bg-gradient-to-r from-[#10b981] via-[#059669] to-[#047857] border-2 border-[#065f46] shadow-md cursor-pointer group hover:brightness-105 active:scale-[0.99] transition-all flex items-center px-4"
          >
            {/* Tech Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff25_1px,transparent_1px),linear-gradient(to_bottom,#ffffff25_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />

            {/* Left Content */}
            <div className="relative z-10 flex flex-col justify-between h-full py-2.5">
              <div>
                <div className="inline-block bg-[#162024] text-emerald-300 text-[8px] font-black tracking-widest px-2 py-0.5 rounded-sm uppercase">
                  TALENTOS & SINERGIAS
                </div>
                <h3 className="text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] tracking-tighter uppercase italic leading-none pt-1">
                  HABILIDADES
                </h3>
              </div>

              {/* Bottom Ribbon */}
              <div className="bg-black/80 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm flex items-center gap-1.5 w-fit shadow-xs border border-emerald-950">
                <Sparkles className="w-2.5 h-2.5 text-emerald-300" />
                <span>EFECTOS PASIVOS EN DUELO</span>
              </div>
            </div>

            {/* Right Emblem Icons */}
            <div className="absolute right-4 flex items-center gap-2 pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-white/15 border-2 border-white/80 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* ================= TARJETA 4: VOLVER (TONO GRIS) ================= */}
          <div
            onClick={onClose}
            className="relative h-24 rounded-xl overflow-hidden bg-gradient-to-r from-[#475569] via-[#334155] to-[#1e293b] border-2 border-slate-700 shadow-md cursor-pointer group hover:brightness-115 active:scale-[0.99] transition-all flex items-center px-4"
          >
            {/* Tech Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />

            {/* Left Content */}
            <div className="relative z-10 flex flex-col justify-between h-full py-2.5">
              <div>
                <div className="inline-block bg-[#0f172a] text-slate-300 text-[8px] font-black tracking-widest px-2 py-0.5 rounded-sm uppercase">
                  NAVEGACIÓN
                </div>
                <h3 className="text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] tracking-tighter uppercase italic leading-none pt-1">
                  VOLVER
                </h3>
              </div>

              {/* Bottom Ribbon */}
              <div className="bg-black/80 text-slate-300 text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm flex items-center gap-1.5 w-fit shadow-xs border border-slate-800">
                <RotateCcw className="w-2.5 h-2.5 text-slate-400" />
                <span>REGRESAR AL MENÚ PRINCIPAL</span>
              </div>
            </div>

            {/* Right Emblem Icons */}
            <div className="absolute right-4 flex items-center gap-2 pointer-events-none">
              <div className="w-11 h-11 rounded-full bg-white/10 border-2 border-dashed border-white/60 flex items-center justify-center text-white group-hover:-translate-x-1 transition-transform">
                <ArrowLeft className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Close Button */}
        <div className="flex justify-center pt-1 pb-1">
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
