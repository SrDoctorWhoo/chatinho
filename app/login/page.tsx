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
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-slate-950">
      {/* Animated Background Blobs with Framer Motion */}
      <motion.div 
        animate={{ 
          x: [0, 30, -20, 0],
          y: [0, -50, 20, 0],
          scale: [1, 1.1, 0.9, 1]
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 -left-4 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" 
      />
      <motion.div 
        animate={{ 
          x: [0, -30, 20, 0],
          y: [0, 50, -20, 0],
          scale: [1, 1.1, 0.9, 1]
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-0 -right-4 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" 
      />
      <motion.div 
        animate={{ 
          x: [0, 20, -30, 0],
          y: [0, 30, -50, 0],
          scale: [1, 0.9, 1.1, 1]
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        className="absolute -bottom-8 left-20 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" 
      />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#10b981 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-[440px]"
      >
        {/* Header Section */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center p-3 mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 gap-2 px-4"
          >
            <Sparkles size={16} />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Next-Gen Chat Platform</span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, rotate: -10 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="relative inline-flex mb-6 group"
          >
            <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative flex items-center justify-center w-20 h-20 rounded-[1.75rem] bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 shadow-2xl shadow-emerald-500/20 transform hover:scale-105 transition-all duration-500">
              <MessageSquare size={36} strokeWidth={2} />
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-4xl font-extrabold tracking-tight text-white"
          >
            Chat<span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">inho</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-slate-400 mt-2 font-medium"
          >
            Inteligência e Gestão em Atendimento
          </motion.p>
        </div>

        {/* Login Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="glass-panel premium-card rounded-[2.5rem] p-8 md:p-10 shadow-2xl border-white/5 backdrop-blur-2xl bg-white/[0.03]"
        >
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl font-bold text-white tracking-tight">Acesso ao Painel</h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">Bem-vindo de volta!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 ml-1">
                E-mail Profissional
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600 group-focus-within:text-emerald-400 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all outline-none"
                  placeholder="ex: admin@empresa.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                  Senha de Acesso
                </label>
                <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors">
                  Esqueceu?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600 group-focus-within:text-emerald-400 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center p-4 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-400 text-xs"
              >
                <ShieldCheck size={16} className="mr-2 shrink-0" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden py-4 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-2xl transition-all shadow-xl shadow-emerald-500/10 active:scale-[0.98] disabled:opacity-70"
            >
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                ) : (
                  <>
                    Entrar no Sistema
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </form>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center space-y-4"
        >
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">
            © 2026 Chatinho Ecosystem • v2.0
          </p>
          <div className="flex justify-center gap-6">
            <a href="#" className="text-slate-500 hover:text-slate-300 text-[10px] font-bold uppercase transition-colors">Suporte</a>
            <a href="#" className="text-slate-500 hover:text-slate-300 text-[10px] font-bold uppercase transition-colors">Termos</a>
            <a href="#" className="text-slate-500 hover:text-slate-300 text-[10px] font-bold uppercase transition-colors">Segurança</a>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
