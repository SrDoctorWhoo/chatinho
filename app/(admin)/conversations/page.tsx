'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { ConversationList } from '@/components/chat/ConversationList';

const ChatWindow = dynamic(() => import('@/components/chat/ChatWindow').then(m => m.ChatWindow), { ssr: false });
const MessageInput = dynamic(() => import('@/components/chat/MessageInput').then(m => m.MessageInput), { ssr: false });
import { useSocket } from '@/hooks/useSocket';
import { MessageSquare, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ConversationsPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [availableDepartments, setAvailableDepartments] = useState<any[]>([]);
  const [toast, setToast] = useState<{message: string, show: boolean, type: 'success' | 'error'}>({message: '', show: false, type: 'success'});
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const { socket } = useSocket();

  // Conversa ativa calculada a partir da lista
  const activeConversation = conversations.find(c => c.id === activeConversationId);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({message, show: true, type});
    setTimeout(() => setToast({message: '', show: false, type}), 4000);
  };

  useEffect(() => {
    if (session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER') {
      fetch('/api/departments')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setAvailableDepartments(data);
        });
    }
  }, [session]);

  const fetchConversations = useCallback(async () => {
    try {
      let url = '/api/conversations';
      const params = new URLSearchParams();
      
      if (filter === 'mine') {
        params.append('mine', 'true');
      } else if (filter !== 'all') {
        params.append('status', filter);
      }

      if (selectedDepartment !== 'all') {
        params.append('departmentId', selectedDepartment);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter, selectedDepartment]);

  const fetchMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', (data: any) => {
      // 1. Update messages if the conversation is active
      if (activeConversationId === data.conversationId) {
        setMessages(prev => {
          // Evitar mensagens duplicadas (caso o optimistic UI já tenha adicionado)
          if (prev.find(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }

      // 2. Re-order conversations list locally for instant feedback
      setConversations(prev => {
        const index = prev.findIndex(c => c.id === data.conversationId);
        
        if (index !== -1) {
          // Conversa já existe na lista
          const updatedConversations = [...prev];
          const conversation = { ...updatedConversations[index] };
          
          // Atualiza dados da última mensagem
          conversation.lastMessageAt = data.message.timestamp;
          conversation.messages = [data.message];
          
          // Se o webhook mandou o estado atualizado da conversa (com assignedTo etc)
          if (data.conversation) {
             Object.assign(conversation, data.conversation);
          }

          // Remove da posição atual e coloca no topo
          updatedConversations.splice(index, 1);
          return [conversation, ...updatedConversations];
        } else {
          // Conversa nova ou não estava na lista carregada
          fetchConversations();
          return prev;
        }
      });
    });

    return () => {
      socket.off('new_message');
    };
  }, [socket, activeConversationId, fetchConversations]);

  const handleSelectConversation = async (id: string) => {
    setActiveConversationId(id);
    await fetchMessages(id);
  };

  const handleSendMessage = async (text: string) => {
    if (!activeConversation) return;

    const newMessage = {
      id: 'temp-' + Date.now(),
      body: text,
      fromMe: true,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMessage]);

    try {
      await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          text
        })
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleSendMedia = async (file: File, caption?: string) => {
    if (!activeConversation) return;

    const newMessage = {
      id: 'temp-' + Date.now(),
      body: caption || `📷 Mídia: ${file.name}`,
      fromMe: true,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMessage]);

    try {
      const formData = new FormData();
      formData.append('conversationId', activeConversation.id);
      formData.append('file', file);
      if (caption) formData.append('caption', caption);

      await fetch('/api/messages/send-media', {
        method: 'POST',
        body: formData
      });
    } catch (err) {
      console.error('Failed to send media:', err);
    }
  };

  return (
    <div className="h-[calc(100vh-160px)] glass-panel rounded-[2rem] overflow-hidden flex shadow-2xl animate-in border-white/5">
      {/* Sidebar - Contatos */}
      <div className={cn(
        "flex-shrink-0 border-r border-white/5 flex flex-col bg-white/[0.02] z-20 backdrop-blur-md transition-all duration-500 ease-in-out overflow-hidden",
        isSidebarVisible ? "w-[380px] opacity-100" : "w-0 opacity-0 border-none"
      )}>
        <ConversationList 
          conversations={conversations} 
          activeId={activeConversationId || undefined}
          onSelect={handleSelectConversation}
          filter={filter}
          setFilter={setFilter}
          departments={availableDepartments}
          selectedDepartment={selectedDepartment}
          onDepartmentChange={setSelectedDepartment}
          showDeptFilter={session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER'}
        />
      </div>
      
      {/* Área do Chat */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950/30 relative z-10">
        {activeConversation ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 min-h-0">
              <ChatWindow 
                conversation={activeConversation} 
                messages={messages}
                onStatusUpdate={fetchConversations}
                onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
                isSidebarCollapsed={!isSidebarVisible}
                onDeleted={() => {
                  setActiveConversationId(null);
                  showToast('Ação concluída com sucesso!');
                }}
              />
            </div>
            <div className="flex-shrink-0 bg-white/5 px-6 py-4 border-t border-white/5 backdrop-blur-md relative z-20">
              <MessageInput 
                onSend={handleSendMessage} 
                onSendMedia={handleSendMedia}
                disabled={!activeConversation}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-10 animate-pulse" />
              <div className="relative w-24 h-24 rounded-[2rem] bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <MessageSquare size={48} strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Painel de Atendimento</h2>
            <p className="max-w-md text-slate-400 font-medium leading-relaxed">
              Selecione uma conversa ao lado para iniciar a interação em tempo real com seus clientes.
            </p>
            <div className="mt-10 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-widest uppercase">
              <ShieldAlert size={14} />
              Sistema de Mensageria Seguro
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in fade-in slide-in-from-bottom-5">
          <div className={cn(
            "flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border text-sm font-semibold text-white",
            toast.type === 'success' ? "bg-[#00a884] border-[#06cf9c]" : "bg-red-500 border-red-400"
          )}>
            <ShieldAlert size={20} />
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
