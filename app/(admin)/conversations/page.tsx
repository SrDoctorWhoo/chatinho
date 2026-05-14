'use client';

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { ConversationList } from '@/components/chat/ConversationList';
import { InternalChatList } from '@/components/chat/InternalChatList';
import { InternalChatWindow } from '@/components/chat/InternalChatWindow';

const ChatWindow = dynamic(() => import('@/components/chat/ChatWindow').then(m => m.ChatWindow), { ssr: false });
const MessageInput = dynamic(() => import('@/components/chat/message-input').then(m => m.MessageInput), { ssr: false });
import { useSocket } from '@/hooks/useSocket';
import { MessageSquare, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams, useRouter } from 'next/navigation';

function ConversationsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialId = searchParams.get('id');
  const { data: session } = useSession();
  const [messagesCache, setMessagesCache] = useState<Record<string, any[]>>({});
  const [hasMoreMap, setHasMoreMap] = useState<Record<string, boolean>>({});
  const [loadingMore, setLoadingMore] = useState(false);
  const [tick, setTick] = useState(0);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [availableDepartments, setAvailableDepartments] = useState<any[]>([]);
  const [toast, setToast] = useState<{message: string, show: boolean, type: 'success' | 'error'}>({message: '', show: false, type: 'success'});
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [viewMode, setViewMode] = useState<'CUSTOMERS' | 'INTERNAL'>(
    (session?.user as any)?.role === 'INTERNAL' ? 'INTERNAL' : 'CUSTOMERS'
  );
  const [internalChats, setInternalChats] = useState<any[]>([]);
  const [activeInternalChatId, setActiveInternalChatId] = useState<string | null>(null);
  const [lastPing, setLastPing] = useState<string | null>(null);
  const [internalUsers, setInternalUsers] = useState<any[]>([]);
  const [internalMessages, setInternalMessages] = useState<any[]>([]);
  const { socket, connected } = useSocket();

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

  const fetchInternalData = useCallback(async () => {
    try {
      const [chatsRes, usersRes] = await Promise.all([
        fetch('/api/internal/chats'),
        fetch('/api/internal/users')
      ]);
      if (chatsRes.ok) setInternalChats(await chatsRes.json());
      if (usersRes.ok) setInternalUsers(await usersRes.json());
    } catch (err) {
      console.error('Error fetching internal data:', err);
    }
  }, []);

  const fetchInternalMessages = useCallback(async (chatId: string) => {
    try {
      const res = await fetch(`/api/internal/chats/${chatId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setInternalMessages(data);
      }
    } catch (err) {
      console.error('Error fetching internal messages:', err);
    }
  }, []);

  useEffect(() => {
    if (activeInternalChatId) {
      fetchInternalMessages(activeInternalChatId);
    }
  }, [activeInternalChatId, fetchInternalMessages]);

  const handleStartDirectChat = async (userId: string) => {
    try {
      const res = await fetch('/api/internal/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'DIRECT', targetId: userId })
      });
      if (res.ok) {
        const chat = await res.json();
        setInternalChats(prev => {
          if (prev.find(c => c.id === chat.id)) return prev;
          return [chat, ...prev];
        });
        setActiveInternalChatId(chat.id);
      }
    } catch (err) {
      console.error('Error starting direct chat:', err);
      showToast('Erro ao iniciar chat direto', 'error');
    }
  };

  const handleSendInternalMessage = async (text: string) => {
    if (!activeInternalChatId) return;

    try {
      const res = await fetch(`/api/internal/chats/${activeInternalChatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text })
      });
      if (res.ok) {
        const message = await res.json();
        setInternalMessages(prev => {
          if (prev.find(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    } catch (err) {
      console.error('Error sending internal message:', err);
      showToast('Erro ao enviar mensagem interna', 'error');
    }
  };

  const handleSendInternalMedia = async (file: File, caption?: string) => {
    if (!activeInternalChatId) return;

    const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'document';
    const tempUrl = URL.createObjectURL(file);

    const newMessage = {
      id: 'temp-' + Date.now(),
      body: caption || (type === 'audio' ? 'Áudio' : file.name),
      senderId: session?.user?.id,
      sender: { name: session?.user?.name || 'Eu' },
      createdAt: new Date().toISOString(),
      type,
      mediaUrl: tempUrl
    };
    
    setInternalMessages(prev => [...prev, newMessage]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (caption) formData.append('caption', caption);

      const res = await fetch(`/api/internal/chats/${activeInternalChatId}/messages/send-media`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const message = await res.json();
        setInternalMessages(prev => prev.map(m => m.id === newMessage.id ? message : m));
      } else {
        showToast('Erro ao enviar mídia interna', 'error');
        setInternalMessages(prev => prev.filter(m => m.id !== newMessage.id));
      }
    } catch (err) {
      console.error('Error sending internal media:', err);
      showToast('Erro ao enviar mídia interna', 'error');
    } finally {
      URL.revokeObjectURL(tempUrl);
    }
  };

  const handleStartDepartmentChat = async (departmentId: string) => {
    try {
      const res = await fetch('/api/internal/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'GROUP', departmentId })
      });
      if (res.ok) {
        const chat = await res.json();
        setActiveInternalChatId(chat.id);
        fetchInternalData();
      }
    } catch (err) {
      console.error('Error starting department chat:', err);
      showToast('Erro ao iniciar chat de setor', 'error');
    }
  };

  const activeIdRef = useRef<string | null>(null);

  const fetchMessages = useCallback(async (conversationId: string, cursor?: string) => {
    try {
      const url = `/api/conversations/${conversationId}/messages?limit=50&scope=all${cursor ? `&cursor=${cursor}` : ''}`;
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
          const updated = [...current, ...newMessages];
          return { ...prev, [conversationId]: updated };
        } else {
          return { ...prev, [conversationId]: newMessages };
        }
      });

      // Só atualiza a view se ainda for a conversa ativa (usando ref para evitar stale closure)
      if (activeIdRef.current === conversationId) {
        if (cursor) {
          setMessages(prev => {
            const combined = [...prev, ...newMessages];
            return combined.sort((a, b) => 
              new Date(b.createdAt || b.timestamp || 0).getTime() - 
              new Date(a.createdAt || a.timestamp || 0).getTime()
            );
          });
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

  useEffect(() => {
    activeIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const processedInitialId = useRef<string | null>(null);

  useEffect(() => {
    if (!initialId || processedInitialId.current === initialId) return;

    const selectConversation = async () => {
      processedInitialId.current = initialId;
      
      // 1. Tenta achar na lista local
      const localConv = conversations.find(c => c.id === initialId);
      if (localConv) {
        handleSelectConversation(initialId);
      } else {
        // 2. Se não achar local, busca no servidor (importante para tickets fechados/antigos)
        try {
          const res = await fetch(`/api/conversations/${initialId}`);
          if (res.ok) {
            const remoteConv = await res.json();
            setConversations(prev => {
              if (prev.find(c => c.id === remoteConv.id)) return prev;
              return [remoteConv, ...prev];
            });
            handleSelectConversation(initialId);
          }
        } catch (err) {
          console.error('Erro ao buscar conversa inicial:', err);
        }
      }

      // 3. Limpa os parâmetros da URL APENAS após garantir a seleção
      const isGenerating = searchParams.get('generateReport') === 'true';
      if (!isGenerating) {
        const params = new URLSearchParams(searchParams.toString());
        if (params.has('id')) {
          params.delete('id');
          router.replace(`/conversations${params.toString() ? '?' + params.toString() : ''}`);
        }
      }
    };

    selectConversation();
  }, [initialId, conversations, router, searchParams, handleSelectConversation]);


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
    if (viewMode === 'INTERNAL') {
      fetchInternalData();
    }
  }, [viewMode, fetchInternalData]);

  useEffect(() => {
    if (!socket) return;

    socket.on('ping', (data: any) => {
      setLastPing(new Date().toLocaleTimeString());
    });

    socket.on('new_message', (data: any) => {
      const { conversationId: rawId, message, conversation: updatedConv } = data;
      const conversationId = String(rawId);
      const currentActiveId = activeIdRef.current ? String(activeIdRef.current) : null;
      
      console.log(`%c[SOCKET] 📥 MENSAGEM: ${message.id} | Conv: ${conversationId}`, 'background: #0000ff; color: white; padding: 2px;');
      (window as any).lastMsg = data;

      // SÓ NOTIFICA SE NÃO ESTIVER NA CONVERSA ATIVA
      if (currentActiveId !== conversationId) {
        const playSound = () => {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
          audio.play().catch(() => {});
        };
        playSound();

        const alertDiv = document.createElement('div');
        alertDiv.innerHTML = `⚡ <b>NOVA MENSAGEM:</b> ${message.body.substring(0, 20)}${message.body.length > 20 ? '...' : ''}`;
        alertDiv.style.cssText = 'position:fixed; top:20px; right:20px; background:linear-gradient(to right, #10b981, #3b82f6); color:white; padding:15px 25px; z-index:9999; border-radius:15px; font-weight:bold; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); animation: slideIn 0.5s ease-out;';
        document.body.appendChild(alertDiv);
        setTimeout(() => { alertDiv.style.opacity = '0'; setTimeout(() => alertDiv.remove(), 1000); }, 4000);
      }

      // 1. Atualizar a Janela de Chat (Mensagens) - FORÇADO E ROBUSTO
      const cleanActiveId = currentActiveId?.trim().toLowerCase();
      const cleanTargetId = conversationId?.trim().toLowerCase();

      console.log(`[SOCKET] Auditoria: Ativa(${cleanActiveId}) | Alvo(${cleanTargetId})`);

      if (cleanActiveId === cleanTargetId) {
        console.log('%c[SOCKET] 💉 INJETANDO MENSAGEM NO CHAT ABERTO!', 'background: #22c55e; color: white; padding: 4px; border-radius: 4px;');
        setMessages(prev => {
          const messageId = String(message.id);
          // EVITAR DUPLICIDADE: Verifica se a mensagem já existe no estado
          if (prev.some(m => String(m.id) === messageId)) return prev;
          
          // Garante que a mensagem tenha uma data válida para o sort
          const newMessage = {
            ...message,
            _isAgent: message.body?.startsWith('*') || message.body?.includes('Atendente'),
            createdAt: message.createdAt || new Date().toISOString(),
            timestamp: message.timestamp || new Date().toISOString()
          };

          const newList = [...prev, newMessage];
          return newList.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.timestamp || 0).getTime();
            const dateB = new Date(b.createdAt || b.timestamp || 0).getTime();
            return dateB - dateA; // Newer to older for flex-col-reverse
          });
        });
      }

      // 2. Atualizar a Lateral (Conversas)
      setConversations(prev => {
        const index = prev.findIndex(c => String(c.id) === conversationId);
        if (index !== -1) {
          const updatedList = [...prev];
          const conv = { ...updatedList[index] };
          conv.lastMessageAt = message.timestamp || message.createdAt;
          conv.lastMessage = message.body;
          if (updatedConv) Object.assign(conv, updatedConv);
          updatedList.splice(index, 1);
          return [conv, ...updatedList];
        } else {
          fetchConversations();
          return prev;
        }
      });

      setTick(t => t + 1);
    });

    socket.on('new_internal_message', (data: any) => {
      const { chatId, message } = data;
      
      if (activeInternalChatId === chatId) {
        setInternalMessages(prev => {
          if (prev.find(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }

      setInternalChats(prev => {
        const index = prev.findIndex(c => c.id === chatId);
        if (index !== -1) {
          const updated = [...prev];
          // Cria uma nova referência para o chat para forçar re-render e evita mutação direta
          updated[index] = { 
            ...updated[index], 
            messages: [message], 
            updatedAt: new Date().toISOString() 
          };
          // Ordena para que o chat atualizado suba para o topo
          return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        } else {
          console.log('[Socket] Chat interno não encontrado, recarregando lista...');
          fetchInternalData();
          return prev;
        }
      });
    });

    return () => {
      socket.off('new_message');
      socket.off('new_internal_message');
    };
  }, [socket, activeConversationId, activeInternalChatId, fetchConversations, fetchInternalData]);

  // Fallback Polling - Se o socket não estiver conectado, busca dados a cada 5s
  useEffect(() => {
    if (connected) return;

    const interval = setInterval(() => {
      console.log('[Polling] Buscando atualizações...');
      fetchConversations();
      if (activeConversationId) {
        fetchMessages(activeConversationId);
      }
      if (viewMode === 'INTERNAL') {
        fetchInternalData();
        if (activeInternalChatId) {
          fetchInternalMessages(activeInternalChatId);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [connected, activeConversationId, activeInternalChatId, viewMode, fetchConversations, fetchMessages, fetchInternalData, fetchInternalMessages]);


  const handleSendMessage = async (text: string, type: 'chat' | 'internal' = 'chat') => {
    if (!activeConversation) return;

    const signature = currentUser?.signature;
    const bodyWithSignature = (signature && type === 'chat') ? `*${signature}*\n${text}` : text;

    const newMessage = {
      id: 'temp-' + Date.now(),
      body: bodyWithSignature,
      fromMe: true,
      timestamp: new Date().toISOString(),
      type: type
    };
    
    setMessages(prev => [{ ...newMessage, _isAgent: true }, ...prev]);
    setMessagesCache(prev => ({
      ...prev,
      [activeConversation.id]: [{ ...newMessage, _isAgent: true }, ...(prev[activeConversation.id] || [])]
    }));

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          text,
          type
        })
      });
      if (!response.ok) {
        const data = await response.json();
        showToast(data.error || 'Erro ao enviar mensagem', 'error');
        // Remove temp message on error
        setMessages(prev => prev.filter(m => m.id !== newMessage.id));
      } else {
        const data = await response.json();
        if (data) {
          setMessages(prev => {
            const dataId = String(data.id);
            const tempId = String(newMessage.id);
            
            // Se o socket já inseriu a mensagem real (com o mesmo ID), removemos a temporária.
            if (prev.some(m => String(m.id) === dataId)) {
              return prev.filter(m => String(m.id) !== tempId);
            }
            // Caso contrário, substituímos a temporária pela real.
            return prev.map(m => String(m.id) === tempId ? { ...data, _isAgent: true } : m);
          });
          
          setMessagesCache(prev => {
            const conversationId = activeConversation.id;
            const currentMsgs = prev[conversationId] || [];
            if (currentMsgs.some(m => String(m.id) === String(data.id))) {
              return {
                ...prev,
                [conversationId]: currentMsgs.filter(m => String(m.id) !== String(newMessage.id))
              };
            }
            return {
              ...prev,
              [conversationId]: currentMsgs.map(m => String(m.id) === String(newMessage.id) ? { ...data, _isAgent: true } : m)
            };
          });
        }
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
    
    setMessages(prev => [newMessage, ...prev]);
    setMessagesCache(prev => ({
      ...prev,
      [activeConversation.id]: [newMessage, ...(prev[activeConversation.id] || [])]
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
    <>

      <div className="p-8 h-full flex flex-col">
      <div className="flex-1 glass-panel rounded-[2rem] overflow-hidden flex shadow-2xl animate-in border-white/5">
      {/* Sidebar - Contatos */}
      <div className={cn(
        "flex-shrink-0 border-r border-white/5 flex flex-col bg-white/[0.02] z-20 backdrop-blur-md transition-all duration-500 ease-in-out overflow-hidden",
        isSidebarVisible ? "w-[380px] opacity-100" : "w-0 opacity-0 border-none"
      )}>
        {/* View Mode Toggle */}
        <div className="flex-shrink-0 p-4 flex gap-2 border-b border-white/5 bg-black/20">
          {(session?.user as any)?.role !== 'INTERNAL' && (
            <button 
              onClick={() => setViewMode('CUSTOMERS')}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                viewMode === 'CUSTOMERS' ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:bg-white/5"
              )}
            >
              Clientes
            </button>
          )}
          <button 
            onClick={() => setViewMode('INTERNAL')}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              viewMode === 'INTERNAL' ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:bg-white/5"
            )}
          >
            Interno
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {viewMode === 'CUSTOMERS' ? (
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
          ) : (
            <InternalChatList 
              chats={internalChats}
              users={internalUsers}
              activeChatId={activeInternalChatId}
              onSelectChat={setActiveInternalChatId}
              onStartDirectChat={handleStartDirectChat}
              onStartDepartmentChat={handleStartDepartmentChat}
              currentUserId={session?.user?.id || ''}
            />
          )}
        </div>

        {/* Socket Indicators Relocated to Sidebar Bottom */}
        <div className="p-4 bg-black/20 border-t border-white/5 space-y-2">
          <div className={cn(
            "px-3 py-1.5 rounded-xl text-[9px] font-black tracking-[0.1em] flex items-center justify-center gap-2 border backdrop-blur-md transition-all duration-500",
            connected ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-red-500/10 border-red-500/20 text-red-500"
          )}>
            <div className={cn("w-1.5 h-1.5 rounded-full", connected ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
            SOCKET: {connected ? "CONECTADO" : "DESCONECTADO"}
          </div>
          {lastPing && (
            <div className="px-3 py-1 bg-blue-500/5 border border-white/5 text-slate-500 text-[8px] font-bold rounded-lg text-center uppercase tracking-widest">
              Último Sinal: {lastPing}
            </div>
          )}
        </div>
      </div>
      
      {/* Área do Chat */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950/30 relative z-30">
        {viewMode === 'INTERNAL' && activeInternalChatId ? (
          <InternalChatWindow 
            chat={internalChats.find(c => c.id === activeInternalChatId)}
            messages={internalMessages}
            currentUserId={session?.user?.id || ''}
            onSendMessage={handleSendInternalMessage}
            onSendMedia={handleSendInternalMedia}
          />
        ) : activeConversation ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <ChatWindow 
              conversation={activeConversation} 
              messages={messages}
              onSendMessage={handleSendMessage}
              onSendMedia={handleSendMedia}
              onStatusUpdate={fetchConversations}
              onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
              isSidebarCollapsed={!isSidebarVisible}
              onLoadMore={loadMoreMessages}
              hasMore={hasMoreMap[activeConversationId || '']}
              autoGenerateReport={searchParams.get('generateReport') === 'true'}
              onDeleted={() => {
                setActiveConversationId(null);
                showToast('Ação concluída com sucesso!');
              }}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-10 animate-pulse" />
              <div className={cn(
                "relative w-24 h-24 rounded-[2rem] flex items-center justify-center border transition-all",
                viewMode === 'INTERNAL' ? "bg-blue-500/20 text-blue-400 border-blue-500/20" : "bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/20"
              )}>
                <MessageSquare size={48} strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
              {viewMode === 'INTERNAL' ? 'Chat da Equipe' : 'Painel de Atendimento'}
            </h2>
            <p className="max-w-md text-slate-400 font-medium leading-relaxed">
              {viewMode === 'INTERNAL' 
                ? 'Selecione um colega ou canal de setor para iniciar uma conversa colaborativa interna.'
                : 'Selecione uma conversa ao lado para iniciar a interação em tempo real com seus clientes.'}
            </p>
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
  </>
  );
}

export default function ConversationsPage() {
  return (
    <Suspense fallback={<div className="p-8 h-full flex items-center justify-center text-white">Carregando conversas...</div>}>
      <ConversationsContent />
    </Suspense>
  );
}
