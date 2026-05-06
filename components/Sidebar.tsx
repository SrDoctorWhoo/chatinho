'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Smartphone, 
  Settings, 
  LogOut,
  ChevronRight,
  GitBranch,
  Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession, signOut } from 'next-auth/react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ['ADMIN', 'MANAGER', 'ATTENDANT'] },
  { icon: MessageSquare, label: 'Conversas', href: '/conversations', roles: ['ADMIN', 'MANAGER', 'ATTENDANT'] },
  { icon: Smartphone, label: 'WhatsApp', href: '/whatsapp', roles: ['ADMIN'] },
  { icon: GitBranch, label: 'Fluxos (Bot)', href: '/flows', roles: ['ADMIN', 'MANAGER'] },
  { icon: Users, label: 'Atendentes', href: '/attendants', roles: ['ADMIN', 'MANAGER'] },
  { icon: Settings, label: 'Configurações', href: '/settings', roles: ['ADMIN', 'MANAGER'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const filteredItems = menuItems.filter(item => 
    item.roles.includes(session?.user?.role || 'ATTENDANT')
  );

  return (
    <aside className="w-72 h-screen flex flex-col bg-slate-950 text-slate-400 border-r border-white/5 relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full" />
      
      <div className="relative z-10 p-8 mb-4">
        <Link href="/dashboard" className="flex items-center gap-3 text-white group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
            <MessageSquare size={24} className="text-slate-950" />
          </div>
          <span className="text-2xl font-bold tracking-tighter">
            Chat<span className="text-emerald-400">inho</span>
          </span>
        </Link>
      </div>

      <nav className="relative z-10 flex-1 px-4 space-y-1.5">
        {filteredItems.map((item, index) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={item.href}
                className={cn(
                  "relative flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group",
                  isActive 
                    ? "text-emerald-400" 
                    : "hover:text-slate-200"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl z-0"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <div className="relative z-10 flex items-center gap-3">
                  <item.icon size={20} className={cn(
                    "transition-colors duration-300",
                    isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-emerald-400"
                  )} />
                  <span className="tracking-wide text-[14px] font-medium">{item.label}</span>
                </div>

                <div className="relative z-10">
                  {isActive ? (
                    <motion.div 
                      layoutId="active-dot"
                      className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]" 
                    />
                  ) : (
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-40 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="relative z-10 p-6 mt-auto">
        <div className="bg-white/[0.03] backdrop-blur-md p-4 rounded-3xl mb-6 border border-white/5 group hover:bg-white/[0.05] transition-all cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Crown size={32} className="text-emerald-400" />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-[10px]">
                {session?.user?.role === 'ADMIN' ? 'ADM' : session?.user?.role === 'MANAGER' ? 'MGR' : 'ATD'}
              </div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" 
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-100 truncate">{session?.user?.name || 'Usuário'}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] truncate">
                {session?.user?.role === 'ADMIN' ? 'Administrador' : session?.user?.role === 'MANAGER' ? 'Gerente' : 'Atendente'}
              </p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-all duration-300 font-medium text-sm group"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="tracking-wide">Encerrar Sessão</span>
        </button>
      </div>
    </aside>
  );
}
