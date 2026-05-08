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
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-[#020617]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Iniciando Editor...</p>
        </div>
      </div>
    );
  }

  const selectedNode = flow.nodes?.find((n: any) => n.id === selectedNodeId);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-[#020617]">
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
              className="absolute inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
            />
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
          
          <div className="relative p-0 min-h-full w-full">
            <AnimatePresence mode="wait">
              {selectedNode ? (
                <motion.div
                  key={selectedNode.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <NodeEditor 
                    node={selectedNode}
                    nodes={flow.nodes}
                    allFlows={allFlows}
                    departments={departments}
                    integrations={integrations}
                    onUpdate={updateNode}
                    onDelete={deleteNode}
                  />
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-10 mt-20"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-600/20 blur-3xl rounded-full" />
                    <div className="relative w-28 h-28 rounded-[2.5rem] bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-2xl shadow-blue-600/30">
                      <Zap size={50} className="text-white" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Desenhe sua Automação</h3>
                    <p className="text-slate-500 text-xl font-medium leading-relaxed max-w-lg mx-auto">
                      Selecione um passo na lateral para configurar ou use os botões de componentes para expandir seu fluxo.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full pt-10">
                    <div className="p-8 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 text-left shadow-sm hover:border-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-500/5 group">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Sparkles size={24} />
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2 text-lg">IA Nativa</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">Conecte n8n ou Dify para processar dados em tempo real e criar fluxos inteligentes.</p>
                    </div>
                    <div className="p-8 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 text-left shadow-sm hover:border-emerald-500/50 transition-all hover:shadow-xl hover:shadow-emerald-500/5 group">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Smartphone size={24} />
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2 text-lg">Omnichannel</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">Um único fluxo para todas as suas instâncias, mantendo a consistência no atendimento.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
