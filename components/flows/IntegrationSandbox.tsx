'use client';

import { useState } from 'react';
import { Play, Loader2, Sparkles, Code, Terminal, AlertCircle, MessageSquare, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface IntegrationSandboxProps {
  integration: any;
  onUpdate: (data: any) => void;
}

export default function IntegrationSandbox({ integration, onUpdate }: IntegrationSandboxProps) {
  const [testInput, setTestInput] = useState('');
  const [testVariables, setTestVariables] = useState(JSON.stringify({
    nome: "Usuário Teste",
    telefone: "5511999999999",
    protocolo: "2024001",
    departamentos: "Suporte, Financeiro",
    historico: ""
  }, null, 2));
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    if (!testInput) return;
    setLoading(true);
    setTestResult(null);
    try {
      let variables = {};
      try {
        variables = JSON.parse(testVariables);
      } catch (e) {
        console.warn('JSON de variáveis inválido');
      }

      const res = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...integration,
          message: testInput,
          variables
        })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      console.error(err);
      setTestResult({ error: 'Falha na conexão' });
    } finally {
      setLoading(false);
    }
  };

  if (!integration) return null;

  return (
    <div className="space-y-4 p-4 md:p-5 bg-slate-950/50 rounded-2xl border border-white/5 shadow-inner">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center shadow-lg">
            <Play size={18} fill="currentColor" />
          </div>
          <div>
            <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Ambiente de Teste</h4>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Simulação em tempo real</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Painel de Entrada */}
        <div className="w-full lg:w-[450px] space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare size={12} /> Mensagem de Simulação
              </label>
            </div>
            <div className="relative group">
              <textarea
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="Ex: Como faço para falar com o suporte?"
                className="w-full h-32 p-6 bg-[#020617] border border-slate-800 rounded-[2rem] text-white text-xs outline-none focus:ring-2 focus:ring-blue-600/20 transition-all placeholder:text-slate-700 font-medium resize-none shadow-2xl"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Code size={12} /> Variáveis (JSON)
              </label>
            </div>
            <div className="relative group">
              <textarea
                value={testVariables}
                onChange={(e) => setTestVariables(e.target.value)}
                className="w-full h-40 p-6 bg-[#020617] border border-slate-800 rounded-[2rem] text-white text-[10px] outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-mono resize-none shadow-2xl"
              />
            </div>
          </div>

          <button
            onClick={handleTest}
            disabled={loading || !testInput}
            className={cn(
              "w-full flex items-center justify-center gap-3 px-8 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95 disabled:opacity-50 disabled:grayscale disabled:scale-100",
              loading ? "bg-slate-800 text-slate-400" : "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-blue-600/20"
            )}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            {loading ? 'Processando Engine...' : 'Executar Simulação'}
          </button>
        </div>

        {/* Painel de Saída - Terminal Style */}
        <div className="flex-1 flex flex-col bg-[#020617] rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-[0_30px_70px_rgba(0,0,0,0.4)] relative min-h-[450px]">
          <div className="flex items-center justify-between px-8 py-6 bg-slate-900/80 border-b border-slate-800/50 backdrop-blur-md">
            <div className="flex items-center gap-6">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Diagnóstico</span>
            </div>
            {testResult && !testResult.error && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/20"
              >
                <Sparkles size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Sucesso</span>
              </motion.div>
            )}
          </div>
          
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar font-mono text-xs relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.03),transparent)] pointer-events-none" />
            
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center space-y-6 relative z-10"
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-blue-600/10 border-t-blue-600 animate-spin" />
                    <Terminal size={24} className="absolute inset-0 m-auto text-blue-500 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse mb-1.5">Processando</p>
                    <p className="text-slate-600 text-[9px] font-black uppercase tracking-widest">Consultando Engine...</p>
                  </div>
                </motion.div>
              ) : testResult ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 relative z-10"
                >
                  <div className={cn(
                    "p-6 rounded-2xl border leading-relaxed whitespace-pre-wrap font-bold text-xs transition-all shadow-inner",
                    testResult.error || !testResult.success 
                      ? "bg-red-500/5 border-red-500/20 text-red-400" 
                      : "bg-blue-600/5 border-blue-600/20 text-blue-400"
                  )}>
                    {typeof testResult === 'string' ? testResult : JSON.stringify(testResult, null, 2)}
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-800 space-y-6 py-6 opacity-30 relative z-10">
                  <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-800 flex items-center justify-center group-hover:border-blue-500/30 transition-all duration-500">
                    <Terminal size={32} className="opacity-40 group-hover:text-blue-500 group-hover:opacity-100 transition-all" />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-1.5">Terminal Pronto</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-700 italic">Iniciar simulação</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Barra de Status Inferior do Terminal */}
          <div className="px-8 py-5 bg-black border-t border-slate-800/80 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-6 text-[9px] font-black text-slate-600 tracking-widest">
               <span className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" /> READY</span>
               <div className="w-px h-3 bg-slate-800" />
               <span className="flex items-center gap-2.5 text-blue-500/50">
                  <Code size={12} />
                  <span>v2.4.0</span>
               </span>
            </div>
            {loading && (
              <div className="flex items-center gap-2.5 text-blue-500">
                <Loader2 size={12} className="animate-spin" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] animate-pulse">Streaming...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
