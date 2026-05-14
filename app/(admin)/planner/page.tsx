'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  Search, 
  Layout, 
  MoreVertical, 
  User,
  Hash,
  Filter,
  ExternalLink,
  HandMetal,
  XCircle,
  MessageSquare,
  AlertCircle,
  Plus,
  Flag,
  ListTodo,
  Calendar,
  Trash2,
  Download,
  Play
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NewTaskModal } from '@/components/planner/NewTaskModal';

export default function PlannerPage() {
  const router = useRouter();
  const { socket } = useSocket();
  const { data: session } = useSession();
  const [data, setData] = useState<any>({ todo: [], doing: [], done: [] });
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [availableDepts, setAvailableDepts] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchPlannerData = useCallback(async () => {
    try {
      const res = await fetch(`/api/planner?departmentId=${selectedDept}&userId=${selectedUser}`);
      const json = await res.json();
      if (!res.ok) {
        console.error('API Error:', json);
        return;
      }
      setData(json || { todo: [], doing: [], done: [] });
      
      if (availableDepts.length === 0) {
        const dashboardRes = await fetch('/api/dashboard');
        const dashboardJson = await dashboardRes.json();
        setAvailableDepts(dashboardJson.availableDepartments || []);
      }

      if (availableUsers.length === 0 && session?.user?.role === 'ADMIN') {
        const usersRes = await fetch('/api/users');
        const usersJson = await usersRes.json();
        setAvailableUsers(usersJson || []);
      }
    } catch (err) {
      console.error('Failed to fetch planner data', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDept, selectedUser, availableDepts.length, availableUsers.length, session?.user?.role]);

  useEffect(() => {
    fetchPlannerData();
  }, [fetchPlannerData]);

  // Real-time updates via Socket
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (payload: any) => {
      const { conversationId, conversation } = payload;
      if (!conversation) return;

      setData((prev: any) => {
        const newData = { ...prev };
        
        // 1. Remove from any existing column
        Object.keys(newData).forEach(key => {
          newData[key] = newData[key].filter((c: any) => c.id !== conversationId);
        });

        // 2. Add to the correct column based on status
        let targetColumn = 'todo';
        if (conversation.status === 'ACTIVE') targetColumn = 'doing';
        else if (conversation.status === 'CLOSED') targetColumn = 'done';
        else if (conversation.status === 'QUEUED' || conversation.status === 'BOT') targetColumn = 'todo';

        // Add to top of target column
        newData[targetColumn] = [conversation, ...newData[targetColumn]];
        
        // Keep done column limited
        if (targetColumn === 'done') {
          newData.done = newData.done.slice(0, 50);
        }

        return newData;
      });
    };

    const handleNewMessage = (payload: any) => {
      const { conversationId, message, conversation } = payload;
      
      setData((prev: any) => {
        const newData = { ...prev };
        let found = false;

        // Find and update preview/timestamp
        Object.keys(newData).forEach(key => {
          const index = newData[key].findIndex((c: any) => c.id === conversationId);
          if (index !== -1) {
            const updatedConv = { ...newData[key][index], ...conversation };
            updatedConv.messages = [message];
            updatedConv.updatedAt = message.timestamp || new Date().toISOString();
            
            // Move to top of its column
            newData[key].splice(index, 1);
            newData[key] = [updatedConv, ...newData[key]];
            found = true;
          }
        });

        // If not found in any column (new chat), we might need to reload or add if it matches filter
        if (!found && conversation) {
          handleUpdate(payload);
        }

        return newData;
      });
    };

    socket.on('conversation_updated', handleUpdate);
    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('conversation_updated', handleUpdate);
      socket.off('new_message', handleNewMessage);
    };
  }, [socket]);

  const handleAccept = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/conversations/${id}/accept`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        // Socket will handle the move, but we can update locally for speed
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
      setActiveMenu(null);
    }
  };

  const handleClose = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Deseja encerrar este atendimento?')) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/conversations/${id}/close`, { method: 'POST' });
      if (res.ok) fetchPlannerData();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
      setActiveMenu(null);
    }
  };

  const handleReopen = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Deseja reabrir este atendimento?')) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/conversations/${id}/reopen`, { method: 'POST' });
      if (res.ok) fetchPlannerData();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
      setActiveMenu(null);
    }
  };

  const handleCompleteTask = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Deseja concluir esta tarefa?')) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/tasks/${id}`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DONE' })
      });
      if (res.ok) fetchPlannerData();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRedistribute = async (e: React.MouseEvent, id: string, itemType: 'TASK' | 'CONVERSATION') => {
    e.stopPropagation();
    const userId = window.prompt('Digite o ID do novo atendente (ou deixe vazio para remover atribuição):');
    if (userId === null) return; // Cancelled

    setUpdatingId(id);
    try {
      const endpoint = itemType === 'TASK' ? `/api/tasks/${id}` : `/api/conversations/${id}`;
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId: userId || null })
      });
      if (res.ok) fetchPlannerData();
      else alert('Erro ao redistribuir item.');
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
      setActiveMenu(null);
    }
  };

  const handleDeleteTask = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Deseja excluir esta tarefa permanentemente?')) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) fetchPlannerData();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
      setActiveMenu(null);
    }
  };

  const exportToCSV = () => {
    setExporting(true);
    try {
      const allItems = [...data.todo, ...data.doing, ...data.done];
      if (allItems.length === 0) {
        alert('Nenhum dado para exportar.');
        return;
      }

      const headers = ['Tipo', 'Título/Nome', 'Status', 'Atendente', 'Setor', 'Protocolo', 'Atualizado em'];
      const csvData = allItems.map(item => {
        const type = item.itemType === 'TASK' ? 'Tarefa' : 'Atendimento';
        const title = item.itemType === 'TASK' ? item.title : (item.contact?.name || item.contact?.number);
        const status = item.status;
        const attendant = item.assignedTo?.name || 'N/A';
        const department = item.department?.name || 'Geral';
        const protocol = item.protocol || 'N/A';
        const updated = new Date(item.updatedAt).toLocaleString('pt-BR');

        return [type, title, status, attendant, department, protocol, updated].join(',');
      });

      const csvContent = [headers.join(','), ...csvData].join('\n');
      const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio_planner_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    { id: 'todo', title: 'Aguardando', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', glow: 'shadow-amber-500/10', border: 'border-amber-500/20' },
    { id: 'doing', title: 'Em Atendimento', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10', glow: 'shadow-emerald-500/10', border: 'border-emerald-500/20' },
    { id: 'done', title: 'Finalizados', icon: CheckCircle2, color: 'text-slate-400', bg: 'bg-slate-500/10', glow: 'shadow-slate-500/10', border: 'border-slate-500/20' },
  ];

  const filteredData = (status: string) => {
    if (!data || !data[status] || !Array.isArray(data[status])) return [];
    return data[status].filter((item: any) => {
      if (item.itemType === 'TASK') {
        return item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return item.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.contact?.number?.includes(searchTerm) ||
        item.protocol?.toLowerCase().includes(searchTerm.toLowerCase());
    });
  };

  const isTodoEmpty = !data.todo || !Array.isArray(data.todo) || data.todo.length === 0;
  const isDoingEmpty = !data.doing || !Array.isArray(data.doing) || data.doing.length === 0;

  if (loading && isTodoEmpty && isDoingEmpty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Layout size={24} className="text-emerald-500/50" />
          </div>
        </div>
        <p className="text-slate-500 font-bold text-sm animate-pulse uppercase tracking-widest">Sincronizando Planner...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#020617] overflow-hidden">
      {/* Top Bar Area - Fixed */}
      <div className="p-4 md:p-8 pb-0">
        <div className="max-w-[1800px] mx-auto w-full">
          <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4 text-emerald-500 font-bold text-[10px] uppercase tracking-[0.3em]">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Layout size={12} />
                <span>Workflow em Tempo Real</span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight">Planner</h1>
              <p className="text-slate-400 mt-2 font-medium text-sm">Gerencie o fluxo de atendimento da sua equipe.</p>
            </div>

              <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="relative w-full sm:w-72 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={16} />
                <input 
                  type="text"
                  placeholder="Buscar protocolo, nome ou tarefa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-12 bg-white/[0.04] border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white/[0.06] transition-all"
                />
              </div>
 
              <div className="flex items-center gap-3 w-full sm:w-auto h-12 bg-white/[0.04] border border-white/10 rounded-2xl px-4">
                <Filter size={14} className="text-slate-400" />
                <select 
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-transparent border-none py-1.5 text-xs font-bold text-slate-200 focus:outline-none cursor-pointer sm:min-w-[130px]"
                >
                  <option value="all" className="bg-[#0f172a]">Todos Setores</option>
                  {availableDepts.map((dept) => (
                    <option key={dept.id} value={dept.id} className="bg-[#0f172a]">{dept.name}</option>
                  ))}
                </select>
              </div>
 
              <div className="flex items-center gap-3 w-full sm:w-auto h-12 bg-white/[0.04] border border-white/10 rounded-2xl px-4">
                <User size={14} className="text-slate-400" />
                <select 
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="bg-transparent border-none py-1.5 text-xs font-bold text-slate-200 focus:outline-none cursor-pointer sm:min-w-[130px]"
                >
                  <option value="all" className="bg-[#0f172a]">Todos Membros</option>
                  <option value="me" className="bg-[#0f172a]">Atribuídos a mim</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id} className="bg-[#0f172a]">{user.name}</option>
                  ))}
                </select>
              </div>
 
              <div className="flex items-center gap-4 ml-auto">
                <button
                  onClick={exportToCSV}
                  disabled={exporting}
                  className="flex items-center justify-center h-12 w-12 bg-white/5 text-slate-300 rounded-2xl hover:bg-white/10 transition-all border border-white/10 disabled:opacity-50"
                  title="Exportar Relatório"
                >
                  <Download size={20} className={exporting ? 'animate-bounce' : ''} />
                </button>
 
                <button
                  onClick={() => setShowNewTask(true)}
                  className="flex items-center gap-2 h-12 px-6 bg-emerald-500 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 whitespace-nowrap"
                >
                  <Plus size={18} />
                  NOVA TAREFA
                </button>
              </div>
            </div>
          </header>
        </div>
      </div>

      {/* Kanban Area - Scrollable Columns */}
      <div className="flex-1 min-h-0 overflow-hidden p-4 md:p-8 pt-4">
        <div className="max-w-[1800px] mx-auto h-full min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full items-stretch pb-4 min-h-0">
            {columns.map((col) => (
              <div key={col.id} className="flex flex-col min-w-0 h-full min-h-0 group/column">
                <div className="flex items-center justify-between mb-4 px-2 py-3 border-b border-white/5 bg-white/[0.01] rounded-t-3xl">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-xl shadow-lg", col.bg, col.color)}>
                      <col.icon size={20} />
                    </div>
                    <div>
                      <h2 className="font-black text-white text-sm tracking-wide uppercase">{col.title}</h2>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{filteredData(col.id).length} itens</p>
                    </div>
                  </div>
                </div>

                <div className={cn(
                  "flex-1 relative flex flex-col min-h-0 rounded-b-[2.5rem] border-x border-b border-white/[0.03] bg-white/[0.01] backdrop-blur-3xl transition-all duration-500",
                  col.glow
                )}>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none rounded-b-[2.5rem]" />
                  
                  {/* Scrollable Container for Cards */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                    <AnimatePresence mode="popLayout" initial={false}>
                    {filteredData(col.id).map((item: any) => (
                      item.itemType === 'TASK' ? (
                        /* ========= TASK CARD ========= */
                        <motion.div
                          key={`task-${item.id}`}
                          layout
                          initial={{ opacity: 0, scale: 0.9, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          whileHover={{ y: -5, scale: 1.02 }}
                          className={cn(
                            "group relative p-7 rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-xl hover:bg-slate-800/80 transition-all cursor-pointer shadow-2xl hover:shadow-blue-500/20",
                            updatingId === item.id && "opacity-50 pointer-events-none scale-95",
                            activeMenu === item.id ? "overflow-visible z-[50]" : "overflow-hidden z-[1]"
                          )}
                          onClick={() => router.push(`/conversations?id=${item.id}`)}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-900/50 to-blue-950/50 border border-blue-500/30 flex items-center justify-center shadow-inner">
                                <ListTodo size={20} className="text-blue-400" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm font-black text-white truncate group-hover:text-blue-400 transition-colors">
                                  {item.title}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                    {item.department?.name || 'Sem setor'}
                                  </span>
                                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                                  <span className="text-[10px] font-bold text-slate-500">
                                    {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true, locale: ptBR })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="relative">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenu(activeMenu === item.id ? null : item.id);
                                }}
                                className={cn(
                                  "w-9 h-9 flex items-center justify-center rounded-xl transition-all",
                                  activeMenu === item.id ? "bg-blue-500 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                                )}
                              >
                                <MoreVertical size={16} />
                              </button>

                              {activeMenu === item.id && (
                                <div className="absolute right-0 top-11 w-48 bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden py-1 animate-in">
                                  {col.id !== 'done' && (
                                    <button 
                                      onClick={(e) => handleCompleteTask(e, item.id)}
                                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                    >
                                      <CheckCircle2 size={14} />
                                      Concluir Tarefa
                                    </button>
                                  )}
                                  <button 
                                    onClick={(e) => handleRedistribute(e, item.id, 'TASK')}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-blue-400 hover:bg-blue-500/10 transition-colors"
                                  >
                                    <Users size={14} />
                                    Redistribuir
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setActiveMenu(null); router.push(`/conversations?id=${item.id}`); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/5 transition-colors"
                                  >
                                    <Clock size={14} />
                                    Ver Histórico
                                  </button>
                                  <div className="h-px bg-white/5 my-1" />
                                  <button 
                                    onClick={(e) => handleDeleteTask(e, item.id)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors"
                                  >
                                    <Trash2 size={14} />
                                    Excluir
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {item.description && (
                            <div className="relative mb-4">
                              <div className="absolute left-0 top-0 w-1 h-full bg-blue-500/40 rounded-full" />
                              <p className="pl-4 text-xs text-slate-200 line-clamp-3 leading-relaxed font-medium">{item.description}</p>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-4 border-t border-white/[0.03]">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 text-[9px] font-black text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/10">
                                <ListTodo size={10} />
                                TAREFA
                              </div>
                              {item.dueDate && (
                                <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
                                  <Calendar size={10} />
                                  {new Date(item.dueDate).toLocaleDateString('pt-BR')}
                                </div>
                              )}
                            </div>
                            {item.assignedTo && (
                              <div className="flex items-center gap-2 bg-white/5 pr-3 pl-1.5 py-1 rounded-full border border-white/10 group/user hover:bg-white/10 transition-colors">
                                <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center border border-white/5">
                                  <User size={10} className="text-slate-400" />
                                </div>
                                <span className="text-[10px] font-black text-slate-300 group-hover/user:text-white transition-colors">{item.assignedTo.name}</span>
                              </div>
                            )}
                          </div>
                          <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                          <div className="absolute -inset-[100%] bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-3xl pointer-events-none" />
                          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                        </motion.div>
                      ) : (
                        /* ========= CONVERSATION CARD ========= */
                        <motion.div
                          key={`conv-${item.id}`}
                          layout
                          initial={{ opacity: 0, scale: 0.9, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, x: col.id === 'todo' ? 100 : -100 }}
                          whileHover={{ y: -5, scale: 1.02 }}
                          onClick={() => router.push(`/conversations?id=${item.id}`)}
                          className={cn(
                            "group relative p-7 rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-xl hover:bg-slate-800/80 transition-all cursor-pointer shadow-2xl hover:shadow-emerald-500/20",
                            updatingId === item.id && "opacity-50 pointer-events-none scale-95",
                            activeMenu === item.id ? "overflow-visible z-[50]" : "overflow-hidden z-[1]"
                          )}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="relative shrink-0">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-sm font-black text-emerald-400 group-hover:scale-110 transition-transform duration-500 shadow-xl">
                                  {item.contact?.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div className={cn(
                                  "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0f172a] shadow-lg",
                                  item.status === 'ACTIVE' ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                                )} />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm font-black text-white truncate group-hover:text-emerald-400 transition-colors">
                                  {item.contact?.name || item.contact?.number}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate max-w-[120px]">
                                    {item.department?.name || 'Geral'}
                                  </span>
                                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                                  <span className="text-[10px] font-bold text-slate-500">
                                    {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true, locale: ptBR })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="relative">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenu(activeMenu === item.id ? null : item.id);
                                }}
                                className={cn(
                                  "w-9 h-9 flex items-center justify-center rounded-xl transition-all",
                                  activeMenu === item.id ? "bg-emerald-500 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                                )}
                              >
                                <MoreVertical size={16} />
                              </button>

                              {activeMenu === item.id && (
                                <div className="absolute right-0 top-11 w-48 bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden py-1 animate-in">
                                  {col.id === 'todo' && (
                                    <button 
                                      onClick={(e) => handleAccept(e, item.id)}
                                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                    >
                                      <HandMetal size={14} />
                                      Assumir Atendimento
                                    </button>
                                  )}
                                  <button 
                                    onClick={(e) => handleRedistribute(e, item.id, 'CONVERSATION')}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-blue-400 hover:bg-blue-500/10 transition-colors"
                                  >
                                    <Users size={14} />
                                    Redistribuir
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setActiveMenu(null); router.push(`/conversations?id=${item.id}`); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/5 transition-colors"
                                  >
                                    <MessageSquare size={14} />
                                    Abrir Chat
                                  </button>
                                  <div className="h-px bg-white/5 my-1" />
                                  {col.id === 'done' ? (
                                    <button 
                                      onClick={(e) => handleReopen(e, item.id)}
                                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                    >
                                      <Play size={14} />
                                      Reabrir Atendimento
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={(e) => handleClose(e, item.id)}
                                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                      <XCircle size={14} />
                                      Encerrar
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="relative mb-2">
                            <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500/40 rounded-full" />
                            <div className="pl-4">
                              <p className="text-xs text-slate-200 line-clamp-3 leading-relaxed font-medium group-hover:text-white transition-colors">
                                {item.messages?.[0]?.body || 'Sem histórico de mensagens...'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.03]">
                            <div className="flex items-center gap-3">
                              {item.protocol ? (
                                <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500 bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/10">
                                  <Hash size={10} />{item.protocol}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-lg">
                                  <Clock size={10} />{item.status}
                                </div>
                              )}
                            </div>
                            {item.assignedTo && (
                              <div className="flex items-center gap-2 group/user bg-white/5 pr-3 pl-1.5 py-1 rounded-full border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center border border-white/5"><User size={10} className="text-slate-400" /></div>
                                <span className="text-[10px] font-black text-slate-300 group-hover/user:text-white transition-colors">{item.assignedTo.name}</span>
                              </div>
                            )}
                          </div>
                          <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                          <div className="absolute -inset-[100%] bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-3xl pointer-events-none" />
                          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                        </motion.div>
                    )))}
                  </AnimatePresence>

                    {filteredData(col.id).length === 0 && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-20 text-slate-700 opacity-30 space-y-3"
                      >
                        <div className="p-6 rounded-full border-2 border-dashed border-slate-800">
                          <col.icon size={32} strokeWidth={1} />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Sem itens</p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <NewTaskModal
        isOpen={showNewTask}
        onClose={() => setShowNewTask(false)}
        onSuccess={fetchPlannerData}
      />
    </div>
  );
}
