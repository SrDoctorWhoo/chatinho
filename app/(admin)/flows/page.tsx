'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GitBranch, Plus, Play, Pause, Trash2, Edit2, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function FlowsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if ((session?.user as any)?.role === 'INTERNAL') {
      router.replace('/conversations');
    }
  }, [session, status, router]);

  const [flows, setFlows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFlow, setNewFlow] = useState({ name: '', description: '' });

  const fetchFlows = async () => {
    try {
      const res = await fetch('/api/flows');
      const data = await res.json();
      setFlows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlows();
  }, []);

  const [isCreating, setIsCreating] = useState(false);
  const handleCreateFlow = async () => {
    if (!newFlow.name) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFlow)
      });
      
      if (res.ok) {
        setNewFlow({ name: '', description: '' });
        setShowCreateModal(false);
        fetchFlows();
      } else {
        const errorData = await res.json();
        alert(`Erro ao criar fluxo: ${errorData.error || 'Erro desconhecido no servidor'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Falha na conexão com o servidor ao tentar criar o fluxo.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteFlow = async (id: string) => {
    if (!confirm('Deseja realmente excluir este fluxo? Todos os passos vinculados serão perdidos.')) return;
    try {
      const res = await fetch(`/api/flows/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchFlows();
      } else {
        const data = await res.json();
        alert(`Erro ao excluir: ${data.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Falha na rede ao tentar excluir o fluxo.');
    }
  };

  return (
    <div className="space-y-10 p-12 bg-slate-950 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Fluxos de Automação</h1>
          <p className="text-slate-400 font-black uppercase tracking-widest text-[11px] mt-2 opacity-70">Crie e gerencie respostas automáticas inteligentes.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-2xl shadow-blue-600/30 active:scale-[0.98]"
        >
          <Plus size={20} />
          Novo Fluxo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5 animate-pulse h-64" />
          ))
        ) : flows.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-slate-900/30 rounded-[3rem] border-4 border-dashed border-white/5">
            <GitBranch className="mx-auto text-slate-800 mb-6" size={64} />
            <p className="text-slate-500 font-black uppercase tracking-widest text-sm">Nenhum fluxo criado. Comece criando o seu primeiro!</p>
          </div>
        ) : (
          flows.map((flow) => (
            <div key={flow.id} className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5 hover:border-blue-500/50 transition-all group flex flex-col backdrop-blur-sm shadow-2xl">
              <div className="flex items-start justify-between mb-8">
                <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-500 shadow-sm border border-blue-500/20">
                  <GitBranch size={28} />
                </div>
                <div className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest flex items-center gap-2 border",
                  flow.isActive 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                    : "bg-slate-800 text-slate-400 border-slate-700"
                )}>
                  {flow.isActive ? <Play size={10} fill="currentColor" /> : <Pause size={10} fill="currentColor" />}
                  {flow.isActive ? 'ATIVO' : 'INATIVO'}
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-black text-white tracking-tight leading-tight">{flow.name}</h3>
                  {flow.isDefault && (
                    <span className="px-3 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20">PADRÃO</span>
                  )}
                </div>
                <p className="text-sm text-slate-400 font-medium leading-relaxed line-clamp-2 opacity-80">
                  {flow.description || 'Sem descrição definida para este fluxo.'}
                </p>
                <div className="pt-4 flex items-center gap-3 flex-wrap">
                  <span className="px-3 py-1 bg-slate-800 rounded-lg text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] border border-white/5">
                    {flow._count?.nodes || 0} PASSOS
                  </span>
                  {flow.instances?.length > 0 ? (
                    <div className="flex gap-2 flex-wrap">
                      {flow.instances.map((inst: any) => (
                        <span key={inst.id} className="px-3 py-1 bg-blue-900/30 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest">
                          {inst.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="px-3 py-1 bg-slate-800 text-slate-500 border border-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest">
                      TODAS AS INSTÂNCIAS
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-white/5 flex items-center gap-3">
                <Link 
                  href={`/flows/${flow.id}`}
                  className="flex-1 flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-600/20 border border-white/10"
                >
                  <Edit2 size={18} />
                  Configurar
                </Link>
                <button 
                  onClick={() => handleDeleteFlow(flow.id)}
                  className="p-4 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all border border-transparent hover:border-red-500/20"
                >
                  <Trash2 size={24} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Flow Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800 w-full max-w-md p-10 rounded-[3rem] shadow-[0_30px_70px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-500">
                  <GitBranch size={24} />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">Novo Fluxo</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-2">
                  Nome do Fluxo
                </label>
                <input
                  type="text"
                  value={newFlow.name}
                  onChange={(e) => setNewFlow({ ...newFlow, name: e.target.value })}
                  className="block w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-700 font-bold"
                  placeholder="Ex: Boas-vindas"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-2">
                  Descrição
                </label>
                <textarea
                  value={newFlow.description}
                  onChange={(e) => setNewFlow({ ...newFlow, description: e.target.value })}
                  className="block w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-blue-500 outline-none resize-none transition-all placeholder:text-slate-700 font-bold"
                  rows={3}
                  placeholder="Breve descrição do fluxo..."
                />
              </div>
              
              <div className="flex items-center gap-4 mt-12">
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black uppercase tracking-widest text-[11px] rounded-2xl transition-all border border-white/5"
                >
                  Cancelar
                </button>
                <button 
                  disabled={isCreating}
                  onClick={handleCreateFlow}
                  className="flex-1 py-5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl transition-all shadow-2xl shadow-blue-600/30 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Fluxo'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
