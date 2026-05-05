'use client';

import { useState, useEffect } from 'react';
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
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WhatsappPage() {
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [qrModal, setQrModal] = useState<{ isOpen: boolean; qr: string | null; instanceId: string | null }>({
    isOpen: false,
    qr: null,
    instanceId: null
  });

  const fetchInstances = async () => {
    try {
      const res = await fetch('/api/whatsapp/instances');
      const data = await res.json();
      setInstances(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/whatsapp/instances/sync', { method: 'POST' });
      if (res.ok) {
        await fetchInstances();
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchInstances();
  }, []);

  const handleCreateInstance = async () => {
    if (!newInstanceName) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/whatsapp/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newInstanceName })
      });
      if (res.ok) {
        setNewInstanceName('');
        setShowCreateModal(false);
        fetchInstances();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

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
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <Zap size={24} />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white">
              WhatsApp <span className="text-emerald-400">Hub</span>
            </h1>
          </div>
          <p className="text-lg text-slate-400 max-w-2xl font-medium leading-relaxed">
            Gerencie múltiplas instâncias da Evolution API com sincronização em tempo real e controle total.
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
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500",
                    instance.status === 'CONNECTED' 
                      ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" 
                      : "bg-white/5 text-slate-500"
                  )}>
                    <Smartphone size={32} strokeWidth={2.5} />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-white tracking-tighter leading-none">
                      {instance.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <ShieldCheck size={14} className="text-emerald-500" />
                      ID: {instance.instanceId}
                    </div>
                  </div>
                </div>

                <div className={cn(
                  "px-4 py-2 rounded-full text-[10px] font-black flex items-center gap-2 border shadow-lg backdrop-blur-md",
                  instance.status === 'CONNECTED' 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                    : instance.status === 'QRCODE'
                    ? "bg-orange-500/10 text-orange-400 border-orange-500/20 animate-pulse"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                )}>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    instance.status === 'CONNECTED' ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : instance.status === 'QRCODE' ? "bg-orange-400" : "bg-red-400"
                  )} />
                  {instance.status === 'CONNECTED' ? 'ONLINE' : instance.status === 'QRCODE' ? 'AGUARDANDO SCAN' : 'OFFLINE'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-auto">
                {instance.status !== 'CONNECTED' ? (
                  <button 
                    onClick={() => handleConnect(instance)}
                    className="col-span-2 group/btn flex items-center justify-center gap-3 py-4.5 bg-white text-slate-950 font-black rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/5"
                  >
                    <QrCode size={20} />
                    Conectar Agora
                  </button>
                ) : (
                  <div className="col-span-2 py-4 px-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                      <Clock size={14} /> Conexão Estável
                    </span>
                    <div className="flex gap-2">
                       <button className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all">
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  </div>
                )}
                
                <button 
                  onClick={() => handleDeleteInstance(instance.id, instance.name)}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-white/5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 font-bold rounded-2xl transition-all"
                >
                  <Trash2 size={18} />
                  Remover
                </button>
                <button 
                  onClick={fetchInstances}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-white/5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 font-bold rounded-2xl transition-all"
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
          <div className="relative w-full max-w-md bg-slate-900 rounded-[3rem] shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-12">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-black text-white tracking-tighter">Nova <span className="text-emerald-400">Instância</span></h2>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-slate-500 hover:text-white transition-colors"
                >
                  <X size={28} />
                </button>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Identificador da Conta</label>
                  <input
                    type="text"
                    value={newInstanceName}
                    onChange={(e) => setNewInstanceName(e.target.value)}
                    className="block w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 outline-none transition-all font-bold text-white placeholder-slate-600"
                    placeholder="Ex: Comercial, Suporte..."
                    disabled={isCreating}
                  />
                </div>
                
                <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                  <p className="text-xs text-emerald-400 leading-relaxed font-bold">
                    <span className="uppercase tracking-widest text-[9px] block mb-1 opacity-50">Dica Profissional</span>
                    Use nomes curtos e sem espaços para melhor organização na sua infraestrutura de atendimento.
                  </p>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleCreateInstance}
                    disabled={isCreating || !newInstanceName}
                    className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 text-slate-950 font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-3 text-lg"
                  >
                    {isCreating ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} />}
                    {isCreating ? 'Provisionando...' : 'Confirmar Criação'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl animate-in fade-in duration-500" />
          <div className="relative w-full max-w-sm bg-slate-900 rounded-[4rem] shadow-2xl border border-white/5 overflow-hidden animate-in zoom-in-95 duration-700">
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
    </div>
  );
}
