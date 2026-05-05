'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Search, User, MessageSquare } from 'lucide-react';

interface ConversationListProps {
  conversations: any[];
  activeId?: string;
  onSelect: (id: string) => void;
  filter: string;
  setFilter: (filter: string) => void;
}

export function ConversationList({ conversations, activeId, onSelect, filter, setFilter }: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = [
    { id: 'all', label: 'Todos' },
    { id: 'QUEUED', label: 'Fila' },
    { id: 'mine', label: 'Meus' },
    { id: 'CLOSED', label: 'Fechados' }
  ];

  const filteredConversations = conversations.filter(conv => {
    const term = searchTerm.toLowerCase();
    const nameMatch = conv.contact?.name?.toLowerCase().includes(term);
    const numMatch = conv.contact?.number?.toLowerCase().includes(term);
    return nameMatch || numMatch;
  });

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Header com Abas */}
      <div className="px-6 pt-8 pb-4">
        <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Conversas</h2>
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all duration-300",
                filter === tab.id 
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              )}
            >
              {tab.label}
              {tab.id === 'QUEUED' && conversations.filter(c => c.status === 'QUEUED').length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-[9px] rounded-md font-black">
                  {conversations.filter(c => c.status === 'QUEUED').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-2">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm text-white placeholder-slate-600 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-all focus:bg-white/[0.08]"
            placeholder="Buscar por nome ou número..."
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mt-4 px-3 space-y-1 custom-scrollbar">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-600 px-8 text-center">
            <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-4">
              <MessageSquare size={32} className="opacity-20" />
            </div>
            <p className="text-sm font-medium">Nenhuma conversa encontrada</p>
          </div>
        ) : (
          filteredConversations.map((conv: any) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-4 rounded-[1.5rem] transition-all duration-300 cursor-pointer group mb-1",
                activeId === conv.id 
                  ? "bg-emerald-500/10 border border-emerald-500/10" 
                  : "hover:bg-white/5 border border-transparent"
              )}
            >
              <div className="relative">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white overflow-hidden transition-all duration-500 relative",
                  activeId === conv.id ? "bg-gradient-to-br from-emerald-500 to-teal-600 rotate-0" : "bg-slate-800 rotate-[-4deg] group-hover:rotate-0"
                )}>
                  {conv.contact.profilePic ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={conv.contact.profilePic} alt={conv.contact.name || ''} className="w-full h-full object-cover" />
                  ) : (
                    <User size={28} className={cn(activeId === conv.id ? "text-slate-950" : "text-slate-500")} />
                  )}
                </div>
                {conv.status === 'QUEUED' && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  </div>
                )}
                {conv.status === 'ACTIVE' && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-lg shadow-emerald-500/40" />
                )}
              </div>
              
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-start justify-between mb-1 gap-2">
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className={cn(
                      "text-[15px] font-bold truncate transition-colors leading-tight",
                      activeId === conv.id ? "text-emerald-400" : "text-slate-200 group-hover:text-white"
                    )}>
                      {conv.contact.name || conv.contact.number}
                    </span>
                    {conv.contact.name && conv.contact.name !== conv.contact.number && (
                      <span className={cn(
                        "text-[11px] font-medium truncate mt-0.5",
                        activeId === conv.id ? "text-emerald-700" : "text-slate-500"
                      )}>
                        {conv.contact.number.includes('@lid') ? 'Linked Device' : conv.contact.number}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                      {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                    {conv.contact.notes && (
                      <span className="text-[10px] font-bold text-amber-500/90 truncate max-w-[80px] italic flex items-center gap-1">
                        📝 Nota
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "text-[13px] truncate flex-1 font-medium",
                    conv.status === 'QUEUED' ? "text-orange-400/80" : "text-slate-500 group-hover:text-slate-400"
                  )}>
                    {conv.status === 'QUEUED' ? 'Aguardando atendimento...' : (conv.messages?.[0]?.body || 'Inicie uma conversa')}
                  </p>
                  {conv.assignedTo && filter !== 'mine' && (
                    <div className="h-5 px-2 rounded-md bg-white/5 border border-white/5 flex items-center">
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                        {conv.assignedTo.name.split(' ')[0]}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
