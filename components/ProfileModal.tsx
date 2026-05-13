'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Camera, 
  FileText, 
  Lock, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [profile, setProfile] = useState({
    name: '',
    image: '',
    signature: '',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/users/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile({
          name: data.name || '',
          image: data.image || '',
          signature: data.signature || '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Compress image before setting it
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressed = canvas.toDataURL('image/jpeg', 0.7);
          setProfile(prev => ({ ...prev, image: compressed }));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.details ? `${data.error}: ${data.details}` : (data.error || 'Erro ao atualizar perfil'));
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/users/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao alterar senha');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Meu Perfil</h2>
                <p className="text-slate-500 text-sm font-medium">Gerencie suas informações e segurança.</p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-8 mt-6 gap-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all",
                  activeTab === 'profile' 
                    ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" 
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                )}
              >
                <User size={16} />
                Perfil
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all",
                  activeTab === 'password' 
                    ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" 
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                )}
              >
                <Lock size={16} />
                Segurança
              </button>
            </div>

            <div className="p-8">
              {activeTab === 'profile' ? (
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  {/* Photo Upload */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-3xl bg-slate-800 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-emerald-500/50">
                        {profile.image ? (
                          <img src={profile.image} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User size={32} className="text-slate-600" />
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                          <Camera size={20} className="text-white" />
                        </div>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleImageChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      <p className="text-[10px] text-center mt-2 font-bold text-slate-500 uppercase tracking-widest">Foto Interna</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Nome Completo</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                          placeholder="Seu nome"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Assinatura Mensagem</label>
                      <div className="relative group">
                        <FileText className="absolute left-4 top-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                        <textarea
                          value={profile.signature}
                          onChange={(e) => setProfile(prev => ({ ...prev, signature: e.target.value }))}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all min-h-[100px] resize-none"
                          placeholder="Texto que aparecerá no final das suas mensagens..."
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-500/20"
                  >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    SALVAR ALTERAÇÕES
                  </button>
                </form>
              ) : (
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Senha Atual</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                        <input
                          type="password"
                          value={passwords.currentPassword}
                          onChange={(e) => setPasswords(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Nova Senha</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                        <input
                          type="password"
                          value={passwords.newPassword}
                          onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                          placeholder="No mínimo 8 caracteres"
                          required
                          minLength={8}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Confirmar Nova Senha</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                        <input
                          type="password"
                          value={passwords.confirmPassword}
                          onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                          placeholder="Confirme a nova senha"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-500/20"
                  >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Lock size={20} />}
                    REDEFINIR SENHA
                  </button>
                </form>
              )}

              {/* Status Feedback */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-400 text-sm font-bold"
                  >
                    <CheckCircle2 size={18} />
                    Salvo com sucesso!
                  </motion.div>
                )}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm font-bold"
                  >
                    <AlertCircle size={18} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
