'use client';

import { useState } from 'react';
import { Send, Paperclip, Smile, Mic } from 'lucide-react';

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text);
    setText('');
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="flex items-center gap-2"
    >
      <div className="flex items-center gap-1 text-[#aebac1] px-2">
        <button 
          type="button" 
          onClick={() => console.log('Emoji click')}
          className="p-2 hover:bg-[#3b4a54] rounded-full transition-all cursor-pointer"
        >
          <Smile size={26} />
        </button>
        <button 
          type="button" 
          onClick={() => console.log('Attachment click')}
          className="p-2 hover:bg-[#3b4a54] rounded-full transition-all cursor-pointer"
        >
          <Paperclip size={26} />
        </button>
      </div>
      
      <div className="flex-1 relative">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-2.5 bg-[#2a3942] border-none rounded-lg text-[#e9edef] text-[15px] focus:ring-0 outline-none disabled:opacity-50 placeholder-[#8696a0] cursor-text"
          placeholder="Digite uma mensagem"
        />
      </div>

      <div className="px-2">
        {text.trim() ? (
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
