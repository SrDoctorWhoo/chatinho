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
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FlowEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const [flow, setFlow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const fetchFlow = useCallback(async () => {
    try {
      const res = await fetch(`/api/flows/${id}`);
      const data = await res.json();
      setFlow(data);
      // Só seleciona o primeiro nó se ainda não houver nenhum selecionado
      if (data.nodes?.length > 0 && !selectedNodeId) {
        setSelectedNodeId(data.nodes[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]); // Removido selectedNodeId daqui para evitar loops de recarregamento

  useEffect(() => {
    fetchFlow();
  }, [fetchFlow]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/flows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flow)
      });
      if (res.ok) {
        const updatedFlow = await res.json();
        setFlow(updatedFlow);
        // Se o nó selecionado era um "new-", atualiza para o ID real
        if (selectedNodeId?.startsWith('new-')) {
          // Tenta achar o nó correspondente na mesma posição (já que deletamos e recriamos na ordem)
          // Ou simplesmente seleciona o primeiro nó novo se houver dúvida.
          // Por simplicidade e segurança, vamos apenas manter a seleção se o ID bater ou selecionar o primeiro.
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
    <div className="h-[calc(100vh-120px)] flex flex-col bg-slate-50 dark:bg-slate-950 -m-8 overflow-hidden">
      {/* Top Bar */}
      <div className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">{flow.name}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Editando fluxo de automação</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setFlow({ ...flow, isActive: !flow.isActive })}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black tracking-wider transition-all border",
              flow.isActive 
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20" 
                : "bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/20"
            )}
          >
            <Play size={10} fill="currentColor" className={cn(!flow.isActive && "opacity-50")} />
            {flow.isActive ? 'ATIVO' : 'INATIVO'}
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Salvando...' : 'Salvar Fluxo'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Node List */}
        <div className="w-80 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Configuração Inicial</h3>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-600">
                <Sparkles size={14} />
                <span className="text-[10px] font-black uppercase tracking-wider">Gatilho de Entrada</span>
              </div>
              <input 
                type="text"
                value={flow.triggerKeywords || ''}
                onChange={(e) => setFlow({ ...flow, triggerKeywords: e.target.value })}
                placeholder="Ex: oi, ola, menu"
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
              <p className="text-[9px] text-slate-500 leading-relaxed italic">
                Deixe vazio para responder a qualquer mensagem. Use vírgulas para separar palavras.
              </p>
            </div>
          </div>

          <div className="p-4 border-t border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Passos do Fluxo</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {(flow.nodes || []).map((node: any, idx: number) => (
              <button
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-2xl transition-all border text-left group",
                  selectedNodeId === node.id 
                    ? "bg-blue-600/5 border-blue-600/20 text-blue-600" 
                    : "bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  node.type === 'MESSAGE' ? "bg-indigo-500/10 text-indigo-500" :
                  node.type === 'MENU' ? "bg-amber-500/10 text-amber-500" :
                  node.type === 'TRANSFER' ? "bg-emerald-500/10 text-emerald-500" :
                  "bg-slate-500/10 text-slate-500"
                )}>
                  {node.type === 'MESSAGE' ? <MessageSquare size={16} /> :
                   node.type === 'MENU' ? <MenuIcon size={16} /> :
                   node.type === 'TRANSFER' ? <UserPlus size={16} /> :
                   <Type size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold opacity-50 uppercase">PASSO {idx + 1}</p>
                  <p className="text-sm font-semibold truncate">{node.content || 'Sem conteúdo'}</p>
                </div>
                <ChevronRight size={16} className={cn(
                  "transition-all",
                  selectedNodeId === node.id ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                )} />
              </button>
            ))}
            
            <div className="pt-4 grid grid-cols-2 gap-2">
              <button 
                onClick={() => addNode('MESSAGE')}
                className="flex flex-col items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-blue-600/10 hover:text-blue-600 rounded-2xl transition-all border border-dashed border-slate-300 dark:border-slate-700"
              >
                <MessageSquare size={18} />
                <span className="text-[10px] font-bold">MENSAGEM</span>
              </button>
              <button 
                onClick={() => addNode('MENU')}
                className="flex flex-col items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-blue-600/10 hover:text-blue-600 rounded-2xl transition-all border border-dashed border-slate-300 dark:border-slate-700"
              >
                <MenuIcon size={18} />
                <span className="text-[10px] font-bold">MENU</span>
              </button>
              <button 
                onClick={() => addNode('TRANSFER')}
                className="flex flex-col items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-blue-600/10 hover:text-blue-600 rounded-2xl transition-all border border-dashed border-slate-300 dark:border-slate-700"
              >
                <UserPlus size={18} />
                <span className="text-[10px] font-bold">TRANSBORDO</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content: Node Editor */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-8">
          {selectedNode ? (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
                    <Settings2 size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Configurar Passo</h2>
                    <p className="text-sm text-slate-500">Defina o que o bot deve fazer aqui</p>
                  </div>
                </div>
                <button 
                  onClick={() => deleteNode(selectedNode.id)}
                  className="p-3 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="glass-card p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tipo de Ação</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['MESSAGE', 'MENU', 'TRANSFER'].map((type) => (
                      <button
                        key={type}
                        onClick={() => updateNode(selectedNode.id, { type })}
                        className={cn(
                          "py-3 px-4 rounded-2xl border-2 transition-all font-bold text-xs flex flex-col items-center gap-2",
                          selectedNode.type === type 
                            ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20" 
                            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 hover:border-blue-600/30"
                        )}
                      >
                        {type === 'MESSAGE' ? <MessageSquare size={18} /> :
                         type === 'MENU' ? <MenuIcon size={18} /> :
                         <UserPlus size={18} />}
                        {type === 'MESSAGE' ? 'Mensagem' :
                         type === 'MENU' ? 'Menu' : 'Humano'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Conteúdo da Mensagem</label>
                  <textarea
                    value={selectedNode.content}
                    onChange={(e) => updateNode(selectedNode.id, { content: e.target.value })}
                    className="w-full p-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 dark:text-slate-200 min-h-[150px] transition-all"
                    placeholder="Olá! Como posso ajudar?"
                  />
                </div>

                {selectedNode.type === 'MENU' && (
                  <div className="space-y-4 pt-4">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Opções do Menu</label>
                    {selectedNode.options?.map((opt: any, idx: number) => (
                      <div key={idx} className="flex gap-3 items-start">
                        <input
                          type="text"
                          placeholder="Chave (ex: 1)"
                          className="w-20 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                          value={opt.keyword}
                          onChange={(e) => {
                            const newOpts = [...selectedNode.options];
                            newOpts[idx].keyword = e.target.value;
                            updateNode(selectedNode.id, { options: newOpts });
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Texto da Opção"
                          className="flex-1 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                          value={opt.label}
                          onChange={(e) => {
                            const newOpts = [...selectedNode.options];
                            newOpts[idx].label = e.target.value;
                            updateNode(selectedNode.id, { options: newOpts });
                          }}
                        />
                        <select 
                          className="w-40 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                          value={opt.targetNodeId}
                          onChange={(e) => {
                            const newOpts = [...selectedNode.options];
                            newOpts[idx].targetNodeId = e.target.value;
                            updateNode(selectedNode.id, { options: newOpts });
                          }}
                        >
                          <option value="">Próximo Passo...</option>
                          {flow.nodes.filter((n: any) => n.id !== selectedNode.id).map((n: any) => (
                            <option key={n.id} value={n.id}>{n.content.substring(0, 20)}...</option>
                          ))}
                        </select>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        const newOpts = [...(selectedNode.options || []), { keyword: '', label: '', targetNodeId: '' }];
                        updateNode(selectedNode.id, { options: newOpts });
                      }}
                      className="flex items-center gap-2 text-blue-600 text-xs font-bold hover:underline py-2"
                    >
                      <Plus size={14} /> Adicionar Opção
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
              <div className="w-24 h-24 rounded-full bg-blue-600/5 flex items-center justify-center border border-blue-600/10 mb-2">
                <Zap size={40} className="text-blue-600/40" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Editor de Automação</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Selecione um passo na lista à esquerda para editar o que o bot deve responder, ou crie um novo passo usando os botões abaixo.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 w-full pt-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-left">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
                    <Sparkles size={16} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Gatilho</h4>
                  <p className="text-[10px] text-slate-500">Defina quais palavras iniciam este bot.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-left">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center mb-3">
                    <GitBranch size={16} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Passos</h4>
                  <p className="text-[10px] text-slate-500">Crie menus ou mensagens automáticas.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
