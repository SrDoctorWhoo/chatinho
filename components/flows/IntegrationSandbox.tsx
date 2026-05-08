'use client';

import { useState } from 'react';
import { Play, Loader2, Sparkles, Code, Terminal, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface IntegrationSandboxProps {
  node: any;
  integrations: any[];
  onUpdate: (data: any) => void;
}

export default function IntegrationSandbox({ node, integrations, onUpdate }: IntegrationSandboxProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testVariables, setTestVariables] = useState('{\n  "cpf": "123.456.789-00",\n  "nome": "Célio Veloso"\n}');
  const [testResult, setTestResult] = useState<any>(null);

  const selectedIntegration = integrations.find(i => i.id === node.integrationId);

  const handleTest = async () => {
    if (!node.integrationId) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          integrationId: node.integrationId,
          variables: JSON.parse(testVariables),
          message: node.content
        })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-blue-500" />
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Sandbox de Teste</h4>
        </div>
        <button
          onClick={handleTest}
          disabled={isTesting || !node.integrationId}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all",
            isTesting || !node.integrationId
              ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
          )}
        >
          {isTesting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          <span>{isTesting ? 'Executando...' : 'Testar Integração'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Variáveis (JSON)</label>
            <Code size={12} className="text-slate-400" />
          </div>
          <textarea
            value={testVariables}
            onChange={(e) => setTestVariables(e.target.value)}
            className="w-full h-40 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-mono outline-none focus:ring-2 focus:ring-blue-500/20 transition-all leading-relaxed"
          />
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Resposta do Servidor</label>
            <Sparkles size={12} className="text-blue-400" />
          </div>
          <div className="w-full h-40 bg-slate-900 dark:bg-black rounded-2xl p-4 overflow-y-auto custom-scrollbar border border-slate-800">
            {testResult ? (
              <pre className={cn(
                "text-[11px] font-mono leading-relaxed",
                testResult.error ? "text-red-400" : "text-emerald-400"
              )}>
                {JSON.stringify(testResult, null, 2)}
              </pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 italic text-[11px]">
                {!node.integrationId ? (
                  <>
                    <AlertCircle size={20} className="mb-2 text-slate-700" />
                    <span>Selecione uma integração para testar</span>
                  </>
                ) : (
                  <span>Aguardando execução...</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
