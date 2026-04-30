'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  ArrowLeft, 
  MessageSquare, 
  ListTree, 
  UserRound, 
  Trash2, 
  ChevronRight,
  Save,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';

export default function FlowEditorPage() {
  const params = useParams();
  const [flow, setFlow] = useState<any>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchFlow = async () => {
      try {
        const res = await fetch(`/api/flows/${params.id}`);
        const data = await res.json();
        setFlow(data);
        setNodes(data.nodes || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFlow();
  }, [params.id]);

  const addNode = async () => {
    try {
      const res = await fetch(`/api/flows/${params.id}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'MESSAGE', content: 'Nova mensagem automática...' })
      });
      const newNode = await res.json();
      setNodes([...nodes, newNode]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    // In a full impl, we'd save all nodes/options here.
    // For now, let's just simulate.
    setTimeout(() => setSaving(false), 800);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 gap-4">
      <RefreshCw size={32} className="animate-spin" />
      <p className="font-medium">Carregando editor...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/flows" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Editor de Fluxo</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Configurando: {flow?.name}</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
          {saving ? 'Salvando...' : 'Salvar Fluxo'}
        </button>
      </div>

      <div className="space-y-6 max-w-4xl">
        {nodes.map((node: any, index: number) => (
          <div key={node.id} className="relative">
            <div className="glass-card p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2.5 rounded-xl",
                    node.type === 'MESSAGE' ? "bg-blue-600/10 text-blue-600" :
                    node.type === 'MENU' ? "bg-indigo-600/10 text-indigo-600" :
                    "bg-emerald-600/10 text-emerald-600"
                  )}>
                    {node.type === 'MESSAGE' && <MessageSquare size={20} />}
                    {node.type === 'MENU' && <ListTree size={20} />}
                    {node.type === 'TRANSFER' && <UserRound size={20} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Passo {index + 1}: {node.type}
                    </h4>
                  </div>
                </div>
                <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mensagem</label>
                  <textarea
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    rows={3}
                    defaultValue={node.content}
                  />
                </div>

                {node.type === 'MENU' && (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Opções</label>
                    {node.options?.map((opt: any) => (
                      <div key={opt.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                          {opt.keyword}
                        </span>
                        <span className="flex-1 text-sm font-medium">{opt.label}</span>
                        <ChevronRight size={16} className="text-slate-400" />
                        <span className="text-xs text-blue-500 font-bold uppercase">Ir para #{opt.targetNodeId}</span>
                      </div>
                    ))}
                    <button className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-blue-500 hover:border-blue-500/50 transition-all text-sm font-medium">
                      + Adicionar Opção
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {index < nodes.length - 1 && (
              <div className="flex justify-center my-2">
                <div className="w-0.5 h-8 bg-slate-200 dark:bg-slate-800" />
              </div>
            )}
          </div>
        ))}

        <button 
          onClick={addNode}
          className="w-full py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 hover:text-blue-500 hover:border-blue-500/50 transition-all flex flex-col items-center gap-2 group"
        >
          <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-600/10 group-hover:text-blue-600 transition-all">
            <Plus size={24} />
          </div>
          <span className="font-bold">Adicionar novo passo ao fluxo</span>
        </button>
      </div>
    </div>
  );
}
