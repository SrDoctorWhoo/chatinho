'use client';

import { cn } from '@/lib/utils';
import { 
  User, Phone, MoreVertical, Search, CheckCircle2, XCircle, 
  UserPlus, X, Bot, Play, Pause, PanelLeftClose, PanelLeftOpen 
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export function ChatWindow({ 
  conversation, 
  messages, 
  onStatusUpdate, 
  onDeleted,
  onToggleSidebar,
  isSidebarCollapsed 
}: ChatWindowProps) {
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
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [contactName, setContactName] = useState(conversation.contact.name || '');
  const [contactEmail, setContactEmail] = useState(conversation.contact.email || '');
  const [contactNotes, setContactNotes] = useState(conversation.contact.notes || '');

  const scrollRef = useRef<HTMLDivElement>(null);

  // Atualiza estados quando a conversa muda
  useEffect(() => {
    setContactName(conversation.contact.name || '');
    setContactEmail(conversation.contact.email || '');
    setContactNotes(conversation.contact.notes || '');
  }, [conversation]);

  useEffect(() => {
    if (activeModal === 'transfer') {
      if (users.length === 0) {
        fetch('/api/users').then(res => res.json()).then(data => {
          if(Array.isArray(data)) setUsers(data);
        });
      }
      if (departments.length === 0) {
        fetch('/api/departments').then(res => res.json()).then(data => {
          if(Array.isArray(data)) setDepartments(data);
        });
      }
    }
    if (activeModal === 'edit') {
      setContactName(conversation?.contact?.name || conversation?.contact?.number || '');
    }
    if (activeModal === 'note') {
      setContactNotes(conversation?.contact?.notes || '');
    }
  }, [activeModal, conversation, users.length, departments.length]);

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
    if (!selectedUser && !selectedDepartment) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser || null, departmentId: selectedDepartment || null })
      });
      if (res.ok) {
        setActiveModal(null);
        setSelectedUser('');
        setSelectedDepartment('');
        onStatusUpdate();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateContact = async (data: { name?: string, notes?: string, email?: string }) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/contacts/${conversation.contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
        throw new Error('Falha ao atualizar contato');
      }

      onStatusUpdate();
      setActiveModal(null);
    } catch (err) {
      console.error('Erro ao atualizar contato:', err);
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
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-950/20">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
      
      {/* Header */}
      <div className="px-6 py-4 bg-white/[0.03] backdrop-blur-xl flex items-center justify-between z-30 relative border-b border-white/5 shadow-xl">
        <div className="flex items-center gap-4">
          {/* Botão de Toggle da Sidebar (WhatsApp Web Style) */}
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            title={isSidebarCollapsed ? "Expandir Menu" : "Recolher Menu"}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>

          <div className="relative">
            <div className={cn(
              "w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl cursor-pointer group",
              conversation.contact.profilePic ? "bg-white/5" : "bg-gradient-to-br from-slate-800 to-slate-900"
            )} onClick={() => setActiveModal('edit')}>
              {conversation.contact.profilePic ? (
                <img 
                  src={conversation.contact.profilePic} 
                  alt={conversation.contact.name || ''} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-black text-emerald-500 tracking-tighter">
                  {(conversation.contact.name || 'C').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className={cn(
              "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#020617] shadow-lg",
              conversation.status === 'QUEUED' ? "bg-orange-500 animate-pulse" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            )} />
          </div>
          
          <div className="flex flex-col cursor-pointer" onClick={() => setActiveModal('edit')}>
            <h2 className="text-white font-bold text-lg tracking-tight leading-none mb-1.5 flex items-center gap-2">
              {conversation.contact.name || conversation.contact.number}
              {conversation.contact.email && (
                <span className="text-[10px] font-medium text-slate-500 lowercase px-2 py-0.5 bg-white/5 rounded-full border border-white/5">
                  {conversation.contact.email}
                </span>
              )}
            </h2>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  conversation.status === 'QUEUED' ? "bg-orange-500 animate-pulse" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                )} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {conversation.status === 'QUEUED' ? 'Fila de Espera' : 'Em Atendimento'}
                </span>
              </div>
              {conversation.contact.notes && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-lg w-fit">
                   <span className="text-[11px] text-amber-500 font-bold italic truncate max-w-[400px]">
                     📝 {conversation.contact.notes}
                   </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Busca na Conversa */}
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {isSearching && (
                <motion.div 
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 'auto', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="overflow-hidden flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-1.5"
                >
                  <Search size={14} className="text-slate-500" />
                  <input 
                    autoFocus
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar mensagens..."
                    className="bg-transparent border-none outline-none text-xs text-white placeholder-slate-600 ml-2 w-32 lg:w-48"
                  />
                  <X 
                    size={14} 
                    className="text-slate-500 hover:text-white cursor-pointer ml-2" 
                    onClick={() => { setIsSearching(false); setSearchTerm(''); }} 
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            {!isSearching && (
              <button 
                onClick={() => setIsSearching(true)}
                className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <Search size={20} />
              </button>
            )}
          </div>

          <div className="w-px h-6 bg-white/10 mx-1" />

          {conversation.status === 'QUEUED' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAccept}
              disabled={updating}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-500 text-slate-950 text-xs font-black rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              <UserPlus size={16} strokeWidth={2.5} />
              ACEITAR
            </motion.button>
          )}

          <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/5">
            {conversation.status !== 'CLOSED' && (
              <button
                onClick={handleToggleBot}
                disabled={updating}
                className={cn(
                  "p-2 rounded-lg transition-all relative group",
                  localIsBotActive ? "text-amber-500 bg-amber-500/10" : "text-slate-500 hover:text-blue-400 hover:bg-blue-400/10"
                )}
                title={localIsBotActive ? "Pausar Robô" : "Ativar Robô"}
              >
                {localIsBotActive ? <Pause size={18} /> : <Bot size={18} />}
              </button>
            )}

            {conversation.status === 'ACTIVE' && (
              <button
                onClick={handleClose}
                disabled={updating}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                title="Fechar Conversa"
              >
                <XCircle size={18} />
              </button>
            )}
            
            <div className="w-px h-4 bg-white/10 mx-1" />
            
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className={cn(
                "p-2 rounded-lg transition-all",
                menuOpen ? "text-white bg-white/10" : "text-slate-500 hover:text-white"
              )}
            >
              <MoreVertical size={18} />
            </button>
          </div>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setMenuOpen(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-72 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 py-3 overflow-hidden"
                >
                  <div className="px-4 py-2 border-b border-white/5 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ações Rápidas</span>
                  </div>

                  {conversation.contact.notes && (
                    <div className="px-4 py-3 bg-amber-500/5 border-y border-amber-500/10 mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Notas do Contato</span>
                      </div>
                      <p className="text-xs text-amber-200/70 italic leading-relaxed">
                        "{conversation.contact.notes}"
                      </p>
                    </div>
                  )}
                  
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setActiveModal('transfer');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm"
                  >
                    <UserPlus size={16} />
                    Transferir Atendimento
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setActiveModal('edit');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm"
                  >
                    <Search size={16} />
                    Editar Detalhes do Contato
                  </button>

                  <div className="h-px bg-white/5 my-2" />

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleDeleteConversation();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-sm"
                  >
                    <XCircle size={16} />
                    Excluir Toda a Conversa
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scroll-smooth z-10 custom-scrollbar"
      >
        <AnimatePresence initial={false}>
          {displayedMessages.map((msg, idx) => {
            const isLastOfGroup = idx === displayedMessages.length - 1 || displayedMessages[idx+1].fromMe !== msg.fromMe;
            
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex w-full group",
                  msg.fromMe ? "justify-end" : "justify-start"
                )}
              >
                <div className={cn(
                  "relative max-w-[70%] transition-all duration-300",
                  msg.fromMe ? "items-end" : "items-start"
                )}>
                  <div
                    className={cn(
                      "px-4 py-3 rounded-2xl text-[14.5px] leading-relaxed shadow-xl relative",
                      msg.fromMe 
                        ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 font-medium rounded-tr-sm" 
                        : "bg-white/[0.06] backdrop-blur-md text-slate-100 border border-white/5 rounded-tl-sm"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                    
                    <div className={cn(
                      "flex items-center gap-1.5 mt-2 opacity-60",
                      msg.fromMe ? "justify-end" : "justify-start"
                    )}>
                      <span className="text-[10px] font-bold tracking-tighter uppercase">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.fromMe && (
                        <div className="flex -space-x-1">
                          <CheckCircle2 size={10} className="text-slate-950" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
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
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-[10px] font-black text-[#8696a0] uppercase tracking-widest mb-2">Para um Setor (Fila)</label>
                    <select 
                      value={selectedDepartment} 
                      onChange={(e) => {
                        setSelectedDepartment(e.target.value);
                        if(e.target.value) setSelectedUser(''); // Limpa o usuário se escolher setor
                      }}
                      className="w-full bg-[#2a3942] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#00a884] transition-all"
                    >
                      <option value="">-- Selecione o setor de destino --</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3 py-2">
                    <div className="h-px bg-white/5 flex-1" />
                    <span className="text-[10px] font-black text-slate-600">OU</span>
                    <div className="h-px bg-white/5 flex-1" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#8696a0] uppercase tracking-widest mb-2">Direto para um Atendente</label>
                    <select 
                      value={selectedUser} 
                      onChange={(e) => {
                        setSelectedUser(e.target.value);
                        if(e.target.value) setSelectedDepartment(''); // Limpa o setor se escolher usuário
                      }}
                      className="w-full bg-[#2a3942] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#00a884] transition-all"
                    >
                      <option value="">-- Selecione o atendente --</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-[#8696a0] hover:text-white font-medium">Cancelar</button>
                  <button 
                    onClick={handleTransfer} 
                    disabled={updating || (!selectedUser && !selectedDepartment)} 
                    className="px-6 py-2 bg-[#00a884] text-white rounded-lg font-bold hover:bg-[#06cf9c] disabled:opacity-50 active:scale-95 transition-all shadow-lg shadow-emerald-500/10"
                  >
                    {selectedUser ? 'Transferir para Atendente' : 'Transferir para Setor'}
                  </button>
                </div>
              </>
            )}

            {activeModal === 'edit' && (
              <>
                <h3 className="text-lg font-semibold text-white mb-4">Perfil do Contato</h3>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-[10px] font-black text-[#8696a0] uppercase tracking-widest mb-2">Nome Completo</label>
                    <input 
                      type="text"
                      placeholder="Nome do cliente..."
                      value={contactName} 
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full bg-[#2a3942] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#00a884] transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-[#8696a0] uppercase tracking-widest mb-2">E-mail</label>
                    <input 
                      type="email"
                      placeholder="exemplo@email.com"
                      value={contactEmail} 
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full bg-[#2a3942] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#00a884] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#8696a0] uppercase tracking-widest mb-2">Observações e Notas</label>
                    <textarea 
                      value={contactNotes} 
                      onChange={(e) => setContactNotes(e.target.value)}
                      rows={4}
                      placeholder="Anote informações importantes aqui..."
                      className="w-full bg-[#2a3942] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#00a884] resize-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <button 
                    onClick={handleDeleteContact} 
                    disabled={updating} 
                    className="text-red-500 hover:text-red-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:opacity-80"
                  >
                    <XCircle size={14} /> Excluir Contato
                  </button>
                  <div className="flex gap-3">
                    <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-[#8696a0] hover:text-white text-xs font-bold uppercase tracking-widest">Cancelar</button>
                    <button 
                      onClick={() => handleUpdateContact({ name: contactName, email: contactEmail, notes: contactNotes })} 
                      disabled={updating} 
                      className="px-6 py-2 bg-[#00a884] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#06cf9c] disabled:opacity-50 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
