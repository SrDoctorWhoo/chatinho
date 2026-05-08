'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Layers, 
  Shield, 
  Plus, 
  Trash2, 
  Save, 
  Bot,
  Clock,
  Sparkles,
  ExternalLink,
  Edit2,
  X,
  ChevronRight,
  Globe,
  Zap,
  Cpu,
  Lock,
  Key,
  ShieldCheck,
  Activity,
  LogOut,
  Smartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [departments, setDepartments] = useState<any[]>([]);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [isAddingInteg, setIsAddingInteg] = useState(false);
  const [editingIntegId, setEditingIntegId] = useState<string | null>(null);
  const [newDept, setNewDept] = useState({ name: '', description: '' });
  const [integForm, setIntegForm] = useState({ name: '', type: 'DIFY', method: 'POST', apiKey: '', baseUrl: '', isActive: true });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);

  // Global Settings State
  const [globalSettings, setGlobalSettings] = useState({
    isBotEnabled: true,
    chatExpirationMinutes: 60,
    systemName: 'Chatinho'
  });

  // Security State
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [securityLoading, setSecurityLoading] = useState(false);

  // Mock Activity Logs
  const [activityLogs] = useState([
    { id: 1, action: 'LOGIN', description: 'Acesso realizado via Chrome/Windows', target: 'Painel Master', ip: '192.168.1.15', date: 'Hoje, 10:45', type: 'success' },
    { id: 2, action: 'UPDATE', description: 'Configurações de Bot alteradas', target: 'Sistema', ip: '192.168.1.15', date: 'Hoje, 09:20', type: 'info' },
    { id: 3, action: 'CREATE', description: 'Novo setor "Vendas" adicionado', target: 'Setores', ip: '187.12.44.10', date: 'Ontem, 16:30', type: 'success' },
    { id: 4, action: 'DELETE', description: 'Atendente "Roberto" removido', target: 'Equipe', ip: '192.168.1.15', date: '07 Mai, 14:15', type: 'error' },
  ]);

  useEffect(() => {
    fetchDepartments();
    fetchGlobalSettings();
    fetchIntegrations();
  }, []);

  const fetchGlobalSettings = async () => {
    try {
      const res = await fetch('/api/settings/bot');
      const data = await res.json();
      if (data && !data.error) {
        setGlobalSettings({
          isBotEnabled: data.isBotEnabled,
          chatExpirationMinutes: data.chatExpirationMinutes || 60,
          systemName: 'Chatinho'
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

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

  const fetchIntegrations = async () => {
    try {
      const res = await fetch('/api/integrations');
      const data = await res.json();
      setIntegrations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch integrations:', err);
    }
  };

  const handleSaveGlobal = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(globalSettings)
      });
      if (res.ok) {
        alert('Configurações salvas com sucesso!');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
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

  const testIntegration = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...integForm,
          message: 'Mensagem de teste do sistema',
          variables: { nome: 'Usuário Teste', telefone: '5511999999999' }
        })
      });
      const data = await response.json();
      setTestResult({
        success: response.ok,
        message: response.ok ? (data.message || `Sucesso (${response.status})`) : (data.message || `Erro ${response.status}`),
        data: data.data || data
      });
    } catch (err) {
      setTestResult({ success: false, message: 'Erro ao realizar teste' });
    } finally {
      setTesting(false);
    }
  };

  const handleAddIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingIntegId ? `/api/integrations/${editingIntegId}` : '/api/integrations';
      const method = editingIntegId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(integForm)
      });
      if (res.ok) {
        setIsAddingInteg(false);
        setEditingIntegId(null);
        setIntegForm({ name: '', type: 'DIFY', apiKey: '', baseUrl: '', isActive: true });
        setTestResult(null);
        fetchIntegrations();
      }
    } catch (err) {
      console.error('Failed to save integration:', err);
    } finally {
      setSaving(false);
    }
  };

  const deleteIntegration = async (id: string) => {
    if (!confirm('Excluir esta integração?')) return;
    try {
      await fetch(`/api/integrations/${id}`, { method: 'DELETE' });
      fetchIntegrations();
    } catch (err) {
      console.error('Failed to delete integration:', err);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      alert('As senhas não coincidem!');
      return;
    }
    if (securityForm.newPassword.length < 8) {
      alert('A nova senha deve ter pelo menos 8 caracteres!');
      return;
    }

    setSecurityLoading(true);
    try {
      const res = await fetch('/api/users/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: securityForm.currentPassword,
          newPassword: securityForm.newPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Senha atualizada com sucesso!');
        setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        alert(data.error || 'Erro ao atualizar senha');
      }
    } catch (err) {
      alert('Erro de conexão ao atualizar senha');
    } finally {
      setSecurityLoading(false);
    }
  };

  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;
    setPasswordStrength(score);
  };

  const tabs = [
    { id: 'general', label: 'Geral', icon: Settings },
    { id: 'departments', label: 'Setores', icon: Layers },
    { id: 'ai', label: 'Integrações & IA', icon: Sparkles },
    { id: 'security', label: 'Segurança', icon: Shield },
  ];

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
            Configurações <span className="text-emerald-400">Master</span>
          </h1>
          <p className="text-slate-400 font-medium">Controle total do ecossistema Chatinho.</p>
        </div>
        
        {activeTab === 'general' && (
          <button
            onClick={handleSaveGlobal}
            disabled={saving}
            className="flex items-center gap-3 px-8 py-4 bg-emerald-500 text-slate-950 rounded-[1.5rem] font-black text-sm hover:scale-105 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
          >
            <Save size={20} />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
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

        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 lg:p-12 backdrop-blur-xl overflow-y-auto custom-scrollbar">
          
          {activeTab === 'general' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                    <Bot className="text-emerald-500" size={24} /> Comportamento
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-6 bg-white/[0.03] border border-white/5 rounded-3xl">
                      <div>
                        <p className="text-sm font-bold text-white">Bot Ativado</p>
                        <p className="text-[10px] text-slate-500 font-medium">Ativa ou desativa o robô globalmente.</p>
                      </div>
                      <button 
                        onClick={() => setGlobalSettings({...globalSettings, isBotEnabled: !globalSettings.isBotEnabled})}
                        className={cn("w-12 h-6 rounded-full relative transition-all", globalSettings.isBotEnabled ? "bg-emerald-500" : "bg-slate-700")}
                      >
                        <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", globalSettings.isBotEnabled ? "right-1" : "left-1")} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-white/[0.03] border border-white/5 rounded-3xl">
                      <div>
                        <p className="text-sm font-bold text-white">Expiração (Minutos)</p>
                        <p className="text-[10px] text-slate-500 font-medium">Tempo para encerrar chats ociosos.</p>
                      </div>
                      <input 
                        type="number"
                        value={globalSettings.chatExpirationMinutes}
                        onChange={(e) => setGlobalSettings({...globalSettings, chatExpirationMinutes: parseInt(e.target.value)})}
                        className="w-20 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-center font-bold outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                    <Globe className="text-blue-500" size={24} /> Sistema
                  </h3>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nome da Plataforma</label>
                    <input
                      type="text"
                      value={globalSettings.systemName}
                      onChange={(e) => setGlobalSettings({...globalSettings, systemName: e.target.value})}
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'departments' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-white tracking-tight">Setores de Atendimento</h2>
                <button onClick={() => setIsAddingDept(true)} className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-slate-950 transition-all">
                  <Plus size={24} />
                </button>
              </div>

              {isAddingDept && (
                <form onSubmit={handleAddDepartment} className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input required placeholder="Nome do Setor" value={newDept.name} onChange={(e) => setNewDept({...newDept, name: e.target.value})} className="w-full px-6 py-4 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none" />
                    <input placeholder="Descrição" value={newDept.description} onChange={(e) => setNewDept({...newDept, description: e.target.value})} className="w-full px-6 py-4 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none" />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setIsAddingDept(false)} className="px-6 py-3 text-slate-500 font-bold text-sm">Cancelar</button>
                    <button type="submit" className="px-8 py-3 bg-emerald-500 text-slate-950 rounded-xl font-black text-sm transition-all shadow-lg shadow-emerald-500/20">Salvar Setor</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 gap-4">
                {departments.map((dept) => (
                  <div key={dept.id} className="group flex items-center justify-between p-6 bg-white/[0.03] border border-white/5 rounded-3xl hover:bg-white/[0.05] transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400"><Layers size={24} /></div>
                      <div>
                        <h3 className="text-lg font-bold text-white leading-tight">{dept.name}</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">{dept.description || 'Sem descrição'}</p>
                      </div>
                    </div>
                    <button className="p-3 text-slate-600 hover:text-red-500 transition-all"><Trash2 size={20} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                    <Sparkles className="text-blue-500" size={28} /> Integrações Externas
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Gerencie chaves e APIs para IA e serviços terceiros.</p>
                </div>
                <button 
                  onClick={() => {
                    setIntegForm({ name: '', type: 'DIFY', method: 'POST', apiKey: '', baseUrl: '', isActive: true });
                    setEditingIntegId(null);
                    setTestResult(null);
                    setIsAddingInteg(true);
                  }} 
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:scale-105 transition-all shadow-xl shadow-blue-600/20"
                >
                  <Plus size={20} /> Nova Integração
                </button>
              </div>

              {isAddingInteg && (
                <form onSubmit={handleAddIntegration} className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-6 animate-in zoom-in-95">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nome da Integração</label>
                      <input required placeholder="Ex: Dify Comercial" value={integForm.name} onChange={(e) => setIntegForm({...integForm, name: e.target.value})} className="w-full px-6 py-4 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Tipo de Serviço</label>
                      <select value={integForm.type} onChange={(e) => setIntegForm({...integForm, type: e.target.value})} className="w-full px-6 py-4 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/20">
                        <option value="DIFY">Dify.ai</option>
                        <option value="OPENAI">OpenAI (ChatGPT)</option>
                        <option value="WEBHOOK">Custom Webhook</option>
                      </select>
                    </div>

                    {integForm.type === 'WEBHOOK' && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Método HTTP</label>
                        <select value={integForm.method} onChange={(e) => setIntegForm({...integForm, method: e.target.value})} className="w-full px-6 py-4 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/20">
                          <option value="POST">POST (Recomendado)</option>
                          <option value="GET">GET</option>
                        </select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">URL Base (API)</label>
                      <input placeholder="https://api.dify.ai/v1" value={integForm.baseUrl || ''} onChange={(e) => setIntegForm({...integForm, baseUrl: e.target.value})} className="w-full px-6 py-4 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Chave API / Token</label>
                      <input type="password" placeholder="app-xxxxxxxxxxxx" value={integForm.apiKey || ''} onChange={(e) => setIntegForm({...integForm, apiKey: e.target.value})} className="w-full px-6 py-4 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                    <button type="button" onClick={() => { setIsAddingInteg(false); setEditingIntegId(null); setTestResult(null); }} className="px-6 py-3 text-slate-500 font-bold text-sm">Cancelar</button>
                    <button type="button" onClick={testIntegration} disabled={testing || !integForm.baseUrl} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold border border-white/10 transition-all disabled:opacity-50">
                      {testing ? 'Testando...' : 'Testar Integração'}
                    </button>
                    <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black text-sm transition-all shadow-lg shadow-blue-600/20">
                      {editingIntegId ? 'Salvar Alterações' : 'Salvar Integração'}
                    </button>
                  </div>

                  {testResult && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className={cn(
                        "p-4 rounded-2xl border flex items-center gap-3",
                        testResult.success ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-red-500/10 border-red-500/20 text-red-500"
                      )}>
                        <div className={cn("w-2 h-2 rounded-full", testResult.success ? "bg-emerald-500" : "bg-red-500")} />
                        <span className="text-xs font-bold uppercase tracking-wider">{testResult.message}</span>
                      </div>
                      
                      {testResult.data && (
                        <div className="bg-slate-950 rounded-2xl border border-white/5 p-4 overflow-hidden">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Resposta da API:</p>
                          <pre className="text-[10px] text-emerald-400 font-mono whitespace-pre-wrap break-all">
                            {JSON.stringify(testResult.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {integrations.map((integ) => (
                  <div key={integ.id} className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl flex flex-col gap-6 hover:border-blue-500/30 transition-all group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black">
                          {integ.type === 'DIFY' ? 'D' : integ.type === 'OPENAI' ? 'O' : 'W'}
                        </div>
                        <div>
                          <h3 className="font-bold text-white">{integ.name}</h3>
                          <span className="text-[10px] font-black bg-white/5 px-2 py-0.5 rounded text-slate-500 uppercase tracking-widest">{integ.type}</span>
                        </div>
                      </div>
                      <div className={cn("px-3 py-1 rounded-full text-[9px] font-black tracking-widest", integ.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                        {integ.isActive ? 'ATIVO' : 'INATIVO'}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">URL Base</p>
                      <p className="text-xs text-slate-400 truncate">{integ.baseUrl || 'N/A'}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => deleteIntegration(integ.id)} className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-red-500 transition-all">
                        <Trash2 size={14} /> Excluir
                      </button>
                      <button 
                        onClick={() => {
                          setIntegForm({
                            name: integ.name,
                            type: integ.type,
                            method: integ.method || 'POST',
                            apiKey: integ.apiKey || '',
                            baseUrl: integ.baseUrl || '',
                            isActive: integ.isActive
                          });
                          setEditingIntegId(integ.id);
                          setTestResult(null);
                          setIsAddingInteg(true);
                        }}
                        className="flex items-center gap-2 text-xs font-bold text-blue-500 hover:scale-105 transition-all"
                      >
                        Configurar <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                
                {integrations.length === 0 && (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white/[0.01] border border-dashed border-white/10 rounded-[3rem]">
                    <Cpu size={48} className="text-slate-800 mb-4" />
                    <p className="text-slate-500 font-bold">Nenhuma integração cadastrada.</p>
                  </div>
                )}
              </div>

              {/* Guia de Webhook */}
              <div className="mt-12 p-8 bg-blue-500/5 border border-blue-500/10 rounded-[2.5rem] space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Como conectar via Webhook?</h3>
                    <p className="text-sm text-slate-500">Use o Make.com, n8n ou seu próprio servidor para processar mensagens.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest">1. O que enviamos (Payload)</h4>
                    <pre className="p-4 bg-slate-950 rounded-2xl border border-white/5 text-[10px] text-emerald-400 overflow-x-auto">
{`{
  "contact": {
    "name": "João Silva",
    "number": "5511999999999"
  },
  "message": "Olá, gostaria de saber o preço.",
  "conversationId": "uuid-123"
}`}
                    </pre>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest">2. O que esperamos (Resposta)</h4>
                    <pre className="p-4 bg-slate-950 rounded-2xl border border-white/5 text-[10px] text-emerald-400 overflow-x-auto">
{`{
  "answer": "O valor do produto é R$ 100,00."
}`}
                    </pre>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl">
                  <p className="text-xs text-slate-400 leading-relaxed italic">
                    💡 <strong>Dica:</strong> Se você estiver usando o Make.com, crie um cenário com "Custom Webhook" e finalize com um "Webhook Response" enviando o JSON acima.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* Alterar Senha */}
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/5">
                      <Lock size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Segurança da Conta</h3>
                      <p className="text-xs text-slate-500">Atualize suas credenciais de acesso periodicamente.</p>
                    </div>
                  </div>

                  <form onSubmit={handleUpdatePassword} className="space-y-6 bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Senha Atual</label>
                      <div className="relative">
                        <Key className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                        <input 
                          required
                          type="password" 
                          value={securityForm.currentPassword}
                          onChange={(e) => setSecurityForm({...securityForm, currentPassword: e.target.value})}
                          className="w-full pl-14 pr-6 py-4 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500/20" 
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nova Senha</label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                        <input 
                          required
                          type="password" 
                          value={securityForm.newPassword}
                          onChange={(e) => {
                            setSecurityForm({...securityForm, newPassword: e.target.value});
                            calculatePasswordStrength(e.target.value);
                          }}
                          className="w-full pl-14 pr-6 py-4 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500/20" 
                          placeholder="Mínimo 8 caracteres"
                        />
                      </div>
                      
                      {/* Password Strength Indicator */}
                      {securityForm.newPassword && (
                        <div className="px-4 pt-2">
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full transition-all duration-500",
                                passwordStrength <= 25 ? "bg-red-500 w-1/4" : 
                                passwordStrength <= 50 ? "bg-orange-500 w-2/4" :
                                passwordStrength <= 75 ? "bg-blue-500 w-3/4" : "bg-emerald-500 w-full"
                              )} 
                            />
                          </div>
                          <p className="text-[9px] font-bold mt-2 uppercase tracking-tighter text-slate-500">
                            Força da senha: {
                              passwordStrength <= 25 ? "Fraca" : 
                              passwordStrength <= 50 ? "Média" :
                              passwordStrength <= 75 ? "Boa" : "Excelente"
                            }
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Confirmar Nova Senha</label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                        <input 
                          required
                          type="password" 
                          value={securityForm.confirmPassword}
                          onChange={(e) => setSecurityForm({...securityForm, confirmPassword: e.target.value})}
                          className="w-full pl-14 pr-6 py-4 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500/20" 
                          placeholder="Repita a nova senha"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={securityLoading || !securityForm.newPassword || securityForm.newPassword !== securityForm.confirmPassword}
                      className="w-full py-4 bg-emerald-500 text-slate-950 rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:grayscale"
                    >
                      {securityLoading ? 'Processando...' : 'Atualizar Credenciais'}
                    </button>
                  </form>
                </div>

                {/* Auditoria / Logs */}
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/5">
                        <Activity size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Logs de Auditoria</h3>
                        <p className="text-xs text-slate-500">Rastreabilidade completa de ações administrativas.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-4 lg:p-8">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="group flex items-center justify-between p-4 rounded-2xl hover:bg-white/[0.02] transition-all border border-transparent hover:border-white/5">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black",
                            log.type === 'success' ? "bg-emerald-500/10 text-emerald-500" :
                            log.type === 'error' ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                          )}>
                            {log.action.substring(0, 3)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-200">{log.description}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{log.date}</span>
                              <span className="text-[10px] font-medium text-slate-700">•</span>
                              <span className="text-[10px] font-mono text-slate-600">{log.ip}</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-800 group-hover:text-slate-400 transition-all" />
                      </div>
                    ))}

                    <button className="w-full py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hover:text-white transition-all">
                      Ver histórico completo
                    </button>
                  </div>

                  {/* Sessões Ativas */}
                  <div className="p-8 bg-gradient-to-br from-blue-600/10 to-emerald-600/10 border border-white/5 rounded-[2.5rem] space-y-4">
                    <div className="flex items-center gap-3 text-blue-400">
                      <Smartphone size={20} />
                      <h4 className="text-sm font-black uppercase tracking-widest">Sessão Atual</h4>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-bold">Windows • Chrome</p>
                        <p className="text-[10px] text-slate-500">Último acesso: Agora mesmo</p>
                      </div>
                      <button className="px-4 py-2 bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5">
                        <LogOut size={14} className="inline mr-2" /> Encerrar
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
