'use client';

import { cn } from '@/lib/utils';
import { User, Phone, MoreVertical, Search, CheckCircle2, XCircle, UserPlus, X, Bot, Play, Pause } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Message {
  id: string;
  body: string;
  fromMe: boolean;
  timestamp: string;
}

interface ChatWindowProps {
  conversation: any;
  messages: Message[];
  onStatusUpdate: () => void;
  onDeleted?: () => void;
}

export function ChatWindow({ conversation, messages, onStatusUpdate, onDeleted }: ChatWindowProps) {
  const [updating, setUpdating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [localIsBotActive, setLocalIsBotActive] = useState(conversation?.isBotActive || false);
  
  // Sincroniza estado local quando a prop muda
  useEffect(() => {
    setLocalIsBotActive(conversation?.isBotActive || false);
  }, [conversation?.isBotActive]);
  
  // Modals state
  const [activeModal, setActiveModal] = useState<'transfer' | 'edit' | 'note' | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactNotes, setContactNotes] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeModal === 'transfer' && users.length === 0) {
      fetch('/api/users').then(res => res.json()).then(data => {
        if(Array.isArray(data)) setUsers(data);
      });
    }
    if (activeModal === 'edit') {
      setContactName(conversation?.contact?.name || conversation?.contact?.number || '');
    }
    if (activeModal === 'note') {
      setContactNotes(conversation?.contact?.notes || '');
    }
  }, [activeModal, conversation]);

  const displayedMessages = searchTerm 
    ? messages.filter(m => m.body?.toLowerCase().includes(searchTerm.toLowerCase()))
    : messages;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedMessages]);

  const handleAccept = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/accept`, { method: 'POST' });
      if (res.ok) onStatusUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = async () => {
    if (!confirm('Deseja realmente encerrar este atendimento?')) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/close`, { method: 'POST' });
      if (res.ok) onStatusUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!confirm('ATENÇÃO: Deseja realmente excluir permanentemente esta conversa e todas as suas mensagens?')) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/conversations/${conversation.id}`, { method: 'DELETE' });
      if (res.ok) {
        if (onDeleted) onDeleted();
        onStatusUpdate();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!confirm('ATENÇÃO: Deseja realmente excluir este contato e TODAS as suas conversas?')) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/contacts/${conversation.contact.id}`, { method: 'DELETE' });
      if (res.ok) {
        setActiveModal(null);
        if (onDeleted) onDeleted();
        onStatusUpdate();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleBot = async () => {
    setUpdating(true);
    const newState = !localIsBotActive;
    setLocalIsBotActive(newState); // Mudança instantânea na UI
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newState })
      });
      if (res.ok) {
        onStatusUpdate();
      } else {
        // Reverte se der erro
        setLocalIsBotActive(!newState);
      }
    } catch (err) {
      console.error(err);
      setLocalIsBotActive(!newState);
    } finally {
      setUpdating(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedUser) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser })
      });
      if (res.ok) {
        setActiveModal(null);
        onStatusUpdate();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateContact = async (data: { name?: string, notes?: string }) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/contacts/${conversation.contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setActiveModal(null);
        onStatusUpdate();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0b141a] text-[#8696a0] p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-[#202c33] flex items-center justify-center mb-6 text-[#6a7175]">
          <User size={48} />
        </div>
        <h2 className="text-xl font-bold text-[#e9edef] mb-2">WhatsApp Web Professional</h2>
        <p className="max-w-xs text-sm">Selecione uma conversa para começar a atender seus clientes em tempo real.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0b141a] h-full relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] opacity-[0.06] pointer-events-none brightness-50"></div>
      
      {/* Header */}
      <div className="px-4 py-2 bg-[#202c33] flex items-center justify-between z-30 relative shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#6a7175] flex items-center justify-center text-white overflow-hidden shadow-sm">
            {conversation.contact.profilePic ? (
               // eslint-disable-next-line @next/next/no-img-element
               <img src={conversation.contact.profilePic} alt="avatar" className="w-full h-full object-cover" />
            ) : (
               <User size={24} />
            )}
          </div>
          <div className="flex flex-col">
            <h2 className="text-[#e9edef] font-semibold text-[16px]">
              {conversation.contact.name || conversation.contact.number}
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  conversation.status === 'QUEUED' ? "bg-orange-500 animate-pulse" : "bg-emerald-500"
                )} />
                <p className="text-[11px] text-[#8696a0]">
                  {conversation.status === 'QUEUED' ? 'Aguardando' : 'Em atendimento'}
                </p>
              </div>
              {conversation.contact.notes && (
                <>
                  <span className="text-[#8696a0] text-xs px-1">•</span>
                  <span className="text-xs text-amber-500/90 italic flex items-center gap-1 max-w-md truncate" title={conversation.contact.notes}>
                    📝 {conversation.contact.notes}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {conversation.status === 'QUEUED' && (
            <button
              onClick={handleAccept}
              disabled={updating}
              className="flex items-center gap-2 px-4 py-1.5 bg-[#00a884] hover:bg-[#06cf9c] text-white text-xs font-bold rounded-lg transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              <UserPlus size={16} />
              Aceitar Chamado
            </button>
          )}
          
          {conversation.status !== 'CLOSED' && (
            <button
              onClick={handleToggleBot}
              disabled={updating}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all border active:scale-95 disabled:opacity-50",
                localIsBotActive 
                  ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border-amber-500/30" 
                  : "bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border-blue-500/30"
              )}
              title={localIsBotActive ? "Pausar Automação" : "Ativar Automação"}
            >
              {localIsBotActive ? <Pause size={16} /> : <Bot size={16} />}
              {localIsBotActive ? 'Pausar Bot' : 'Ativar Bot'}
            </button>
          )}

          {conversation.status === 'ACTIVE' && (
            <button
              onClick={handleClose}
              disabled={updating}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-500 text-xs font-bold rounded-lg transition-all border border-red-500/30 active:scale-95 disabled:opacity-50"
            >
              <XCircle size={16} />
              Encerrar
            </button>
          )}

          <div className="w-px h-6 bg-[#222e35] mx-2" />
          
          <div className="flex items-center gap-3 text-[#aebac1]">
            {isSearching ? (
              <div className="flex items-center bg-[#2a3942] rounded-lg px-2 py-1 h-8 animate-in fade-in slide-in-from-right-4">
                <input 
                  autoFocus
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar na conversa..."
                  className="bg-transparent border-none outline-none text-sm text-[#e9edef] w-48 px-2 placeholder-[#8696a0]"
                />
                <X size={16} className="cursor-pointer hover:text-white" onClick={() => { setIsSearching(false); setSearchTerm(''); }} />
              </div>
            ) : (
              <Search size={20} className="cursor-pointer hover:text-[#e9edef] transition-colors" onClick={() => setIsSearching(true)} />
            )}
            
            <div className="relative">
              <MoreVertical 
                size={20} 
                className={cn("cursor-pointer transition-colors", menuOpen ? "text-[#e9edef]" : "hover:text-[#e9edef]")} 
                onClick={() => setMenuOpen(!menuOpen)} 
              />
              
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)}></div>
                  <div className="absolute right-0 top-8 w-56 bg-[#233138] rounded-xl shadow-2xl z-50 py-2 border border-white/5 animate-in fade-in zoom-in-95">
                    <button onClick={() => { setMenuOpen(false); handleClose(); }} className="w-full text-left px-4 py-2.5 text-sm text-[#e9edef] hover:bg-[#111b21] transition-colors">
                      Encerrar atendimento
                    </button>
                    <button onClick={() => { setMenuOpen(false); setActiveModal('transfer'); }} className="w-full text-left px-4 py-2.5 text-sm text-[#e9edef] hover:bg-[#111b21] transition-colors">
                      Transferir
                    </button>
                    <button onClick={() => { setMenuOpen(false); setActiveModal('edit'); }} className="w-full text-left px-4 py-2.5 text-sm text-[#e9edef] hover:bg-[#111b21] transition-colors">
                      Editar contato
                    </button>
                    <button onClick={() => { setMenuOpen(false); setActiveModal('note'); }} className="w-full text-left px-4 py-2.5 text-sm text-[#e9edef] hover:bg-[#111b21] transition-colors">
                      Adicionar aviso/nota
                    </button>
                    <div className="border-t border-white/5 my-1" />
                    <button onClick={() => { setMenuOpen(false); handleDeleteConversation(); }} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-[#111b21] transition-colors">
                      Excluir conversa
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-10 py-6 space-y-2 scroll-smooth z-10"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#374045 transparent' }}
      >
        {displayedMessages.map((msg, idx) => (
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

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#202c33] rounded-2xl w-full max-w-md p-6 shadow-2xl border border-white/10 relative">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-[#8696a0] hover:text-white">
              <X size={20} />
            </button>
            
            {activeModal === 'transfer' && (
              <>
                <h3 className="text-lg font-semibold text-white mb-4">Transferir Atendimento</h3>
                <div className="mb-6">
                  <label className="block text-sm text-[#8696a0] mb-2">Selecione o atendente</label>
                  <select 
                    value={selectedUser} 
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full bg-[#2a3942] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#00a884]"
                  >
                    <option value="">-- Escolha um usuário --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-[#8696a0] hover:text-white font-medium">Cancelar</button>
                  <button onClick={handleTransfer} disabled={updating || !selectedUser} className="px-4 py-2 bg-[#00a884] text-white rounded-lg font-bold hover:bg-[#06cf9c] disabled:opacity-50">Transferir</button>
                </div>
              </>
            )}

            {activeModal === 'edit' && (
              <>
                <h3 className="text-lg font-semibold text-white mb-4">Editar Contato</h3>
                <div className="mb-6">
                  <label className="block text-sm text-[#8696a0] mb-2">Nome do Contato</label>
                  <input 
                    type="text"
                    value={contactName} 
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-[#2a3942] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#00a884]"
                  />
                </div>
                <div className="flex items-center justify-between mt-8">
                  <button onClick={handleDeleteContact} disabled={updating} className="text-red-500 hover:text-red-400 text-sm font-semibold flex items-center gap-1">
                    <XCircle size={16} /> Excluir Contato
                  </button>
                  <div className="flex gap-3">
                    <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-[#8696a0] hover:text-white font-medium">Cancelar</button>
                    <button onClick={() => handleUpdateContact({ name: contactName })} disabled={updating || !contactName} className="px-4 py-2 bg-[#00a884] text-white rounded-lg font-bold hover:bg-[#06cf9c] disabled:opacity-50">Salvar</button>
                  </div>
                </div>
              </>
            )}

            {activeModal === 'note' && (
              <>
                <h3 className="text-lg font-semibold text-white mb-4">Avisos e Notas do Cliente</h3>
                <div className="mb-6">
                  <p className="text-xs text-[#8696a0] mb-3">Estas anotações ficarão salvas no perfil deste cliente permanentemente.</p>
                  <textarea 
                    value={contactNotes} 
                    onChange={(e) => setContactNotes(e.target.value)}
                    rows={5}
                    placeholder="Digite observações importantes sobre este cliente..."
                    className="w-full bg-[#2a3942] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#00a884] resize-none"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-[#8696a0] hover:text-white font-medium">Cancelar</button>
                  <button onClick={() => handleUpdateContact({ notes: contactNotes })} disabled={updating} className="px-4 py-2 bg-[#00a884] text-white rounded-lg font-bold hover:bg-[#06cf9c] disabled:opacity-50">Salvar Notas</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
