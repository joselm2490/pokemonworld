import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  LogOut,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { AuthService, TrainerUser } from '../services/authService';
import { PokeBallGraphic } from '../components/common/PokeBallGraphic';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<TrainerUser | null>(() =>
    AuthService.getCurrentUser()
  );
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!username.trim() || !password.trim()) {
      setError('Por favor ingresa tu nombre de entrenador / correo y tu contraseña.');
      return;
    }

    setLoading(true);
    try {
      const user = await AuthService.login(username, password);
      setCurrentUser(user);
      setSuccessMsg(`¡Bienvenido a la Arena, Entrenador ${user.username}!`);
      setTimeout(() => {
        navigate('/');
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión. Revisa tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setSuccessMsg('Has cerrado sesión correctamente.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c1015] via-[#141b24] to-[#0a0e13] flex flex-col items-center justify-center p-4 font-sans select-none relative overflow-hidden">
      {/* Background Cyber Tech Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1b2432_1px,transparent_1px),linear-gradient(to_bottom,#1b2432_1px,transparent_1px)] bg-[size:28px_28px] opacity-25 pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden pb-4 z-10 border border-slate-200">
        {/* Header Bar */}
        <div className="bg-[#14171a] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <PokeBallGraphic size={24} glow={false} />
            <h1 className="text-base sm:text-lg font-black uppercase tracking-wider font-sans text-white">
              INICIAR SESIÓN
            </h1>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
            title="Volver a la Arena"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5">
          {currentUser ? (
            /* Already Logged In Profile */
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
                  onClick={() => navigate('/room')}
                  className="py-2.5 px-3 bg-slate-900 hover:bg-black active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs text-center"
                >
                  Ir a Duelos PvP
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

                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-wider py-1 px-2 cursor-pointer"
                >
                  Volver al Inicio →
                </button>
              </div>
            </div>
          ) : (
            /* Login Form */
            <div className="space-y-4">
              {/* Tab Selector */}
              <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-black uppercase tracking-wider">
                <div className="py-2 text-center rounded-xl bg-white text-slate-900 shadow-sm border border-slate-200/80">
                  Iniciar Sesión
                </div>
                <Link
                  to="/register"
                  className="py-2 text-center rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
                >
                  Crear Cuenta
                </Link>
              </div>

              {/* Status / Error Alerts */}
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nombre de Entrenador o Correo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Ej. Red, Ash o joselm2490"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 mt-3 bg-gradient-to-r from-[#d9f977] via-[#b6f04d] to-[#99e334] hover:brightness-105 active:scale-[0.99] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md border border-[#9fd638] flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span className="animate-pulse">Conectando a la Arena...</span>
                  ) : (
                    <>
                      <span>Ingresar a la Arena</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-3 text-center border-t border-slate-100">
                <p className="text-[11px] text-slate-500">
                  ¿Aún no tienes cuenta?{' '}
                  <Link
                    to="/register"
                    className="font-bold text-emerald-600 hover:text-emerald-700 underline"
                  >
                    Registrar Entrenador
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex justify-center pt-1 pb-1">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 uppercase tracking-wider flex items-center gap-1.5 py-1 px-3 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Menú Principal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
