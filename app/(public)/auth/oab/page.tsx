'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Shield, User, Lock, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function OABLoginPage() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('convId');

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [userName, setUserName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationId) {
      setErrorMsg('Link inválido. Por favor, solicite um novo link no WhatsApp.');
      setStatus('error');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/oab-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData,
          conversationId 
        })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setUserName(data.name || 'Doutor(a)');
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'Falha ao realizar login. Verifique seus dados.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg('Erro de conexão. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans selection:bg-blue-500/30">
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
          <div className="relative p-8 md:p-10 rounded-[2.5rem] bg-slate-900/50 border border-slate-800 shadow-2xl backdrop-blur-xl text-center">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/20 backdrop-blur-xl animate-bounce">
              <CheckCircle2 className="text-emerald-500" size={48} />
            </div>
            
            <div className="pt-8">
              <h1 className="text-2xl md:text-3xl font-black text-white mb-4">Login Sucesso!</h1>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-8">
                Olá, <span className="text-white font-bold">{userName}</span>! Sua identidade foi validada com sucesso.
              </p>
              
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-bold mb-8">
                Você já pode voltar para o WhatsApp para continuar seu atendimento.
              </div>

              <button 
                onClick={() => window.close()}
                className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all active:scale-95 border border-slate-700"
              >
                Fechar esta janela
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans selection:bg-blue-500/30 overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 mb-6 shadow-lg shadow-blue-500/10">
            <Shield size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">Portal OAB-GO</h1>
          <p className="text-slate-500 text-sm font-medium">Validação segura para emissão de 2ª via</p>
        </div>

        <div className="relative p-8 md:p-10 rounded-[2.5rem] bg-slate-900/40 border border-slate-800/50 shadow-2xl backdrop-blur-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Usuário / CPF</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors">
                  <User size={18} />
                </div>
                <input
                  required
                  type="text"
                  placeholder="Seu CPF ou login"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-slate-950/50 border-2 border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha do Portal</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-950/50 border-2 border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-sm"
                />
              </div>
            </div>

            {status === 'error' && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold animate-in shake duration-300">
                <AlertCircle size={16} className="shrink-0" />
                <p>{errorMsg}</p>
              </div>
            )}

            <button
              disabled={loading}
              type="submit"
              className="w-full relative group overflow-hidden py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  ACESSAR PORTAL
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-800/50 text-center">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">
              Sistema de Autenticação Segura © OAB-GO
            </p>
          </div>
        </div>

        <p className="text-center mt-8 text-slate-600 text-xs font-medium">
          Esqueceu sua senha? <a href="#" className="text-blue-500 hover:underline">Recuperar aqui</a>
        </p>
      </div>
    </div>
  );
}
