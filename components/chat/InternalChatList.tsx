'use client';

import { Users, Hash, User as UserIcon, MessageSquare, Search, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import React, { useState, useMemo } from 'react';

interface InternalChatListProps {
  chats: any[];
  users: any[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onStartDirectChat: (userId: string) => void;
  onStartDepartmentChat: (deptId: string) => void;
  currentUserId: string;
}

export function InternalChatList({ 
  chats, 
  users, 
  activeChatId, 
  onSelectChat, 
  onStartDirectChat,
  onStartDepartmentChat,
  currentUserId
}: InternalChatListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('all');

  const departments = useMemo(() => {
    const depts = new Map();
    users.forEach(u => {
      u.departments?.forEach((d: any) => {
        depts.set(d.id, d.name);
      });
    });
    return Array.from(depts.entries()).map(([id, name]) => ({ id, name }));
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = selectedDeptId === 'all' || 
                         user.departments?.some((d: any) => d.id === selectedDeptId);
      return matchesSearch && matchesDept;
    });
  }, [users, searchTerm, selectedDeptId]);

  const filteredChats = useMemo(() => {
    return chats.filter(chat => {
      if (chat.type === 'GROUP') {
        const matchesSearch = chat.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = selectedDeptId === 'all' || chat.departmentId === selectedDeptId;
        return matchesSearch && matchesDept;
      }
      return true; // Keep direct chats for now, or we could filter them by the other person's name
    });
  }, [chats, searchTerm, selectedDeptId]);

  return (
    <div className="flex flex-col h-full bg-[#111b21] border-r border-white/5">
      {/* Search and Filter Header */}
      <div className="p-4 space-y-3 border-b border-white/5 bg-black/20">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={16} />
          <input 
            type="text"
            placeholder="Buscar colega ou canal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedDeptId('all')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
              selectedDeptId === 'all' 
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" 
                : "bg-white/5 border-white/5 text-slate-500 hover:text-slate-300"
            )}
          >
            Todos
          </button>
          {departments.map(dept => (
            <button
              key={dept.id}
              onClick={() => setSelectedDeptId(dept.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                selectedDeptId === dept.id 
                  ? "bg-blue-500/20 border-blue-500/40 text-blue-400" 
                  : "bg-white/5 border-white/5 text-slate-500 hover:text-slate-300"
              )}
            >
              {dept.name}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar flex-1">
        
        {/* Canais de Departamento */}
        <div>
          <h3 className="text-[10px] font-black text-emerald-500/50 uppercase tracking-[0.2em] mb-4 px-2">Canais de Setores</h3>
          <div className="space-y-1">
            {filteredChats.filter(c => c.type === 'GROUP').length === 0 && (
              <div className="px-4 py-8 text-center border border-dashed border-white/5 rounded-2xl mb-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nenhum canal encontrado</p>
              </div>
            )}
            {filteredChats.filter(c => c.type === 'GROUP').map(chat => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group",
                  activeChatId === chat.id ? "bg-emerald-500/10 text-emerald-400" : "hover:bg-white/5 text-slate-400"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                  activeChatId === chat.id ? "bg-emerald-500/20" : "bg-slate-800/50 group-hover:bg-slate-800"
                )}>
                  <Hash size={18} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs font-black uppercase tracking-wider truncate">{chat.name}</p>
                  {chat.messages?.[0] && (
                    <p className="text-[10px] opacity-60 truncate">{chat.messages[0].body}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Conversas Diretas */}
        <div>
          <h3 className="text-[10px] font-black text-blue-500/50 uppercase tracking-[0.2em] mb-4 px-2">Membros da Equipe</h3>
          <div className="space-y-1">
            {filteredUsers.length === 0 && (
              <div className="px-4 py-8 text-center border border-dashed border-white/5 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nenhum membro encontrado</p>
              </div>
            )}
            {filteredUsers.map(user => {
              // Encontra se já existe um chat DIRECT com este usuário
              const existingChat = chats.find(c => 
                c.type === 'DIRECT' && 
                c.participants.some((p: any) => p.userId === user.id)
              );

              return (
                <button
                  key={user.id}
                  onClick={() => existingChat ? onSelectChat(existingChat.id) : onStartDirectChat(user.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group",
                    (existingChat && activeChatId === existingChat.id) ? "bg-blue-500/10 text-blue-400" : "hover:bg-white/5 text-slate-400"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all relative",
                    (existingChat && activeChatId === existingChat.id) ? "bg-blue-500/20" : "bg-slate-800/50 group-hover:bg-slate-800"
                  )}>
                    <UserIcon size={18} />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#111b21] rounded-full" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-black uppercase tracking-wider truncate">{user.name}</p>
                    <p className="text-[9px] opacity-40 font-bold uppercase tracking-widest truncate">
                      {user.departments?.[0]?.name || 'Equipe'} • {user.role}
                    </p>
                  </div>
                  {existingChat && activeChatId !== existingChat.id && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
