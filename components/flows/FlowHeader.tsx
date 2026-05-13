'use client';

import { Save, ArrowLeft, GitBranch, Smartphone, Check, Loader2, Menu, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FlowHeaderProps {
  flow: any;
  saving: boolean;
  onSave: () => void;
  instances: any[];
  selectedInstanceIds: string[];
  onInstanceToggle: (id: string) => void;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
}

export default function FlowHeader({ 
  flow, 
  saving, 
  onSave, 
  instances, 
  selectedInstanceIds, 
  onInstanceToggle,
  onToggleSidebar,
  onOpenSettings
}: FlowHeaderProps) {
  const router = useRouter();

  return (
    <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3 md:gap-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 transition-colors"
        >
          <Menu size={20} />
        </motion.button>

        <motion.button
          whileHover={{ x: -4 }}
          onClick={() => router.push('/flows')}
          className="hidden sm:flex p-2 md:p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
        >
          <ArrowLeft size={20} />
        </motion.button>

        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-600/20 shrink-0">
            <GitBranch size={20} className="md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-xl font-black text-slate-900 dark:text-white tracking-tight truncate max-w-[120px] md:max-w-none">
                {flow?.name || 'Carregando...'}
              </h1>
              <span className={cn(
                "hidden xs:inline-block px-2 py-0.5 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-wider",
                flow?.isActive 
                  ? "bg-emerald-500/10 text-emerald-500" 
                  : "bg-slate-500/10 text-slate-500"
              )}>
                {flow?.isActive ? 'Ativo' : 'Rascunho'}
              </span>
            </div>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium truncate max-w-[150px] md:max-w-none">
              {flow?.description || 'Editor de fluxo'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        {/* Gatilhos e Configs */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-3 rounded-2xl bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-all border border-amber-500/20 shadow-lg shadow-amber-500/5 group shrink-0"
        >
          <Zap size={18} className="md:w-5 md:h-5 group-hover:fill-amber-500 transition-all" />
          <span className="hidden sm:inline text-[10px] md:text-xs font-black uppercase tracking-widest">Gatilhos</span>
        </motion.button>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1 md:mx-0" />

        {/* Instâncias Selector */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-x-auto max-w-[150px] md:max-w-none no-scrollbar">
          <div className="hidden md:flex px-3 items-center gap-2 text-slate-400">
            <Smartphone size={14} />
            <span className="text-[10px] font-bold uppercase tracking-tight">Canais</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => {
                selectedInstanceIds.length > 0 && selectedInstanceIds.forEach(id => onInstanceToggle(id));
              }}
              className={cn(
                "px-2 md:px-3 py-1 md:py-1.5 rounded-xl text-[9px] md:text-[10px] font-bold transition-all border shrink-0",
                selectedInstanceIds.length === 0
                  ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/20"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500"
              )}
            >
              Todas
            </button>
            {instances.map((inst) => (
              <button
                key={inst.id}
                onClick={() => onInstanceToggle(inst.id)}
                className={cn(
                  "px-2 md:px-3 py-1 md:py-1.5 rounded-xl text-[9px] md:text-[10px] font-bold transition-all border shrink-0",
                  selectedInstanceIds.includes(inst.id)
                    ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/20"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500"
                )}
              >
                {inst.name}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden md:block h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2" />

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onSave}
          disabled={saving}
          className={cn(
            "flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-2xl text-xs md:text-sm font-bold transition-all shadow-xl shrink-0",
            saving 
              ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" 
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30"
          )}
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <Save size={18} className="md:w-5 md:h-5" />
              <span className="hidden sm:inline">Salvar Alterações</span>
              <span className="sm:hidden">Salvar</span>
            </>
          )}
        </motion.button>
      </div>
    </header>
  );
}
