'use client';

import { cn } from '@/lib/utils';
import { 
  User, Phone, MoreVertical, Search, CheckCircle2, XCircle, 
  FileText, PanelLeftOpen, PanelLeftClose, X, UserPlus, Pause, Bot,
  Play, Download, Eye
} from 'lucide-react';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface Message {
  id: string;
  body: string;
  fromMe: boolean;
  timestamp: string;
  type?: string;
  mediaUrl?: string;
}

interface ChatWindowProps {
  conversation: any;
  messages: Message[];
  onStatusUpdate: () => void;
  onDeleted?: () => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function ChatWindow({ 
  conversation, 
  messages, 
  onStatusUpdate, 
  onDeleted,
  onToggleSidebar,
  isSidebarCollapsed,
  onLoadMore,
  hasMore
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
  const [activeModal, setActiveModal] = useState<'transfer' | 'edit' | 'note' | 'pdf-preview' | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [contactName, setContactName] = useState(conversation.contact.name || '');
  const [contactEmail, setContactEmail] = useState(conversation.contact.email || '');
  const [contactNotes, setContactNotes] = useState(conversation.contact.notes || '');

  const scrollRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const prevScrollHeight = useRef(0);
  const isFetchingMore = useRef(false);

  // Atualiza estados quando a conversa muda
  useEffect(() => {
    isInitialLoad.current = true;
    setContactName(conversation.contact.name || '');
    setContactEmail(conversation.contact.email || '');
    setContactNotes(conversation.contact.notes || '');
  }, [conversation.id]);

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
  }, [activeModal, conversation, users.length, departments.length]);

  const displayedMessages = searchTerm 
    ? messages.filter(m => m.body?.toLowerCase().includes(searchTerm.toLowerCase()))
    : messages;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop === 0 && hasMore && !isFetchingMore.current && !searchTerm) {
      isFetchingMore.current = true;
      prevScrollHeight.current = e.currentTarget.scrollHeight;
      onLoadMore?.();
    }
  }, [hasMore, onLoadMore, searchTerm]);

  useEffect(() => {
    if (scrollRef.current) {
      if (isInitialLoad.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        isInitialLoad.current = false;
      } else if (isFetchingMore.current) {
        // Estabiliza o scroll ao carregar histórico antigo
        const newScrollHeight = scrollRef.current.scrollHeight;
        const heightDiff = newScrollHeight - prevScrollHeight.current;
        scrollRef.current.scrollTop = heightDiff;
        isFetchingMore.current = false;
      } else {
        // Somente rola suave se estiver próximo do fundo ou for nova mensagem
        const isNearBottom = scrollRef.current.scrollHeight - scrollRef.current.scrollTop - scrollRef.current.clientHeight < 200;
        if (isNearBottom) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }
    }
  }, [messages]);

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

  const handleExportPDF = async () => {
    if (!messages || messages.length === 0) return;
    
    setUpdating(true);
    setMenuOpen(false);
    
    try {
      // Importações dinâmicas para evitar erros de inicialização global e reduzir bundle size
      const [jsPDF, { toPng }] = await Promise.all([
        import('jspdf').then(m => m.default),
        import('html-to-image')
      ]);

      const element = document.getElementById('messages-container');
      if (!element) return;

      // Ativa visual de exportação
      document.body.classList.add('is-exporting-pdf');
      
      // Pequeno delay para garantir que o DOM atualizou as classes
      await new Promise(resolve => setTimeout(resolve, 100));

      const imgData = await toPng(element, {
        backgroundColor: '#0b141a',
        quality: 1,
        pixelRatio: 2, 
        width: 850, // Força largura de documento
        style: {
          height: 'auto',
          maxHeight: 'none',
          overflow: 'visible',
          width: '850px',
        },
        filter: (node) => {
          const el = node as HTMLElement;
          if (el.classList && (el.classList.contains('z-50') || el.classList.contains('fixed'))) {
            return false;
          }
          return true;
        }
      });

      // Restaura interface normal
      document.body.classList.remove('is-exporting-pdf');

      const imgProps = (new jsPDF()).getImageProperties(imgData);
      
      // Criamos o PDF com o tamanho EXATO da imagem para evitar espaços em branco
      const pdf = new jsPDF({
        orientation: imgProps.width > imgProps.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [imgProps.width, imgProps.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, imgProps.width, imgProps.height);
      pdf.save(`conversa-${conversation.contact.name || conversation.contact.number}-${new Date().toLocaleDateString()}.pdf`);
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      alert('Erro ao gerar PDF. O sistema de captura moderno encontrou uma restrição visual.');
    } finally {
      setUpdating(false);
    }
  };

  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  const handleGeneratePreview = async () => {
    if (!messages || messages.length === 0) return;
    
    setIsGeneratingPreview(true);
    setMenuOpen(false);
    
    try {
      const { toPng } = await import('html-to-image');
      const element = document.getElementById('messages-container');
      if (!element) return;

      document.body.classList.add('is-exporting-pdf');
      await new Promise(resolve => setTimeout(resolve, 300));

      const imgData = await toPng(element, {
        backgroundColor: '#0b141a',
        quality: 1,
        pixelRatio: 1.5, // Menor para preview mais rápido
        width: 850,
        style: { height: 'auto', maxHeight: 'none', overflow: 'visible', width: '850px' }
      });

      document.body.classList.remove('is-exporting-pdf');
      setPdfPreviewUrl(imgData);
      setActiveModal('pdf-preview');
    } catch (err) {
      console.error('Erro ao gerar preview:', err);
      alert('Erro ao gerar pré-visualização.');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Limpeza de Blobs por segurança e memória
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl && pdfPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  const handleCloseModal = () => {
    if (activeModal === 'pdf-preview' && pdfPreviewUrl && pdfPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(null);
    }
    setActiveModal(null);
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

                  <button
                    onClick={handleGeneratePreview}
                    disabled={updating || isGeneratingPreview}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm disabled:opacity-50"
                  >
                    <Eye size={16} />
                    Visualizar Relatório (PDF)
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
        id="messages-container"
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-8 space-y-6 z-10 custom-scrollbar bg-[#0b141a]"
      >
        {hasMore && (
          <div className="flex justify-center py-4">
             <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        )}
        {/* PDF Exclusive Header (Visible only during capture) */}
        <div 
          id="pdf-export-header" 
          className="pdf-only flex-col gap-6 mb-12 p-8 bg-white/5 rounded-[2.5rem] border border-white/10 items-start justify-between w-full"
        >
          <div className="flex items-center gap-6 w-full">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
              <User size={40} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black text-white tracking-tight">{conversation.contact.name || 'Contato'}</h1>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Relatório Oficial</span>
              </div>
              <p className="text-slate-400 font-bold text-lg mt-1">{conversation.contact.number}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-2">Data de Geração</p>
              <p className="text-white font-bold text-xl">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              <p className="text-slate-500 text-xs mt-1 font-medium italic">Sistema Chatinho v2.3.7</p>
            </div>
          </div>
          <div className="h-px bg-white/10 w-full mt-4" />
        </div>

        <AnimatePresence initial={false}>
          {displayedMessages.map((msg, idx) => (
            <MessageItem 
              key={msg.id} 
              msg={msg} 
              idx={idx} 
              conversation={conversation} 
              totalMessages={displayedMessages.length}
              onPlayAudio={() => {}} // Placeholder if global state is needed
              shouldAnimate={!isInitialLoad.current && !isFetchingMore.current} // Não anima na carga inicial nem no scroll infinito
            />
          ))}
        </AnimatePresence>
      </div>

      {mounted && activeModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" 
            onClick={handleCloseModal} 
          />
          <div className={cn(
            "relative w-full glass-modal premium-shadow rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300",
            activeModal === 'pdf-preview' ? "max-w-5xl h-[90vh]" : "max-w-md p-6"
          )}>
            <button onClick={handleCloseModal} className="absolute top-4 right-4 text-[#8696a0] hover:text-white z-10">
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
                  <button onClick={handleCloseModal} className="px-4 py-2 text-[#8696a0] hover:text-white font-medium">Cancelar</button>
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
                    <button onClick={handleCloseModal} className="px-4 py-2 text-[#8696a0] hover:text-white text-xs font-bold uppercase tracking-widest">Cancelar</button>
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

            {activeModal === 'pdf-preview' && pdfPreviewUrl && (
              <div className="w-full h-full flex flex-col p-6 md:p-8 overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
                  <div className="space-y-1">
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center animate-premium-pulse">
                        <Eye className="text-emerald-500" size={20} />
                      </div>
                      Relatório de Conversa
                    </h3>
                    <p className="text-[10px] text-emerald-500/60 font-black uppercase tracking-widest ml-13">Visualização Premium Ativada</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleCloseModal} 
                      className="px-5 py-2.5 text-[#8696a0] hover:text-white font-bold uppercase text-[10px] tracking-widest transition-colors"
                    >
                      Descartar
                    </button>
                    <button 
                      onClick={handleExportPDF} 
                      className="px-8 py-3 bg-emerald-500 text-slate-950 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-emerald-400 transition-all flex items-center gap-3 shadow-xl shadow-emerald-500/30 active:scale-95 group"
                    >
                      <Download size={16} className="group-hover:translate-y-0.5 transition-transform" /> 
                      Baixar PDF Oficial
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto bg-black/40 rounded-3xl p-4 md:p-8 border border-white/5 custom-scrollbar premium-shadow group">
                  <div className="relative group-hover:scale-[1.01] transition-transform duration-700 ease-out origin-top">
                    <img src={pdfPreviewUrl} alt="Preview do PDF" className="w-full h-auto rounded-xl shadow-2xl mx-auto ring-1 ring-white/10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none rounded-xl" />
                  </div>
                </div>
                
                <div className="mt-6 flex items-center justify-center gap-4 shrink-0">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic opacity-50">
                    Sistema Chatinho v2.3.7 • Exportação Dinâmica de Alta Definição
                  </p>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// Componente de Áudio Customizado Premium Otimizado
const CustomAudioPlayer = React.memo(function CustomAudioPlayer({ url, isFromMe }: { url: string, isFromMe: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [error, setError] = useState(false);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !url) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error("Erro ao reproduzir áudio:", err);
        setError(true);
      });
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, url]);

  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const duration = audioRef.current.duration;
    if (duration) {
      setProgress((current / duration) * 100);
      const mins = Math.floor(current / 60);
      const secs = Math.floor(current % 60);
      setCurrentTime(`${mins}:${secs.toString().padStart(2, '0')}`);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime('0:00');
  }, []);

  const bars = useMemo(() => [0.3, 0.6, 0.4, 0.8, 0.5, 0.7, 0.3, 0.6, 0.4, 0.2, 0.5, 0.7, 0.3, 0.8, 0.4, 0.6, 0.3, 0.5, 0.7, 0.4], []);

  return (
    <div className={cn(
      "flex items-center gap-5 p-5 rounded-[24px] border transition-all duration-500 w-full min-w-[300px] group/audio relative overflow-hidden",
      isFromMe 
        ? "bg-slate-900/40 border-white/5 hover:bg-slate-900/60" 
        : "glass-panel border-white/5 hover:bg-white/10"
    )}>
      {/* Background Decor */}
      <div className={cn(
        "absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-10 transition-opacity group-hover/audio:opacity-20",
        isFromMe ? "bg-emerald-500" : "bg-emerald-400"
      )} />

      <button 
        onClick={togglePlay}
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-90 shrink-0 shadow-lg relative z-10",
          isFromMe ? "bg-emerald-500 text-slate-950" : "bg-emerald-500 text-slate-950"
        )}
      >
        {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} className="ml-1" fill="currentColor" />}
      </button>

      <div className="flex-1 space-y-3 relative z-10">
        <div className="flex justify-between items-center px-1">
          <div className="flex gap-1.5 items-end h-7">
             {error ? (
               <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Erro no arquivo</span>
             ) : (
               bars.map((h, i) => (
                 <motion.div 
                   key={i} 
                   initial={false}
                   animate={isPlaying ? { 
                     height: [`${h*100}%`, `${(1.2-h)*100}%`, `${h*100}%`],
                     opacity: [0.4, 1, 0.4]
                   } : { 
                     height: `${h*100}%`, 
                     opacity: 0.3 
                   }}
                   transition={isPlaying ? { 
                     repeat: Infinity, 
                     duration: 0.8, 
                     delay: i * 0.05 
                   } : { 
                     duration: 0.3 
                   }}
                   className={cn("w-1.5 rounded-full", isFromMe ? "bg-emerald-500" : "bg-emerald-400")}
                 />
               ))
             )}
          </div>
          <span className={cn("text-[10px] font-black uppercase tracking-widest font-mono opacity-60", isFromMe ? "text-emerald-500" : "text-emerald-400")}>
            {error ? '--:--' : currentTime}
          </span>
        </div>

        <div className="h-2 w-full bg-black/30 rounded-full overflow-hidden cursor-pointer relative">
          <motion.div 
            className={cn("h-full absolute left-0 top-0 glow-emerald", isFromMe ? "bg-emerald-500" : "bg-emerald-500")}
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      {url && (
        <audio 
          ref={audioRef} 
          src={url} 
          onTimeUpdate={handleTimeUpdate} 
          onEnded={handleEnded}
          onError={() => setError(true)}
          preload="metadata"
        />
      )}
    </div>
  );
});

// Componente de Item de Mensagem Memoizado
const MessageItem = React.memo(function MessageItem({ msg, idx, conversation, totalMessages, onPlayAudio, shouldAnimate }: any) {
  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 10, scale: 0.95 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "flex w-full group mb-2",
        msg.fromMe ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "relative max-w-[70%] transition-all duration-300",
        msg.fromMe ? "items-end" : "items-start"
      )}>
          <div
            className={cn(
              "px-4 py-3 rounded-2xl text-[14.5px] leading-relaxed shadow-xl relative overflow-hidden",
              msg.fromMe 
                ? "bg-gradient-to-br from-[#00a884] to-[#05cd9c] text-[#0b141a] font-semibold rounded-tr-sm ring-1 ring-white/10" 
                : "bg-[#202c33] text-[#e9edef] border border-white/5 rounded-tl-sm shadow-md"
            )}
          >
            {/* Media Display */}
            {msg.type === 'image' && msg.mediaUrl && (
              <div className="mb-2 -mx-4 -mt-3 relative group">
                <img 
                  src={msg.mediaUrl.startsWith('http') || msg.mediaUrl.startsWith('/') ? msg.mediaUrl : `/uploads/${msg.mediaUrl}`} 
                  alt="Mídia" 
                  className="max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(msg.mediaUrl.startsWith('http') || msg.mediaUrl.startsWith('/') ? msg.mediaUrl : `/uploads/${msg.mediaUrl}`, '_blank')}
                />
              </div>
            )}

            {msg.type === 'audio' && msg.mediaUrl && (
              <div className="py-2 flex flex-col gap-2 min-w-[280px]">
                <CustomAudioPlayer 
                  url={msg.mediaUrl.startsWith('http') || msg.mediaUrl.startsWith('/') ? msg.mediaUrl : `/uploads/${msg.mediaUrl}`} 
                  isFromMe={msg.fromMe}
                />
              </div>
            )}

            {msg.body && (
              <p className={cn(
                "whitespace-pre-wrap break-words",
                msg.fromMe ? "selection:bg-slate-950 selection:text-emerald-400" : "selection:bg-emerald-500 selection:text-slate-950"
              )}>
                {msg.body.split(/(\*.*?\*)/).map((part: string, i: number) => {
                  if (part.startsWith('*') && part.endsWith('*')) {
                    return <strong key={i} className="font-extrabold text-inherit underline-offset-4 decoration-current/30">{part.slice(1, -1)}</strong>;
                  }
                  return part;
                })}
              </p>
            )}
          
          <div className={cn(
            "flex items-center gap-1.5 mt-2 opacity-60",
            msg.fromMe ? "justify-end" : "justify-start"
          )}>
            {msg.fromMe && !msg.body?.includes('Atendente') && (
              <span className="text-[9px] font-black text-emerald-500/80 uppercase tracking-widest mr-auto flex items-center gap-1">
                <Bot size={10} /> Robô / Fluxo
              </span>
            )}
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
});
