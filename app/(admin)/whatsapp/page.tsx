'use client';

import { useState, useEffect } from 'react';
import { Smartphone, Plus, RefreshCw, Trash2, CheckCircle2, XCircle, QrCode, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WhatsappPage() {
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [qrModal, setQrModal] = useState<{ isOpen: boolean; qr: string | null; instanceId: string | null }>({
    isOpen: false,
    qr: null,
    instanceId: null
  });

  const fetchInstances = async () => {
    try {
      const res = await fetch('/api/instances');
      const data = await res.json();
      setInstances(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstances();
  }, []);

  const handleCreateInstance = async () => {
    if (!newInstanceName) return;
    try {
      const res = await fetch('/api/instances', {
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
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (qrModal.isOpen && qrModal.instanceId) {
      const checkQr = async () => {
        try {
          const res = await fetch(`/api/instances/${qrModal.instanceId}/qr`);
          const data = await res.json();
          
          if (data.code && data.code !== qrModal.qr) {
            setQrModal(prev => ({ ...prev, qr: data.code }));
          }
          
          // If status becomes connected, close modal and refresh
          if (data.status === 'CONNECTED') {
            setQrModal({ isOpen: false, qr: null, instanceId: null });
            fetchInstances();
          }
        } catch (err) {
          console.error('Erro ao buscar QR:', err);
        }
      };

      checkQr();
      interval = setInterval(checkQr, 3000); // Polling every 3 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [qrModal.isOpen, qrModal.instanceId, qrModal.qr]);

  const handleConnect = async (instance: any) => {
    setQrModal({ isOpen: true, qr: null, instanceId: instance.id });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">WhatsApp</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie suas instâncias e conexões.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
        >
          <Plus size={20} />
          Nova Instância
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-6 rounded-3xl animate-pulse h-48 bg-slate-200/50 dark:bg-slate-800/50" />
          ))
        ) : instances.length === 0 ? (
          <div className="col-span-full py-20 text-center glass-card rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <Smartphone className="mx-auto text-slate-300 dark:text-slate-700 mb-4" size={48} />
            <p className="text-slate-500 dark:text-slate-400">Nenhuma instância criada. Comece criando uma nova!</p>
          </div>
        ) : (
          instances.map((instance) => (
            <div key={instance.id} className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 rounded-2xl bg-blue-600/10 text-blue-600">
                  <Smartphone size={24} />
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5",
                  instance.status === 'CONNECTED' 
                    ? "bg-emerald-500/10 text-emerald-600" 
                    : "bg-red-500/10 text-red-600"
                )}>
                  {instance.status === 'CONNECTED' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  {instance.status === 'CONNECTED' ? 'CONECTADO' : 'DESCONECTADO'}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{instance.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{instance.instanceId}</p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                {instance.status !== 'CONNECTED' && (
                  <button 
                    onClick={() => handleConnect(instance)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all"
                  >
                    <QrCode size={16} />
                    Conectar
                  </button>
                )}
                <button 
                  onClick={fetchInstances}
                  className="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"
                >
                  <RefreshCw size={20} />
                </button>
                <button className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all ml-auto">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Instance Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-8 rounded-3xl shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Nova Instância</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nome da Instância
                </label>
                <input
                  type="text"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex: Suporte"
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
                  onClick={handleCreateInstance}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20"
                >
                  Criar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm p-8 rounded-3xl shadow-2xl flex flex-col items-center">
            <div className="w-full flex justify-end mb-2">
              <button onClick={() => setQrModal({ isOpen: false, qr: null, instanceId: null })}>
                <X size={20} className="text-slate-400 hover:text-white" />
              </button>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center">Conectar WhatsApp</h2>
            <div className="bg-white p-4 rounded-2xl mb-6 shadow-inner">
              {qrModal.qr ? (
                <img src={qrModal.qr} alt="QR Code" className="w-48 h-48" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-slate-100 animate-pulse rounded-xl">
                  <RefreshCw className="animate-spin text-slate-400" size={32} />
                </div>
              )}
            </div>
            <p className="text-sm text-slate-500 text-center leading-relaxed">
              Abra o WhatsApp no seu celular, toque em <span className="font-bold">Aparelhos conectados</span> e aponte a câmera para este código.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
