
import React, { useState, useEffect } from 'react';
import { 
  GitCompare, 
  Target, 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  Layers,
  Search,
  Award
} from 'lucide-react';
import { dbService } from '../firebase';
import { Exam, ClassType, MarkEntry } from '../types';
import { GradingEngine } from '../utils/GradingEngine';

const ComparativeAnalysisView: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [entries, setEntries] = useState<MarkEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([dbService.getExams(), dbService.getClasses()]).then(([e, c]) => {
      setExams(e);
      setClasses(c);
      if (e.length > 0) setSelectedExamId(e[0].id);
      if (c.length > 0) setSelectedClassId(c[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedExamId) return;
    setLoading(true);
    dbService.getMarkEntriesWithFilters({ examId: selectedExamId, classIds: [selectedClassId] })
      .then(setEntries)
      .finally(() => setLoading(false));
  }, [selectedExamId, selectedClassId]);

  const classAvg = entries.length > 0 
    ? entries.reduce((s, e) => s + (e.obtainedMarks || 0) / e.maxMarks * 100, 0) / entries.length 
    : 0;

  return (
    <div className="space-y-10 animate-slide-up pb-32">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-3">
            <GitCompare className="text-blue-500 w-8 h-8" />
            Comparative Audit
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            Peer-to-Peer & Institutional Benchmark Scaling
          </p>
        </div>

        <div className="flex flex-wrap gap-3 bg-[#0a0e1a] p-2 rounded-2xl border border-white/5 w-full md:w-auto">
          <select 
            value={selectedExamId} 
            onChange={e => setSelectedExamId(e.target.value)}
            className="bg-white/5 text-[9px] font-black text-white uppercase tracking-widest px-4 py-2 rounded-xl border border-white/5 outline-none"
          >
            {exams.map(e => <option key={e.id} value={e.id}>{e.examName}</option>)}
          </select>
          <select 
            value={selectedClassId} 
            onChange={e => setSelectedClassId(e.target.value)}
            className="bg-white/5 text-[9px] font-black text-white uppercase tracking-widest px-4 py-2 rounded-xl border border-white/5 outline-none"
          >
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-[#0a0e1a] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative">
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
             <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                <Target className="w-4 h-4 text-blue-500" />
                Variance Analysis vs Class Average ({classAvg.toFixed(1)}%)
             </h3>
          </div>
          
          <div className="max-h-[600px] overflow-y-auto no-scrollbar">
             <div className="divide-y divide-white/5">
                {entries.sort((a,b) => (b.obtainedMarks || 0) - (a.obtainedMarks || 0)).map(entry => {
                  const percentage = (entry.obtainedMarks || 0) / entry.maxMarks * 100;
                  const gap = percentage - classAvg;
                  const isAbove = gap >= 0;

                  return (
                    <div key={entry.id} className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-white/[0.02] transition-colors">
                       <div className="flex items-center gap-6">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${isAbove ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                             <Users className="w-5 h-5" />
                          </div>
                          <div>
                             <div className="text-sm font-black text-white uppercase tracking-tight">{entry.studentName}</div>
                             <div className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-1">{entry.studentSeatNo}</div>
                          </div>
                       </div>

                       <div className="flex-1 max-w-md w-full px-10">
                          <div className="flex justify-between text-[8px] font-black uppercase tracking-widest mb-2">
                             <span className="text-slate-600">Performance Index</span>
                             <span className={isAbove ? 'text-emerald-500' : 'text-rose-500'}>
                                {isAbove ? '+' : ''}{gap.toFixed(1)}% Variance
                             </span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full relative overflow-hidden">
                             <div 
                               className={`h-full rounded-full transition-all duration-1000 ${isAbove ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-rose-500'}`}
                               style={{ width: `${percentage}%` }}
                             ></div>
                             {/* Class Average Marker */}
                             <div 
                               className="absolute top-0 bottom-0 w-0.5 bg-amber-500/50 z-10"
                               style={{ left: `${classAvg}%` }}
                             ></div>
                          </div>
                       </div>

                       <div className="text-right">
                          <div className="text-2xl font-black text-white tracking-tighter">{percentage.toFixed(1)}%</div>
                          <div className={`flex items-center justify-end gap-1 text-[8px] font-black uppercase tracking-widest ${isAbove ? 'text-emerald-500' : 'text-rose-500'}`}>
                             {isAbove ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                             {isAbove ? 'Above Baseline' : 'Below Baseline'}
                          </div>
                       </div>
                    </div>
                  )
                })}
             </div>
          </div>
      </div>
    </div>
  );
};

export default ComparativeAnalysisView;
