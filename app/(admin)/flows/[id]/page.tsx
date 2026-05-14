'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, Smartphone, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

// Sub-componentes
import FlowHeader from '@/components/flows/FlowHeader';
import FlowSidebar from '@/components/flows/FlowSidebar';
import NodeEditor from '@/components/flows/NodeEditor';
import FlowSettings from '@/components/flows/FlowSettings';

export default function FlowEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const [flow, setFlow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [allInstances, setAllInstances] = useState<any[]>([]);
  const [selectedInstanceIds, setSelectedInstanceIds] = useState<string[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [allFlows, setAllFlows] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const fetchFlow = useCallback(async () => {
    try {
      const [flowRes, instancesRes, deptsRes, integRes, flowsRes] = await Promise.all([
        fetch(`/api/flows/${id}`),
        fetch('/api/whatsapp/instances'),
        fetch('/api/departments'),
        fetch('/api/integrations'),
        fetch('/api/flows')
      ]);
      const data = await flowRes.json();
      const instances = await instancesRes.json();
      const depts = await deptsRes.json();
      const integs = await integRes.json();
      const flows = await flowsRes.json();

      setFlow(data);
      setAllInstances(Array.isArray(instances) ? instances : []);
      setDepartments(Array.isArray(depts) ? depts : []);
      setIntegrations(Array.isArray(integs) ? integs : []);
      setAllFlows(Array.isArray(flows) ? flows.filter((f: any) => f.id !== id) : []);
      
      if (data.instances?.length > 0) {
        setSelectedInstanceIds(data.instances.map((i: any) => i.id));
      }
      if (data.nodes?.length > 0 && !selectedNodeId) {
        setSelectedNodeId(data.nodes[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchFlow();
  }, [fetchFlow]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/flows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...flow, instanceIds: selectedInstanceIds })
      });
      if (res.ok) {
        const updatedFlow = await res.json();
        setFlow(updatedFlow);
        if (updatedFlow.instances) {
          setSelectedInstanceIds(updatedFlow.instances.map((i: any) => i.id));
        }
        if (selectedNodeId?.startsWith('new-')) {
          const firstNode = updatedFlow.nodes?.[0];
          if (firstNode) setSelectedNodeId(firstNode.id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const addNode = (type: string) => {
    const newNode = {
      id: `new-${Date.now()}`,
      type,
      content: '',
      flowId: id as string,
      options: []
    };
    setFlow({ ...flow, nodes: [...(flow.nodes || []), newNode] });
    setSelectedNodeId(newNode.id);
  };

  const updateNode = (nodeId: string, data: any) => {
    setFlow({
      ...flow,
      nodes: flow.nodes.map((n: any) => n.id === nodeId ? { ...n, ...data } : n)
    });
  };

  const deleteNode = (nodeId: string) => {
    if (confirm('Deseja realmente excluir este passo?')) {
      setFlow({ ...flow, nodes: flow.nodes.filter((n: any) => n.id !== nodeId) });
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#020617]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Iniciando Editor...</p>
        </div>
      </div>
    );
  }

  const selectedNode = flow.nodes?.find((n: any) => n.id === selectedNodeId);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#020617]">
      <FlowHeader 
        flow={flow}
        saving={saving}
        onSave={handleSave}
        instances={allInstances}
        selectedInstanceIds={selectedInstanceIds}
        onInstanceToggle={(iid) => {
          setSelectedInstanceIds(prev => 
            prev.includes(iid) ? prev.filter(id => id !== iid) : [...prev, iid]
          );
        }}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <FlowSidebar 
          nodes={flow.nodes || []}
          selectedNodeId={selectedNodeId}
          onSelectNode={(id) => {
            setSelectedNodeId(id);
            setSidebarOpen(false); // Fecha ao selecionar no mobile
          }}
          onAddNode={addNode}
          onReorder={(newNodes) => setFlow({ ...flow, nodes: newNodes })}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Overlay para mobile quando sidebar aberta */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
            />
          )}
        </AnimatePresence>

        <main className="flex-1 relative overflow-hidden bg-slate-950">
          {/* Background Pattern */}
          <div 
            className="absolute inset-0 z-0 opacity-[0.2]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #334155 1.5px, transparent 0)`,
              backgroundSize: '32px 32px'
            }}
          />
          
          <div className="relative p-0 h-full w-full custom-scrollbar overflow-y-auto">
            <AnimatePresence mode="wait">
              {selectedNode ? (
                <motion.div
                  key={selectedNode.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="min-h-full"
                >
                  <NodeEditor 
                    node={selectedNode}
                    nodes={flow.nodes}
                    allFlows={allFlows}
                    departments={departments}
                    integrations={integrations}
                    allInstances={allInstances}
                    selectedInstanceIds={selectedInstanceIds}
                    onUpdate={updateNode}
                    onDelete={deleteNode}
                  />
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="min-h-full flex flex-col items-center justify-center text-center max-w-4xl mx-auto space-y-8 md:space-y-12 py-12 md:py-20 px-6"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-600/20 blur-3xl rounded-full" />
                    <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-2xl shadow-blue-600/30">
                      <Zap size={32} className="md:size-[50px] text-white" />
                    </div>
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    <h3 className="text-2xl md:text-4xl font-black text-white tracking-tight">Desenhe sua Automação</h3>
                    <p className="text-slate-500 text-base md:text-xl font-medium leading-relaxed max-w-lg mx-auto">
                      Selecione um passo na lateral para configurar ou adicione novos componentes para expandir seu fluxo.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full pt-6 md:pt-10">
                    <div className="p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] bg-slate-900 border border-slate-800 text-left shadow-2xl hover:border-blue-500/50 transition-all group">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                        <Sparkles size={22} />
                      </div>
                      <h4 className="font-bold text-slate-100 mb-1.5 md:mb-2 text-base md:text-lg">IA Nativa</h4>
                      <p className="text-[10px] md:text-xs text-slate-500 leading-relaxed font-black">Conecte Dify ou n8n para processar dados e criar fluxos inteligentes.</p>
                    </div>
                    <div className="p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] bg-slate-900 border border-slate-800 text-left shadow-2xl hover:border-emerald-500/50 transition-all group">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                        <Smartphone size={22} />
                      </div>
                      <h4 className="font-bold text-slate-100 mb-1.5 md:mb-2 text-base md:text-lg">Omnichannel</h4>
                      <p className="text-[10px] md:text-xs text-slate-500 leading-relaxed font-black">Um único fluxo para todas as suas instâncias de WhatsApp.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      <FlowSettings 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        flow={flow}
        departments={departments}
        onUpdate={(data) => setFlow({ ...flow, ...data })}
      />
    </div>
  );
}
