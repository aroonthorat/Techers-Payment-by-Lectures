
import React from 'react';
import { User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { MarkEntry } from '../types';
import { NativeBridge } from '../utils/NativeBridge';

interface MarkEntryRowProps {
  entry: MarkEntry;
  index: number;
  onUpdate: (id: string, data: Partial<MarkEntry>) => void;
  inputRef: (el: HTMLInputElement | null) => void;
  onKeyDown: (e: React.KeyboardEvent, index: number) => void;
}

const MarkEntryRow: React.FC<MarkEntryRowProps> = React.memo(({ 
  entry, 
  index, 
  onUpdate, 
  inputRef, 
  onKeyDown 
}) => {
  const isInvalid = entry.obtainedMarks !== null && entry.obtainedMarks > entry.maxMarks;
  const isCompleted = entry.obtainedMarks !== null || entry.isAbsent;

  const handleAbsentToggle = () => {
    NativeBridge.hapticFeedback('impact');
    onUpdate(entry.id, { isAbsent: !entry.isAbsent });
  };

  return (
    <tr className={`group transition-colors ${
      isInvalid ? 'bg-rose-500/5' : 
      entry.isAbsent ? 'bg-slate-900/50' : 
      isCompleted ? 'hover:bg-emerald-500/5' : 'hover:bg-white/5'
    }`}>
      <td className="px-6 py-4 font-mono text-[10px] font-black text-slate-500 group-hover:text-amber-500 transition-colors">
        {entry.studentSeatNo}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
            entry.isAbsent ? 'bg-slate-800 border-slate-700 text-slate-600' : 
            isCompleted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 
            'bg-slate-800/50 border-[var(--border)] text-slate-400'
          }`}>
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className={`text-[11px] font-black uppercase tracking-tight transition-colors ${
              entry.isAbsent ? 'text-slate-600 line-through' : 'text-slate-200'
            }`}>
              {entry.studentName}
            </div>
            <div className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">
              Roll: {entry.studentRollNo || 'N/A'} • {entry.medium}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <button 
          tabIndex={0}
          aria-label={`Mark ${entry.studentName} as absent`}
          onClick={handleAbsentToggle}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              handleAbsentToggle();
            }
          }}
          className={`w-10 h-6 rounded-full transition-all relative border outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-card)] ${
            entry.isAbsent ? 'bg-rose-600 border-rose-500' : 'bg-slate-800 border-white/10'
          }`}
        >
          <div className={`absolute top-1 w-3.5 h-3.5 rounded-full transition-all bg-white ${
            entry.isAbsent ? 'right-1' : 'left-1'
          }`} />
        </button>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-center gap-3">
          <div className="relative">
            <input 
              ref={inputRef}
              type="number"
              disabled={entry.isAbsent}
              value={entry.obtainedMarks === null ? '' : entry.obtainedMarks}
              onChange={(e) => {
                onUpdate(entry.id, { obtainedMarks: e.target.value === '' ? null : Number(e.target.value) });
              }}
              onKeyDown={(e) => onKeyDown(e, index)}
              className={`w-20 bg-[var(--bg-main)] border-2 rounded-xl px-3 py-2.5 text-center text-sm font-black transition-all outline-none ${
                entry.isAbsent ? 'border-transparent text-slate-800' :
                isInvalid ? 'border-rose-500 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 
                'border-[var(--border)] text-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10'
              }`}
            />
            {isInvalid && (
              <div className="absolute -top-1 -right-1">
                <AlertCircle className="w-3 h-3 text-rose-500" />
              </div>
            )}
          </div>
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">/ {entry.maxMarks}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <input 
          type="text"
          placeholder="Add remarks..."
          value={entry.remarks || ''}
          onChange={(e) => onUpdate(entry.id, { remarks: e.target.value })}
          className="w-full bg-transparent border-b border-[var(--border)] text-[10px] font-bold text-slate-400 focus:text-white focus:border-amber-500 outline-none px-1 py-1 transition-all"
        />
      </td>
      <td className="px-6 py-4 text-right">
        {isCompleted && !isInvalid ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-slate-700 ml-auto" />
        )}
      </td>
    </tr>
  );
});

export default MarkEntryRow;
