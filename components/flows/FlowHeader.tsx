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
    <header className="h-14 md:h-16 bg-slate-950 border-b border-slate-800 px-4 md:px-6 flex items-center justify-between sticky top-0 z-50 shadow-2xl">
      <div className="flex items-center gap-3 md:gap-5">
        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/flows')}
          className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-blue-500 transition-all border border-slate-800"
        >
          <ArrowLeft size={16} />
        </motion.button>

        <div className="flex items-center gap-2.5 md:gap-3.5">
          <div className="relative group hidden sm:block">
             <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20 shrink-0 relative overflow-hidden">
                <GitBranch size={16} className="group-hover:rotate-12 transition-transform duration-500" />
             </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-sm md:text-base font-black text-white tracking-tight truncate max-w-[150px] md:max-w-none">
                {flow?.name || 'Carregando...'}
              </h1>
              <span className={cn(
                "px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest shadow-sm border shrink-0",
                flow?.isActive 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                  : "bg-slate-900 text-slate-500 border-slate-800"
              )}>
                {flow?.isActive ? '• Ativo' : 'Draft'}
              </span>
            </div>
            <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest opacity-80 truncate hidden xs:block">
              {flow?.description || 'Editor inteligente'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-500 transition-all shadow-lg shadow-amber-600/20 group border border-white/5"
        >
          <Zap size={14} className="fill-current" />
          <span className="text-[8px] font-black uppercase tracking-widest hidden sm:block">Gatilhos</span>
        </motion.button>

        <div className="h-5 w-px bg-slate-800 hidden sm:block" />

        <div className="hidden lg:flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 shadow-inner overflow-x-auto custom-scrollbar max-w-[200px] xl:max-w-none">
          <div className="flex px-1.5 items-center gap-1.5 text-slate-500 shrink-0">
            <Smartphone size={10} />
            <span className="text-[7px] font-black uppercase tracking-widest">Canais</span>
          </div>
          
          <button
            onClick={() => {
              if (selectedInstanceIds.length === instances.length) {
                // Deselect all
                selectedInstanceIds.forEach(id => onInstanceToggle(id));
              } else {
                // Select all (only those not selected)
                instances.forEach(i => {
                  if (!selectedInstanceIds.includes(i.id)) onInstanceToggle(i.id);
                });
              }
            }}
            className={cn(
              "px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tight transition-all shrink-0",
              selectedInstanceIds.length === instances.length
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-800 text-slate-500 border border-slate-700 hover:border-blue-500/50"
            )}
          >
            Todas
          </button>

          {instances.map((inst) => {
            const isSelected = selectedInstanceIds.includes(inst.id);
            return (
              <button
                key={inst.id}
                onClick={() => onInstanceToggle(inst.id)}
                className={cn(
                  "px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tight transition-all shrink-0 border",
                  isSelected
                    ? "bg-slate-800 text-blue-400 border-blue-500/30"
                    : "bg-transparent text-slate-600 border-transparent hover:border-slate-800"
                )}
              >
                {inst.name}
              </button>
            );
          })}
        </div>

        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSave}
          disabled={saving}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-xl shrink-0",
            saving 
              ? "bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800" 
              : "bg-blue-600 text-white shadow-blue-600/30 hover:bg-blue-500 border border-white/5"
          )}
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>
              <Save size={14} />
              <span className="hidden xs:block">Salvar</span>
            </>
          )}
        </motion.button>
      </div>
    </header>
  );
}
