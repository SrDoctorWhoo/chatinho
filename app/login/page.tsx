'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, Globe, Zap, Cpu } from 'lucide-react';

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
    <div className="flex min-h-screen w-full overflow-hidden bg-[#020617] text-slate-200 selection:bg-emerald-500 selection:text-slate-950 font-sans">
      
      {/* LEFT SECTION: Intriguing Content & Visuals (Hidden on small mobile, flex on larger) */}
      <div className="hidden lg:flex relative w-3/5 h-screen flex-col justify-between p-16 overflow-hidden border-r border-white/5 bg-slate-950/20 backdrop-blur-3xl">
        {/* Animated Background for Left Section */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-emerald-500/5 blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/5 blur-[120px] animate-pulse" style={{ animationDelay: '3s' }} />
          
          {/* Moving Particles/Dots Pattern */}
          <div 
            className="absolute inset-0 opacity-[0.05]" 
            style={{ 
              backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
              backgroundSize: '64px 64px' 
            }} 
          />
        </div>

        {/* Top Branding */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative z-10 flex items-center gap-4"
        >
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 backdrop-blur-md">
            <MessageSquare className="text-emerald-400" size={28} />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white">Chatinho</span>
        </motion.div>

        {/* Center Intriguing Visual & Text */}
        <div className="relative z-10 flex flex-col items-start gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Sparkles size={12} className="animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Next-Gen Communication</span>
            </div>
            <h2 className="text-7xl font-bold tracking-tight leading-[1.05] text-white">
              Inteligência que <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">conecta pessoas.</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-lg leading-relaxed">
              O ecossistema definitivo para gestão de atendimentos e automação de fluxos conversacionais em escala global.
            </p>
          </motion.div>

          {/* Abstract Grid Feature List */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 gap-8 mt-4"
          >
            <div className="flex items-start gap-4 p-4 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-default">
              <Globe className="text-emerald-500 mt-1" size={24} />
              <div>
                <h4 className="font-bold text-white text-sm">Alcance Global</h4>
                <p className="text-xs text-slate-500 mt-1">Conecte-se com clientes em qualquer lugar do mundo.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-default">
              <Zap className="text-emerald-500 mt-1" size={24} />
              <div>
                <h4 className="font-bold text-white text-sm">Respostas Rápidas</h4>
                <p className="text-xs text-slate-500 mt-1">Automação inteligente para zero tempo de espera.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Stats or Footer Info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="relative z-10 flex items-center gap-12 text-slate-500"
        >
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-white tracking-tighter">+500k</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Conversas diárias</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-white tracking-tighter">99.9%</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Tempo de atividade</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-white tracking-tighter">AI</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Powered Engine</span>
          </div>
        </motion.div>
      </div>

      {/* RIGHT SECTION: Minimalist Login Form */}
      <div className="flex-1 relative h-screen flex flex-col items-center justify-center p-8 md:p-20 bg-slate-950">
        
        {/* Subtle Background Glow for Right Side */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[420px] relative z-10"
        >
          {/* Logo for Mobile (Shows only when LG hidden) */}
          <div className="lg:hidden flex justify-center mb-12">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <MessageSquare className="text-emerald-400" size={32} />
              </div>
              <span className="text-3xl font-black tracking-tighter text-white">Chatinho</span>
            </div>
          </div>

          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white tracking-tight mb-3">Login</h1>
            <p className="text-slate-500 text-lg">Acesse sua central de comando.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1 block">
                E-mail Profissional
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-600 group-focus-within:text-emerald-500 transition-colors">
                  <Mail size={20} strokeWidth={1.5} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-14 pr-6 py-5 bg-slate-900 border border-white/5 rounded-[2rem] text-white placeholder-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/40 transition-all outline-none"
                  placeholder="nome@empresa.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 block">
                  Senha Secreta
                </label>
                <button type="button" className="text-[11px] font-bold text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-widest">
                  Esqueci
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-600 group-focus-within:text-emerald-500 transition-colors">
                  <Lock size={20} strokeWidth={1.5} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-14 pr-6 py-5 bg-slate-900 border border-white/5 rounded-[2rem] text-white placeholder-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/40 transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center p-5 rounded-[1.5rem] bg-red-500/5 border border-red-500/10 text-red-400 text-xs gap-3"
              >
                <ShieldCheck size={18} className="shrink-0" />
                <span className="font-semibold">{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden py-5 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-[2rem] transition-all duration-300 shadow-[0_15px_40px_-10px_rgba(16,185,129,0.4)] active:scale-[0.98] disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center justify-center gap-3">
                {loading ? (
                  <div className="w-6 h-6 border-3 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="tracking-tight text-lg">Acessar Sistema</span>
                    <ArrowRight size={22} className="group-hover:translate-x-1.5 transition-transform duration-300" />
                  </>
                )}
              </span>
            </button>

            {/* Support/Links for Mobile Only */}
            <div className="lg:hidden pt-8 flex flex-col items-center gap-6">
              <div className="flex gap-8">
                {['Termos', 'Privacidade', 'Segurança'].map(item => (
                  <span key={item} className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{item}</span>
                ))}
              </div>
              <p className="text-slate-700 text-[10px] font-bold uppercase tracking-[0.4em]">© 2026 CHATINHO</p>
            </div>
          </form>
        </motion.div>
      </div>

    </div>
  );
}
