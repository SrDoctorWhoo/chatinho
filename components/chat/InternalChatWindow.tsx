'use client';

import { cn } from '@/lib/utils';
import { 
  Users, Hash, MoreVertical, Search, Send, User as UserIcon,
  Bot, Clock, ShieldCheck, Paperclip
} from 'lucide-react';
import React, { useEffect, useRef, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageInput } from './message-input';

interface InternalMessage {
  id: string;
  body: string;
  senderId: string;
  sender: { name: string };
  createdAt: string;
  type?: string;
  mediaUrl?: string;
}

interface InternalChatWindowProps {
  chat: any;
  messages: InternalMessage[];
  currentUserId: string;
  onSendMessage: (text: string) => void;
  onSendMedia?: (file: File, caption?: string) => void;
}

export function InternalChatWindow({ 
  chat, 
  messages, 
  currentUserId,
  onSendMessage,
  onSendMedia
}: InternalChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!chat) return null;

  const chatPartner = useMemo(() => {
    if (chat.type !== 'DIRECT') return null;
    return chat.participants?.find((p: any) => p.userId !== currentUserId)?.user;
  }, [chat, currentUserId]);

  return (
    <div className="flex flex-col h-full bg-[#0b141a] relative overflow-hidden">
      
      {/* Header Premium */}
      <header className="h-[70px] bg-[#111b21] border-b border-white/5 flex items-center justify-between px-6 shrink-0 relative z-10">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden group",
            chat.type === 'GROUP' ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
          )}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            {chat.type === 'GROUP' ? <Hash size={20} /> : <UserIcon size={20} />}
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              {chat.type === 'GROUP' ? chat.name : chatPartner?.name}
              {chat.type === 'GROUP' && <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] rounded-md border border-emerald-500/20">Setor</span>}
              {chat.type === 'DIRECT' && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />}
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              {chat.type === 'GROUP' ? 'Canal de Colaboração da Equipe' : `${chatPartner?.email} • Online`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
             <ShieldCheck size={12} className="text-blue-400" />
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Criptografia Interna</span>
          </div>
          
          <div className="flex items-center gap-1">
            <AnimatePresence>
              {isSearching && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 200, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Buscar na conversa..."
                    value={localSearchTerm}
                    onChange={(e) => setLocalSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-1.5 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <button 
              onClick={() => {
                setIsSearching(!isSearching);
                if (isSearching) setLocalSearchTerm('');
              }}
              className={cn(
                "p-2.5 rounded-xl transition-all",
                isSearching ? "bg-blue-500 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Search size={20} />
            </button>
          </div>

          <button className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
            <MoreVertical size={20} />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[url('/bg-chat.png')] bg-repeat opacity-95"
      >
        <div className="flex flex-col items-center my-8">
           <div className="px-4 py-2 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/5 flex items-center gap-3">
              <Clock size={12} className="text-slate-500" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Início da Conversa Segura</span>
           </div>
        </div>

        {messages
          .filter(msg => !localSearchTerm || msg.body.toLowerCase().includes(localSearchTerm.toLowerCase()))
          .map((msg, idx) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex w-full group",
                isMe ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "max-w-[70%] flex flex-col",
                isMe ? "items-end" : "items-start"
              )}>
                {!isMe && chat.type === 'GROUP' && (
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1 ml-2">
                    {msg.sender.name}
                  </span>
                )}
                <div className={cn(
                  "px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-xl relative min-w-[120px]",
                  isMe 
                    ? "bg-blue-600 text-white rounded-tr-sm" 
                    : "bg-[#202c33] text-[#e9edef] rounded-tl-sm border border-white/5"
                )}>
                  {msg.type === 'image' && msg.mediaUrl && (
                    <div className="mb-2 rounded-lg overflow-hidden border border-white/10">
                      <img src={msg.mediaUrl} alt="Imagem" className="max-w-full h-auto object-cover cursor-pointer hover:scale-105 transition-transform" />
                    </div>
                  )}

                  {msg.type === 'audio' && msg.mediaUrl && (
                    <div className="mb-2 min-w-[240px]">
                      <audio controls className="w-full h-10 filter invert brightness-200">
                        <source src={msg.mediaUrl} type="audio/mpeg" />
                      </audio>
                    </div>
                  )}

                  {msg.type === 'document' && msg.mediaUrl && (
                    <a 
                      href={msg.mediaUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 mb-2 bg-black/20 rounded-xl hover:bg-black/30 transition-colors border border-white/5 group"
                    >
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                        <Paperclip size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold truncate pr-4">{msg.body}</p>
                        <p className="text-[9px] opacity-50 uppercase tracking-widest mt-0.5">Clique para baixar</p>
                      </div>
                    </a>
                  )}

                  {(msg.type === 'chat' || !msg.type || (msg.type !== 'document' && msg.body !== 'Áudio')) && (
                    <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                  )}

                  <div className={cn(
                    "flex items-center gap-1.5 mt-1.5 opacity-50",
                    isMe ? "justify-end" : "justify-start"
                  )}>
                    <span className="text-[9px] font-bold">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 bg-white/5 border-t border-white/5 backdrop-blur-md relative z-20">
        <MessageInput 
          onSend={onSendMessage} 
          onSendMedia={onSendMedia}
          disabled={!chat}
        />
      </div>
    </div>
  );
}
