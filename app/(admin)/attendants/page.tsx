'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Trash2, 
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Edit2
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

export default function AttendantsPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'ATTENDANT',
    signature: '',
    departmentIds: [] as string[]
  });

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditing ? `/api/users/${editingUserId}` : '/api/users';
      const method = isEditing ? 'PATCH' : 'POST';
      
      const payload = isEditing 
        ? { 
            name: newUser.name, 
            email: newUser.email, 
            role: newUser.role, 
            departmentIds: newUser.departmentIds,
            signature: newUser.signature
          }
        : newUser;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setIsAdding(false);
        setIsEditing(false);
        setEditingUserId(null);
        setNewUser({ name: '', email: '', password: '', role: 'ATTENDANT', signature: '', departmentIds: [] });
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to save user:', err);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUserId(user.id);
    setIsEditing(true);
    setIsAdding(true);
    setNewUser({
      name: user.name,
      email: user.email,
      password: '', // Don't show password
      role: user.role,
      signature: user.signature || '',
      departmentIds: user.departments?.map((d: any) => d.id) || []
    });
  };

  const toggleDepartment = (id: string) => {
    setNewUser(prev => ({
      ...prev,
      departmentIds: prev.departmentIds.includes(id)
        ? prev.departmentIds.filter(d => d !== id)
        : [...prev.departmentIds, id]
    }));
  };

  // Filtrar departamentos visíveis para o gerente no modal
  const visibleDepartmentsForNewUser = session?.user?.role === 'ADMIN' 
    ? departments 
    : departments.filter(d => (session?.user as any).departmentIds?.includes(d.id));

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este atendente?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
            Gestão de <span className="text-emerald-400">Equipe</span>
          </h1>
          <p className="text-slate-400 font-medium">Controle os acessos e permissões por setor.</p>
        </div>
        
        {(session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER') && (
          <button
            onClick={() => {
              setIsEditing(false);
              setEditingUserId(null);
              setNewUser({ name: '', email: '', password: '', role: 'ATTENDANT', signature: '', departmentIds: [] });
              setIsAdding(true);
            }}
            className="flex items-center gap-3 px-6 py-4 bg-emerald-500 text-slate-950 rounded-[1.5rem] font-black text-sm hover:scale-105 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
          >
            <UserPlus size={20} />
            Novo Usuário
          </button>
        )}
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 relative group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 rounded-[2rem] text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all backdrop-blur-md focus:bg-white/[0.08]"
          />
        </div>
        
        <div className="bg-white/5 border border-white/5 rounded-[2rem] p-5 flex items-center justify-between backdrop-blur-md">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Equipe</p>
            <p className="text-2xl font-black text-white">{users.length}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div 
              key={user.id}
              className="group relative bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8 hover:bg-white/[0.06] transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/5"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white text-xl font-black shadow-inner">
                    {user.name?.charAt(0) || '?'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-slate-950 shadow-lg" />
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                    user.role === 'ADMIN' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                    user.role === 'MANAGER' ? "bg-purple-500/10 border-purple-500/20 text-purple-400" :
                    "bg-blue-500/10 border-blue-500/20 text-blue-400"
                  )}>
                    {user.role}
                  </span>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(user)}
                      className="p-2 text-slate-600 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    {session?.user?.role === 'ADMIN' && (
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{user.name}</h3>
                  <div className="flex items-center gap-2 text-slate-500 mt-1">
                    <Mail size={14} />
                    <span className="text-xs font-medium">{user.email}</span>
                  </div>
                </div>

                {/* Departments Tags */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {user.departments?.map((dept: any) => (
                    <span key={dept.id} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[8px] font-black uppercase text-slate-400 tracking-tighter">
                      {dept.name}
                    </span>
                  ))}
                  {(!user.departments || user.departments.length === 0) && (
                    <span className="text-[10px] text-slate-600 font-medium italic">Sem setor definido</span>
                  )}
                </div>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <Clock size={12} />
                    Desde {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1 text-emerald-500/50">
                    <CheckCircle2 size={12} />
                    Ativo
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add User Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-950/60 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 rounded-[3rem] p-10 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {isEditing ? 'Atualize as permissões e dados.' : 'Preencha os dados de acesso.'}
                </p>
              </div>
              <button onClick={() => setIsAdding(false)} className="p-3 hover:bg-white/5 rounded-2xl text-slate-400 transition-all">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nome Completo</label>
                  <input
                    required
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    placeholder="João Silva"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Cargo</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                  >
                    <option value="ATTENDANT" className="bg-slate-900">Atendente</option>
                    {session?.user?.role === 'ADMIN' && <option value="MANAGER" className="bg-slate-900">Gerente</option>}
                    {session?.user?.role === 'ADMIN' && <option value="ADMIN" className="bg-slate-900">Administrador</option>}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">E-mail de Acesso</label>
                <input
                  required
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="joao@oabgo.org.br"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Assinatura das Mensagens</label>
                <textarea
                  value={newUser.signature}
                  onChange={(e) => setNewUser({...newUser, signature: e.target.value})}
                  rows={2}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                  placeholder="Ex: Att, Equipe OABGO"
                />
                <p className="text-[9px] text-slate-600 px-4">Será enviada automaticamente ao final de cada mensagem.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Senha Temporária</label>
                <input
                  required={!isEditing}
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder={isEditing ? "Deixe em branco para manter" : "••••••••"}
                />
              </div>

              {/* Department Selection */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Vincular Setores</label>
                <div className="grid grid-cols-2 gap-2">
                  {visibleDepartmentsForNewUser.map(dept => (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => toggleDepartment(dept.id)}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-xs font-bold",
                        newUser.departmentIds.includes(dept.id)
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10"
                      )}
                    >
                      {dept.name}
                      {newUser.departmentIds.includes(dept.id) && <CheckCircle2 size={14} />}
                    </button>
                  ))}
                </div>
                {visibleDepartmentsForNewUser.length === 0 && (
                  <p className="text-[10px] text-amber-500/70 italic px-4">
                    Nenhum setor disponível para vincular.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-5 bg-emerald-500 text-slate-950 rounded-2xl font-black text-sm hover:scale-[1.02] transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98] mt-4"
              >
                {isEditing ? 'Salvar Alterações' : 'Criar Acesso'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
