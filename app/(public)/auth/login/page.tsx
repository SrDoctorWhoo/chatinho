'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Shield, User, Lock, ArrowRight, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GenericLoginPage() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('convId');
  const integrationId = searchParams.get('integId');

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function checkStatus() {
      if (!conversationId) return;
      try {
        const res = await fetch(`/api/auth/external-login/status?convId=${conversationId}`);
        const data = await res.json();
        if (data.isAuthenticated) {
          setStatus('success');
        }
      } catch (err) {
        console.error('Erro ao verificar status:', err);
      }
    }
    checkStatus();
  }, [conversationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationId || !integrationId) {
      setErrorMsg('Link de autenticação incompleto. Por favor, solicite um novo link no chat.');
      setStatus('error');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/external-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData,
          conversationId,
          integrationId
        })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'Falha ao realizar login. Verifique seus dados.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg('Erro de conexão com o servidor de autenticação.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-sans selection:bg-blue-500/30">
        <div className="w-full max-w-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative p-10 rounded-[3rem] bg-slate-900/40 border border-emerald-500/20 shadow-[0_30px_70px_rgba(16,185,129,0.1)] backdrop-blur-2xl text-center"
          >
            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/20 backdrop-blur-xl mx-auto mb-8 animate-pulse">
              <CheckCircle2 className="text-emerald-500" size={48} />
            </div>
            
            <h1 className="text-3xl font-black text-white mb-4 tracking-tight">Autenticado!</h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-10 font-medium">
              Sua identidade foi validada com sucesso. O assistente virtual já recebeu a confirmação.
            </p>
            
            <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-[11px] font-black uppercase tracking-widest mb-8">
              Você pode fechar esta janela e voltar para o WhatsApp.
            </div>

            <button 
              onClick={() => window.close()}
              className="w-full py-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-widest transition-all active:scale-95 border border-white/5"
            >
              Fechar Janela
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-sans selection:bg-blue-500/30 overflow-hidden relative">
      {/* Dynamic Background */}
      <div className="absolute top-0 -left-20 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 -right-20 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse delay-1000" />

      <div className="w-full max-w-md relative z-10">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white mb-8 shadow-2xl shadow-blue-600/20 relative group">
            <Shield size={36} />
            <div className="absolute inset-0 bg-white/20 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-3">Área Segura</h1>
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Autenticação em Tempo Real</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative p-8 md:p-12 rounded-[3.5rem] bg-slate-900/30 border border-white/5 shadow-2xl backdrop-blur-3xl"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Usuário de Acesso</label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors">
                  <User size={20} />
                </div>
                <input
                  required
                  type="text"
                  placeholder="Nome de usuário ou CPF"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-[#020617]/50 border-2 border-slate-800/50 rounded-3xl py-5 pl-16 pr-6 text-white placeholder:text-slate-700 focus:border-blue-500/50 focus:ring-8 focus:ring-blue-500/5 outline-none transition-all font-bold text-sm shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Senha Secreta</label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-[#020617]/50 border-2 border-slate-800/50 rounded-3xl py-5 pl-16 pr-6 text-white placeholder:text-slate-700 focus:border-blue-500/50 focus:ring-8 focus:ring-blue-500/5 outline-none transition-all font-bold text-sm shadow-inner"
                />
              </div>
            </div>

            <AnimatePresence>
              {status === 'error' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex items-center gap-4 p-5 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold"
                >
                  <AlertCircle size={20} className="shrink-0" />
                  <p>{errorMsg}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              disabled={loading}
              type="submit"
              className="w-full relative group overflow-hidden py-6 rounded-3xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  Entrar no Sistema
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-white/5 text-center flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-blue-500/50">
              <Sparkles size={12} />
              <p className="text-[9px] font-black uppercase tracking-[0.4em]">Secure Auth System</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
