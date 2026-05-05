'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Mic, X, Image as ImageIcon } from 'lucide-react';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';

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
    <form 
      onSubmit={handleSubmit}
      className="flex items-center gap-2"
    >
      <div className="flex items-center gap-1 text-[#aebac1] px-2 relative" ref={emojiRef}>
        <button 
          type="button" 
          onClick={() => setShowEmoji(!showEmoji)}
          className="p-2 hover:bg-[#3b4a54] rounded-full transition-all cursor-pointer"
        >
          <Smile size={26} className={showEmoji ? "text-emerald-500" : ""} />
        </button>
        
        {showEmoji && (
          <div className="absolute bottom-14 left-0 z-50 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
            <EmojiPicker theme={Theme.DARK} onEmojiClick={onEmojiClick} searchPlaceHolder="Buscar emoji..." />
          </div>
        )}

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
          className="p-2 hover:bg-[#3b4a54] rounded-full transition-all cursor-pointer"
        >
          <Paperclip size={26} />
        </button>
      </div>
      
      <div className="flex-1 relative">
        {selectedFile && (
          <div className="absolute bottom-[calc(100%+16px)] left-0 bg-[#202c33] p-3 rounded-xl border border-white/10 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="w-12 h-12 bg-[#111b21] rounded-lg flex items-center justify-center">
              <ImageIcon size={24} className="text-emerald-500" />
            </div>
            <div className="flex flex-col flex-1 min-w-[200px] max-w-[300px]">
              <span className="text-sm font-semibold text-white truncate">{selectedFile.name}</span>
              <span className="text-xs text-[#8696a0]">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <button 
              type="button" 
              onClick={() => setSelectedFile(null)}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-[#8696a0] hover:text-red-400"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-2.5 bg-[#2a3942] border-none rounded-lg text-[#e9edef] text-[15px] focus:ring-0 outline-none disabled:opacity-50 placeholder-[#8696a0] cursor-text"
          placeholder={selectedFile ? "Adicione uma legenda..." : "Digite uma mensagem"}
        />
      </div>

      <div className="px-2">
        {text.trim() || selectedFile ? (
          <button
            type="submit"
            disabled={disabled}
            className="p-2 text-[#8696a0] hover:text-[#e9edef] transition-all active:scale-90 cursor-pointer disabled:cursor-not-allowed"
          >
            <Send size={26} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => console.log('Mic click')}
            className="p-2 text-[#8696a0] hover:text-[#e9edef] transition-all cursor-pointer"
          >
            <Mic size={26} />
          </button>
        )}
      </div>
    </form>
  );
}
