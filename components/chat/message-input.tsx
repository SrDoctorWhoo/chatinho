'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Mic, X, Image as ImageIcon, FileText, Bot } from 'lucide-react';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSend: (text: string, type?: 'chat' | 'internal') => void;
  onSendMedia?: (file: File, caption?: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, onSendMedia, disabled }: MessageInputProps) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isInternal, setIsInternal] = useState(false);
  const [shortcuts, setShortcuts] = useState<any[]>([]);
  const [filteredShortcuts, setFilteredShortcuts] = useState<any[]>([]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch('/api/settings/canned-responses')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setShortcuts(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Tenta formatos compatíveis com Meta Cloud API primeiro
      const mimeTypes = ['audio/mp4', 'audio/aac', 'audio/ogg; codecs=opus', 'audio/webm; codecs=opus'];
      const selectedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'audio/webm';
      
      console.log('[Recorder] Usando MimeType:', selectedMimeType);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      console.log(`[Recorder] Iniciando gravação em ${selectedMimeType}`);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: selectedMimeType });
        const file = new File([audioBlob], `recording.${selectedMimeType.split('/')[1].split(';')[0]}`, {
          type: selectedMimeType
        });
        if (onSendMedia) onSendMedia(file);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Não foi possível acessar o microfone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleTextChange = (val: string) => {
    setText(val);
    if (val.startsWith('/') && !isInternal) {
      const query = val.slice(1).toLowerCase();
      const filtered = shortcuts.filter(s => s.shortcut.includes(query));
      setFilteredShortcuts(filtered);
      setShowShortcuts(filtered.length > 0);
      setSelectedIndex(0);
    } else {
      setShowShortcuts(false);
    }
  };

  const handleSelectShortcut = (s: any) => {
    setText(s.content);
    setShowShortcuts(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    
    if (selectedFile) {
      if (onSendMedia) onSendMedia(selectedFile, text);
      setSelectedFile(null);
      setText('');
    } else if (text.trim()) {
      onSend(text, isInternal ? 'internal' : 'chat');
      setText('');
      if (isInternal) setIsInternal(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="px-6 py-6 bg-transparent relative z-20">
      <form 
        onSubmit={handleSubmit}
        className="flex items-end gap-3 max-w-7xl mx-auto"
      >
        {/* Attachment & Emoji Buttons */}
        <div className="flex items-center gap-1.5 bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2rem] p-1.5 shadow-2xl">
          <div className="relative" ref={emojiRef}>
            <button 
              type="button" 
              onClick={() => setShowEmoji(!showEmoji)}
              className={cn(
                "p-3 rounded-2xl transition-all duration-500 group",
                showEmoji ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Smile size={20} className="group-active:scale-90 transition-transform" />
            </button>
            
            <AnimatePresence>
              {showEmoji && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-16 left-0 z-50 shadow-2xl"
                >
                  <EmojiPicker theme={Theme.DARK} onEmojiClick={onEmojiClick} searchPlaceHolder="Buscar emoji..." />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            accept="image/*,video/*,audio/*,application/pdf"
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all group"
          >
            <Paperclip size={20} className="group-active:scale-90 transition-transform" />
          </button>

          <div className="w-px h-5 bg-white/10 mx-0.5" />

          <button 
            type="button" 
            onClick={() => setIsInternal(!isInternal)}
            className={cn(
              "p-3 rounded-2xl transition-all group flex items-center gap-2",
              isInternal ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20" : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
            title={isInternal ? "Modo: Nota Interna (Oculto p/ Cliente)" : "Modo: Mensagem Direta"}
          >
            <FileText size={20} className="group-active:scale-90 transition-transform" />
            {isInternal && <span className="text-[10px] font-black uppercase tracking-tighter pr-1">Nota</span>}
          </button>
        </div>
        
        {/* Input Area */}
        <div className="flex-1 relative group">
          <AnimatePresence>
            {showShortcuts && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-0 mb-4 w-full bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden z-50"
              >
                <div className="p-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2">Respostas Rápidas</span>
                  <Bot size={14} className="text-emerald-500/50" />
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  {filteredShortcuts.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectShortcut(s)}
                      className={cn(
                        "w-full text-left px-5 py-4 flex flex-col gap-1 hover:bg-emerald-500/5 transition-colors border-b border-white/5 last:border-none",
                        idx === selectedIndex ? "bg-emerald-500/10" : ""
                      )}
                    >
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">/{s.shortcut}</span>
                      <p className="text-sm text-slate-300 font-medium line-clamp-2 leading-relaxed">{s.content}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {(selectedFile || isRecording) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-full left-0 mb-4 w-full bg-slate-950/80 backdrop-blur-3xl p-5 rounded-[2rem] border border-white/10 shadow-2xl flex items-center gap-5"
              >
                {isRecording ? (
                  <>
                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 animate-premium-pulse">
                      <Mic size={32} className="text-red-500" />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-base font-black text-white tracking-tight">Gravando Áudio Premium</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{formatTime(recordingTime)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                      {selectedFile?.type.includes('image') ? <ImageIcon size={32} className="text-emerald-500" /> : <FileText size={32} className="text-emerald-500" />}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-base font-black text-white tracking-tight truncate">{selectedFile?.name}</span>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{(selectedFile?.size || 0 / 1024 / 1024).toFixed(2)} MB • Pronto para enviar</span>
                    </div>
                  </>
                )}
                <button 
                  type="button" 
                  onClick={() => isRecording ? stopRecording() : setSelectedFile(null)}
                  className="p-3 bg-white/5 hover:bg-red-500/10 rounded-2xl transition-all text-slate-400 hover:text-red-400"
                >
                  <X size={20} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <textarea
              rows={1}
              value={text}
              onChange={(e) => {
                handleTextChange(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
              }}
              onKeyDown={(e) => {
                if (showShortcuts) {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev + 1) % filteredShortcuts.length);
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev - 1 + filteredShortcuts.length) % filteredShortcuts.length);
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSelectShortcut(filteredShortcuts[selectedIndex]);
                  } else if (e.key === 'Escape') {
                    setShowShortcuts(false);
                  }
                } else if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={disabled || isRecording}
              className={cn(
                "w-full pl-7 pr-16 py-5 bg-white/[0.03] backdrop-blur-3xl border rounded-[2rem] text-base font-medium outline-none disabled:opacity-50 placeholder-slate-600 transition-all resize-none shadow-2xl",
                isInternal 
                  ? "border-amber-500/30 focus:ring-4 focus:ring-amber-500/5 text-amber-100" 
                  : "border-white/5 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/20 text-white"
              )}
              placeholder={
                isInternal 
                  ? "Sua nota interna aqui..." 
                  : selectedFile ? "Legenda opcional..." : isRecording ? "Escutando..." : "Digite aqui... (use / para atalhos)"
              }
              style={{ minHeight: '64px' }}
            />
            
            <div className="absolute right-3.5 bottom-3">
              <motion.button
                whileHover={{ scale: 1.1, rotate: -15 }}
                whileTap={{ scale: 0.9, rotate: 0 }}
                type={isRecording ? "button" : "submit"}
                onClick={isRecording ? stopRecording : undefined}
                disabled={disabled || (!text.trim() && !selectedFile && !isRecording)}
                className={cn(
                  "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl",
                  text.trim() || selectedFile || isRecording
                    ? (isInternal ? "bg-amber-500 text-slate-950 shadow-amber-500/20" : "bg-emerald-500 text-slate-950 shadow-emerald-500/20")
                    : "bg-white/5 text-slate-600 cursor-not-allowed opacity-50"
                )}
              >
                <Send size={20} strokeWidth={2.5} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Voice Message Button */}
        {!text.trim() && !selectedFile && !isRecording && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={startRecording}
            className="w-16 h-16 bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-[2rem] flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-all shadow-2xl group"
          >
            <Mic size={24} className="group-hover:scale-110 transition-transform" />
          </motion.button>
        )}
      </form>
    </div>
  );
}
