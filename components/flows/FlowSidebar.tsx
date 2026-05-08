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
  GitBranch
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FlowSidebarProps {
  nodes: any[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onAddNode: (type: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const nodeTypes = [
  { id: 'MESSAGE', label: 'Mensagem', icon: MessageSquare, color: 'blue' },
  { id: 'MENU', label: 'Menu Texto', icon: List, color: 'purple' },
  { id: 'LIST', label: 'Lista Wpp', icon: Layout, color: 'emerald' },
  { id: 'WAIT_INPUT', label: 'Pedir Dado', icon: Type, color: 'amber' },
  { id: 'AI_DIFY', label: 'IA & Webhook', icon: Bot, color: 'indigo' },
  { id: 'TRANSFER', label: 'Humano', icon: User, color: 'orange' }
];

export default function FlowSidebar({ 
  nodes, 
  selectedNodeId, 
  onSelectNode, 
  onAddNode,
  isOpen,
  onClose
}: FlowSidebarProps) {
  return (
    <aside className={cn(
      "w-64 lg:w-72 h-full bg-white dark:bg-[#020617] border-r border-slate-200/60 dark:border-slate-800/60 flex flex-col z-40 transition-all duration-300",
      "fixed lg:relative inset-y-0 left-0 lg:translate-x-0 shadow-2xl lg:shadow-none",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
        {/* Adicionar Novo Passo */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Componentes</h3>
            <Zap size={14} className="text-amber-500 animate-pulse" />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {nodeTypes.map((t) => (
              <motion.button
                key={t.id}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAddNode(t.id)}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 hover:border-blue-500/50 hover:bg-blue-500/[0.02] transition-all group"
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                  `bg-${t.color}-500/10 text-${t.color}-500 group-hover:scale-110`
                )}>
                  <t.icon size={20} />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-tight text-slate-600 dark:text-slate-400">{t.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-800/50 mx-2" />

        {/* Lista de Passos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Estrutura do Fluxo</h3>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-500">
              {nodes.length} PASSOS
            </span>
          </div>

          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {nodes.map((node, idx) => {
                const typeInfo = nodeTypes.find(t => t.id === node.type) || nodeTypes[0];
                const isSelected = selectedNodeId === node.id;

                return (
                  <motion.button
                    key={node.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => onSelectNode(node.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left relative overflow-hidden group",
                      isSelected
                        ? "bg-blue-600 border-blue-500 shadow-lg shadow-blue-600/20 text-white"
                        : "bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-blue-500/30 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    )}
                  >
                    {isSelected && (
                      <motion.div 
                        layoutId="active-pill"
                        className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 -z-10"
                      />
                    )}

                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                      isSelected 
                        ? "bg-white/20 text-white" 
                        : `bg-${typeInfo.color}-500/10 text-${typeInfo.color}-500`
                    )}>
                      <typeInfo.icon size={18} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={cn(
                          "text-[9px] font-black uppercase tracking-widest mb-0.5",
                          isSelected ? "text-blue-100/80" : "text-slate-400"
                        )}>
                          PASSO {idx + 1}
                        </p>
                        {isSelected && <ChevronRight size={12} className="text-white/60" />}
                      </div>
                      <p className={cn(
                        "text-xs font-bold truncate",
                        isSelected ? "text-white" : "text-slate-700 dark:text-slate-200"
                      )}>
                        {node.content ? `"${node.content.substring(0, 30)}..."` : "Sem conteúdo"}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>

            {nodes.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-center px-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300 dark:text-slate-700">
                  <GitBranch size={32} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Fluxo Vazio</p>
                  <p className="text-[11px] text-slate-500">Adicione seu primeiro passo acima para começar.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer da Sidebar com Dica */}
      <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200/60 dark:border-slate-800/60 mt-auto">
        <div className="flex gap-2">
          <Zap size={12} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[9px] leading-snug text-slate-500 font-medium">
            A ordem visual aqui não altera a execução. O bot segue os links de "Próximo Passo".
          </p>
        </div>
      </div>
    </aside>
  );
}
