'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { ConversationList } from '@/components/chat/ConversationList';

const ChatWindow = dynamic(() => import('@/components/chat/ChatWindow').then(m => m.ChatWindow), { ssr: false });
const MessageInput = dynamic(() => import('@/components/chat/message-input').then(m => m.MessageInput), { ssr: false });
import { useSocket } from '@/hooks/useSocket';
import { MessageSquare, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ConversationsPage() {
  const { data: session } = useSession();
  const [messagesCache, setMessagesCache] = useState<Record<string, any[]>>({});
  const [hasMoreMap, setHasMoreMap] = useState<Record<string, boolean>>({});
  const [loadingMore, setLoadingMore] = useState(false);
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

  // Active conversation helper
  const activeConversation = useMemo(() => 
    conversations.find(c => c.id === activeConversationId),
    [conversations, activeConversationId]
  );

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({message, show: true, type});
    setTimeout(() => setToast({message: '', show: false, type}), 4000);
  };

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/users/${session.user.id}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setCurrentUser(data);
        })
        .catch(err => console.error('Error fetching user:', err));
    }
  }, [session]);

  useEffect(() => {
    if (session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER') {
      fetch('/api/departments')
        .then(res => res.ok ? res.text() : Promise.resolve('[]'))
        .then(text => {
          const data = text ? JSON.parse(text) : [];
          if (Array.isArray(data)) setAvailableDepartments(data);
        })
        .catch(err => console.error('Error fetching departments:', err));
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
      if (!res.ok) throw new Error('Failed to fetch conversations');
      
      const text = await res.text();
      const data = text ? JSON.parse(text) : [];
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter, selectedDepartment]);

  const activeIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const fetchMessages = useCallback(async (conversationId: string, cursor?: string) => {
    try {
      const url = `/api/conversations/${conversationId}/messages?limit=50${cursor ? `&cursor=${cursor}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch messages');

      const data = await res.json();
      const newMessages = Array.isArray(data) ? data : [];
      
      setHasMoreMap(prev => ({
        ...prev,
        [conversationId]: newMessages.length === 50
      }));

      // Atualiza o cache sempre
      setMessagesCache(prev => {
        const current = prev[conversationId] || [];
        if (cursor) {
          const updated = [...newMessages, ...current];
          return { ...prev, [conversationId]: updated };
        } else {
          return { ...prev, [conversationId]: newMessages };
        }
      });

      // Só atualiza a view se ainda for a conversa ativa (usando ref para evitar stale closure)
      if (activeIdRef.current === conversationId) {
        if (cursor) {
          setMessages(prev => [...newMessages, ...prev]);
        } else {
          setMessages(newMessages);
        }
      }
      
      return newMessages;
    } catch (err) {
      console.error(err);
      return [];
    }
  }, []);

  const loadMoreMessages = useCallback(async () => {
    if (!activeConversationId || loadingMore || !hasMoreMap[activeConversationId]) return;
    
    const oldestMessage = messages[0];
    if (!oldestMessage?.id) return;

    setLoadingMore(true);
    await fetchMessages(activeConversationId, oldestMessage.id);
    setLoadingMore(false);
  }, [activeConversationId, messages, loadingMore, hasMoreMap, fetchMessages]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', (data: any) => {
      const { conversationId, message } = data;

      // 1. Update Global Cache
      setMessagesCache(prev => {
        const current = prev[conversationId] || [];
        if (current.find(m => m.id === message.id)) return prev;
        return { ...prev, [conversationId]: [...current, message] };
      });

      // 2. Update Active View
      if (activeConversationId === conversationId) {
        setMessages(prev => {
          if (prev.find(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }

      // 3. Update Conversation List
      setConversations(prev => {
        const index = prev.findIndex(c => c.id === conversationId);
        if (index !== -1) {
          const updated = [...prev];
          const conv = { ...updated[index] };
          conv.lastMessageAt = message.timestamp;
          conv.messages = [message];
          if (data.conversation) Object.assign(conv, data.conversation);
          updated.splice(index, 1);
          return [conv, ...updated];
        } else {
          fetchConversations();
          return prev;
        }
      });
    });

    return () => {
      socket.off('new_message');
    };
  }, [socket, activeConversationId, fetchConversations]);

  const handleSelectConversation = useCallback(async (id: string) => {
    if (id === activeConversationId) return;
    
    setActiveConversationId(id);
    
    // Check Cache first
    if (messagesCache[id]) {
      setMessages(messagesCache[id]);
      // Silently refresh last 50 to keep it fresh
      fetchMessages(id);
    } else {
      setMessages([]);
      await fetchMessages(id);
    }
  }, [activeConversationId, messagesCache, fetchMessages]);

  const handleSendMessage = async (text: string) => {
    if (!activeConversation) return;

    const signature = currentUser?.signature;
    const bodyWithSignature = signature ? `*${signature}*\n${text}` : text;

    const newMessage = {
      id: 'temp-' + Date.now(),
      body: bodyWithSignature,
      fromMe: true,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessagesCache(prev => ({
      ...prev,
      [activeConversation.id]: [...(prev[activeConversation.id] || []), newMessage]
    }));

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          text
        })
      });
      if (!response.ok) {
        const data = await response.json();
        showToast(data.error || 'Erro ao enviar mensagem', 'error');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      showToast('Erro de conexão ao enviar mensagem', 'error');
    }
  };

  const handleSendMedia = async (file: File, caption?: string) => {
    if (!activeConversation) return;

    const signature = currentUser?.signature;
    const bodyWithSignature = signature ? `*${signature}*\n${caption || ''}` : (caption || '');

    const newMessage = {
      id: 'temp-' + Date.now(),
      body: bodyWithSignature || (file.type.includes('image') ? '' : `Mídia: ${file.name}`),
      fromMe: true,
      timestamp: new Date().toISOString(),
      type: file.type.includes('image') ? 'image' : file.type.includes('audio') ? 'audio' : 'document',
      mediaUrl: URL.createObjectURL(file)
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessagesCache(prev => ({
      ...prev,
      [activeConversation.id]: [...(prev[activeConversation.id] || []), newMessage]
    }));

    try {
      const formData = new FormData();
      formData.append('conversationId', activeConversation.id);
      formData.append('file', file);
      if (caption) formData.append('caption', caption);

      const response = await fetch('/api/messages/send-media', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        showToast(data.error || 'Erro ao enviar mídia', 'error');
        setMessages(prev => prev.filter(m => m.id !== newMessage.id));
      } else {
        const data = await response.json();
        if (data.message) {
          setMessages(prev => prev.map(m => m.id === newMessage.id ? data.message : m));
          setMessagesCache(prev => ({
            ...prev,
            [activeConversation.id]: (prev[activeConversation.id] || []).map(m => m.id === newMessage.id ? data.message : m)
          }));
        }
      }
      URL.revokeObjectURL(newMessage.mediaUrl);
    } catch (err) {
      console.error('Failed to send media:', err);
      showToast('Erro de conexão ao enviar mídia', 'error');
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex-1 glass-panel rounded-[2rem] overflow-hidden flex shadow-2xl animate-in border-white/5">
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
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950/30 relative z-30">
        {activeConversation ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 min-h-0">
              <ChatWindow 
                conversation={activeConversation} 
                messages={messages}
                onStatusUpdate={fetchConversations}
                onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
                isSidebarCollapsed={!isSidebarVisible}
                onLoadMore={loadMoreMessages}
                hasMore={hasMoreMap[activeConversationId || '']}
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
  </div>
  );
}
