'use client';

import { Variable, ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface VariablePickerProps {
  onSelect: (variable: string) => void;
  className?: string;
}

const commonVariables = [
  { name: 'nome', label: 'Nome do Contato', category: 'Identidade' },
  { name: 'telefone', label: 'WhatsApp', category: 'Identidade' },
  { name: 'protocolo', label: 'Protocolo', category: 'Sistema' },
  { name: 'departamentos', label: 'Lista de Deptos', category: 'IA / Roteamento' },
  { name: 'historico', label: 'Histórico Chat', category: 'IA / Roteamento' },
  { name: 'is_first_interaction', label: '1ª Interação', category: 'IA / Roteamento' },
];

export default function VariablePicker({ onSelect, className }: VariablePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative inline-block", className)} ref={containerRef}>
      <motion.button
        whileHover={{ scale: 1.05, y: -1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 text-blue-600 hover:bg-blue-600 hover:text-white transition-all border-2 border-blue-600/20 shadow-sm group"
      >
        <Variable size={14} className="group-hover:rotate-12 transition-transform" />
        <span className="text-[11px] font-black uppercase tracking-widest">Variáveis</span>
        <ChevronDown size={12} className={cn("transition-transform", isOpen && "rotate-180")} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 bottom-full mb-4 w-64 bg-white dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] z-50 overflow-hidden"
          >
            <div className="p-6 border-b-2 border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                <Sparkles size={14} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-100 block">Variáveis Dinâmicas</span>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tight">Insira tags personalizadas</p>
              </div>
            </div>
            
            <div className="max-h-72 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {['Identidade', 'Sistema', 'IA / Roteamento'].map(category => (
                <div key={category} className="space-y-2">
                  <div className="px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-80">
                    {category}
                  </div>
                  <div className="space-y-1">
                    {commonVariables.filter(v => v.category === category).map((v) => (
                      <button
                        key={v.name}
                        onClick={() => {
                          onSelect(`{{${v.name}}}`);
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 transition-all text-left group"
                      >
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black group-hover:text-white transition-colors">{v.label}</span>
                          <code className="text-[9px] font-mono text-blue-600 dark:text-blue-400 group-hover:text-blue-100 transition-colors">
                            {`{{${v.name}}}`}
                          </code>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
