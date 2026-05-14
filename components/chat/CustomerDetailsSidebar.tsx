'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  X, User, Phone, FileText, Calendar, Shield, 
  UserCheck, Hash, MessageSquare, Info, Tag
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CustomerDetailsSidebarProps {
  conversation: any;
  onClose: () => void;
  onEdit: () => void;
}

export function CustomerDetailsSidebar({ conversation, onClose, onEdit }: CustomerDetailsSidebarProps) {
  if (!conversation) return null;

  const contact = conversation.contact;

  return (
    <motion.div 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="w-80 h-full bg-white/[0.02] backdrop-blur-2xl border-l border-white/5 flex flex-col z-40 relative shadow-2xl"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info size={18} className="text-emerald-500" />
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Detalhes do Cliente</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        {/* Profile Card */}
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-[2.5rem] bg-slate-800 border-2 border-white/5 p-1 mb-4 shadow-2xl overflow-hidden">
            {contact.profilePic ? (
              <img src={contact.profilePic} alt={contact.name} className="w-full h-full object-cover rounded-[2.2rem]" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-black text-emerald-500">
                {(contact.name || 'C').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h4 className="text-xl font-black text-white tracking-tight mb-1">{contact.name || 'Sem Nome'}</h4>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{contact.number}</p>
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-1 gap-4">
          <InfoItem icon={<Phone size={14} />} label="Telefone" value={contact.number} />
          <InfoItem icon={<Hash size={14} />} label="CPF" value={contact.cpf || 'Não informado'} />
          <InfoItem icon={<MessageSquare size={14} />} label="Canal" value={conversation.platform || 'WhatsApp'} />
          <InfoItem icon={<Shield size={14} />} label="Setor" value={conversation.department?.name || 'Geral'} />
          <InfoItem icon={<UserCheck size={14} />} label="Responsável" value={conversation.assignedTo?.name || 'Aguardando'} />
          <InfoItem icon={<Tag size={14} />} label="Ticket" value={`#${conversation.protocol || '---'}`} />
          <InfoItem icon={<Calendar size={14} />} label="Último Contato" value={conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleDateString() : 'Hoje'} />
        </div>

        {/* Notes Section */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText size={14} className="text-amber-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Notas Rápidas</span>
            </div>
            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-[13px] text-amber-200/80 italic leading-relaxed">
              {contact.notes || "Nenhuma nota adicionada para este cliente."}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Info size={14} className="text-blue-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Observações</span>
            </div>
            <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-[13px] text-blue-200/80 italic leading-relaxed">
              {contact.observations || "Nenhuma observação detalhada registrada."}
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Actions */}
      <div className="p-6 border-t border-white/5">
        <button 
          onClick={onEdit}
          className="w-full py-3 bg-emerald-500 text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
        >
          Editar Cadastro
        </button>
      </div>
    </motion.div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 group-hover:text-emerald-500 transition-colors">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
        <span className="text-sm font-bold text-slate-300">{value}</span>
      </div>
    </div>
  );
}
