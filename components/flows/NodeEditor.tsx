'use client';

import { 
  Settings, 
  Trash2, 
  MessageSquare, 
  List, 
  Layout, 
  Type, 
  Bot, 
  User, 
  Variable,
  Globe,
  Settings2,
  HelpCircle,
  Plus,
  ArrowRight,
  Sparkles
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
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
}

export default function NodeEditor({ 
  node, 
  nodes, 
  allFlows, 
  departments, 
  integrations, 
  onUpdate, 
  onDelete 
}: NodeEditorProps) {
  
  if (!node) return null;

  const nodeTypes = [
    { 
      id: 'MESSAGE', 
      label: 'Mensagem', 
      icon: MessageSquare, 
      color: 'blue',
      description: 'Envia uma mensagem de texto simples. Ideal para saudações e avisos.'
    },
    { 
      id: 'MENU', 
      label: 'Menu Texto', 
      icon: List, 
      color: 'purple',
      description: 'Opções numeradas (1, 2, 3...). O cliente responde digitando o número ou a palavra-chave.'
    },
    { 
      id: 'LIST', 
      label: 'Lista Wpp', 
      icon: Layout, 
      color: 'emerald',
      description: 'Menu interativo oficial do WhatsApp (Lista/Botão). Mais profissional e fácil de clicar.'
    },
    { 
      id: 'WAIT_INPUT', 
      label: 'Pedir Dado', 
      icon: Type, 
      color: 'amber',
      description: 'Pausa o bot e aguarda o cliente enviar algo (CPF, Foto, Email) para salvar em uma variável.'
    },
    { 
      id: 'AI_DIFY', 
      label: 'IA & Webhook', 
      icon: Bot, 
      color: 'indigo',
      description: 'Conecta com Inteligência Artificial (Dify) ou sistemas externos para respostas dinâmicas.'
    },
    { 
      id: 'TRANSFER', 
      label: 'Humano', 
      icon: User, 
      color: 'orange',
      description: 'Transfere o chat para um atendente real e um setor específico.'
    }
  ];

  const currentType = nodeTypes.find(t => t.id === node.type) || nodeTypes[0];

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500 pb-20 px-4 md:px-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 md:gap-5">
          <motion.div 
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className={cn(
              "w-12 h-12 md:w-16 md:h-16 rounded-[1.5rem] md:rounded-[2rem] shadow-xl flex items-center justify-center text-white shrink-0",
              `bg-${currentType.color}-600 shadow-${currentType.color}-600/20`
            )}
          >
            <currentType.icon size={24} className="md:w-[30px] md:h-[30px]" />
          </motion.div>
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                {currentType.label}
              </h2>
            </div>
            <p className="text-[10px] md:text-sm text-slate-500 font-medium truncate">ID: {node.id}</p>
            <p className="text-[10px] md:text-xs text-blue-500 dark:text-blue-400 font-bold uppercase tracking-widest mt-1">
              {currentType.description}
            </p>
          </div>
        </div>
        <button 
          onClick={() => onDelete(node.id)}
          className="p-3 md:p-4 rounded-2xl md:rounded-[1.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:border-red-500/30 transition-all group"
        >
          <Trash2 size={18} className="md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 xl:col-span-9 space-y-8 min-w-0">
          {/* Editor de Conteúdo Principal */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-[2.5rem] p-6 md:p-12 border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-200/20 dark:shadow-none space-y-6 md:space-y-10">
            
            {node.type !== 'AI_DIFY' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {node.type === 'TRANSFER' ? 'Mensagem de Transferência' : 'Conteúdo da Mensagem'}
                  </label>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <HelpCircle size={12} />
                    <span className="text-[10px] font-bold">Dica: Use {"{{nome}}"}</span>
                  </div>
                </div>
                <textarea
                  className="w-full p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-sm min-h-[160px] focus:ring-4 focus:ring-blue-500/10 transition-all outline-none leading-relaxed font-medium"
                  placeholder="Ex: Olá! Como posso te ajudar hoje?"
                  value={node.content}
                  onChange={(e) => onUpdate(node.id, { content: e.target.value })}
                />
              </div>
            )}

            {/* Configurações Específicas por Tipo */}
            {node.type === 'AI_DIFY' && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Selecione a Integração</label>
                    <div className="relative">
                      <select 
                        className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm outline-none appearance-none font-bold text-blue-600 dark:text-blue-400"
                        value={node.integrationId || ''}
                        onChange={(e) => onUpdate(node.id, { integrationId: e.target.value })}
                      >
                        <option value="">Nenhuma selecionada</option>
                        <optgroup label="🌍 Configuração Global">
                          <option value="GLOBAL_INTERNET">✨ Usar Chat Internet (Global)</option>
                          <option value="GLOBAL_COMERCIAL">💼 Usar Chat Comercial (Global)</option>
                        </optgroup>
                        <optgroup label="🔌 Integrações Específicas">
                          {integrations.map((integ: any) => (
                            <option key={integ.id} value={integ.id}>{integ.name} ({integ.type})</option>
                          ))}
                        </optgroup>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <Globe size={16} />
                      </div>
                    </div>
                  </div>
                </div>

                <IntegrationSandbox 
                  node={node} 
                  integrations={integrations} 
                  onUpdate={(data) => onUpdate(node.id, data)} 
                />
              </div>
            )}

            {node.type === 'WAIT_INPUT' && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center gap-2 px-1">
                  <Variable size={16} className="text-amber-500" />
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da Variável de Destino</label>
                </div>
                <input
                  type="text"
                  placeholder="Ex: cpf, email, pedido..."
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-amber-500/10 transition-all font-bold"
                  value={node.variableName || ''}
                  onChange={(e) => onUpdate(node.id, { variableName: e.target.value })}
                />
                <p className="text-[10px] text-slate-500 italic px-1 font-medium">
                   ✨ O bot salvará automaticamente a resposta do usuário nesta variável.
                </p>
              </div>
            )}

            {node.type === 'TRANSFER' && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Encaminhar para Departamento</label>
                <div className="relative">
                  <select 
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm outline-none appearance-none font-bold text-orange-600 dark:text-orange-400"
                    value={node.routingDepartmentId || ''}
                    onChange={(e) => onUpdate(node.id, { routingDepartmentId: e.target.value })}
                  >
                    <option value="">Aguardar Fila Geral</option>
                    {departments.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <User size={16} />
                  </div>
                </div>
              </div>
            )}

            {node.type === 'LIST' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Título da Lista (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: Nossos Serviços"
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold"
                    value={node.title || ''}
                    onChange={(e) => onUpdate(node.id, { title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Texto do Botão (Obrigatório)</label>
                  <input
                    type="text"
                    placeholder="Ex: Ver Opções"
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold"
                    value={node.buttonText || ''}
                    onChange={(e) => onUpdate(node.id, { buttonText: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Rodapé (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: Selecione uma opção para continuar"
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold"
                    value={node.footer || ''}
                    onChange={(e) => onUpdate(node.id, { footer: e.target.value })}
                  />
                </div>
              </div>
            )}

            {node.type === 'LIST' && (
              <div className="p-6 bg-amber-500/5 dark:bg-amber-500/10 rounded-[2rem] border border-amber-500/10 space-y-4 mb-6">
                <div className="flex items-center gap-2 px-1">
                  <Variable size={16} className="text-amber-500" />
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Salvar Escolha em uma Variável (Opcional)</label>
                </div>
                <input
                  type="text"
                  placeholder="Ex: setor_escolhido, opcao_suporte..."
                  className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-amber-500/10 transition-all font-bold"
                  value={node.variableName || ''}
                  onChange={(e) => onUpdate(node.id, { variableName: e.target.value })}
                />
                <p className="text-[9px] text-slate-500 italic px-1 font-medium">
                   💡 Se preenchido, o valor da opção escolhida será salvo nesta variável.
                </p>
              </div>
            )}

            {/* Menus e Listas */}
            {(node.type === 'MENU' || node.type === 'LIST') && (
              <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    {node.type === 'LIST' ? 'Opções Interativas (Wpp)' : 'Opções do Menu Numérico'}
                  </label>
                  <button
                    onClick={() => {
                      const newOpts = [...(node.options || []), { keyword: '', label: '', targetNodeId: '' }];
                      onUpdate(node.id, { options: newOpts });
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/10 text-blue-600 text-[10px] font-bold uppercase hover:bg-blue-600 hover:text-white transition-all"
                  >
                    <Plus size={14} /> Adicionar Opção
                  </button>
                </div>

                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {node.options?.map((opt: any, idx: number) => (
                      <motion.div 
                        key={idx}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid grid-cols-12 gap-3 p-5 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 group"
                      >
                        <div className="col-span-2">
                          <label className="block text-[9px] font-black text-slate-400 mb-1 tracking-tighter">CHAVE</label>
                          <input
                            type="text"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-xs font-black text-center text-blue-600"
                            value={opt.keyword}
                            onChange={(e) => {
                              const newOpts = [...node.options];
                              newOpts[idx].keyword = e.target.value;
                              onUpdate(node.id, { options: newOpts });
                            }}
                          />
                        </div>
                        <div className="col-span-5">
                          <label className="block text-[9px] font-black text-slate-400 mb-1 tracking-tighter">TÍTULO DA OPÇÃO</label>
                          <input
                            type="text"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
                            value={opt.label}
                            onChange={(e) => {
                              const newOpts = [...node.options];
                              newOpts[idx].label = e.target.value;
                              onUpdate(node.id, { options: newOpts });
                            }}
                          />
                        </div>
                        <div className="col-span-4">
                          <label className="block text-[9px] font-black text-slate-400 mb-1 tracking-tighter">AÇÃO AO CLICAR</label>
                          <select 
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-[10px] font-bold outline-none"
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
                            <option value="">Encerrar fluxo</option>
                            <optgroup label="Neste Fluxo">
                              {nodes.filter(n => n.id !== node.id).map(n => {
                                  const stepIdx = nodes.findIndex(orig => orig.id === n.id) + 1;
                                  const typeLabel = nodeTypes.find(t => t.id === n.type)?.label || 'Ação';
                                  return (
                                    <option key={n.id} value={n.id}>
                                      #{stepIdx} [{typeLabel}] {n.content?.substring(0, 30)}...
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
                        <div className="col-span-1 flex items-end justify-center pb-1">
                          <button 
                            onClick={() => {
                              const newOpts = node.options.filter((_: any, i: number) => i !== idx);
                              onUpdate(node.id, { options: newOpts });
                            }}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

          </div>
        </div>

        <div className="lg:col-span-4 xl:col-span-3 space-y-6 min-w-0">
          {/* Barra Lateral de Roteamento */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-[2.5rem] p-6 md:p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-xl space-y-8 lg:sticky lg:top-28">
            <div className="flex items-center gap-3 px-1">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                <Settings2 size={18} />
              </div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">Roteamento</h3>
            </div>

            {(node.type === 'MESSAGE' || node.type === 'WAIT_INPUT' || node.type === 'AI_DIFY') && (
              <NextStepSelector 
                label={node.type === 'WAIT_INPUT' ? 'Após receber o dado' : node.type === 'AI_DIFY' ? 'Após resposta da integração' : 'Próxima Ação Automática'}
                value={node.targetFlowId ? `flow-${node.targetFlowId}` : node.nextStepId || ''}
                nodes={nodes}
                allFlows={allFlows}
                currentNodeId={node.id}
                onChange={(data) => onUpdate(node.id, data)}
                emptyLabel={node.type === 'WAIT_INPUT' ? 'Encerrar fluxo aqui' : 'Aguardar resposta do usuário'}
              />
            )}

            <div className="p-6 bg-blue-600/5 dark:bg-blue-600/10 rounded-3xl border border-blue-600/10 space-y-3">
              <div className="flex items-center gap-2 text-blue-600">
                <Sparkles size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Configuração Avançada</span>
              </div>
              <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
                Você pode usar chaves entre chaves duplas {"{{variável}}"} no conteúdo da mensagem para exibir dados capturados anteriormente ou do contato.
              </p>
              
              <div className="mt-3 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium space-y-2">
                <div>
                  <strong className="text-slate-700 dark:text-slate-200">Variáveis Padrão:</strong>
                  <ul className="list-disc pl-4 mt-1">
                    <li>{"{{nome}}"} - Nome do contato</li>
                    <li>{"{{telefone}}"} - Número do WhatsApp</li>
                  </ul>
                </div>
                
                {node.type === 'AI_DIFY' && (
                  <>
                    <div className="pt-2 border-t border-blue-500/10">
                      <strong className="text-slate-700 dark:text-slate-200">Variáveis Enviadas para a IA:</strong>
                      <ul className="list-disc pl-4 mt-1">
                        <li>{"historico"} - Últimas 20 mensagens (embutido no JSON)</li>
                        <li>{"is_first_interaction"} - Primeira mensagem (true/false)</li>
                        <li>{"departamentos"} - Lista de departamentos e seus IDs reais para transferência</li>
                      </ul>
                    </div>
                    <div className="pt-2 border-t border-blue-500/10">
                      <strong className="text-slate-700 dark:text-slate-200">Ações da IA (Dify responde com as Tags):</strong>
                      <ul className="list-disc pl-4 mt-1">
                        <li><code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[9px]">[TRANSFER]</code> - Fila Geral</li>
                        <li><code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[9px]">[TRANSFER_DEPT:id]</code> - Transfere p/ Depto</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
