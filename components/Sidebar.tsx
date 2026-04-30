'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Smartphone, 
  Settings, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: MessageSquare, label: 'Conversas', href: '/conversations' },
  { icon: Smartphone, label: 'WhatsApp', href: '/whatsapp' },
  { icon: Users, label: 'Atendentes', href: '/attendants' },
  { icon: Settings, label: 'Configurações', href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 h-screen flex flex-col bg-slate-900 text-slate-400 border-r border-slate-800">
      <div className="p-6 mb-4">
        <div className="flex items-center gap-3 text-white">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <MessageSquare size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight">Chatinho</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl transition-all group",
                isActive 
                  ? "bg-blue-600/10 text-blue-500 font-medium" 
                  : "hover:bg-slate-800/50 hover:text-slate-200"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} />
                <span>{item.label}</span>
              </div>
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="glass-card bg-slate-800/40 p-4 rounded-2xl mb-4 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">Administrador</p>
              <p className="text-xs text-slate-500 truncate">admin@chatinho.com</p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
        >
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
