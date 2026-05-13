'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Calendar, 
  User, 
  Hash, 
  AlertCircle,
  Clock,
  Flag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewTaskModal({ isOpen, onClose, onSuccess }: NewTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    departmentId: '',
    assignedToId: '',
    priority: 'MEDIUM',
    dueDate: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetch('/api/departments').then(res => res.json()).then(setDepartments);
      fetch('/api/internal/users').then(res => res.json()).then(setUsers);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
        onClose();
        setFormData({
          title: '',
          description: '',
          departmentId: '',
          assignedToId: '',
          priority: 'MEDIUM',
          dueDate: ''
        });
      }
    } catch (err) {
      console.error('Error creating task:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#0f172a] border border-white/10 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden"
          >
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Nova Tarefa</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Planejamento Interno</p>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl text-slate-400 transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-4">Título da Tarefa</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="Ex: Revisar contrato de serviços"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-4">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                  placeholder="Detalhes sobre a tarefa..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-4">Setor</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                  >
                    <option value="" className="bg-slate-900">Nenhum</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id} className="bg-slate-900">{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-4">Prioridade</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                  >
                    <option value="LOW" className="bg-slate-900">Baixa</option>
                    <option value="MEDIUM" className="bg-slate-900">Média</option>
                    <option value="HIGH" className="bg-slate-900">Alta</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-4">Responsável</label>
                  <select
                    value={formData.assignedToId}
                    onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                  >
                    <option value="" className="bg-slate-900">Não atribuído</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id} className="bg-slate-900">{user.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-4">Prazo</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 bg-white/5 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button
                  disabled={loading}
                  type="submit"
                  className="flex-[2] py-4 bg-emerald-500 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50"
                >
                  {loading ? 'Criando...' : 'Criar Tarefa'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
