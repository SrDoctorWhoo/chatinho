import { MessageSquare, Users, Clock, CheckCircle2 } from 'lucide-react';

const stats = [
  { label: 'Conversas Ativas', value: '12', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-600/10' },
  { label: 'Aguardando Atendimento', value: '4', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-600/10' },
  { label: 'Atendentes Online', value: '3', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-600/10' },
  { label: 'Resolvidos Hoje', value: '28', icon: CheckCircle2, color: 'text-indigo-600', bg: 'bg-indigo-600/10' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Visão Geral</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Acompanhe o desempenho do seu atendimento em tempo real.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
              </div>
              <div className={cn("p-3 rounded-2xl", stat.bg, stat.color)}>
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 min-h-[400px]">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Atividade Recente</h2>
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <p>Nenhuma atividade para mostrar no momento.</p>
          </div>
        </div>

        <div className="glass-card p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 min-h-[400px]">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Performance por Atendente</h2>
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <p>Os dados de performance aparecerão conforme os atendimentos forem iniciados.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to handle conditional classes (assuming cn is available globally or imported)
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
