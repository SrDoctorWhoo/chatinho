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
  Crown,
  Layout
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { ProfileModal } from './ProfileModal';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ['ADMIN', 'MANAGER', 'ATTENDANT', 'INTERNAL'] },
  { icon: Layout, label: 'Planner', href: '/planner', roles: ['ADMIN', 'MANAGER', 'ATTENDANT', 'INTERNAL'] },
  { icon: MessageSquare, label: 'Conversas', href: '/conversations', roles: ['ADMIN', 'MANAGER', 'ATTENDANT', 'INTERNAL'] },
  { icon: Smartphone, label: 'WhatsApp', href: '/whatsapp', roles: ['ADMIN'] },
  { icon: GitBranch, label: 'Fluxos (Bot)', href: '/flows', roles: ['ADMIN', 'MANAGER'] },
  { icon: Users, label: 'Atendentes', href: '/attendants', roles: ['ADMIN', 'MANAGER'] },
  { icon: Settings, label: 'Configurações', href: '/settings', roles: ['ADMIN', 'MANAGER'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const filteredItems = menuItems.filter(item => 
    item.roles.includes(session?.user?.role || 'ATTENDANT')
  );

  return (
    <aside className="w-64 h-screen flex flex-col bg-slate-950 text-slate-400 border-r border-white/5 relative overflow-hidden shrink-0">
      {/* Decorative gradient blur */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500/10 blur-[60px] rounded-full" />
      
      <div className="relative z-10 p-6 mb-2">
        <Link href="/dashboard" className="flex items-center gap-2.5 text-white group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
            <MessageSquare size={18} className="text-slate-950" />
          </div>
          <span className="text-xl font-bold tracking-tighter">
            Chat<span className="text-emerald-400">inho</span>
          </span>
        </Link>
      </div>

      <nav className="relative z-10 flex-1 px-3 space-y-1">
        {filteredItems.map((item, index) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={item.href}
                className={cn(
                  "relative flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-300 group",
                  isActive 
                    ? "text-emerald-400" 
                    : "hover:text-slate-200"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/20 rounded-xl z-0"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <div className="relative z-10 flex items-center gap-3">
                  <item.icon size={18} className={cn(
                    "transition-colors duration-300",
                    isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-emerald-400"
                  )} />
                  <span className="tracking-wide text-[13px] font-semibold">{item.label}</span>
                </div>

                <div className="relative z-10">
                  {isActive ? (
                    <motion.div 
                      layoutId="active-dot"
                      className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" 
                    />
                  ) : (
                    <ChevronRight size={12} className="opacity-0 group-hover:opacity-40 -translate-x-1 group-hover:translate-x-0 transition-all duration-300" />
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="relative z-10 p-5 mt-auto border-t border-white/5 bg-slate-900/20">
        <div 
          onClick={() => setIsProfileOpen(true)}
          className="bg-white/[0.02] backdrop-blur-md p-3 rounded-2xl mb-4 border border-white/5 group hover:bg-white/[0.04] transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-1.5 opacity-5 group-hover:opacity-10 transition-opacity">
            <Crown size={24} className="text-emerald-400" />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-[8px] overflow-hidden">
                {session?.user?.image ? (
                  <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  session?.user?.role === 'ADMIN' ? 'ADM' : session?.user?.role === 'MANAGER' ? 'MGR' : 'ATD'
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-slate-100 truncate">{session?.user?.name || 'Usuário'}</p>
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.1em] truncate">
                {session?.user?.role}
              </p>
            </div>
          </div>
        </div>

        <ProfileModal 
          isOpen={isProfileOpen} 
          onClose={() => setIsProfileOpen(false)} 
          user={session?.user}
        />
        
        <button 
          onClick={() => signOut()}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-400/5 transition-all duration-300 font-bold text-[12px] group"
        >
          <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          <span className="tracking-wide">Sair</span>
        </button>
      </div>
    </aside>
  );
}
