'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageSquare, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Credenciais inválidas. Tente novamente.');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Ocorreu um erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden bg-[#020617]">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Subtle Mesh Grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '40px 40px' 
          }} 
        />
        
        {/* Radial Vignette */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-[#020617]/80" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[460px]"
      >
        {/* Header Section */}
        <div className="text-center mb-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-500/80 mb-6"
          >
            <Sparkles size={12} className="animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Enterprise Solutions</span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full group-hover:bg-emerald-500/30 transition-all duration-700" />
              <div className="relative flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
                <MessageSquare size={38} className="text-emerald-400" strokeWidth={1.5} />
              </div>
            </div>
            
            <div className="space-y-1">
              <h1 className="text-5xl font-black tracking-tighter text-white">
                Chat<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">inho</span>
              </h1>
              <p className="text-slate-500 text-sm font-medium tracking-wide">
                Ecossistema de Atendimento Inteligente
              </p>
            </div>
          </motion.div>
        </div>

        {/* Login Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="relative group"
        >
          {/* Card Outer Glow */}
          <div className="absolute -inset-px bg-gradient-to-b from-white/10 to-transparent rounded-[2.5rem] blur-sm opacity-50" />
          
          <div className="relative bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl overflow-hidden">
            {/* Subtle Gradient Overlay */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
            
            <div className="relative z-10">
              <div className="mb-10 text-center md:text-left">
                <h2 className="text-2xl font-bold text-white tracking-tight">Login</h2>
                <p className="text-slate-500 text-sm mt-1 font-medium">Insira suas credenciais para continuar</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 ml-1 block">
                    E-mail
                  </label>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-emerald-400 transition-colors duration-300">
                      <Mail size={18} strokeWidth={2} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/40 transition-all duration-300 outline-none hover:border-white/10"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 block">
                      Senha
                    </label>
                    <a href="#" className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-wider">
                      Esqueceu?
                    </a>
                  </div>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-emerald-400 transition-colors duration-300">
                      <Lock size={18} strokeWidth={2} />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-white/5 rounded-2xl text-white placeholder-slate-700 focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/40 transition-all duration-300 outline-none hover:border-white/10"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400 text-xs gap-3"
                  >
                    <ShieldCheck size={16} className="shrink-0" />
                    <span className="font-medium">{error}</span>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full overflow-hidden py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-emerald-500/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative flex items-center justify-center gap-3">
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="tracking-tight text-base">Entrar no Sistema</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                      </>
                    )}
                  </span>
                </button>
              </form>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 text-center"
        >
          <div className="flex justify-center gap-8 mb-6">
            <a href="#" className="text-slate-500 hover:text-emerald-400 text-[10px] font-bold uppercase tracking-widest transition-colors">Termos</a>
            <a href="#" className="text-slate-500 hover:text-emerald-400 text-[10px] font-bold uppercase tracking-widest transition-colors">Privacidade</a>
            <a href="#" className="text-slate-500 hover:text-emerald-400 text-[10px] font-bold uppercase tracking-widest transition-colors">Segurança</a>
          </div>
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em]">
            © 2026 Chatinho Ecosystem <span className="mx-2">•</span> Premium Suite
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
