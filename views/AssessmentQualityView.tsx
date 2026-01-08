
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  BrainCircuit, 
  AlertTriangle, 
  BarChart, 
  Search, 
  HelpCircle,
  Activity,
  Layers,
  CheckCircle2,
  Download
} from 'lucide-react';
import { dbService } from '../firebase';
import { Exam, ClassType, MarkEntry } from '../types';

const AssessmentQualityView: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [entries, setEntries] = useState<MarkEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dbService.getExams().then(e => {
      setExams(e);
      if (e.length > 0) setSelectedExamId(e[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedExamId) return;
    setLoading(true);
    dbService.getMarkEntriesWithFilters({ examId: selectedExamId })
      .then(setEntries)
      .finally(() => setLoading(false));
  }, [selectedExamId]);

  const stats = React.useMemo(() => {
    if (entries.length === 0) return null;
    const scores = entries.map(e => (e.obtainedMarks || 0) / e.maxMarks * 100);
    const avg = scores.reduce((s, c) => s + c, 0) / scores.length;
    
    // Simple standard deviation
    const variance = scores.reduce((s, c) => s + Math.pow(c - avg, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    return {
      average: avg,
      stdDev,
      status: avg < 40 ? 'Critically Difficult' : avg > 75 ? 'Excessively Easy' : 'Optimally Balanced',
      fairnessScore: stdDev > 25 ? 'Low (High Variance)' : 'High (Consistent Clusters)',
      health: avg > 40 && avg < 80 ? 'Healthy' : 'Requires Review'
    };
  }, [entries]);

  const exportAudit = () => {
    if (!stats) return;
    const headers = ['Metric', 'Value', 'Verdict'];
    const rows = [
      ['Difficulty Index', `${stats.average.toFixed(2)}%`, stats.status],
      ['Standard Deviation', stats.stdDev.toFixed(2), stats.fairnessScore],
      ['Fairness Cluster', stats.fairnessScore, stats.health],
      ['Sample Size', entries.length.toString(), 'Verified']
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Assessment_Audit_${selectedExamId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10 animate-slide-up pb-32">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-3">
            <ShieldCheck className="text-indigo-500 w-8 h-8" />
            Assessment Quality Audit
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
            Fairness Index, Difficulty Scaling & Pedagogical Alignment
          </p>
        </div>

        <div className="bg-[var(--bg-card)] p-2 rounded-2xl border border-[var(--border)] w-full md:w-auto">
          <select 
            value={selectedExamId} 
            onChange={e => setSelectedExamId(e.target.value)}
            className="bg-white/5 text-[9px] font-black text-white uppercase tracking-widest px-6 py-2.5 rounded-xl border border-white/5 outline-none appearance-none"
          >
            {exams.map(e => <option key={e.id} value={e.id}>{e.examName}</option>)}
          </select>
        </div>
      </div>

      {!stats ? (
        <div className="py-40 text-center text-slate-600 font-black uppercase text-[10px] tracking-widest border-2 border-dashed border-[var(--border)] rounded-[3rem]">
           Select an assessment cycle to begin audit
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Fairness Matrix */}
           <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[3.5rem] p-12 space-y-10 relative overflow-hidden group">
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl -mr-32 -mb-32"></div>
              <div className="flex justify-between items-center relative z-10">
                 <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-3">
                    <BrainCircuit className="w-5 h-5 text-indigo-400" />
                    Cognitive Difficulty Scale
                 </h3>
                 <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${stats.health === 'Healthy' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {stats.health}
                 </span>
              </div>
              
              <div className="text-center space-y-2 relative z-10">
                 <div className="text-5xl font-black text-white tracking-tighter">{stats.average.toFixed(1)}%</div>
                 <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Difficulty Index</div>
              </div>

              <div className="space-y-6 relative z-10">
                 <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                    <div>
                       <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Status Verdict</div>
                       <div className="text-sm font-black text-white uppercase tracking-tight">{stats.status}</div>
                    </div>
                    <Activity className={`w-8 h-8 ${stats.average < 40 ? 'text-rose-500' : 'text-emerald-500'}`} />
                 </div>
                 
                 <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                    <div>
                       <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Standard Deviation</div>
                       <div className="text-sm font-black text-white uppercase tracking-tight">{stats.stdDev.toFixed(2)} pts</div>
                    </div>
                    <Layers className="w-8 h-8 text-indigo-500 opacity-30" />
                 </div>
              </div>
           </div>

           {/* Feedback & Recommendations */}
           <div className="bg-slate-900 border border-white/10 rounded-[3.5rem] p-12 space-y-10">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-3">
                 <HelpCircle className="w-5 h-5 text-amber-500" />
                 Pedagogical Recommendations
              </h3>
              
              <div className="space-y-6">
                 <div className="p-6 bg-white/5 border border-white/5 rounded-3xl flex gap-5">
                    <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
                       <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                       <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Fairness Warning</h4>
                       <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
                          {stats.stdDev > 20 ? "Assessment shows high polarized results. Evaluate if teaching materials were consistently accessible to all candidates." : "Assessment shows consistent outcome clustering. Quality of evaluation is within institutional parameters."}
                       </p>
                    </div>
                 </div>

                 <div className="p-6 bg-white/5 border border-white/5 rounded-3xl flex gap-5">
                    <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center shrink-0">
                       <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                       <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Next Cycle Logic</h4>
                       <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
                          {stats.average < 50 ? "Recommend modular difficulty reduction for the next assessment to avoid candidate demotivation." : "Current difficulty levels are appropriate for standard curriculum pacing."}
                       </p>
                    </div>
                 </div>
              </div>

              <button 
                onClick={exportAudit}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 border border-white/10 flex items-center justify-center gap-2"
              >
                 <Download className="w-4 h-4" />
                 Download Full Audit Report
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentQualityView;
