'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Mic, X, Image as ImageIcon } from 'lucide-react';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSend: (text: string) => void;
  onSendMedia?: (file: File, caption?: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, onSendMedia, disabled }: MessageInputProps) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    
    if (selectedFile) {
      if (onSendMedia) onSendMedia(selectedFile, text);
      setSelectedFile(null);
      setText('');
    } else if (text.trim()) {
      onSend(text);
      setText('');
    }
  };

  return (
    <div className="px-6 py-6 bg-transparent relative z-20">
      <form 
        onSubmit={handleSubmit}
        className="flex items-end gap-3 max-w-7xl mx-auto"
      >
        {/* Attachment & Emoji Buttons */}
        <div className="flex items-center gap-1 bg-white/[0.03] backdrop-blur-2xl border border-white/5 rounded-2xl p-1.5 shadow-2xl">
          <div className="relative" ref={emojiRef}>
            <button 
              type="button" 
              onClick={() => setShowEmoji(!showEmoji)}
              className={cn(
                "p-2.5 rounded-xl transition-all duration-300 group",
                showEmoji ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Smile size={22} className="group-active:scale-90 transition-transform" />
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
            accept="image/*,video/*,application/pdf"
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
          >
            <Paperclip size={22} className="group-active:scale-90 transition-transform" />
          </button>
        </div>
        
        {/* Input Area */}
        <div className="flex-1 relative group">
          <AnimatePresence>
            {selectedFile && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-0 mb-4 w-full bg-slate-900/90 backdrop-blur-2xl p-4 rounded-3xl border border-white/10 shadow-2xl flex items-center gap-4"
              >
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                  <ImageIcon size={28} className="text-emerald-500" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-bold text-white truncate">{selectedFile.name}</span>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setSelectedFile(null)}
                  className="p-2 hover:bg-red-400/10 rounded-xl transition-colors text-slate-400 hover:text-red-400"
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
                setText(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={disabled}
              className="w-full pl-6 pr-14 py-4 bg-white/[0.03] backdrop-blur-2xl border border-white/5 rounded-3xl text-white text-[15px] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 outline-none disabled:opacity-50 placeholder-slate-600 transition-all resize-none shadow-2xl"
              placeholder={selectedFile ? "Adicione uma legenda..." : "Escreva sua mensagem aqui..."}
              style={{ minHeight: '56px' }}
            />
            
            <div className="absolute right-3 bottom-2.5">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={disabled || (!text.trim() && !selectedFile)}
                className={cn(
                  "p-2.5 rounded-2xl transition-all duration-300 shadow-xl",
                  text.trim() || selectedFile
                    ? "bg-emerald-500 text-slate-950 shadow-emerald-500/20"
                    : "bg-white/5 text-slate-600 cursor-not-allowed"
                )}
              >
                <Send size={22} strokeWidth={2.5} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Voice Message Placeholder */}
        {!text.trim() && !selectedFile && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            className="p-4 bg-white/[0.03] backdrop-blur-2xl border border-white/5 rounded-2xl text-slate-400 hover:text-emerald-400 transition-all shadow-2xl"
          >
            <Mic size={24} />
          </motion.button>
        )}
      </form>
    </div>
  );
}
