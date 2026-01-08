
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Award, 
  Target, 
  ChevronRight, 
  PieChart, 
  Search, 
  Filter,
  BrainCircuit,
  Activity,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { dbService } from '../firebase';
import { Exam, ClassType, MarkEntry } from '../types';
import { useClassPerformance } from '../hooks/useClassPerformance';
import { GradingEngine } from '../utils/GradingEngine';

interface Props {
  onViewStudent?: (studentId: string) => void;
}

const StudentPerformanceView: React.FC<Props> = ({ onViewStudent }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { metrics, entries, loading } = useClassPerformance(selectedExamId, selectedClassId);

  useEffect(() => {
    Promise.all([dbService.getExams(), dbService.getClasses()]).then(([e, c]) => {
      setExams(e);
      setClasses(c);
      if (e.length > 0) setSelectedExamId(e[0].id);
      if (c.length > 0) setSelectedClassId(c[0].id);
    });
  }, []);

  const filteredStudents = entries.filter(e => 
    e.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.studentSeatNo.includes(searchQuery)
  ).sort((a,b) => (b.obtainedMarks || 0) - (a.obtainedMarks || 0));

  return (
    <div className="space-y-8 animate-slide-up pb-32 pt-4">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-3">
            <BarChart3 className="text-amber-500 w-8 h-8" />
            Performance Hub
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            Real-time Academic Intelligence & Tier Analysis
          </p>
        </div>

        <div className="flex flex-wrap gap-3 bg-[var(--bg-card)] p-2 rounded-2xl border border-[var(--border)] w-full md:w-auto">
          <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2 border border-white/5">
             <Target className="w-3.5 h-3.5 text-amber-500" />
             <select 
               value={selectedExamId} 
               onChange={e => setSelectedExamId(e.target.value)}
               className="bg-transparent text-[10px] font-black text-white uppercase tracking-widest outline-none appearance-none cursor-pointer"
             >
               {exams.map(e => <option key={e.id} value={e.id}>{e.examName}</option>)}
             </select>
          </div>
          <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2 border border-white/5">
             <Users className="w-3.5 h-3.5 text-blue-500" />
             <select 
               value={selectedClassId} 
               onChange={e => setSelectedClassId(e.target.value)}
               className="bg-transparent text-[10px] font-black text-white uppercase tracking-widest outline-none appearance-none cursor-pointer"
             >
               {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-40 flex flex-col items-center justify-center gap-4 text-slate-600">
           <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
           <p className="text-[10px] font-black uppercase tracking-[0.3em]">Processing Assessment Nodes...</p>
        </div>
      ) : !metrics ? (
        <div className="py-32 text-center bg-[var(--bg-card)] rounded-[3rem] border-2 border-dashed border-[var(--border)] opacity-50">
           <AlertCircle className="w-16 h-16 mx-auto mb-6 text-slate-700" />
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No data found for the selected cycle.</p>
        </div>
      ) : (
        <div className="space-y-8">
           {/* Tier 1: Executive Stats */}
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricBox 
                label="Class Average" 
                value={`${metrics.averageMarks}%`} 
                icon={TrendingUp} 
                color="text-amber-500" 
                bg="bg-amber-500/10" 
              />
              <MetricBox 
                label="Success Rate" 
                value={`${metrics.passRate}%`} 
                icon={Award} 
                color="text-emerald-500" 
                bg="bg-emerald-500/10" 
              />
              <MetricBox 
                label="Difficulty Index" 
                value={metrics.difficultyIndex} 
                icon={BrainCircuit} 
                color="text-blue-500" 
                bg="bg-blue-500/10" 
              />
              <MetricBox 
                label="Top Candidate" 
                value={metrics.highestScore} 
                sub={metrics.highestStudent}
                icon={Activity} 
                color="text-indigo-500" 
                bg="bg-indigo-500/10" 
              />
           </div>

           {/* Tier 2: Visualization */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-[3rem] p-10 flex flex-col justify-between group overflow-hidden relative">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 blur-3xl -mr-24 -mt-24 group-hover:scale-125 transition-transform duration-700"></div>
                 <div className="flex justify-between items-center mb-10 relative z-10">
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                       <BarChart3 className="w-4 h-4 text-amber-500" />
                       Mark Distribution
                    </h3>
                    <div className="flex gap-1">
                       {Object.keys(metrics.distribution).map(k => <div key={k} className="w-1 h-1 rounded-full bg-slate-800"></div>)}
                    </div>
                 </div>
                 
                 <div className="flex items-end justify-between gap-4 h-48 relative z-10">
                    {Object.entries(metrics.distribution).map(([range, count]) => {
                      const height = entries.length ? ((count as number) / entries.length) * 100 : 0;
                      return (
                        <div key={range} className="flex-1 flex flex-col items-center group/bar">
                           <div className="w-full relative">
                              <div 
                                className="w-full bg-white/5 border border-white/5 rounded-t-xl group-hover/bar:bg-amber-500/20 group-hover/bar:border-amber-500/30 transition-all duration-500 ease-out"
                                style={{ height: `${height}%`, minHeight: '4px' }}
                              >
                                 <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-black text-amber-500 opacity-0 group-hover/bar:opacity-100 transition-opacity">{count}</div>
                              </div>
                           </div>
                           <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest mt-4 group-hover/bar:text-slate-400 transition-colors">{range}</span>
                        </div>
                      )
                    })}
                 </div>
              </div>

              <div className="bg-slate-900 border border-white/10 rounded-[3rem] p-10 flex flex-col justify-center text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -mr-16 -mt-16"></div>
                 <h3 className="text-xs font-black uppercase tracking-widest mb-10 relative z-10 flex items-center gap-3">
                    <PieChart className="w-4 h-4 text-emerald-500" />
                    Outcome Ratio
                 </h3>
                 
                 <div className="space-y-6 relative z-10">
                    <div className="space-y-2">
                       <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                          <span className="text-emerald-400">Pass</span>
                          <span>{metrics.passRate}%</span>
                       </div>
                       <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${metrics.passRate}%` }}></div>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                          <span className="text-rose-500">Fail</span>
                          <span>{metrics.failRate}%</span>
                       </div>
                       <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500" style={{ width: `${metrics.failRate}%` }}></div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Tier 3: Individual Rankings */}
           <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[3rem] overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-[var(--border)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.02]">
                 <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                    <Filter className="w-4 h-4 text-slate-500" />
                    Leaderboard & Performance Tiering
                 </h3>
                 <div className="relative w-full md:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input 
                      placeholder="Audit candidate name..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-[#050810] border border-white/10 rounded-2xl pl-12 pr-6 py-3 text-[11px] font-black text-white outline-none focus:border-amber-500 transition-all placeholder:text-slate-700"
                    />
                 </div>
              </div>
              
              <div className="overflow-x-auto no-scrollbar">
                 <table className="w-full text-left">
                    <thead className="bg-black/20 text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] border-b border-[var(--border)]">
                       <tr>
                          <th className="px-10 py-5">Rank</th>
                          <th className="px-10 py-5">Candidate</th>
                          <th className="px-10 py-5 text-center">Outcome</th>
                          <th className="px-10 py-5 text-center">Score</th>
                          <th className="px-10 py-5 text-center">Grade</th>
                          <th className="px-10 py-5 text-right">Drill Down</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                       {filteredStudents.map((entry, idx) => {
                         const gradeInfo = GradingEngine.calculateGrade(entry.obtainedMarks || 0, entry.maxMarks);
                         return (
                           <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="px-10 py-5">
                                 <span className="text-[11px] font-black text-slate-600 group-hover:text-amber-500">#{idx + 1}</span>
                              </td>
                              <td className="px-10 py-5">
                                 <div className="flex flex-col">
                                    <span className="text-xs font-black text-white uppercase tracking-tight">{entry.studentName}</span>
                                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">{entry.studentSeatNo}</span>
                                 </div>
                              </td>
                              <td className="px-10 py-5 text-center">
                                 <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${gradeInfo.isPass ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                    {gradeInfo.isPass ? 'Qualify' : 'Remedial'}
                                 </span>
                              </td>
                              <td className="px-10 py-5 text-center">
                                 <div className="text-xs font-black text-white">{entry.obtainedMarks} <span className="text-slate-600 text-[9px]">/ {entry.maxMarks}</span></div>
                              </td>
                              <td className="px-10 py-5 text-center">
                                 <div className={`w-8 h-8 rounded-lg mx-auto flex items-center justify-center text-[10px] font-black border ${gradeInfo.bgColor} ${gradeInfo.color} border-white/5 group-hover:scale-110 transition-transform`}>
                                    {gradeInfo.grade}
                                 </div>
                              </td>
                              <td className="px-10 py-5 text-right">
                                 <button 
                                   onClick={() => onViewStudent && onViewStudent(entry.studentId)}
                                   className="p-2.5 bg-white/5 rounded-xl text-slate-600 hover:text-white hover:bg-amber-500 transition-all active:scale-90"
                                 >
                                    <ChevronRight className="w-4 h-4" />
                                 </button>
                              </td>
                           </tr>
                         );
                       })}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const MetricBox = ({ label, value, icon: Icon, color, bg, sub }: any) => (
  <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-[2.5rem] flex flex-col justify-between group hover:border-amber-500/20 transition-all hover:shadow-xl">
    <div className={`w-10 h-10 ${bg} ${color} rounded-xl flex items-center justify-center shadow-sm`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="mt-6">
      <div className="text-2xl font-black text-white tracking-tighter">{value}</div>
      <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">{label}</div>
      {sub && <div className="text-[7px] font-bold text-slate-600 uppercase mt-0.5 truncate">{sub}</div>}
    </div>
  </div>
);

export default StudentPerformanceView;
