'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  GitBranch, 
  Plus, 
  Save, 
  ArrowLeft, 
  MessageSquare, 
  Menu as MenuIcon, 
  UserPlus, 
  Trash2, 
  ChevronRight,
  Settings2,
  Play,
  Type,
  Sparkles,
  Zap,
  Smartphone,
  Globe,
  Check,
  HelpCircle,
  Layout,
  List,
  Settings,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const fetchFlow = useCallback(async () => {
    try {
      const [flowRes, instancesRes, deptsRes] = await Promise.all([
        fetch(`/api/flows/${id}`),
        fetch('/api/whatsapp/instances'),
        fetch('/api/departments')
      ]);
      const data = await flowRes.json();
      const instances = await instancesRes.json();
      const depts = await deptsRes.json();

      setFlow(data);
      setAllInstances(Array.isArray(instances) ? instances : []);
      setDepartments(Array.isArray(depts) ? depts : []);
      // Pré-seleciona instâncias já vinculadas
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

  const toggleInstance = (instanceId: string) => {
    setSelectedInstanceIds(prev =>
      prev.includes(instanceId)
        ? prev.filter(i => i !== instanceId)
        : [...prev, instanceId]
    );
  };

  const addNode = (type: string) => {
    const newNode = {
      id: `new-${Date.now()}`,
      type,
      content: 'Nova mensagem...',
      options: [],
      nextStepId: null
    };
    setFlow({
      ...flow,
      nodes: [...(flow.nodes || []), newNode]
    });
    setSelectedNodeId(newNode.id);
  };

  const updateNode = (nodeId: string, updates: any) => {
    if (!flow?.nodes) return;
    setFlow({
      ...flow,
      nodes: flow.nodes.map((n: any) => n.id === nodeId ? { ...n, ...updates } : n)
    });
  };

  const deleteNode = (nodeId: string) => {
    if (!flow?.nodes || !confirm('Excluir este passo?')) return;
    setFlow({
      ...flow,
      nodes: flow.nodes.filter((n: any) => n.id !== nodeId)
    });
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  if (loading) return <div className="p-8 animate-pulse">Carregando editor...</div>;
  if (!flow) return <div className="p-8">Fluxo não encontrado.</div>;

  const selectedNode = flow.nodes.find((n: any) => n.id === selectedNodeId);

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-[#020617] overflow-hidden">
      {/* Header Premium */}
      <header className="h-20 shrink-0 flex items-center justify-between px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 z-30">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.back()}
            className="group p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
          >
            <ArrowLeft size={20} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>
          <div className="space-y-1">
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{flow.name}</h1>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Editor de Fluxo Ativo</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setFlow({ ...flow, isActive: !flow.isActive })}
            className={cn(
              "flex items-center gap-2.5 px-4 py-2 rounded-xl text-[10px] font-black tracking-wider transition-all border shadow-sm",
              flow.isActive 
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                : "bg-slate-100 text-slate-400 border-slate-200"
            )}
          >
            <div className={cn("w-1.5 h-1.5 rounded-full", flow.isActive ? "bg-emerald-500" : "bg-slate-400")} />
            {flow.isActive ? 'FLUXO ATIVO' : 'INATIVO'}
          </button>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2" />

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            {saving ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div> : <Save size={18} />}
            {saving ? 'Salvando...' : 'Publicar Fluxo'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Esquerda: Configurações & Gatilhos */}
        <aside className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800/60 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="p-6 space-y-8 flex-1">
            {/* Gatilho Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <Zap size={16} className="text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-widest">Gatilho de Entrada</h3>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Palavras-chave</label>
                <input
                  type="text"
                  placeholder="oi, olá, menu..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  value={flow.triggerKeywords || ''}
                  onChange={(e) => setFlow({ ...flow, triggerKeywords: e.target.value })}
                />
                <p className="mt-2 text-[10px] text-slate-500 italic">Separe por vírgula. Deixe vazio para responder qualquer mensagem.</p>
              </div>
            </div>

            {/* Instâncias Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <Smartphone size={16} className="text-blue-500" />
                <h3 className="text-xs font-bold uppercase tracking-widest">Instâncias Ativas</h3>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedInstanceIds([])}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-sm ${
                    selectedInstanceIds.length === 0 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-500/50'
                  }`}
                >
                  <span className="font-medium">Todas as Instâncias</span>
                  {selectedInstanceIds.length === 0 && <Check size={14} />}
                </button>
                
                {allInstances.map((inst: any) => (
                  <button
                    key={inst.id}
                    onClick={() => toggleInstance(inst.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-sm ${
                      selectedInstanceIds.includes(inst.id)
                        ? 'bg-blue-600/10 border-blue-600 text-blue-600' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${inst.status === 'CONNECTED' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className="font-medium">{inst.name}</span>
                    </div>
                    {selectedInstanceIds.includes(inst.id) && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Passos Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <Layout size={16} className="text-purple-500" />
                <h3 className="text-xs font-bold uppercase tracking-widest">Estrutura do Fluxo</h3>
              </div>
              <div className="space-y-2">
                {(flow.nodes || []).map((node: any, idx: number) => (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      selectedNodeId === node.id 
                        ? 'bg-blue-600/5 border-blue-600 shadow-sm shadow-blue-600/5' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      node.type === 'MESSAGE' ? 'bg-blue-500/10 text-blue-500' :
                      node.type === 'MENU' ? 'bg-purple-500/10 text-purple-500' :
                      node.type === 'LIST' ? 'bg-emerald-500/10 text-emerald-500' :
                      'bg-orange-500/10 text-orange-500'
                    }`}>
                      {node.type === 'MESSAGE' ? <MessageSquare size={14} /> : 
                       node.type === 'MENU' ? <List size={14} /> :
                       node.type === 'LIST' ? <Layout size={14} /> :
                       <User size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[10px] font-bold uppercase ${selectedNodeId === node.id ? 'text-blue-600' : 'text-slate-400'}`}>PASSO {idx + 1}</p>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate italic">
                        "{node.content?.substring(0, 30)}..."
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Botões de Ação na base da Sidebar */}
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200/60 dark:border-slate-800/60 grid grid-cols-2 gap-2">
            <button onClick={() => addNode('MESSAGE')} className="flex items-center justify-center gap-2 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold uppercase hover:border-blue-500 transition-all text-slate-600 dark:text-slate-400">
              <MessageSquare size={14} className="text-blue-500" /> Mensagem
            </button>
            <button onClick={() => addNode('MENU')} className="flex items-center justify-center gap-2 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold uppercase hover:border-purple-500 transition-all text-slate-600 dark:text-slate-400">
              <List size={14} className="text-purple-500" /> Menu
            </button>
            <button onClick={() => addNode('LIST')} className="flex items-center justify-center gap-2 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold uppercase hover:border-emerald-500 transition-all text-slate-600 dark:text-slate-400">
              <Layout size={14} className="text-emerald-500" /> Lista Wpp
            </button>
            <button onClick={() => addNode('TRANSFER')} className="flex items-center justify-center gap-2 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold uppercase hover:border-orange-500 transition-all text-slate-600 dark:text-slate-400">
              <User size={14} className="text-orange-500" /> Humano
            </button>
          </div>
        </aside>

        {/* Workspace Central */}
        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 relative bg-slate-50 dark:bg-[#020617] p-12 overflow-y-auto custom-scrollbar">
            {selectedNode ? (
              <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-600 shadow-xl shadow-blue-600/20 flex items-center justify-center text-white">
                      <Settings size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Configurar Passo</h2>
                      <p className="text-sm text-slate-500 font-medium">Defina o comportamento deste ponto do fluxo</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (confirm('Deseja excluir este passo?')) {
                        setFlow({ ...flow, nodes: flow.nodes.filter((n: any) => n.id !== selectedNode.id) });
                        setSelectedNodeId(null);
                      }
                    }}
                    className="p-3 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Card de Configuração */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-sm space-y-8">
                    <div className="space-y-4">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo de Ação</label>
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { id: 'MESSAGE', label: 'Mensagem', icon: MessageSquare, color: 'blue' },
                          { id: 'MENU', label: 'Menu Texto', icon: List, color: 'purple' },
                          { id: 'LIST', label: 'Lista Wpp', icon: Layout, color: 'emerald' },
                          { id: 'TRANSFER', label: 'Humano', icon: User, color: 'orange' }
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => updateNode(selectedNode.id, { type: t.id })}
                            className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                              selectedNode.type === t.id 
                                ? `bg-${t.color}-500/5 border-${t.color}-500 text-${t.color}-600` 
                                : 'bg-transparent border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-200'
                            }`}
                          >
                            <t.icon size={22} />
                            <span className="text-[10px] font-bold uppercase tracking-tight">{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {selectedNode.type === 'TRANSFER' ? 'Mensagem de Transferência' : 'Conteúdo da Mensagem'}
                      </label>
                      <textarea
                        className="w-full p-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm min-h-[120px] focus:ring-2 focus:ring-blue-500/20 transition-all outline-none leading-relaxed"
                        placeholder="Ex: Olá! Como posso te ajudar hoje?"
                        value={selectedNode.content}
                        onChange={(e) => updateNode(selectedNode.id, { content: e.target.value })}
                      />
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] text-slate-400 font-medium italic">Dica: Use {"{{nome}}"} para personalizar com o nome do cliente.</span>
                      </div>
                    </div>

                    {(selectedNode.type === 'MENU' || selectedNode.type === 'LIST') && (
                      <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {selectedNode.type === 'LIST' ? 'Itens da Lista Interativa' : 'Opções do Menu Numérico'}
                          </label>
                        </div>
                        <div className="space-y-3">
                          {selectedNode.options?.map((opt: any, idx: number) => (
                            <div key={idx} className="flex gap-3 items-center group">
                              <div className="flex-1 grid grid-cols-12 gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 group-hover:border-blue-500/30 transition-all">
                                <div className="col-span-2">
                                  <label className="block text-[9px] font-bold text-slate-400 mb-1">CHAVE</label>
                                  <input
                                    type="text"
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-center"
                                    value={opt.keyword}
                                    onChange={(e) => {
                                      const newOpts = [...selectedNode.options];
                                      newOpts[idx].keyword = e.target.value;
                                      updateNode(selectedNode.id, { options: newOpts });
                                    }}
                                  />
                                </div>
                                <div className="col-span-5">
                                  <label className="block text-[9px] font-bold text-slate-400 mb-1">TEXTO DA OPÇÃO</label>
                                  <input
                                    type="text"
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs"
                                    value={opt.label}
                                    onChange={(e) => {
                                      const newOpts = [...selectedNode.options];
                                      newOpts[idx].label = e.target.value;
                                      updateNode(selectedNode.id, { options: newOpts });
                                    }}
                                  />
                                </div>
                                <div className="col-span-5">
                                  <label className="block text-[9px] font-bold text-slate-400 mb-1">PRÓXIMO PASSO</label>
                                  <select 
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs outline-none"
                                    value={opt.targetNodeId}
                                    onChange={(e) => {
                                      const newOpts = [...selectedNode.options];
                                      newOpts[idx].targetNodeId = e.target.value;
                                      updateNode(selectedNode.id, { options: newOpts });
                                    }}
                                  >
                                    <option value="">Encerrar / Aguardar</option>
                                    {flow.nodes.filter((n: any) => n.id !== selectedNode.id).map((n: any, nIdx: number) => (
                                      <option key={n.id} value={n.id}>Passo {nIdx + 1}: {n.content.substring(0, 20)}...</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <button 
                                onClick={() => {
                                  const newOpts = selectedNode.options.filter((_: any, i: number) => i !== idx);
                                  updateNode(selectedNode.id, { options: newOpts });
                                }}
                                className="p-2 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button 
                          onClick={() => {
                            const nextKeyword = (selectedNode.options?.length || 0) + 1;
                            const newOpts = [...(selectedNode.options || []), { keyword: String(nextKeyword), label: 'Nova Opção', targetNodeId: '' }];
                            updateNode(selectedNode.id, { options: newOpts });
                          }}
                          className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs font-bold hover:border-blue-500 hover:text-blue-500 hover:bg-blue-500/5 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus size={16} /> Adicionar Opção
                        </button>
                      </div>
                    )}

                    {selectedNode.type === 'TRANSFER' && (
                      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Setor de Destino</label>
                        <select 
                          className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm outline-none"
                          value={selectedNode.routingDepartmentId || ''}
                          onChange={(e) => updateNode(selectedNode.id, { routingDepartmentId: e.target.value })}
                        >
                          <option value="">Fila Geral (Nenhum setor específico)</option>
                          {departments?.map((dept: any) => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {selectedNode.type === 'MESSAGE' && (
                      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Próxima Ação Automática</label>
                        <select 
                          className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm outline-none"
                          value={selectedNode.nextStepId || ''}
                          onChange={(e) => updateNode(selectedNode.id, { nextStepId: e.target.value })}
                        >
                          <option value="">Aguardar resposta do usuário</option>
                          {flow.nodes.filter((n: any) => n.id !== selectedNode.id).map((n: any, nIdx: number) => (
                            <option key={n.id} value={n.id}>Passo {nIdx + 1}: {n.content.substring(0, 25)}...</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-2xl shadow-blue-600/30">
                  <Zap size={44} className="text-white" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Crie sua jornada...</h3>
                  <p className="text-slate-500 text-lg font-medium leading-relaxed">
                    Escolha um passo na barra lateral para editar ou comece um novo clicando nos botões de ação.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 w-full pt-8">
                  <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-left shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4">
                      <Layout size={20} />
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">Novidade: Listas Wpp</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Use mensagens interativas para uma experiência premium no WhatsApp.</p>
                  </div>
                  <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-left shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4">
                      <Zap size={20} />
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">Gatilhos Inteligentes</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Configure palavras-chave para disparar este fluxo automaticamente.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Direita: Tutorial & Ajuda */}
          <aside className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200/60 dark:border-slate-800/60 overflow-y-auto custom-scrollbar">
            <div className="p-8 space-y-10">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <HelpCircle size={18} className="text-blue-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Guia Rápido</h3>
                </div>
                
                <div className="space-y-6">
                  <section className="space-y-3">
                    <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">Variáveis Dinâmicas</h4>
                    <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-2">
                      <code className="text-xs font-mono text-blue-600 font-bold">{"{{nome}}"}</code>
                      <p className="text-[10px] text-slate-500 leading-relaxed">Insira o nome do cliente automaticamente na mensagem.</p>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">Tipos de Nós</h4>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                        <div>
                          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Mensagem</p>
                          <p className="text-[10px] text-slate-500 italic">Texto simples que segue para o próximo passo ou encerra.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-purple-500 mt-1 shrink-0" />
                        <div>
                          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Menu Texto</p>
                          <p className="text-[10px] text-slate-500 italic">Envia opções numeradas e aguarda o número correspondente.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                        <div>
                          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Lista Wpp</p>
                          <p className="text-[10px] text-slate-500 italic">Menu interativo nativo do WhatsApp (Mais profissional).</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">Nível Desenvolvedor</h4>
                    <div className="p-5 rounded-2xl bg-slate-900 text-slate-300 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <Smartphone size={14} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Multi-Instância</span>
                      </div>
                      <p className="text-[10px] leading-relaxed">Você pode vincular este fluxo a instâncias específicas na barra lateral esquerda. Se não selecionar nenhuma, o fluxo será **Global**.</p>
                      
                      <div className="flex items-center gap-2 text-blue-400 pt-2">
                        <Zap size={14} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Gatilhos</span>
                      </div>
                      <p className="text-[10px] leading-relaxed">Se o gatilho estiver vazio, o bot iniciará no primeiro contato de qualquer usuário novo.</p>
                    </div>
                  </section>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white space-y-3 shadow-xl shadow-blue-600/20">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Suporte Técnico</p>
                <p className="text-xs font-medium leading-relaxed">Precisa de ajuda para criar integrações avançadas?</p>
                <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-xl text-[10px] font-bold transition-all uppercase">Documentação API</button>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
