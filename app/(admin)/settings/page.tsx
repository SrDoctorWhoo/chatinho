'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Layers, 
  Users, 
  Shield, 
  Plus, 
  Trash2, 
  Save, 
  AlertCircle,
  MessageSquare,
  Bot,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('departments');
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDept)
      });
      if (res.ok) {
        setIsAddingDept(false);
        setNewDept({ name: '', description: '' });
        fetchDepartments();
      }
    } catch (err) {
      console.error('Failed to add department:', err);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Geral', icon: Settings },
    { id: 'departments', label: 'Setores / Departamentos', icon: Layers },
    { id: 'security', label: 'Segurança', icon: Shield },
  ];

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div>
        <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
          Configurações do <span className="text-emerald-400">Sistema</span>
        </h1>
        <p className="text-slate-400 font-medium">Gerencie setores, permissões e parâmetros globais.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
        {/* Navigation Sidebar */}
        <div className="lg:w-72 flex flex-col gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-300",
                activeTab === tab.id 
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/10" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              )}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 lg:p-12 backdrop-blur-xl overflow-y-auto custom-scrollbar">
          
          {activeTab === 'departments' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Setores de Atendimento</h2>
                  <p className="text-sm text-slate-500 mt-1">Defina para onde o bot deve encaminhar os clientes.</p>
                </div>
                <button
                  onClick={() => setIsAddingDept(true)}
                  className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-slate-950 transition-all active:scale-95"
                >
                  <Plus size={24} />
                </button>
              </div>

              {isAddingDept && (
                <form onSubmit={handleAddDepartment} className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-4 animate-in zoom-in-95 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nome do Setor</label>
                      <input
                        required
                        type="text"
                        placeholder="Ex: Comercial"
                        value={newDept.name}
                        onChange={(e) => setNewDept({...newDept, name: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Descrição</label>
                      <input
                        type="text"
                        placeholder="Atendimento a novos clientes"
                        value={newDept.description}
                        onChange={(e) => setNewDept({...newDept, description: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsAddingDept(false)}
                      className="px-6 py-3 text-slate-500 font-bold text-sm hover:text-slate-300"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={saving}
                      className="px-8 py-3 bg-emerald-500 text-slate-950 rounded-xl font-black text-sm hover:scale-105 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                    >
                      {saving ? 'Salvando...' : 'Salvar Setor'}
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 gap-4">
                {departments.map((dept) => (
                  <div 
                    key={dept.id}
                    className="group flex items-center justify-between p-6 bg-white/[0.03] border border-white/5 rounded-3xl hover:bg-white/[0.05] transition-all"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                        <Layers size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white leading-tight">{dept.name}</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">{dept.description || 'Sem descrição'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      <div className="hidden md:flex flex-col items-end">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Atendentes</p>
                        <p className="text-sm font-bold text-slate-300">{dept._count?.users || 0}</p>
                      </div>
                      <button className="p-3 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
                
                {departments.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                    <Layers size={48} className="opacity-10 mb-4" />
                    <p className="text-sm font-medium">Nenhum setor cadastrado ainda.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Comportamento do Robô</h3>
                    <p className="text-sm text-slate-500">Configurações globais de automação.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-6 bg-white/[0.03] border border-white/5 rounded-3xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                          <Bot size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Bot Ativado por Padrão</p>
                          <p className="text-[10px] text-slate-500 font-medium">Novas conversas iniciam com o robô.</p>
                        </div>
                      </div>
                      <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer shadow-inner">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-slate-950 rounded-full" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-white/[0.03] border border-white/5 rounded-3xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                          <MessageSquare size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Mensagem de Boas-vindas</p>
                          <p className="text-[10px] text-slate-500 font-medium">Primeira mensagem enviada ao cliente.</p>
                        </div>
                      </div>
                      <ArrowRight size={20} className="text-slate-600" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Identidade Visual</h3>
                    <p className="text-sm text-slate-500">Como o sistema aparece para sua equipe.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nome da Plataforma</label>
                      <input
                        type="text"
                        defaultValue="Chatinho"
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-white/5 flex justify-end">
                <button className="flex items-center gap-3 px-10 py-5 bg-emerald-500 text-slate-950 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl shadow-emerald-500/20 active:scale-95">
                  <Save size={20} />
                  Salvar Alterações
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-600 animate-in fade-in duration-500">
              <ShieldAlert size={64} className="opacity-10 mb-6" />
              <h2 className="text-xl font-bold text-white mb-2">Configurações de Segurança</h2>
              <p className="text-sm font-medium text-center max-w-xs">Políticas de senha e logs de auditoria estarão disponíveis em breve.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
