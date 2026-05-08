'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Users, Clock, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

// Using a client-side fetch or props for stats since this is a 'use client' file now for animations
// In a real scenario, you'd either pass these from a server component or use an API
const dummyStats = [
  { label: 'Conversas Ativas', value: '12', icon: MessageSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10', trend: '+14%' },
  { label: 'Aguardando Atendimento', value: '3', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', trend: '-2' },
  { label: 'Atendentes Online', value: '5', icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10', trend: 'Estável' },
  { label: 'Resolvidos Hoje', value: '48', icon: CheckCircle2, color: 'text-teal-400', bg: 'bg-teal-500/10', trend: '+22%' },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-10 pb-12 p-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-2 mb-2 text-emerald-500 font-bold text-xs uppercase tracking-[0.2em]">
            <Sparkles size={14} />
            <span>Sistema em Tempo Real</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Visão Geral</h1>
          <p className="text-slate-500 mt-1 font-medium">Acompanhe o desempenho do seu atendimento.</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm font-bold"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live Monitoring Active
        </motion.div>
      </header>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {dummyStats.map((stat) => (
          <motion.div 
            key={stat.label} 
            variants={item}
            className="glass-panel premium-card p-6 rounded-[2rem] border-white/5 bg-white/[0.02] group transition-all duration-500 hover:bg-white/[0.05]"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-4">
                <div className={cn("inline-flex p-3 rounded-2xl transition-transform group-hover:rotate-12 duration-500", stat.bg, stat.color)}>
                  <stat.icon size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-black text-white tracking-tight">{stat.value}</h3>
                    <span className="text-[10px] font-bold text-emerald-500 px-1.5 py-0.5 bg-emerald-500/10 rounded-lg">{stat.trend}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Subtle Chart Line Background */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass-panel p-8 rounded-[2.5rem] border-white/5 bg-white/[0.02] min-h-[460px]"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Atividade Recente</h2>
              <p className="text-slate-500 text-sm font-medium mt-1">Fluxo de conversas e eventos do sistema</p>
            </div>
            <button className="px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl text-xs font-bold text-slate-300 transition-all uppercase tracking-widest">Ver Tudo</button>
          </div>
          
          <div className="flex flex-col items-center justify-center h-72 text-slate-500">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-10 animate-pulse" />
              <div className="relative w-20 h-20 rounded-[1.5rem] bg-white/[0.03] border border-white/10 flex items-center justify-center">
                <Clock size={36} className="opacity-20 text-emerald-400" />
              </div>
            </div>
            <p className="font-bold text-slate-400">Silêncio no sistema</p>
            <p className="text-sm opacity-60 mt-1">Novas interações aparecerão aqui dinamicamente</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-white/[0.02] min-h-[460px]"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">Fila</h2>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center h-72 text-slate-500 text-center">
              <div className="w-20 h-20 rounded-[1.5rem] bg-white/[0.03] border border-white/10 flex items-center justify-center mb-6">
                <CheckCircle2 size={36} className="opacity-20 text-emerald-400" />
              </div>
              <p className="font-bold text-slate-400">Fila Zerada!</p>
              <p className="text-sm opacity-60 mt-1">Ótimo trabalho, todos os contatos foram triados.</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating Performance Badge */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
        className="fixed bottom-8 right-8 z-50 glass-panel p-4 rounded-3xl border-emerald-500/20 bg-emerald-500/10 flex items-center gap-3 cursor-pointer hover:bg-emerald-500/20 transition-all shadow-2xl shadow-emerald-500/10 group"
      >
        <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center group-hover:rotate-[360deg] transition-transform duration-1000">
          <TrendingUp size={20} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-500">System Performance</p>
          <p className="text-sm font-bold text-white">99.8% Optimized</p>
        </div>
      </motion.div>
    </div>
  );
}
