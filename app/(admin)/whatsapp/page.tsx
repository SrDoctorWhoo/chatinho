'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Smartphone, 
  Plus, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  QrCode, 
  X,
  ShieldCheck,
  Zap,
  Clock,
  ExternalLink,
  Loader2,
  Database,
  Send,
  Globe,
  Code,
  Layout
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WhatsappPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if ((session?.user as any)?.role === 'INTERNAL') {
      router.replace('/conversations');
    }
  }, [session, status, router]);

  const [instances, setInstances] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [newIntegration, setNewIntegration] = useState('WHATSAPP-BAILEYS');
  const [newToken, setNewToken] = useState('');
  const [newPhoneNumberId, setNewPhoneNumberId] = useState('');
  const [newWabaId, setNewWabaId] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [configModal, setConfigModal] = useState<{ isOpen: boolean; instance: any | null }>({
    isOpen: false,
    instance: null
  });
  const [qrModal, setQrModal] = useState<{ isOpen: boolean; qr: string | null; instanceId: string | null }>({
    isOpen: false,
    qr: null,
    instanceId: null
  });
  const [metaConfig, setMetaConfig] = useState({ token: '', phoneNumberId: '', wabaId: '' });
  const [isSavingMeta, setIsSavingMeta] = useState(false);

  const fetchInstances = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/instances');
      const data = await res.json();
      setInstances(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/whatsapp/instances/sync', { method: 'POST' });
      if (res.ok) {
        await fetchInstances(false);
      } else {
        const errData = await res.json();
        alert(`Erro na sincronização: ${errData.error || 'Falha ao conectar com a Evolution API'}`);
      }
    } catch (err) {
      console.error('Sync failed:', err);
      alert('Erro de rede ao tentar sincronizar.');
    } finally {
      setSyncing(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchInstances(), fetchDepartments()]);
      // Auto-sync on first load to ensure we have the latest from Evolution
      handleSync();
    };
    init();
  }, []);

  const handleCreateInstance = async () => {
    if (!newInstanceName) return;
    setIsCreating(true);
    try {
      const payload: any = { name: newInstanceName, integration: newIntegration };
      if (newIntegration === 'WHATSAPP-BUSINESS') {
        payload.token = newToken;
        payload.phoneNumberId = newPhoneNumberId;
        payload.wabaId = newWabaId;
        payload.number = newNumber;
      } else if (newIntegration === 'TELEGRAM') {
        payload.token = newToken;
      }
      const res = await fetch('/api/whatsapp/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setNewInstanceName('');
        setNewIntegration('WHATSAPP-BAILEYS');
        setNewToken('');
        setNewPhoneNumberId('');
        setNewWabaId('');
        setNewNumber('');
        setShowCreateModal(false);
        fetchInstances();
      } else {
        const err = await res.json();
        alert(`Erro: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateInstance = async (id: string, data: any) => {
    try {
      const res = await fetch(`/api/whatsapp/instances/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        fetchInstances(false);
        if (configModal.isOpen && configModal.instance?.id === id) {
          const updated = await res.json();
          setConfigModal(prev => ({ ...prev, instance: updated }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveMeta = async () => {
    if (!configModal.instance) return;
    setIsSavingMeta(true);
    try {
      await handleUpdateInstance(configModal.instance.id, metaConfig);
      alert('Configurações da Meta salvas com sucesso!');
    } catch (err) {
      alert('Erro ao salvar configurações.');
    } finally {
      setIsSavingMeta(false);
    }
  };

  useEffect(() => {
    if (configModal.isOpen && configModal.instance) {
      setMetaConfig({
        token: configModal.instance.token || '',
        phoneNumberId: configModal.instance.phoneNumberId || '',
        wabaId: configModal.instance.wabaId || ''
      });
    }
  }, [configModal.isOpen, configModal.instance]);

  const handleDeleteInstance = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja remover a instância "${name}"? Isso também a removerá da Evolution API.`)) return;
    
    try {
      const res = await fetch(`/api/whatsapp/instances/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchInstances();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (qrModal.isOpen && qrModal.instanceId) {
      const checkQr = async () => {
        try {
          const res = await fetch(`/api/whatsapp/instances/${qrModal.instanceId}/qr`);
          const data = await res.json();
          
          if (data.code && data.code !== qrModal.qr) {
            setQrModal(prev => ({ ...prev, qr: data.code }));
          }
          
          if (data.status === 'CONNECTED') {
            setQrModal({ isOpen: false, qr: null, instanceId: null });
            fetchInstances();
          }
        } catch (err) {
          console.error('Erro ao buscar QR:', err);
        }
      };

      checkQr();
      interval = setInterval(checkQr, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [qrModal.isOpen, qrModal.instanceId, qrModal.qr]);

  const handleConnect = async (instance: any) => {
    setQrModal({ isOpen: true, qr: null, instanceId: instance.id });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <Zap size={24} />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white">
              Canais de <span className="text-emerald-400">Conexão</span>
            </h1>
          </div>
          <p className="text-lg text-slate-400 max-w-2xl font-medium leading-relaxed">
            Gerencie múltiplas instâncias de WhatsApp e Telegram com sincronização em tempo real e controle total.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="group flex items-center gap-2 px-6 py-4 bg-white/5 border border-white/5 text-slate-300 font-bold rounded-2xl transition-all hover:bg-white/[0.08] active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={20} className={cn("transition-transform duration-700", syncing && "animate-spin")} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
          
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 active:scale-95"
          >
            <Plus size={22} strokeWidth={3} />
            Nova Instância
          </button>
        </div>
      </div>

      {/* Instances Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-[300px] rounded-[2.5rem] bg-white/5 animate-pulse border border-white/5" />
          ))
        ) : instances.length === 0 ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-white/10 bg-white/[0.02]">
            <div className="p-8 rounded-[2rem] bg-white/5 text-slate-600 mb-6">
              <Database size={56} strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Sem instâncias ativas</h3>
            <p className="text-slate-400 text-center max-w-sm font-medium">
              Conecte sua primeira conta do WhatsApp para começar a automatizar seus atendimentos.
            </p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="mt-10 px-10 py-4 bg-white text-slate-950 font-black rounded-2xl hover:scale-105 transition-transform"
            >
              Começar Agora
            </button>
          </div>
        ) : (
          instances.map((instance) => (
            <div 
              key={instance.id} 
              className={cn(
                "group relative overflow-hidden p-8 rounded-[2.5rem] border transition-all duration-500",
                "bg-white/[0.03] border-white/5 backdrop-blur-md",
                "hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/5 hover:-translate-y-2"
              )}
            >
              {/* Card Decoration */}
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px] group-hover:bg-emerald-500/10 transition-colors" />
              
              <div className="relative flex items-start justify-between mb-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500",
                      instance.status === 'CONNECTED' 
                        ? (instance.integration === 'TELEGRAM' ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : 
                           instance.integration === 'WIDGET' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" :
                           "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20") 
                        : "bg-white/5 text-slate-500"
                    )}>
                      {instance.integration === 'TELEGRAM' ? <Send size={32} strokeWidth={2.5} /> : 
                       instance.integration === 'WIDGET' ? <Globe size={32} strokeWidth={2.5} /> :
                       <Smartphone size={32} strokeWidth={2.5} />}
                    </div>

                    <div className={cn(
                      "px-4 py-2 rounded-full text-[10px] font-black flex items-center gap-2 border shadow-lg backdrop-blur-md",
                      instance.status === 'CONNECTED' 
                        ? (instance.integration === 'WIDGET' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20")
                        : instance.status === 'QRCODE'
                        ? "bg-orange-500/10 text-orange-400 border-orange-500/20 animate-pulse"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    )}>
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        instance.status === 'CONNECTED' ? (
                          instance.integration === 'TELEGRAM' ? "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" : 
                          instance.integration === 'WIDGET' ? "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]" :
                          "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                        ) : instance.status === 'QRCODE' ? "bg-orange-400" : "bg-red-400"
                      )} />
                      {instance.status === 'CONNECTED' ? 'ONLINE' : instance.status === 'QRCODE' ? 'AGUARDANDO SCAN' : 'OFFLINE'}
                    </div>
                  </div>
                  
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-black text-white tracking-tighter leading-none">
                          {instance.name}
                        </h3>
                        <button 
                          onClick={() => handleUpdateInstance(instance.id, { isActive: !instance.isActive })}
                          className={cn(
                            "w-10 h-5 rounded-full relative transition-all duration-300",
                            instance.isActive ? (instance.integration === 'WIDGET' ? "bg-indigo-500" : "bg-emerald-500") : "bg-white/10"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300",
                            instance.isActive ? "right-1" : "left-1"
                          )} />
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
                        {instance.number && (
                          <p className={cn("font-bold text-sm tracking-tight", instance.integration === 'WIDGET' ? "text-indigo-400" : "text-emerald-400")}>
                            {instance.integration === 'TELEGRAM' ? instance.number : `+${instance.number}`}
                          </p>
                        )}
                        <span className={cn(
                          "text-[9px] font-black px-2 py-0.5 rounded-md border",
                          instance.integration === 'WHATSAPP-BUSINESS' ? "text-blue-400 border-blue-500/20 bg-blue-500/5" : 
                          instance.integration === 'TELEGRAM' ? "text-sky-400 border-sky-500/20 bg-sky-500/5" :
                          instance.integration === 'WIDGET' ? "text-indigo-400 border-indigo-500/20 bg-indigo-500/5" :
                          "text-slate-500 border-white/5 bg-white/5"
                        )}>
                          {instance.integration === 'WHATSAPP-BUSINESS' ? 'OFICIAL (CLOUD)' : 
                           instance.integration === 'TELEGRAM' ? 'TELEGRAM BOT' : 
                           instance.integration === 'WIDGET' ? 'CHAT WIDGET' : 'WEB (BAILEYS)'}
                        </span>
                        <span className={cn(
                          "text-[9px] font-black px-2 py-0.5 rounded-md border",
                          instance.isActive ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" : "text-slate-500 border-white/5 bg-white/5"
                        )}>
                          {instance.isActive ? 'ATIVADA' : 'PAUSADA'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <ShieldCheck size={14} className="text-emerald-500" />
                      ID: {instance.instanceId}
                    </div>
                </div>

                <button 
                  onClick={() => setConfigModal({ isOpen: true, instance })}
                  className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                >
                  <RefreshCw size={20} className="hover:rotate-180 transition-transform duration-500" />
                </button>
              </div>

              {/* Department Badges */}
              <div className="flex flex-wrap gap-2 mb-8">
                {instance.departments?.length > 0 ? (
                  instance.departments.map((dept: any) => (
                    <span key={dept.id} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {dept.name}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">
                    Nenhum departamento vinculado
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-auto">
                {instance.integration === 'WIDGET' ? (
                  <button 
                    onClick={() => {
                      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
                      const script = `<script src="${baseUrl}/api/widget/embed.js?id=${instance.id}"></script>`;
                      navigator.clipboard.writeText(script);
                      alert('Script copiado com sucesso! Cole-o no seu site antes do fechamento da tag </body>.');
                    }}
                    className="col-span-2 group/btn flex items-center justify-center gap-3 py-4.5 bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-indigo-500/20"
                  >
                    <Code size={20} />
                    Copiar Script
                  </button>
                ) : instance.status === 'CONNECTED' ? (
                  <div className="col-span-2 py-4 px-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                      <Clock size={14} /> Conexão Estável
                    </span>
                  </div>
                ) : (instance.integration !== 'WHATSAPP-BUSINESS' && instance.integration !== 'TELEGRAM') && (
                  <button 
                    onClick={() => handleConnect(instance)}
                    className="col-span-2 group/btn flex items-center justify-center gap-3 py-4.5 bg-white text-slate-950 font-black rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/5"
                  >
                    <QrCode size={20} />
                    Conectar Agora
                  </button>
                )}
                
                <button 
                  onClick={() => handleDeleteInstance(instance.id, instance.name)}
                  className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 text-slate-400 font-black text-xs hover:bg-red-500/10 hover:text-red-400 transition-all border border-white/5 active:scale-95"
                >
                  <Trash2 size={18} />
                  Remover
                </button>
                <button 
                  onClick={() => handleSync()}
                  className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 text-slate-400 font-black text-xs hover:bg-white/10 hover:text-white transition-all border border-white/5 active:scale-95"
                >
                  <RefreshCw size={18} />
                  Status
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Instance Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-300" onClick={() => !isCreating && setShowCreateModal(false)} />
          <div className="relative w-full max-w-lg bg-slate-900 rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden animate-in zoom-in-95 duration-500 max-h-[90vh] overflow-y-auto">
            <div className="p-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-white tracking-tighter">Nova <span className="text-emerald-400">Instância</span></h2>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-slate-500 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Nome */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Nome da Instância <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newInstanceName}
                    onChange={(e) => setNewInstanceName(e.target.value)}
                    className="block w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 outline-none transition-all font-bold text-white placeholder-slate-600"
                    placeholder="Ex: OABGO-CHATINHO"
                    disabled={isCreating}
                  />
                </div>

                {/* Tipo de Integração */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Canal <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewIntegration('WHATSAPP-BAILEYS')}
                      className={cn(
                        "py-3 px-4 rounded-xl border transition-all text-center",
                        newIntegration === 'WHATSAPP-BAILEYS'
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10"
                      )}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">WhatsApp Web</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewIntegration('WHATSAPP-BUSINESS')}
                      className={cn(
                        "py-3 px-4 rounded-xl border transition-all text-center",
                        newIntegration === 'WHATSAPP-BUSINESS'
                          ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                          : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10"
                      )}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">Cloud API</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewIntegration('TELEGRAM')}
                      className={cn(
                        "py-3 px-4 rounded-xl border transition-all text-center",
                        newIntegration === 'TELEGRAM'
                          ? "bg-sky-500/10 border-sky-500/30 text-sky-400"
                          : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10"
                      )}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">Telegram Bot</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewIntegration('WIDGET')}
                      className={cn(
                        "py-3 px-4 rounded-xl border transition-all text-center",
                        newIntegration === 'WIDGET'
                          ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                          : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10"
                      )}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">Chat Widget</span>
                    </button>
                  </div>
                </div>

                {/* Campos Telegram */}
                {newIntegration === 'TELEGRAM' && (
                  <div className="space-y-4 p-5 bg-sky-500/5 rounded-xl border border-sky-500/10">
                    <h4 className="text-sky-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                      <Send size={14} /> Configuração Telegram
                    </h4>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                        Bot Token <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={newToken}
                        onChange={(e) => setNewToken(e.target.value)}
                        className={cn(
                          "block w-full px-4 py-3 bg-white/5 border rounded-lg focus:border-sky-500/50 outline-none transition-all font-bold text-xs text-white placeholder-slate-600",
                          !newToken && "border-white/10",
                          newToken && "border-sky-500/20"
                        )}
                        placeholder="Ex: 123456789:ABCdef..."
                        disabled={isCreating}
                      />
                      <p className="text-[9px] text-slate-500 font-medium px-1">
                        Obtenha seu token conversando com o @BotFather no Telegram.
                      </p>
                    </div>
                  </div>
                )}

                {/* Campos Cloud API */}
                {newIntegration === 'WHATSAPP-BUSINESS' && (
                  <div className="space-y-4 p-5 bg-blue-500/5 rounded-xl border border-blue-500/10">
                    <h4 className="text-blue-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                      <Zap size={14} /> Configuração Cloud API
                    </h4>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                        Token <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={newToken}
                        onChange={(e) => setNewToken(e.target.value)}
                        className={cn(
                          "block w-full px-4 py-3 bg-white/5 border rounded-lg focus:border-blue-500/50 outline-none transition-all font-mono text-xs text-white placeholder-slate-600 min-h-[60px] resize-none",
                          !newToken && "border-white/10",
                          newToken && "border-blue-500/20"
                        )}
                        placeholder="Token permanente da Meta (EA...)"
                        disabled={isCreating}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                        Número <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={newNumber}
                        onChange={(e) => setNewNumber(e.target.value)}
                        className={cn(
                          "block w-full px-4 py-3 bg-white/5 border rounded-lg focus:border-blue-500/50 outline-none transition-all font-bold text-xs text-white placeholder-slate-600",
                          !newNumber && "border-white/10",
                          newNumber && "border-blue-500/20"
                        )}
                        placeholder="Com código do país: 556232382025"
                        disabled={isCreating}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                        Business ID <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={newWabaId}
                        onChange={(e) => setNewWabaId(e.target.value)}
                        className={cn(
                          "block w-full px-4 py-3 bg-white/5 border rounded-lg focus:border-blue-500/50 outline-none transition-all font-bold text-xs text-white placeholder-slate-600",
                          !newWabaId && "border-white/10",
                          newWabaId && "border-blue-500/20"
                        )}
                        placeholder="ID da conta Business (WABA)"
                        disabled={isCreating}
                      />
                    </div>
                  </div>
                )}

                {/* Botão */}
                <button 
                  onClick={handleCreateInstance}
                  disabled={isCreating || !newInstanceName || (newIntegration === 'WHATSAPP-BUSINESS' && (!newToken || !newNumber || !newWabaId)) || (newIntegration === 'TELEGRAM' && !newToken)}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-black rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  {isCreating ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                  {isCreating ? 'Criando...' : 'Criar Instância'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl animate-in fade-in duration-500" />
          <div className="relative w-full max-sm bg-slate-900 rounded-[4rem] shadow-2xl border border-white/5 overflow-hidden animate-in zoom-in-95 duration-700">
            <div className="p-12 flex flex-col items-center">
              <div className="w-full flex justify-end absolute top-8 right-10">
                <button 
                  onClick={() => setQrModal({ isOpen: false, qr: null, instanceId: null })}
                  className="p-2 text-slate-500 hover:text-white transition-colors"
                >
                  <X size={28} />
                </button>
              </div>

              <div className="mt-6 mb-10 text-center space-y-2">
                <h2 className="text-3xl font-black text-white tracking-tighter">Conectar <span className="text-emerald-400">App</span></h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Sincronização via Evolution API</p>
              </div>

              <div className="relative group p-8 bg-white rounded-[3rem] mb-10 shadow-[0_0_100px_rgba(52,211,153,0.15)]">
                <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  {qrModal.qr ? (
                    <img src={qrModal.qr} alt="QR Code" className="w-60 h-60 rounded-2xl" />
                  ) : (
                    <div className="w-60 h-60 flex flex-col items-center justify-center bg-slate-100 rounded-3xl">
                      <Loader2 className="animate-spin text-emerald-500 mb-4" size={56} strokeWidth={3} />
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Gerando Token</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-5 w-full">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-4 text-white font-bold text-sm">
                    <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20">1</span>
                    Abra o WhatsApp no celular
                  </div>
                  <div className="flex items-center gap-4 text-white font-bold text-sm">
                    <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20">2</span>
                    Aparelhos Conectados
                  </div>
                  <div className="flex items-center gap-4 text-white font-bold text-sm">
                    <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20">3</span>
                    Escaneie o código acima
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-8 bg-white/[0.02] text-center border-t border-white/5">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                <ShieldCheck size={14} className="text-emerald-500/50" /> Secure Protocol v2.4
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Config Modal */}
      {configModal.isOpen && configModal.instance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-300" onClick={() => setConfigModal({ isOpen: false, instance: null })} />
          <div className="relative w-full max-w-xl bg-slate-900 rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-12">
              <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black text-white tracking-tighter">Configurar <span className="text-emerald-400">Instância</span></h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{configModal.instance.name}</p>
                </div>
                <button 
                  onClick={() => setConfigModal({ isOpen: false, instance: null })}
                  className="p-2 text-slate-500 hover:text-white transition-colors"
                >
                  <X size={28} />
                </button>
              </div>

              <div className="space-y-10">
                {/* Active Toggle */}
                <div className="flex items-center justify-between p-6 bg-white/[0.03] border border-white/5 rounded-[2rem]">
                  <div className="space-y-1">
                    <h4 className="text-white font-black text-sm uppercase tracking-tight">Status da Operação</h4>
                    <p className="text-xs text-slate-500 font-medium">Ative ou desative o processamento de mensagens desta instância.</p>
                  </div>
                  <button 
                    onClick={() => handleUpdateInstance(configModal.instance.id, { isActive: !configModal.instance.isActive })}
                    className={cn(
                      "w-14 h-7 rounded-full relative transition-all duration-300",
                      configModal.instance.isActive ? (configModal.instance.integration === 'WIDGET' ? "bg-indigo-500" : "bg-emerald-500") : "bg-white/10"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-md",
                      configModal.instance.isActive ? "right-1" : "left-1"
                    )} />
                  </button>
                </div>

                {/* Integration Type */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Tipo de Integração</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleUpdateInstance(configModal.instance.id, { integration: 'WHATSAPP-BAILEYS' })}
                      className={cn(
                        "p-4 rounded-2xl border transition-all text-center",
                        configModal.instance.integration === 'WHATSAPP-BAILEYS' 
                          ? "bg-slate-500/10 border-slate-500/30 text-slate-300" 
                          : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10"
                      )}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">Web (Baileys)</span>
                    </button>
                    <button
                      onClick={() => handleUpdateInstance(configModal.instance.id, { integration: 'WHATSAPP-BUSINESS' })}
                      className={cn(
                        "p-4 rounded-2xl border transition-all text-center",
                        configModal.instance.integration === 'WHATSAPP-BUSINESS' 
                          ? "bg-blue-500/10 border-blue-500/30 text-blue-400" 
                          : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10"
                      )}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">Oficial (Cloud)</span>
                    </button>
                  </div>
                </div>
                
                {/* Meta Cloud API Configuration */}
                {configModal.instance.integration === 'WHATSAPP-BUSINESS' && (
                  <div className="space-y-6 p-8 bg-blue-500/5 rounded-[2rem] border border-blue-500/10">
                    <div className="space-y-1 mb-4">
                      <h4 className="text-blue-400 font-black text-sm uppercase tracking-tight flex items-center gap-2">
                        <Zap size={18} /> Configurações da Meta
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">Insira as credenciais do seu aplicativo no Meta Developers.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Token de Acesso Permanente</label>
                        <textarea
                          value={metaConfig.token}
                          onChange={(e) => setMetaConfig(prev => ({ ...prev, token: e.target.value }))}
                          className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500/50 outline-none transition-all font-mono text-xs text-white placeholder-slate-600 min-h-[80px]"
                          placeholder="Começa com EA..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone Number ID</label>
                          <input
                            type="text"
                            value={metaConfig.phoneNumberId}
                            onChange={(e) => setMetaConfig(prev => ({ ...prev, phoneNumberId: e.target.value }))}
                            className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500/50 outline-none transition-all font-bold text-xs text-white placeholder-slate-600"
                            placeholder="Ex: 574090152446131"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">WABA ID (Business ID)</label>
                          <input
                            type="text"
                            value={metaConfig.wabaId}
                            onChange={(e) => setMetaConfig(prev => ({ ...prev, wabaId: e.target.value }))}
                            className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500/50 outline-none transition-all font-bold text-xs text-white placeholder-slate-600"
                            placeholder="ID da conta Business (WABA)"
                          />
                        </div>
                      </div>

                      <button 
                        onClick={handleSaveMeta}
                        disabled={isSavingMeta}
                        className="w-full py-4 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        {isSavingMeta ? <Loader2 size={20} className="animate-spin" /> : <Database size={20} />}
                        Salvar Credenciais Meta
                      </button>
                    </div>
                  </div>
                )}

                {/* Departments Configuration */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Setores Vinculados</h4>
                  <div className="flex flex-wrap gap-2">
                    {departments.map((dept) => {
                      const isSelected = configModal.instance?.departments?.some((d: any) => d.id === dept.id);
                      return (
                        <button
                          key={dept.id}
                          onClick={() => {
                            const currentIds = configModal.instance?.departments?.map((d: any) => d.id) || [];
                            const newIds = isSelected 
                              ? currentIds.filter((id: string) => id !== dept.id)
                              : [...currentIds, dept.id];
                            handleUpdateInstance(configModal.instance.id, { departmentIds: newIds });
                          }}
                          className={cn(
                            "px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                            isSelected 
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/5" 
                              : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10"
                          )}
                        >
                          {dept.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
