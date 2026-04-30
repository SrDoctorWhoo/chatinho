'use client';

import { cn } from '@/lib/utils';
import { User, Phone, MoreVertical, Search } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface Message {
  id: string;
  body: string;
  fromMe: boolean;
  timestamp: string;
}

interface ChatWindowProps {
  conversation: any;
  messages: Message[];
}

export function ChatWindow({ conversation, messages }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/50 text-slate-400 p-8 text-center">
        <div className="w-20 h-20 rounded-3xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-6">
          <User size={40} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Selecione uma conversa</h2>
        <p>Escolha um contato na lista ao lado para iniciar o atendimento.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0b141a] h-full relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] opacity-[0.06] pointer-events-none brightness-50"></div>
      
      {/* Header */}
      <div className="px-4 py-2 bg-[#202c33] flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#6a7175] flex items-center justify-center text-white overflow-hidden">
            <User size={24} />
          </div>
          <div>
            <h4 className="text-[15px] font-medium text-[#e9edef] leading-tight">
              {conversation.contact.name || conversation.contact.number}
            </h4>
            <p className="text-[12px] text-[#8696a0] mt-0.5">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[#aebac1]">
          <Search size={20} className="cursor-pointer" />
          <MoreVertical size={20} className="cursor-pointer" />
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-10 py-6 space-y-2 scroll-smooth z-10"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#374045 transparent' }}
      >
        {messages.map((msg, idx) => (
          <div
            key={msg.id}
            className={cn(
              "flex w-full mb-1 animate-in",
              msg.fromMe ? "justify-end" : "justify-start"
            )}
            style={{ animationDelay: `${idx * 0.01}s` }}
          >
            <div
              className={cn(
                "max-w-[65%] px-3 py-1.5 rounded-lg text-[14.2px] leading-[19px] relative shadow-sm",
                msg.fromMe 
                  ? "bg-[#005c4b] text-[#e9edef] rounded-tr-none" 
                  : "bg-[#202c33] text-[#e9edef] rounded-tl-none"
              )}
            >
              <p className="whitespace-pre-wrap break-words">{msg.body}</p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-[11px] text-[#8696a0] font-normal uppercase">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.fromMe && (
                  <svg className="w-[16px] h-[16px] text-[#53bdeb]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1.172-6.914l-2.903-2.903 1.414-1.414 1.489 1.489 4.01-4.01 1.414 1.414-5.424 5.424z"/>
                  </svg>
                )}
              </div>
              
              {/* Bubble Tail */}
              <div className={cn(
                "absolute top-0 w-3 h-3",
                msg.fromMe 
                  ? "right-[-8px] text-[#005c4b]" 
                  : "left-[-8px] text-[#202c33]"
              )}>
                <svg viewBox="0 0 8 13" preserveAspectRatio="none" className="w-full h-full fill-current">
                  <path d={msg.fromMe ? "M0 0h8l-8 13z" : "M8 0H0l8 13z"} />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
