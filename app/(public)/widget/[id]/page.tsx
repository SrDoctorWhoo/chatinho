'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Send, User, Mail, Smartphone, Loader2, MessageSquare, X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WidgetPage() {
  const params = useParams();
  const id = params.id as string;

  const [step, setStep] = useState<'LEAD' | 'CHAT'>('LEAD');
  const [instance, setInstance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInstance = async () => {
      try {
        const res = await fetch(`/api/widget/instance/${id}`);
        if (res.ok) {
          const data = await res.json();
          setInstance(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInstance();
  }, [id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'CHAT' && conversation) {
      const fetchMsgs = async () => {
        try {
          const res = await fetch(`/api/widget/messages?conversationId=${conversation.id}`);
          if (res.ok) {
            const data = await res.json();
            setMessages(data);
          }
        } catch (err) { console.error(err); }
      };
      fetchMsgs();
      interval = setInterval(fetchMsgs, 4000);
    }
    return () => clearInterval(interval);
  }, [step, conversation]);

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !whatsapp) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/widget/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId: id, name, email, whatsapp })
      });
      if (res.ok) {
        const data = await res.json();
        setConversation(data.conversation);
        setStep('CHAT');
      } else {
        alert('Erro ao iniciar chat. Tente novamente.');
      }
    } catch (err) { console.error(err); }
    finally { setIsSubmitting(false); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation) return;
    const msgBody = newMessage;
    setNewMessage('');
    // Optimistic update
    const tempMsg = { id: Date.now(), body: msgBody, fromMe: false, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    try {
      await fetch('/api/widget/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: conversation.id, body: msgBody })
      });
    } catch (err) { console.error(err); }
  };

  const closeWidget = () => {
    window.parent.postMessage('chatinho-close', '*');
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-400" size={28} />
          <span className="text-[10px] font-black text-indigo-300/50 uppercase tracking-[0.2em]">Carregando</span>
        </div>
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="h-screen w-screen flex items-center justify-center p-8 text-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' }}>
        <div className="space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center">
            <MessageSquare className="text-slate-600" size={28} />
          </div>
          <h1 className="text-white font-black text-base">Widget indisponível</h1>
          <p className="text-slate-500 text-xs font-medium">Verifique se o widget está ativo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)' }}>
      
      {/* ── Header ── */}
      <div className="relative flex items-center justify-between px-5 py-4" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%)' }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%)' }} />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
            <MessageSquare size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight text-white leading-none">{instance.name}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Online</span>
            </div>
          </div>
        </div>
        <button onClick={closeWidget} className="relative p-1.5 hover:bg-white/10 rounded-lg transition-colors">
          <X size={16} className="text-white/70" />
        </button>
      </div>

      {step === 'LEAD' ? (
        /* ── Lead Capture Form ── */
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Welcome Section */}
          <div className="px-6 pt-6 pb-4 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Atendimento</span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white leading-tight">Como podemos te ajudar?</h1>
            <p className="text-xs text-slate-400 font-medium mt-1">Preencha abaixo para iniciar</p>
          </div>

          {/* Form */}
          <form onSubmit={handleStartChat} className="flex-1 flex flex-col px-5 pb-5 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-0.5">Nome *</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={15} />
                <input 
                  type="text" required value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500/40 outline-none transition-all text-sm font-semibold text-white placeholder-slate-600"
                  placeholder="Seu nome completo"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-0.5">E-mail <span className="text-slate-600">(opcional)</span></label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={15} />
                <input 
                  type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500/40 outline-none transition-all text-sm font-semibold text-white placeholder-slate-600"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-0.5">WhatsApp *</label>
              <div className="relative group">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={15} />
                <input 
                  type="tel" required value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500/40 outline-none transition-all text-sm font-semibold text-white placeholder-slate-600"
                  placeholder="(62) 9 9999-9999"
                />
              </div>
            </div>

            <div className="mt-auto pt-2">
              <button 
                type="submit" disabled={isSubmitting}
                className="w-full py-3 text-sm font-black rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/25"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
                Iniciar Conversa
              </button>
            </div>
            
            <p className="text-center text-[8px] font-bold text-slate-700 uppercase tracking-[0.15em] pb-1">
              Powered by <span className="text-indigo-500/60">Chatinho</span>
            </p>
          </form>
        </div>
      ) : (
        /* ── Chat View ── */
        <>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
            {/* Welcome system message */}
            <div className="flex justify-center py-2">
              <span className="text-[9px] font-bold text-slate-500/70 uppercase tracking-widest bg-white/[0.03] px-3 py-1 rounded-full">
                Chat iniciado
              </span>
            </div>

            {messages.map((msg) => (
              <div key={msg.id} className={cn(
                "max-w-[78%] px-3.5 py-2.5 text-[13px] font-medium leading-relaxed",
                msg.fromMe 
                  ? "rounded-2xl rounded-tl-md bg-white/[0.07] text-slate-200 self-start" 
                  : "rounded-2xl rounded-tr-md ml-auto text-white self-end shadow-md shadow-indigo-600/10"
              )}
              style={!msg.fromMe ? { background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' } : undefined}
              >
                {msg.body}
                <div className={cn(
                  "text-[8px] mt-1 font-bold uppercase tracking-widest",
                  msg.fromMe ? "text-slate-600" : "text-white/40"
                )}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            
            {messages.length <= 1 && (
              <div className="text-center py-6">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <MessageSquare size={18} className="text-indigo-400/50" />
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Aguardando atendente...
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="border-t border-white/[0.06]" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 px-3 py-3">
              <input 
                type="text" value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500/40 transition-all font-semibold text-sm text-white placeholder-slate-600"
                placeholder="Digite sua mensagem..."
              />
              <button 
                type="submit"
                className="p-2.5 rounded-xl text-white transition-all active:scale-90 shadow-lg shadow-indigo-600/20"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
