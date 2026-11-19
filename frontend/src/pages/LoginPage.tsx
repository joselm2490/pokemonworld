import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  ShieldCheck,
  CheckCircle,
  LogOut,
  ArrowRight,
} from 'lucide-react';
import { AuthService, TrainerUser } from '../services/authService';
import { PokeBallGraphic } from '../components/common/PokeBallGraphic';
import { AuthModal } from '../components/auth/AuthModal';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<TrainerUser | null>(() =>
    AuthService.getCurrentUser()
  );
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setSuccessMsg('Has cerrado sesión correctamente.');
  };

  const handleUserChange = (user: TrainerUser | null) => {
    setCurrentUser(user);
    if (user) {
      setTimeout(() => {
        navigate('/');
      }, 400);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0fdf4] flex flex-col items-center justify-center p-3 sm:p-4 font-sans select-none relative overflow-hidden">
      {/* Background Vital Bracelet decorative mint ribbons */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-90 z-0">
        <div className="absolute -top-32 -left-32 w-[600px] h-[260px] bg-gradient-to-br from-[#8bf8c7]/40 via-[#4ceba1]/25 to-transparent rotate-[-22deg] blur-2xl" />
        <div className="absolute top-1/3 -right-32 w-[600px] h-[260px] bg-gradient-to-bl from-[#74f7bc]/35 via-[#4ceba1]/20 to-transparent rotate-[-22deg] blur-2xl" />
        <div className="absolute -bottom-24 -left-20 w-[550px] h-[260px] bg-gradient-to-tr from-[#32f59b]/35 to-transparent rotate-[-22deg] blur-2xl" />
      </div>

      {/* Main Login Card matching Reference Image */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10 border border-slate-200/80 animate-in fade-in duration-200">
        {/* Top Header: Solid Black with Gold Trophy & POKEMON WORLD Title */}
        <div className="bg-[#14171a] text-white px-5 py-3.5 flex items-center gap-2.5 relative">
          <Trophy className="w-6 h-6 text-[#f5d433] fill-[#f5d433]" />
          <h1 className="text-xl font-black uppercase tracking-wider font-sans text-white">
            POKEMON WORLD
          </h1>
        </div>

        {/* Card Content Body */}
        <div className="p-3.5 space-y-3">
          {currentUser ? (
            /* Logged-In Profile State */
            <div className="space-y-4 py-2">
              <div className="flex flex-col items-center justify-center text-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <PokeBallGraphic size={76} />
                <div className="mt-3">
                  <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ENTRENADOR CONECTADO</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    {currentUser.username}
                  </h3>
                  {currentUser.email && (
                    <span className="text-xs text-slate-500 font-mono">
                      {currentUser.email}
                    </span>
                  )}
                </div>
              </div>

              {successMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/team')}
                  className="py-2.5 px-3 bg-[#d9f977] hover:brightness-105 active:scale-95 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs border border-[#b6f04d] text-center"
                >
                  Mis Equipos (10)
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="py-2.5 px-3 bg-slate-900 hover:bg-black active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs text-center flex items-center justify-center gap-1.5"
                >
                  <span>Ir a la Arena</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#32f59b]" />
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 uppercase tracking-wider flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-rose-50 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          ) : (
            /* Unlogged State: Banner + Artwork matching Image */
            <>
              {/* Banner: INGRESA / REGISTRO */}
              <div
                onClick={() => setIsAuthOpen(true)}
                className="relative h-28 rounded-xl overflow-hidden bg-gradient-to-r from-[#d9f977] via-[#e2fa88] to-[#ebfc9d] border-2 border-[#b5db44] shadow-md cursor-pointer group hover:brightness-105 active:scale-[0.99] transition-all flex items-center px-4"
              >
                {/* Background Tech Halftone Pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(#b2d93e_1.5px,transparent_1.5px)] [background-size:12px_12px] opacity-40 pointer-events-none" />

                {/* Left Content */}
                <div className="relative z-10 flex flex-col justify-between h-full py-2.5">
                  <div>
                    <div className="inline-block bg-[#162024] text-[#42e896] text-[8px] font-black tracking-widest px-2 py-0.5 rounded-sm uppercase">
                      ACCESO DE ENTRENADOR
                    </div>
                    <h3 className="text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(20,30,20,0.85)] tracking-tighter uppercase italic leading-none pt-1">
                      INGRESA /
                    </h3>
                    <h3 className="text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(20,30,20,0.85)] tracking-tighter uppercase italic leading-none">
                      REGISTRO
                    </h3>
                  </div>

                  {/* Bottom Ribbon */}
                  <div className="bg-[#111718] text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm flex items-center gap-1.5 w-fit shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-[#d9f977] animate-pulse" />
                    <span className="truncate max-w-[170px]">INICIAR SESIÓN / REGISTRO</span>
                  </div>
                </div>

                {/* Pokéball Graphic on Right */}
                <div className="absolute right-2 -bottom-0.5 w-26 h-26 flex items-center justify-center pointer-events-none group-hover:scale-110 transition-transform duration-300">
                  <PokeBallGraphic size={90} glow={true} />
                </div>
              </div>

              {/* Artwork Image from Imagen pegada.png */}
              <div
                onClick={() => setIsAuthOpen(true)}
                className="rounded-2xl overflow-hidden border border-slate-200 shadow-md cursor-pointer group hover:brightness-105 active:scale-[0.99] transition-all"
                title="Iniciar sesión para acceder a la Arena"
              >
                <img
                  src="/pokemon-login-art.png"
                  alt="Pokemon World"
                  className="w-full h-auto object-cover rounded-2xl block group-hover:scale-[1.01] transition-transform duration-300"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Trainer Authentication Modal (Opens on Click) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onUserChange={handleUserChange}
      />
    </div>
  );
};