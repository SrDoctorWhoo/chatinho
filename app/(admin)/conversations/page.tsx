'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ConversationList } from '@/components/chat/ConversationList';

const ChatWindow = dynamic(() => import('@/components/chat/ChatWindow').then(m => m.ChatWindow), { ssr: false });
const MessageInput = dynamic(() => import('@/components/chat/MessageInput').then(m => m.MessageInput), { ssr: false });
import { useSocket } from '@/hooks/useSocket';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

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
      // 1. Update messages if this is the active conversation
      if (activeConversation?.id === data.conversationId) {
        setMessages(prev => [...prev, data.message]);
      }

      // 2. Refresh conversation list to show new message/order
      fetchConversations();
    });

    return () => {
      socket.off('new_message');
    };
  }, [socket, activeConversation, fetchConversations]);

  const handleSelectConversation = async (id: string) => {
    console.log(`[DEBUG] Selecionando conversa: ${id}`);
    const conv = conversations.find(c => c.id === id);
    setActiveConversation(conv);
    await fetchMessages(id);
  };

  const handleSendMessage = async (text: string) => {
    console.log(`[DEBUG] Tentando enviar mensagem: ${text}`);
    if (!activeConversation) return;

    // 1. Optimistic update
    const newMessage = {
      id: 'temp-' + Date.now(),
      body: text,
      fromMe: true,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMessage]);

    // 2. Send to API
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          text
        })
      });
      console.log(`[DEBUG] Resultado do envio: ${res.status}`);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] glass-panel rounded-[1.5rem] overflow-hidden flex shadow-2xl animate-in bg-[#0b141a] border-none z-0">
      {/* Sidebar - Contatos */}
      <div className="w-[350px] flex-shrink-0 border-r border-slate-800/50 flex flex-col bg-[#111b21] z-20">
        <ConversationList 
          conversations={conversations} 
          activeId={activeConversation?.id}
          onSelect={handleSelectConversation}
        />
      </div>
      
      {/* Área do Chat */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0b141a] relative z-10">
        {activeConversation ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 min-h-0">
              <ChatWindow 
                conversation={activeConversation} 
                messages={messages}
              />
            </div>
            <div className="flex-shrink-0 bg-[#202c33] px-4 py-3 border-t border-slate-800/50">
              <MessageInput 
                onSend={handleSendMessage} 
                disabled={!activeConversation}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center bg-[#222e35]">
            <div className="w-24 h-24 rounded-full bg-[#2a3942] flex items-center justify-center mb-6">
              <svg className="w-12 h-12 opacity-20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
            </div>
            <h2 className="text-2xl font-light text-slate-300 mb-2">WhatsApp Web Nativo</h2>
            <p className="max-w-md opacity-50">Selecione uma conversa para começar a enviar e receber mensagens em tempo real.</p>
          </div>
        )}
      </div>
    </div>
  );
}
