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
    <div className="space-y-3">
      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
        {label}
      </label>
      <div className="relative group">
        <select 
          className="w-full appearance-none p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium pr-12"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
        >
          <option value="">{emptyLabel}</option>
          <optgroup label="Passos deste Fluxo">
            {nodes.filter((n: any) => n.id !== currentNodeId).map((n: any) => {
              const stepIdx = nodes.findIndex((orig: any) => orig.id === n.id) + 1;
              return (
                <option key={n.id} value={n.id}>Passo {stepIdx}: {n.content?.substring(0, 30) || '(Sem texto)'}...</option>
              );
            })}
          </optgroup>
          <optgroup label="Acionar outro Fluxo">
            {allFlows.map((f: any) => (
              <option key={f.id} value={`flow-${f.id}`}>🚀 Ir para: {f.name}</option>
            ))}
          </optgroup>
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <ArrowRight size={16} className="group-focus-within:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}
