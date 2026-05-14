'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Search, User, MessageSquare, Bot, Send } from 'lucide-react';

interface ConversationListProps {
  conversations: any[];
  activeId?: string;
  onSelect: (id: string) => void;
  filter: string;
  setFilter: (filter: string) => void;
  departments?: any[];
  selectedDepartment?: string;
  onDepartmentChange?: (id: string) => void;
  showDeptFilter?: boolean;
}

export const ConversationList = React.memo(function ConversationList({ 
  conversations, 
  activeId, 
  onSelect, 
  filter, 
  setFilter,
  departments = [],
  selectedDepartment = 'all',
  onDepartmentChange,
  showDeptFilter = false
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = useMemo(() => [
    { id: 'all', label: 'Todos' },
    { id: 'QUEUED', label: 'Fila' },
    { id: 'mine', label: 'Meus' },
    { id: 'CLOSED', label: 'Fechados' }
  ], []);

  const filteredConversations = useMemo(() => {
    console.log(`[Front] Re-renderizando lista com ${conversations.length} conversas`);
    const term = searchTerm.toLowerCase();
    return conversations.filter(conv => {
      const nameMatch = conv.contact?.name?.toLowerCase().includes(term);
      const numMatch = conv.contact?.number?.toLowerCase().includes(term);
      return nameMatch || numMatch;
    });
  }, [conversations, searchTerm]);
  
  // Força re-render a cada 30s para atualizar os indicadores de "tempo real" (brilho de nova msg)
  const [now, setNow] = useState(Date.now());
  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-full flex flex-col bg-transparent">      {/* Header com Filtros */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">Conversas</h2>
          {conversations.filter(c => c.status === 'QUEUED').length > 0 && (
            <div className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-1.5 animate-pulse">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider">
                {conversations.filter(c => c.status === 'QUEUED').length} EM FILA
              </span>
            </div>
          )}
        </div>

        {/* Abas Estilo Chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-full transition-all duration-300 border",
                filter === tab.id 
                  ? "bg-emerald-500 border-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" 
                  : "bg-white/5 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/10"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filtro de Setor */}
        {showDeptFilter && (
          <div className="mb-4">
            <select 
              value={selectedDepartment}
              onChange={(e) => onDepartmentChange?.(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-2.5 text-xs text-slate-300 outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all cursor-pointer hover:bg-white/[0.08]"
            >
              <option value="all" className="bg-slate-900">Todos os Setores</option>
              {departments.map((dept: any) => (
                <option key={dept.id} value={dept.id} className="bg-slate-900">{dept.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Search */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-600 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-all focus:bg-white/[0.08]"
            placeholder="Buscar por nome, telefone ou ticket"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mt-2 px-3 space-y-1 custom-scrollbar">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-600 px-8 text-center">
            <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-4">
              <MessageSquare size={32} className="opacity-20" />
            </div>
            <p className="text-sm font-medium">Nenhuma conversa encontrada</p>
          </div>
        ) : (
          filteredConversations.map((conv: any) => {
            const isQueued = conv.status === 'QUEUED';
            const isActive = conv.status === 'ACTIVE';
            const isBot = conv.isBotActive;
            
            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-4 rounded-[1.5rem] transition-all duration-300 cursor-pointer group relative mb-1",
                  activeId === conv.id 
                    ? "bg-emerald-500/10 border border-emerald-500/20" 
                    : "hover:bg-white/5 border border-transparent"
                )}
              >
                {/* Avatar Section */}
                <div className="relative">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white overflow-hidden transition-all duration-500 shadow-inner",
                    activeId === conv.id ? "bg-gradient-to-br from-emerald-500/20 to-teal-600/20" : "bg-slate-800/50"
                  )}>
                    {conv.contact.profilePic ? (
                      <img src={conv.contact.profilePic} alt={conv.contact.name || ''} className="w-full h-full object-cover" />
                    ) : (
                      <span className={cn(
                        "text-lg font-black tracking-tighter",
                        activeId === conv.id ? "text-emerald-400" : "text-slate-500"
                      )}>
                        {(conv.contact.name || 'C').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  {/* Status Indicator Dot */}
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-950 shadow-sm",
                    isQueued ? "bg-amber-500 animate-pulse" : 
                    isActive ? "bg-emerald-500" : 
                    isBot ? "bg-sky-500" : "bg-slate-500"
                  )} />
                </div>
                
                {/* Info Section */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      "text-[15px] font-bold truncate leading-tight transition-colors",
                      activeId === conv.id ? "text-emerald-400" : "text-slate-200 group-hover:text-white"
                    )}>
                      {conv.contact.name || conv.contact.number}
                    </span>
                    <span className={cn(
                      "text-[10px] font-medium transition-all duration-700",
                      activeId === conv.id ? "text-emerald-400" : "text-slate-500",
                      conv.lastMessageAt && (now - new Date(conv.lastMessageAt).getTime() < 60000) ? "text-emerald-400 animate-pulse" : ""
                    )}>
                      {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-1.5">
                    {/* Canal Badge */}
                    <div className={cn(
                      "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter border",
                      conv.platform === 'TELEGRAM' 
                        ? "bg-blue-500/5 border-blue-500/20 text-blue-400" 
                        : "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                    )}>
                      {conv.platform === 'TELEGRAM' ? <Send size={8} /> : <MessageSquare size={8} />}
                      {conv.platform || 'WHATSAPP'}
                    </div>

                    {/* Setor Badge */}
                    {conv.department && (
                      <div className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-md text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                        {conv.department.name}
                      </div>
                    )}

                    {/* Bot Badge */}
                    {isBot && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-sky-500/10 border border-sky-500/20 rounded-md text-[8px] font-black text-sky-500 uppercase tracking-tighter">
                        <Bot size={8} /> Bot
                      </div>
                    )}
                  </div>

                  {/* Last Message */}
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "text-[13px] truncate flex-1 font-medium transition-colors",
                      isQueued ? "text-amber-500/80" : "text-slate-500 group-hover:text-slate-400",
                      conv.lastMessageAt && (now - new Date(conv.lastMessageAt).getTime() < 60000) ? "text-slate-200" : ""
                    )}>
                      {conv.lastMessage || conv.messages?.[0]?.body || (isQueued ? 'Aguardando atendimento...' : 'Inicie uma conversa')}
                    </p>
                    
                    {/* Unread Glowing Dot */}
                    {conv.lastMessageAt && (now - new Date(conv.lastMessageAt).getTime() < 60000) && activeId !== conv.id && (
                      <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
});
