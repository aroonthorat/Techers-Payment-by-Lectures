
import React, { useState, useEffect, useMemo } from 'react';
import { 
  GitCommit, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  Search,
  Filter,
  Activity,
  Calendar,
  Layers
} from 'lucide-react';
import { dbService } from '../firebase';
import { Exam, ClassType, MarkEntry } from '../types';

const ProgressTrackingView: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [entries, setEntries] = useState<MarkEntry[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dbService.getExams(),
      dbService.getClasses(),
      dbService.getMarkEntriesWithFilters({})
    ]).then(([ex, cl, en]) => {
      setExams(ex);
      setClasses(cl);
      setEntries(en);
      if (cl.length > 0) setSelectedClassId(cl[0].id);
      setLoading(false);
    });
  }, []);

  const timelineData = useMemo(() => {
    return exams
      .filter(e => !selectedClassId || e.class === selectedClassId)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .map(exam => {
        const examEntries = entries.filter(ent => ent.examId === exam.id);
        const completed = examEntries.filter(ent => ent.obtainedMarks !== null || ent.isAbsent).length;
        const total = examEntries.length;
        const progress = total > 0 ? (completed / total) * 100 : 0;
        
        return {
          ...exam,
          progress,
          completedCount: completed,
          totalCount: total,
          isFinished: progress === 100 && total > 0
        };
      });
  }, [exams, entries, selectedClassId]);

  return (
    <div className="space-y-10 animate-slide-up pb-32 pt-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-3">
            <Activity className="text-amber-500 w-8 h-8" />
            Progress Timeline
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
            Assessment Lifecycle Tracking & Mark Completion Audit
          </p>
        </div>

        <div className="bg-[var(--bg-card)] p-2 rounded-2xl border border-[var(--border)] w-full md:w-auto">
          <div className="flex items-center gap-3 px-4 py-2">
             <Layers className="w-4 h-4 text-slate-500" />
             <select 
               value={selectedClassId} 
               onChange={e => setSelectedClassId(e.target.value)}
               className="bg-transparent text-[10px] font-black text-white uppercase tracking-widest outline-none appearance-none cursor-pointer"
             >
               <option value="">All Batches</option>
               {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Timeline Path */}
        <div className="absolute left-[27px] top-0 bottom-0 w-0.5 bg-[var(--border)] opacity-20"></div>

        <div className="space-y-12">
          {timelineData.map((exam, idx) => (
            <div key={exam.id} className="relative pl-16 group">
              {/* Node */}
              <div className={`absolute left-0 top-0 w-14 h-14 rounded-2xl flex items-center justify-center border-4 border-[var(--bg-main)] shadow-xl z-10 transition-all group-hover:scale-110 ${exam.isFinished ? 'bg-emerald-500 text-white' : 'bg-[var(--bg-card)] text-slate-500 border-[var(--border)]'}`}>
                {exam.isFinished ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
              </div>

              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8 transition-all hover:border-amber-500/30 shadow-sm hover:shadow-xl">
                 <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                       <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">{new Date(exam.startDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                       <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{exam.examType}</span>
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{exam.examName}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Batch: {classes.find(c => c.id === exam.class)?.name}</p>
                 </div>

                 <div className="w-full md:w-64 space-y-3">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                       <span className="text-slate-400">Marking Progress</span>
                       <span className={exam.isFinished ? 'text-emerald-500' : 'text-amber-500'}>{Math.round(exam.progress)}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                       <div 
                         className={`h-full transition-all duration-1000 ${exam.isFinished ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                         style={{ width: `${exam.progress}%` }}
                       ></div>
                    </div>
                    <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase">
                       <span>{exam.completedCount} Submitted</span>
                       <span>{exam.totalCount} Total</span>
                    </div>
                 </div>

                 <button className="p-4 bg-white/5 rounded-2xl text-slate-400 hover:text-white hover:bg-amber-500 transition-all active:scale-90">
                    <ChevronRight className="w-6 h-6" />
                 </button>
              </div>
            </div>
          ))}

          {timelineData.length === 0 && !loading && (
            <div className="py-20 text-center opacity-30">
               <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-600" />
               <p className="text-[10px] font-black uppercase tracking-widest">No timeline data available for this criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressTrackingView;
