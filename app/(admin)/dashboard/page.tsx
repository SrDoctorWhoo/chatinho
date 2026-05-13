'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Users, Clock, CheckCircle2, TrendingUp, Sparkles, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

// Using a client-side fetch or props for stats since this is a 'use client' file now for animations
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
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('all');
  const [isDeptOpen, setIsDeptOpen] = useState(false);

  const fetchData = async (deptId = 'all') => {
    try {
      const res = await fetch(`/api/dashboard?departmentId=${deptId}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedDept);
    const interval = setInterval(() => fetchData(selectedDept), 30000);
    return () => clearInterval(interval);
  }, [selectedDept]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: 'Conversas Ativas', value: data?.stats?.active || '0', icon: MessageSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10', trend: '+14%' },
    { label: 'Aguardando Atendimento', value: data?.stats?.waiting || '0', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', trend: '-2' },
    { label: 'Atendentes Online', value: data?.stats?.attendants || '0', icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10', trend: 'Estável' },
    { label: 'Resolvidos Hoje', value: data?.stats?.resolvedToday || '0', icon: CheckCircle2, color: 'text-teal-400', bg: 'bg-teal-500/10', trend: '+22%' },
  ];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="space-y-10 pb-12 p-4 md:p-8 max-w-[1600px] mx-auto w-full overflow-x-hidden">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1"
        >
          <div className="flex items-center gap-2 mb-2 text-emerald-500 font-bold text-[10px] uppercase tracking-[0.3em]">
            <Sparkles size={12} />
            <span>Sistema em Tempo Real</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Visão Geral</h1>
          <p className="text-slate-500 mt-1 font-medium text-sm md:text-base">Acompanhe o desempenho do seu atendimento.</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-4"
        >
          {data?.availableDepartments?.length > 0 && (
            <div className="relative">
              <button 
                onClick={() => setIsDeptOpen(!isDeptOpen)}
                className="flex items-center justify-between gap-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-2xl px-5 py-2.5 text-sm font-bold text-white transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-w-[200px]"
              >
                <div className="flex items-center gap-2 truncate">
                  <Users size={14} className="text-emerald-500" />
                  <span className="truncate">
                    {selectedDept === 'all' ? 'Todos os Setores' : 
                      data.availableDepartments.find((d: any) => d.id === selectedDept)?.name}
                  </span>
                </div>
                <ChevronDown size={16} className={cn("text-slate-500 transition-transform duration-300", isDeptOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isDeptOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-3 w-full sm:min-w-[240px] glass-panel border-white/10 bg-slate-900/90 backdrop-blur-xl rounded-[1.5rem] p-2 z-[100] shadow-2xl overflow-hidden"
                  >
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                      <button 
                        onClick={() => { setSelectedDept('all'); setIsDeptOpen(false); }}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between group",
                          selectedDept === 'all' ? "bg-emerald-500/10 text-emerald-400" : "text-slate-400 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        Todos os Setores
                        {selectedDept === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                      </button>
                      
                      {data.availableDepartments.map((dept: any) => (
                        <button 
                          key={dept.id}
                          onClick={() => { setSelectedDept(dept.id); setIsDeptOpen(false); }}
                          className={cn(
                            "w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between group",
                            selectedDept === dept.id ? "bg-emerald-500/10 text-emerald-400" : "text-slate-400 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          <span className="truncate">{dept.name}</span>
                          {selectedDept === dept.id && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="flex items-center gap-3 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-bold whitespace-nowrap">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Monitoring
          </div>
        </motion.div>
      </header>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat) => (
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="xl:col-span-2 glass-panel p-6 md:p-8 rounded-[2.5rem] border-white/5 bg-white/[0.02] min-h-[460px] flex flex-col"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Atividade Recente</h2>
              <p className="text-slate-500 text-xs md:text-sm font-medium mt-1">Fluxo de conversas e eventos do sistema</p>
            </div>
            <button className="px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl text-xs font-bold text-slate-300 transition-all uppercase tracking-widest self-start sm:self-center">Ver Tudo</button>
          </div>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar flex-1">
            {data?.recentActivity?.length > 0 ? (
              data.recentActivity.map((activity: any) => (
                <div key={activity.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group/item gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-emerald-400 border border-white/5">
                      {activity.contactName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">{activity.contactName}</p>
                      <p className="text-xs text-slate-500 truncate">{activity.body}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right shrink-0 pl-14 sm:pl-0">
                    <p className="text-[10px] font-bold text-slate-600 uppercase">
                      {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-tighter">
                      {activity.fromMe ? 'Enviada' : 'Recebida'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
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
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-panel p-6 md:p-8 rounded-[2.5rem] border-white/5 bg-white/[0.02] min-h-[460px] flex flex-col"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">Fila</h2>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar flex-1">
            {data?.queue?.length > 0 ? (
              data.queue.map((item: any) => (
                <div key={item.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group/queue">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-white">{item.contactName}</p>
                    <span className="text-[10px] font-bold text-amber-500 px-2 py-0.5 bg-amber-500/10 rounded-lg uppercase">
                      {item.departmentName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock size={12} />
                    <p className="text-[10px] font-bold uppercase tracking-tight">
                      Aguardando há {Math.floor((new Date().getTime() - new Date(item.waitingSince).getTime()) / 60000)} min
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-72 text-slate-500 text-center">
                <div className="w-20 h-20 rounded-[1.5rem] bg-white/[0.03] border border-white/10 flex items-center justify-center mb-6">
                  <CheckCircle2 size={36} className="opacity-20 text-emerald-400" />
                </div>
                <p className="font-bold text-slate-400">Fila Zerada!</p>
                <p className="text-sm opacity-60 mt-1">Ótimo trabalho, todos os contatos foram triados.</p>
              </div>
            )}
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
  </div>
  );
}
