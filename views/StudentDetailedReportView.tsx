
import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  ArrowLeft, 
  TrendingUp, 
  Target, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Brain, 
  Award,
  Zap,
  Info
} from 'lucide-react';
import { dbService } from '../firebase';
import { Student, MarkEntry, Exam, Subject } from '../types';
import { TrendAnalyzer } from '../utils/TrendAnalyzer';
import { GradingEngine } from '../utils/GradingEngine';

interface Props {
  studentId: string;
  onBack: () => void;
}

const StudentDetailedReportView: React.FC<Props> = ({ studentId, onBack }) => {
  const [data, setData] = useState<{
    student: Student | null,
    entries: MarkEntry[],
    exams: Exam[],
    subjects: Subject[]
  }>({ student: null, entries: [], exams: [], subjects: [] });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dbService.getStudents(),
      dbService.getMarkEntriesWithFilters({}),
      dbService.getExams(),
      dbService.getSubjects(),
      dbService.getClasses() 
    ]).then(([s, me, ex, sub]) => {
      setData({
        student: s.find(item => item.id === studentId) || null,
        entries: me.filter(item => item.studentId === studentId),
        exams: ex,
        subjects: sub
      });
      setLoading(false);
    });
  }, [studentId]);

  const analysis = useMemo(() => {
    if (!data.student || data.entries.length === 0) return null;
    return TrendAnalyzer.analyzeStudent(studentId, data.entries, data.exams, data.subjects);
  }, [data, studentId]);

  if (loading) return (
    <div className="py-40 flex flex-col items-center justify-center gap-4 text-slate-600 animate-pulse">
       <Zap className="w-12 h-12 text-amber-500" />
       <p className="text-[10px] font-black uppercase tracking-widest">Generating Assessment Matrix...</p>
    </div>
  );

  if (!data.student || !analysis) return null;

  return (
    <div className="space-y-10 animate-slide-up pb-32">
       <button onClick={onBack} className="flex items-center gap-3 text-slate-500 hover:text-white transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Back to Directory</span>
       </button>

       {/* Candidate Profile Header */}
       <div className="flex flex-col md:flex-row items-start gap-8 bg-[var(--bg-card)] p-10 rounded-[3.5rem] border border-[var(--border)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 blur-3xl -mr-48 -mt-48"></div>
          <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-amber-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl relative z-10">
             <User className="w-12 h-12" />
          </div>
          <div className="flex-1 relative z-10">
             <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">{data.student.name}</h2>
             <div className="flex flex-wrap gap-4">
                <span className="px-4 py-1.5 bg-white/5 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest border border-[var(--border)]">
                   ID: {data.student.seatNumber}
                </span>
                <span className="px-4 py-1.5 bg-emerald-500/10 rounded-full text-[9px] font-black text-emerald-500 uppercase tracking-widest border border-emerald-500/10">
                   {data.student.medium} Medium
                </span>
                <span className="px-4 py-1.5 bg-blue-500/10 rounded-full text-[9px] font-black text-blue-400 uppercase tracking-widest border border-blue-500/10">
                   Division {data.student.division}
                </span>
             </div>
          </div>
          <div className="text-right relative z-10 hidden md:block">
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Global GPA</div>
             <div className="text-5xl font-black text-white tracking-tighter">
                {(analysis.averagePercentage / 25).toFixed(2)}
             </div>
          </div>
       </div>

       {/* Analysis Grid */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trend & Velocity */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[3rem] p-10 space-y-8 flex flex-col justify-between">
             <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Performance Velocity
             </h3>
             <div className="text-center py-6">
                <div className={`text-6xl font-black tracking-tighter mb-4 ${analysis.trend === 'improving' ? 'text-emerald-500' : analysis.trend === 'declining' ? 'text-rose-500' : 'text-amber-500'}`}>
                   {analysis.velocity > 0 ? '+' : ''}{analysis.velocity}%
                </div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Net Exam-over-Exam Variance</div>
             </div>
             <div className="bg-white/5 rounded-2xl p-5 border border-[var(--border)] text-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Trend Status: </span>
                <span className="text-[11px] font-black text-white uppercase tracking-tight ml-2">{analysis.trend}</span>
             </div>
          </div>

          {/* Strengths & Blindspots */}
          <div className="bg-slate-900 border border-white/10 rounded-[3rem] p-10 space-y-8">
             <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-3">
                <Brain className="w-4 h-4 text-emerald-500" />
                Cognitive Map
             </h3>
             
             <div className="space-y-6">
                <div className="space-y-3">
                   <div className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest flex items-center gap-2">
                      <Target className="w-3 h-3" /> Core Strengths
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {analysis.strengths.length ? analysis.strengths.map(s => (
                        <span key={s} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-bold uppercase">{s}</span>
                      )) : <span className="text-[10px] text-slate-600 font-bold uppercase italic">No benchmarks cleared</span>}
                   </div>
                </div>

                <div className="space-y-3">
                   <div className="text-[8px] font-black text-rose-500/60 uppercase tracking-widest flex items-center gap-2">
                      <ShieldAlert className="w-3 h-3" /> Focus Zones
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {analysis.weaknesses.length ? analysis.weaknesses.map(w => (
                        <span key={w} className="px-3 py-1 bg-rose-500/10 text-rose-400 rounded-lg text-[10px] font-bold uppercase">{w}</span>
                      )) : <span className="text-[10px] text-slate-600 font-bold uppercase italic">No critical blindspots</span>}
                   </div>
                </div>
             </div>
          </div>

          {/* Auto-Feedback */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[3rem] p-10 space-y-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -mr-16 -mt-16"></div>
             <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-3">
                <Zap className="w-4 h-4 text-amber-500" />
                Intelligent Feedback
             </h3>
             
             <div className="bg-white/5 border border-[var(--border)] p-6 rounded-3xl relative z-10">
                <p className="text-[11px] font-bold text-slate-300 leading-relaxed italic uppercase tracking-tight">
                   "{GradingEngine.calculateGrade(analysis.averagePercentage, 100).feedback}"
                </p>
             </div>
             
             <div className="flex items-center gap-4 p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                <Info className="w-5 h-5 text-blue-500 shrink-0" />
                <p className="text-[8px] font-black text-blue-400 uppercase leading-tight">
                   Calculated based on {analysis.history.length} assessment cycles recorded in the system.
                </p>
             </div>
          </div>
       </div>

       {/* Detailed History Log */}
       <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[3rem] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-[var(--border)] flex items-center gap-4 bg-white/[0.02]">
             <Clock className="w-5 h-5 text-slate-600" />
             <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Chronological Assessment Log</h3>
          </div>
          
          <div className="overflow-x-auto no-scrollbar">
             <table className="w-full text-left">
                <thead className="bg-black/20 text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] border-b border-[var(--border)]">
                   <tr>
                      <th className="px-10 py-5">Assessment Cycle</th>
                      <th className="px-10 py-5">Date</th>
                      <th className="px-10 py-5 text-center">Efficiency</th>
                      <th className="px-10 py-5 text-center">Grade Tier</th>
                      <th className="px-10 py-5 text-right">Status</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                   {analysis.history.reverse().map((h, idx) => {
                     const gradeInfo = GradingEngine.calculateGrade(h.percentage, 100);
                     return (
                       <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-10 py-6">
                             <div className="flex items-center gap-4">
                                <div className={`w-1.5 h-1.5 rounded-full ${gradeInfo.isPass ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                <span className="text-xs font-black text-white uppercase tracking-tight">{h.examName}</span>
                             </div>
                          </td>
                          <td className="px-10 py-6">
                             <span className="text-[10px] font-bold text-slate-500 uppercase">{new Date(h.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                          </td>
                          <td className="px-10 py-6 text-center">
                             <div className="text-sm font-black text-white tracking-tighter">{h.percentage.toFixed(1)}%</div>
                          </td>
                          <td className="px-10 py-6 text-center">
                             <div className={`px-4 py-1.5 rounded-xl inline-flex text-[10px] font-black border border-[var(--border)] ${gradeInfo.bgColor} ${gradeInfo.color}`}>
                                {gradeInfo.grade}
                             </div>
                          </td>
                          <td className="px-10 py-6 text-right">
                             <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">RECORDED</span>
                          </td>
                       </tr>
                     );
                   })}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );
};

export default StudentDetailedReportView;
