'use client';

import { ArrowRight, GitBranch, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NextStepSelectorProps {
  label: string;
  value: string;
  nodes: any[];
  allFlows: any[];
  currentNodeId: string;
  onChange: (data: { nextStepId?: string | null, targetFlowId?: string | null }) => void;
  emptyLabel?: string;
}

export default function NextStepSelector({ 
  label, 
  value, 
  nodes, 
  allFlows, 
  currentNodeId, 
  onChange,
  emptyLabel = "Encerrar fluxo aqui"
}: NextStepSelectorProps) {
  
  const handleChange = (val: string) => {
    if (!val) {
      onChange({ nextStepId: null, targetFlowId: null });
    } else if (val.startsWith('flow-')) {
      onChange({ targetFlowId: val.replace('flow-', ''), nextStepId: null });
    } else {
      onChange({ nextStepId: val, targetFlowId: null });
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
        {label}
      </label>
      <div className="relative group">
        <select 
          className="w-full appearance-none p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-blue-400 pr-10 shadow-inner"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
        >
          <option value="">{emptyLabel}</option>
          <optgroup label="✨ Passos deste Fluxo">
            {nodes.filter((n: any) => n.id !== currentNodeId).map((n: any, idx: number) => {
              const stepIdx = nodes.findIndex((orig: any) => orig.id === n.id) + 1;
              return (
                <option key={n.id} value={n.id}>#{stepIdx} [{n.type}] {n.title || n.content?.substring(0, 20) || '(Sem texto)'}...</option>
              );
            })}
          </optgroup>
          <optgroup label="🚀 Acionar outro Fluxo">
            {allFlows.map((f: any) => (
              <option key={f.id} value={`flow-${f.id}`}>{f.name}</option>
            ))}
          </optgroup>
        </select>
        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-blue-500 transition-all">
          <ArrowRight size={18} className="group-focus-within:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}
