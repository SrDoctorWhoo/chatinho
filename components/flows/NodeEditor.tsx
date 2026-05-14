'use client';

import { 
  Trash2, 
  MessageSquare, 
  List, 
  Layout, 
  Type, 
  Bot, 
  User, 
  Variable,
  Globe,
  Plus,
  ArrowRight,
  Sparkles,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import IntegrationSandbox from './IntegrationSandbox';
import NextStepSelector from './NextStepSelector';

interface NodeEditorProps {
  node: any;
  nodes: any[];
  allFlows: any[];
  departments: any[];
  integrations: any[];
  allInstances: any[];
  selectedInstanceIds: string[];
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
}

export default function NodeEditor({ 
  node, 
  nodes, 
  allFlows, 
  departments, 
  integrations, 
  allInstances = [],
  selectedInstanceIds = [],
  onUpdate, 
  onDelete 
}: NodeEditorProps) {
  
  if (!node) return null;

  const nodeTypes = [
    { id: 'MESSAGE', label: 'Mensagem', icon: MessageSquare, color: 'blue' },
    { id: 'MENU', label: 'Menu de Opções', icon: List, color: 'purple' },
    { id: 'LIST', label: 'Lista Dinâmica', icon: Layout, color: 'emerald' },
    { id: 'WAIT_INPUT', label: 'Coletar Dados', icon: Type, color: 'amber' },
    { id: 'AI_DIFY', label: 'IA & Webhook', icon: Bot, color: 'indigo' },
    { id: 'TRANSFER', label: 'Transferência', icon: User, color: 'orange' }
  ];

  const currentType = nodeTypes.find(t => t.id === node.type) || nodeTypes[0];

  const insertVariable = (variable: string) => {
    onUpdate(node.id, { content: (node.content || '') + variable });
  };

  const getPayloadMapping = () => {
    try {
      return JSON.parse(node.payloadMapping || '{}');
    } catch (e) {
      return {};
    }
  };

  const updatePayloadMapping = (newMapping: any) => {
    onUpdate(node.id, { payloadMapping: JSON.stringify(newMapping) });
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-8 px-4 md:px-6 max-w-7xl mx-auto">
      {/* Header do Editor */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-4 md:p-5 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl">
        <div className="flex items-center gap-4 md:gap-5">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "w-12 h-12 md:w-14 md:h-14 rounded-xl shadow-lg flex items-center justify-center text-white shrink-0 relative overflow-hidden group",
              `bg-${currentType.color}-600`
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
            <currentType.icon size={24} className="relative z-10 group-hover:scale-110 transition-transform" />
          </motion.div>
          
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className={cn(
                "px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-[0.2em]",
                `bg-${currentType.color}-500/20 text-${currentType.color}-400 border border-${currentType.color}-500/20`
              )}>
                {currentType.label}
              </span>
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">ID: {node.id}</span>
            </div>
            <h2 className="text-lg md:text-xl font-black text-white tracking-tight">
              {node.title || currentType.label}
            </h2>
          </div>
        </div>

        <button
          onClick={() => onDelete(node.id)}
          className="p-2.5 rounded-lg bg-slate-950 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 transition-all border border-slate-800 hover:border-rose-500/30 group self-end md:self-center"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* Painel de Configuração */}
        <div className="xl:col-span-8 space-y-4">
          <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden shadow-lg">
            <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Type size={14} />
              </div>
              <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Conteúdo</h3>
            </div>
            
            <div className="p-5 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Título Interno</label>
                <input
                  type="text"
                  value={node.title || ''}
                  onChange={(e) => onUpdate(node.id, { title: e.target.value })}
                  placeholder="Ex: Saudação Inicial"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white placeholder:text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                />
              </div>

              {node.type === 'MESSAGE' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Corpo da Mensagem</label>
                      <Variable size={12} className="text-blue-500" />
                    </div>
                    <div className="group relative">
                      <textarea
                        value={node.content}
                        onChange={(e) => onUpdate(node.id, { content: e.target.value })}
                        placeholder="Digite a mensagem..."
                        rows={4}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-white placeholder:text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all shadow-inner resize-none custom-scrollbar"
                      />
                      <div className="absolute bottom-5 right-6 flex items-center gap-2 text-slate-700 group-focus-within:text-blue-500 transition-colors">
                         <Sparkles size={16} />
                         <span className="text-[9px] font-black uppercase tracking-widest">IA Enhanced</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {['{{nome}}', '{{saudacao}}', '{{protocolo}}'].map((v) => (
                      <button
                        key={v}
                        onClick={() => insertVariable(v)}
                        className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-[8px] font-black text-slate-500 hover:text-blue-400 hover:border-blue-500/30 transition-all uppercase"
                      >
                        {v}
                      </button>
                    ))}
                  </div>

                  <NextStepSelector
                    label="Próximo Passo"
                    value={node.nextStepId || ''}
                    nodes={nodes}
                    allFlows={allFlows}
                    currentNodeId={node.id}
                    onChange={({ nextStepId, targetFlowId }) => onUpdate(node.id, { nextStepId, targetFlowId })}
                  />
                </div>
              )}

              {node.type === 'AI_DIFY' && (
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Integração Principal</label>
                      <div className="relative group">
                        <select 
                          className="w-full p-3 bg-slate-950 border border-white/5 rounded-xl text-xs outline-none appearance-none font-bold text-blue-400 focus:border-blue-500 transition-all pr-10 shadow-inner"
                          value={node.integrationId || ''}
                          onChange={(e) => onUpdate(node.id, { integrationId: e.target.value })}
                        >
                          <option value="">Nenhuma selecionada</option>
                          <optgroup label="🌍 Configuração Global">
                            <option value="GLOBAL_INTERNET">✨ Chat Internet (Global)</option>
                            <option value="GLOBAL_COMERCIAL">💼 Chat Comercial (Global)</option>
                          </optgroup>
                          <optgroup label="🔌 Integrações Específicas">
                            {integrations.map((integ: any) => (
                              <option key={integ.id} value={integ.id}>{integ.name}</option>
                            ))}
                          </optgroup>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 group-hover:text-blue-500 transition-colors">
                          <Globe size={14} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Inputs Mapping */}
                  <div className="space-y-4 bg-slate-950/30 p-4 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Share2 size={14} className="text-blue-500" />
                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Mapeamento de Entradas (Low-Code)</h4>
                      </div>
                      <button 
                        onClick={() => {
                          const mapping = getPayloadMapping();
                          const newKey = `input_${Object.keys(mapping).length + 1}`;
                          updatePayloadMapping({ ...mapping, [newKey]: '{{nome}}' });
                        }}
                        className="p-1.5 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {Object.entries(getPayloadMapping()).map(([key, value]: [string, any], idx) => (
                        <div key={idx} className="flex items-center gap-2 group">
                          <input 
                            type="text"
                            value={key}
                            onChange={(e) => {
                              const mapping = getPayloadMapping();
                              const newMapping = { ...mapping };
                              const currentVal = newMapping[key];
                              delete newMapping[key];
                              newMapping[e.target.value] = currentVal;
                              updatePayloadMapping(newMapping);
                            }}
                            placeholder="Chave no Dify"
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-[10px] font-bold text-white focus:border-blue-500 outline-none shadow-inner"
                          />
                          <ArrowRight size={12} className="text-slate-700" />
                          <select
                            value={value}
                            onChange={(e) => {
                              const mapping = getPayloadMapping();
                              updatePayloadMapping({ ...mapping, [key]: e.target.value });
                            }}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-[10px] font-bold text-blue-400 focus:border-blue-500 outline-none shadow-inner"
                          >
                            <option value="{{nome}}">Nome do Cliente</option>
                            <option value="{{telefone}}">WhatsApp / ID</option>
                            <option value="{{protocolo}}">Protocolo</option>
                            <option value="{{departamentos}}">Setores da Instância</option>
                            <option value="{{history}}">Histórico Completo</option>
                            <option value="{{is_first_interaction}}">É primeira interação?</option>
                          </select>
                          <button 
                             onClick={() => {
                               const mapping = getPayloadMapping();
                               const newMapping = { ...mapping };
                               delete newMapping[key];
                               updatePayloadMapping(newMapping);
                             }}
                             className="p-1.5 text-slate-600 hover:text-rose-500 transition-colors"
                          >
                             <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      
                      <div className="flex flex-col gap-3 pt-2">
                        {Object.keys(getPayloadMapping()).length === 0 ? (
                          <div className="flex flex-col items-center gap-3 py-4 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                            <p className="text-[10px] text-slate-500 font-bold italic text-center">
                              Nenhum mapeamento customizado.
                            </p>
                            <button 
                              onClick={() => {
                                updatePayloadMapping({
                                  nome: '{{nome}}',
                                  telefone: '{{telefone}}',
                                  protocolo: '{{protocolo}}',
                                  setores: '{{departamentos}}',
                                  historico: '{{history}}',
                                  primeiro_contato: '{{is_first_interaction}}'
                                });
                              }}
                              className="px-4 py-2 rounded-lg bg-blue-600/10 text-blue-400 text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all border border-blue-500/20"
                            >
                              🚀 Pré-preencher Padrões
                            </button>
                          </div>
                        ) : (
                          <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10 space-y-3">
                             <div className="flex items-center gap-2 text-blue-400">
                                <Sparkles size={12} />
                                <span className="text-[9px] font-black uppercase tracking-widest">Preview de Variáveis do Sistema</span>
                             </div>
                             
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                   <span className="text-[8px] font-black text-slate-500 uppercase tracking-tight">Setores que serão enviados:</span>
                                   <div className="flex flex-wrap gap-1">
                                      {allInstances
                                        .filter(inst => selectedInstanceIds.includes(inst.id))
                                        .flatMap(inst => inst.departments || [])
                                        .filter((dept, i, self) => self.findIndex(d => d.id === dept.id) === i) // unique
                                        .map(dept => (
                                          <span key={dept.id} className="px-1.5 py-0.5 rounded bg-slate-800 text-[8px] font-bold text-slate-300 border border-slate-700">
                                            {dept.name}
                                          </span>
                                        ))
                                      }
                                      {selectedInstanceIds.length === 0 && (
                                        <span className="text-[8px] text-slate-600 italic">Nenhum canal selecionado (enviando todos os setores por padrão)</span>
                                      )}
                                   </div>
                                </div>
                                
                                <div className="space-y-1">
                                   <span className="text-[8px] font-black text-slate-500 uppercase tracking-tight">Canais Ativos:</span>
                                   <div className="flex flex-wrap gap-1">
                                      {allInstances
                                        .filter(inst => selectedInstanceIds.includes(inst.id))
                                        .map(inst => (
                                          <span key={inst.id} className="px-1.5 py-0.5 rounded bg-blue-500/10 text-[8px] font-bold text-blue-400 border border-blue-500/20">
                                            {inst.name}
                                          </span>
                                        ))
                                      }
                                      {selectedInstanceIds.length === 0 && (
                                        <span className="text-[8px] text-slate-600 italic">Todos os Canais</span>
                                      )}
                                   </div>
                                </div>
                             </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <IntegrationSandbox 
                    integration={integrations.find(i => i.id === node.integrationId)} 
                    onUpdate={(data) => onUpdate(node.id, data)} 
                  />
                </div>
              )}

              {node.type === 'WAIT_INPUT' && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500 bg-amber-500/5 p-5 rounded-2xl border border-amber-600/20">
                  <div className="flex items-center gap-2 px-1">
                    <Variable size={16} className="text-amber-600" />
                    <label className="text-[9px] font-black text-slate-100 uppercase tracking-widest">Variável de Destino</label>
                  </div>
                  <input
                    type="text"
                    placeholder="Ex: cpf, email..."
                    className="w-full p-3 bg-slate-950 border border-amber-600/30 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-bold text-amber-500 shadow-sm placeholder:text-amber-900/40"
                    value={node.variableName || ''}
                    onChange={(e) => onUpdate(node.id, { variableName: e.target.value })}
                  />
                  <p className="text-[10px] text-slate-500 font-bold italic px-1">
                    Aguarda a resposta e salva nesta chave. Use como {'{{variável}}'}.
                  </p>
                </div>
              )}

              {node.type === 'TRANSFER' && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Destino da Transferência</label>
                  <div className="relative group">
                    <select 
                      className="w-full p-3 bg-slate-950 border border-white/5 rounded-xl text-xs outline-none appearance-none font-bold text-orange-400 focus:border-orange-500 transition-all pr-10 shadow-inner"
                      value={node.routingDepartmentId || ''}
                      onChange={(e) => onUpdate(node.id, { routingDepartmentId: e.target.value })}
                    >
                      <option value="">Aguardar Fila Geral</option>
                      {departments.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 group-hover:text-orange-500 transition-colors">
                      <User size={16} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Menus e Listas */}
            {(node.type === 'MENU' || node.type === 'LIST') && (
              <div className="space-y-6 p-5 border-t border-slate-800 bg-slate-950/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]", `bg-${currentType.color}-600`)} />
                    <label className="text-[11px] font-black text-slate-100 uppercase tracking-widest">
                      Opções Interativas
                    </label>
                  </div>
                  <button
                    onClick={() => {
                      const newOpts = [...(node.options || []), { keyword: '', label: '', targetNodeId: '' }];
                      onUpdate(node.id, { options: newOpts });
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all border border-white/10"
                  >
                    <Plus size={14} /> Adicionar Opção
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <AnimatePresence mode="popLayout">
                    {node.options?.map((opt: any, idx: number) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="flex flex-col xl:flex-row items-stretch gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-blue-500/20 transition-all group shadow-sm"
                      >
                        <div className="w-full xl:w-24">
                          <label className="block text-[8px] font-black text-slate-600 mb-1.5 tracking-widest px-1 uppercase">Chave</label>
                          <input
                            type="text"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm font-bold text-center text-blue-400 focus:border-blue-500 transition-all shadow-sm"
                            value={opt.keyword}
                            onChange={(e) => {
                              const newOpts = [...node.options];
                              newOpts[idx].keyword = e.target.value;
                              onUpdate(node.id, { options: newOpts });
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="block text-[8px] font-black text-slate-600 mb-1.5 tracking-widest px-1 uppercase">Texto</label>
                          <input
                            type="text"
                            placeholder="Ex: Suporte"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm font-bold text-white focus:border-blue-500 transition-all shadow-sm"
                            value={opt.label}
                            onChange={(e) => {
                              const newOpts = [...node.options];
                              newOpts[idx].label = e.target.value;
                              onUpdate(node.id, { options: newOpts });
                            }}
                          />
                        </div>
                        <div className="w-full xl:w-56">
                          <label className="block text-[8px] font-black text-slate-600 mb-1.5 tracking-widest px-1 uppercase">Próximo</label>
                          <select 
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-[11px] font-bold outline-none focus:border-blue-500 transition-all text-slate-400 shadow-sm"
                            value={opt.targetFlowId ? `flow-${opt.targetFlowId}` : opt.targetNodeId || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const newOpts = [...node.options];
                              if (val.startsWith('flow-')) {
                                newOpts[idx].targetFlowId = val.replace('flow-', '');
                                newOpts[idx].targetNodeId = null;
                              } else {
                                newOpts[idx].targetNodeId = val;
                                newOpts[idx].targetFlowId = null;
                              }
                              onUpdate(node.id, { options: newOpts });
                            }}
                          >
                            <option value="">Encerrar</option>
                            <optgroup label="Neste Fluxo">
                              {nodes.filter(n => n.id !== node.id).map(n => {
                                  const stepIdx = nodes.findIndex(orig => orig.id === n.id) + 1;
                                  return (
                                    <option key={n.id} value={n.id}>
                                      #{stepIdx} {n.title || n.type}
                                    </option>
                                  );
                              })}
                            </optgroup>
                            <optgroup label="Outro Fluxo">
                              {allFlows.map(f => (
                                <option key={f.id} value={`flow-${f.id}`}>🚀 {f.name}</option>
                              ))}
                            </optgroup>
                          </select>
                        </div>
                        <button 
                          onClick={() => {
                            const newOpts = node.options.filter((_: any, i: number) => i !== idx);
                            onUpdate(node.id, { options: newOpts });
                          }}
                          className="self-end p-3 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-4 space-y-4 min-w-0">
          <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-5 border border-slate-800 shadow-2xl xl:sticky xl:top-24 space-y-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-1">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/30">
                  <ArrowRight size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none mb-1">Roteamento</h3>
                  <p className="text-[8px] text-slate-600 font-black uppercase tracking-tight opacity-70">Fluxo de navegação</p>
                </div>
              </div>

              {(node.type === 'MESSAGE' || node.type === 'WAIT_INPUT' || node.type === 'AI_DIFY') && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner">
                  <NextStepSelector 
                    label={node.type === 'WAIT_INPUT' ? 'Após receber dado' : node.type === 'AI_DIFY' ? 'Após integração' : 'Próxima Ação'}
                    value={node.targetFlowId ? `flow-${node.targetFlowId}` : node.nextStepId || ''}
                    nodes={nodes}
                    allFlows={allFlows}
                    currentNodeId={node.id}
                    onChange={(data) => onUpdate(node.id, data)}
                    emptyLabel={node.type === 'WAIT_INPUT' ? 'Encerrar fluxo' : 'Aguardar resposta'}
                  />
                </div>
              )}
            </div>

            <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-2xl text-white space-y-4 shadow-2xl shadow-blue-600/30 group relative overflow-hidden border border-white/10">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
                   <Sparkles size={16} className="text-white" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest">Dica Premium</span>
              </div>
              
              <div className="space-y-3 relative z-10">
                <p className="text-xs leading-relaxed font-bold">
                  Personalize suas mensagens! Use {'{{nome}}'} para chamar o cliente pelo nome.
                </p>
                
                {node.type === 'AI_DIFY' && (
                  <div className="pt-4 space-y-3 border-t border-white/20">
                    <strong className="text-[9px] font-black uppercase tracking-widest block opacity-70">IA Power</strong>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center gap-2 text-[9px] font-bold text-blue-100">
                         <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_white]" />
                         <span>Histórico Automático</span>
                      </div>
                      <div className="flex items-center gap-2 text-[9px] font-bold text-blue-100">
                         <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_white]" />
                         <span>Transferência Dinâmica</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
