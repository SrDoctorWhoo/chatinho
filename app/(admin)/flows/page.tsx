'use client';

import { useState, useEffect } from 'react';
import { GitBranch, Plus, Play, Pause, Trash2, Edit2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function FlowsPage() {
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

  const handleCreateFlow = async () => {
    if (!newFlow.name) return;
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
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Fluxos de Automação</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Crie e gerencie respostas automáticas inteligentes.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
        >
          <Plus size={20} />
          Novo Fluxo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="glass-card p-6 rounded-3xl animate-pulse h-48 bg-slate-200/50 dark:bg-slate-800/50" />
          ))
        ) : flows.length === 0 ? (
          <div className="col-span-full py-20 text-center glass-card rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <GitBranch className="mx-auto text-slate-300 dark:text-slate-700 mb-4" size={48} />
            <p className="text-slate-500 dark:text-slate-400">Nenhum fluxo criado. Comece criando o seu primeiro!</p>
          </div>
        ) : (
          flows.map((flow) => (
            <div key={flow.id} className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-2xl bg-indigo-600/10 text-indigo-600">
                  <GitBranch size={24} />
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5",
                  flow.isActive 
                    ? "bg-emerald-500/10 text-emerald-600" 
                    : "bg-slate-500/10 text-slate-500"
                )}>
                  {flow.isActive ? <Play size={10} fill="currentColor" /> : <Pause size={10} fill="currentColor" />}
                  {flow.isActive ? 'ATIVO' : 'INATIVO'}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{flow.name}</h3>
                  {flow.isDefault && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-600/10 text-blue-600 text-[10px] font-bold">PADRÃO</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                  {flow.description || 'Sem descrição'}
                </p>
                <div className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {flow._count?.nodes || 0} PASSOS
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Link 
                  href={`/flows/${flow.id}`}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-all"
                >
                  <Edit2 size={16} />
                  Editar
                </Link>
                <button className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Flow Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-8 rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Novo Fluxo</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nome do Fluxo
                </label>
                <input
                  type="text"
                  value={newFlow.name}
                  onChange={(e) => setNewFlow({ ...newFlow, name: e.target.value })}
                  className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex: Boas-vindas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={newFlow.description}
                  onChange={(e) => setNewFlow({ ...newFlow, description: e.target.value })}
                  className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows={3}
                  placeholder="Breve descrição do fluxo..."
                />
              </div>
              <div className="flex items-center gap-3 mt-8">
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreateFlow}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20"
                >
                  Criar Fluxo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
