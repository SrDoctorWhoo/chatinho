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

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
            accept="image/*,video/*,audio/*,application/pdf"
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
            {(selectedFile || isRecording) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-0 mb-4 w-full bg-slate-900/90 backdrop-blur-2xl p-4 rounded-3xl border border-white/10 shadow-2xl flex items-center gap-4"
              >
                {isRecording ? (
                  <>
                    <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 animate-pulse">
                      <Mic size={28} className="text-red-500" />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-sm font-bold text-white">Gravando Áudio...</span>
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{formatTime(recordingTime)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                      {selectedFile?.type.includes('image') ? <ImageIcon size={28} className="text-emerald-500" /> : <Paperclip size={28} className="text-emerald-500" />}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-bold text-white truncate">{selectedFile?.name}</span>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{(selectedFile?.size || 0 / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </>
                )}
                <button 
                  type="button" 
                  onClick={() => isRecording ? stopRecording() : setSelectedFile(null)}
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
              disabled={disabled || isRecording}
              className="w-full pl-6 pr-14 py-4 bg-white/[0.03] backdrop-blur-2xl border border-white/5 rounded-3xl text-white text-[15px] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 outline-none disabled:opacity-50 placeholder-slate-600 transition-all resize-none shadow-2xl"
              placeholder={selectedFile ? "Adicione uma legenda..." : isRecording ? "Gravando áudio..." : "Escreva sua mensagem aqui..."}
              style={{ minHeight: '56px' }}
            />
            
            <div className="absolute right-3 bottom-2.5">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type={isRecording ? "button" : "submit"}
                onClick={isRecording ? stopRecording : undefined}
                disabled={disabled || (!text.trim() && !selectedFile && !isRecording)}
                className={cn(
                  "p-2.5 rounded-2xl transition-all duration-300 shadow-xl",
                  text.trim() || selectedFile || isRecording
                    ? "bg-emerald-500 text-slate-950 shadow-emerald-500/20"
                    : "bg-white/5 text-slate-600 cursor-not-allowed"
                )}
              >
                {isRecording ? <Send size={22} strokeWidth={2.5} /> : <Send size={22} strokeWidth={2.5} />}
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
            className="p-4 bg-white/[0.03] backdrop-blur-2xl border border-white/5 rounded-2xl text-slate-400 hover:text-emerald-400 transition-all shadow-2xl"
          >
            <Mic size={24} />
          </motion.button>
        )}
      </form>
    </div>
  );
}
