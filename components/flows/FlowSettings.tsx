'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Info, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface FlowSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  flow: any;
  departments: any[];
  onUpdate: (data: any) => void;
}

export default function FlowSettings({ isOpen, onClose, flow, departments, onUpdate }: FlowSettingsProps) {
  const [formData, setFormData] = useState({
    name: flow?.name || '',
    description: flow?.description || '',
    isActive: flow?.isActive ?? true,
    isDefault: flow?.isDefault ?? false,
    triggerKeywords: flow?.triggerKeywords || '',
    triggerDepartmentId: flow?.triggerDepartmentId || ''
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggle = (name: string) => {
    setFormData(prev => ({ ...prev, [name]: !prev[name as keyof typeof prev] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden max-h-[90vh] flex flex-col"
        >
          <div className="flex items-center justify-between p-5 md:p-6 border-b border-white/5 bg-slate-900/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">Configurações</h3>
                <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Defina como seu fluxo é ativado</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 md:space-y-8 overflow-y-auto custom-scrollbar">
            <div className="space-y-6">
              {/* Nome e Descrição */}
              <div className="grid grid-cols-1 gap-5 md:gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Fluxo</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ex: Menu Principal"
                    className="w-full bg-slate-800 border-none rounded-xl md:rounded-2xl px-5 py-3 md:py-3.5 text-sm font-bold text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Para que serve este fluxo..."
                    rows={2}
                    className="w-full bg-slate-800 border-none rounded-xl md:rounded-2xl px-5 py-3 md:py-3.5 text-sm font-bold text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 transition-all shadow-inner resize-none"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  onClick={() => handleToggle('isActive')}
                  className={cn(
                    "p-4 rounded-[1.8rem] border-2 transition-all cursor-pointer flex flex-col gap-2",
                    formData.isActive 
                      ? "bg-emerald-500/5 border-emerald-500/20" 
                      : "bg-slate-800 border-transparent opacity-60"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", formData.isActive ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-500")}>
                      <CheckCircle2 size={16} />
                    </div>
                    <div className={cn("w-10 h-5 rounded-full relative transition-colors", formData.isActive ? "bg-emerald-500" : "bg-slate-700")}>
                      <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", formData.isActive ? "right-1" : "left-1")} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-white">Fluxo Ativo</p>
                    <p className="text-[9px] font-bold text-slate-500">Responde automaticamente</p>
                  </div>
                </div>

                <div 
                  onClick={() => handleToggle('isDefault')}
                  className={cn(
                    "p-4 rounded-[1.8rem] border-2 transition-all cursor-pointer flex flex-col gap-2",
                    formData.isDefault 
                      ? "bg-blue-500/5 border-blue-500/20" 
                      : "bg-slate-800 border-transparent opacity-60"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", formData.isDefault ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-500")}>
                      <Info size={16} />
                    </div>
                    <div className={cn("w-10 h-5 rounded-full relative transition-colors", formData.isDefault ? "bg-blue-500" : "bg-slate-700")}>
                      <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", formData.isDefault ? "right-1" : "left-1")} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-white">Fluxo Padrão</p>
                    <p className="text-[9px] font-bold text-slate-500">Inicia para novos contatos</p>
                  </div>
                </div>
              </div>

              {/* Gatilhos de Palavras-Chave */}
              <div className="space-y-3 p-5 md:p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/10">
                <div className="flex items-center gap-2 text-amber-500 mb-1">
                  <AlertCircle size={16} />
                  <label className="text-[10px] font-black uppercase tracking-widest">Gatilhos (Keywords)</label>
                </div>
                <input
                  type="text"
                  name="triggerKeywords"
                  value={formData.triggerKeywords}
                  onChange={handleChange}
                  placeholder="ajuda, suporte, oi"
                  className="w-full bg-slate-900 border-2 border-amber-500/10 rounded-xl md:rounded-2xl px-5 py-3 md:py-3.5 text-sm font-bold text-white placeholder:text-slate-700 focus:ring-2 focus:ring-amber-500 transition-all"
                />
                <p className="text-[9px] text-slate-500 font-medium italic">
                  Separe por vírgula. Ativa o fluxo ao receber a palavra exata.
                </p>
              </div>

              {/* Gatilho por Departamento */}
              <div className="space-y-3 p-5 md:p-6 rounded-[2rem] bg-blue-500/5 border border-blue-500/10">
                <div className="flex items-center gap-2 text-blue-500 mb-1">
                  <Zap size={16} />
                  <label className="text-[10px] font-black uppercase tracking-widest">Ao entrar na fila</label>
                </div>
                <select
                  name="triggerDepartmentId"
                  value={formData.triggerDepartmentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, triggerDepartmentId: e.target.value }))}
                  className="w-full bg-slate-900 border-2 border-blue-500/10 rounded-xl md:rounded-2xl px-5 py-3 md:py-3.5 text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="">Nenhum (Desativado)</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
                <p className="text-[9px] text-slate-500 font-medium italic">
                  Dispara este fluxo automaticamente quando um ticket entra na fila deste setor.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 rounded-xl md:rounded-2xl bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-4 rounded-xl md:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Save size={16} />
                Confirmar
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
