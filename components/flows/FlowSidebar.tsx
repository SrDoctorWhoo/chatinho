'use client';

import { 
  MessageSquare, 
  List, 
  Layout, 
  Type, 
  Bot, 
  User, 
  Plus, 
  Search, 
  Zap,
  ChevronRight,
  GitBranch,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FlowSidebarProps {
  nodes: any[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onAddNode: (type: string) => void;
  onReorder: (newNodes: any[]) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const nodeTypes = [
  { 
    id: 'MESSAGE', 
    label: 'Mensagem', 
    icon: MessageSquare, 
    color: 'blue',
    description: 'Envia texto simples. Ideal para saudações.' 
  },
  { 
    id: 'MENU', 
    label: 'Menu Texto', 
    icon: List, 
    color: 'purple',
    description: 'Menu numérico (1, 2, 3...) via texto.' 
  },
  { 
    id: 'LIST', 
    label: 'Lista Wpp', 
    icon: Layout, 
    color: 'emerald',
    description: 'Menu interativo oficial do WhatsApp.' 
  },
  { 
    id: 'WAIT_INPUT', 
    label: 'Pedir Dado', 
    icon: Type, 
    color: 'amber',
    description: 'Captura dados (CPF, E-mail) do cliente.' 
  },
  { 
    id: 'AI_DIFY', 
    label: 'IA & Webhook', 
    icon: Bot, 
    color: 'indigo',
    description: 'Respostas inteligentes via IA (Dify).' 
  },
  { 
    id: 'TRANSFER', 
    label: 'Humano', 
    icon: User, 
    color: 'orange',
    description: 'Transfere para um atendente real.' 
  }
];

export default function FlowSidebar({ 
  nodes, 
  selectedNodeId, 
  onSelectNode, 
  onAddNode,
  onReorder,
  isOpen,
  onClose
}: FlowSidebarProps) {
  return (
    <aside className={cn(
      "w-60 lg:w-64 xl:w-72 h-full bg-slate-950 border-r border-slate-800 flex flex-col z-40 transition-all duration-300 shadow-2xl",
      "fixed lg:relative inset-y-0 left-0 lg:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* Header da Sidebar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">Componentes</h3>
          <div className="p-1 bg-amber-500/10 rounded-md">
            <Zap size={10} className="text-amber-500 fill-amber-500" />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-1.5">
          {nodeTypes.map((t) => (
            <motion.button
              key={t.id}
              whileHover={{ y: -1, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onAddNode(t.id)}
              className="flex flex-col items-center gap-1 p-1.5 rounded-lg bg-slate-900 border border-slate-800 shadow-sm hover:shadow-lg hover:border-blue-500/30 transition-all group"
            >
              <div className={cn(
                "w-7 h-7 rounded-md flex items-center justify-center transition-all shadow-sm",
                `bg-${t.color}-500/10 text-${t.color}-500 group-hover:bg-${t.color}-600 group-hover:text-white`
              )}>
                <t.icon size={14} />
              </div>
              <span className="text-[7px] font-black uppercase tracking-tighter text-slate-400 text-center leading-tight">
                {t.label.split(' ')[0]}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 relative bg-slate-950">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">Timeline</h3>
          <span className="px-1.5 py-0.5 rounded-md bg-blue-600/10 text-[7px] font-black text-blue-500 uppercase border border-blue-600/20">
            {nodes.length} PASSOS
          </span>
        </div>

        <div className="relative pl-3.5">
          {/* Linha Vertical da Timeline */}
          <div className="absolute left-[14px] top-5 bottom-5 w-px bg-slate-800" />

          <Reorder.Group 
            axis="y" 
            values={nodes} 
            onReorder={onReorder}
            className="space-y-3"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {nodes.map((node, idx) => {
                const typeInfo = nodeTypes.find(t => t.id === node.type) || nodeTypes[0];
                const isSelected = selectedNodeId === node.id;

                return (
                  <Reorder.Item
                    key={node.id}
                    value={node}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative"
                  >
                    {/* Ponto da Timeline */}
                    <div className={cn(
                      "absolute -left-[23px] top-6 w-2.5 h-2.5 rounded-full border-2 z-10 transition-all duration-300",
                      isSelected 
                        ? "bg-blue-500 border-slate-950 scale-110 shadow-lg shadow-blue-500/30" 
                        : "bg-slate-700 border-slate-950 shadow-sm"
                    )} />

                    <motion.div
                      whileHover={{ x: 2 }}
                      onClick={() => onSelectNode(node.id)}
                      className={cn(
                        "w-full flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left relative overflow-hidden group cursor-pointer",
                        isSelected
                          ? "bg-slate-900 border-blue-500 shadow-xl shadow-blue-500/5"
                          : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-blue-500/20"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-500 shadow-sm",
                        isSelected 
                          ? `bg-${typeInfo.color}-600 text-white shadow-md shadow-${typeInfo.color}-600/30` 
                          : `bg-${typeInfo.color}-500/10 text-${typeInfo.color}-500`
                      )}>
                        <typeInfo.icon size={16} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className={cn(
                            "text-[7px] font-black uppercase tracking-[0.1em]",
                            isSelected ? "text-blue-500" : "text-slate-500"
                          )}>
                            Passo {idx + 1}
                          </p>
                          {(node.content?.includes('{{auth_login_link}}') || node.content?.includes('{{auth_oab_link}}')) && (
                            <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              <Zap size={6} className="animate-pulse fill-amber-500" />
                              <span className="text-[5px] font-black uppercase">Auth</span>
                            </div>
                          )}
                        </div>
                        <p className={cn(
                          "text-[11px] font-bold truncate leading-tight",
                          isSelected ? "text-white" : "text-slate-400"
                        )}>
                          {node.title || (node.content ? node.content : "Configurar")}
                        </p>
                      </div>
                    </motion.div>
                  </Reorder.Item>
                );
              })}
            </AnimatePresence>

            {nodes.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-center px-4 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-slate-700 shadow-inner border border-slate-800">
                  <GitBranch size={24} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Fluxo Vazio</p>
                  <p className="text-[10px] text-slate-600 leading-relaxed font-black px-2 italic">Adicione um componente.</p>
                </div>
              </div>
            )}
          </Reorder.Group>
        </div>
      </div>
      
      {/* Footer da Sidebar com Guia */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1 bg-blue-500/10 rounded-md">
            <HelpCircle size={12} className="text-blue-500" />
          </div>
          <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-300">Ajuda</h4>
        </div>
        <p className="text-[9px] leading-relaxed text-slate-600 font-black italic">
          💡 Siga as conexões de "Próximo Passo".
        </p>
      </div>
    </aside>
  );
}
