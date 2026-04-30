'use client';

import { cn } from '@/lib/utils';
import { Search, User } from 'lucide-react';

interface ConversationListProps {
  conversations: any[];
  activeId?: string;
  onSelect: (id: string) => void;
}

export function ConversationList({ conversations, activeId, onSelect }: ConversationListProps) {
  return (
    <div className="h-full flex flex-col bg-[#111b21]">
      {/* Search */}
      <div className="px-4 py-2">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8696a0]">
            <Search size={16} />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-1.5 bg-[#202c33] border-none rounded-lg text-sm text-[#e9edef] focus:ring-0 outline-none placeholder-[#8696a0]"
            placeholder="Pesquisar ou começar uma nova conversa"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#374045 transparent' }}>
        {conversations.map((conv: any) => (
          <button
            key={conv.id}
            onClick={() => {
              console.log(`[DEBUG] Clique no contato: ${conv.contact.name || conv.contact.number}`);
              onSelect(conv.id);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 border-b border-[#222e35]/50 transition-all hover:bg-[#202c33] cursor-pointer",
              activeId === conv.id ? "bg-[#2a3942]" : ""
            )}
          >
            <div className="w-12 h-12 rounded-full bg-[#6a7175] flex items-center justify-center flex-shrink-0 text-white overflow-hidden">
              <User size={28} />
            </div>
            
            <div className="flex-1 min-w-0 text-left py-1">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-normal text-[#e9edef] truncate">
                  {conv.contact.name || conv.contact.number}
                </span>
                <span className="text-[11px] text-[#8696a0]">
                  {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <p className="text-[13px] text-[#8696a0] truncate flex-1">
                  {conv.messages?.[conv.messages.length - 1]?.body || 'Inicie uma conversa'}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
