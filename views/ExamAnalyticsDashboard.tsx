
import React from 'react';
import { TrendingUp, Users, Award, Percent, AlertCircle, Trophy, BarChart3 } from 'lucide-react';
import { ExamAnalytics } from '../types';

interface Props {
  analytics: ExamAnalytics;
}

const ExamAnalyticsDashboard: React.FC<Props> = ({ analytics }) => {
  if (analytics.totalStudents === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
      <StatBox 
        icon={Users} 
        label="Audited Students" 
        value={analytics.totalStudents} 
        color="text-blue-500" 
        bg="bg-blue-500/10" 
      />
      <StatBox 
        icon={Percent} 
        label="Global Average" 
        value={`${analytics.averageMarks}%`} 
        color="text-amber-500" 
        bg="bg-amber-500/10" 
      />
      <StatBox 
        icon={Trophy} 
        label="Top Score" 
        value={analytics.highestMarks} 
        sub={analytics.highestStudent} 
        color="text-emerald-500" 
        bg="bg-emerald-500/10" 
      />
      <div className="bg-[#0a0e1a] border border-white/5 p-5 rounded-[2rem] flex flex-col justify-between">
        <div className="flex justify-between items-start">
           <div className={`w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center`}>
              <TrendingUp className="w-5 h-5" />
           </div>
           <div className="text-right">
              <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Pass Ratio</div>
              <div className="text-sm font-black text-white">{Math.round((analytics.passCount / analytics.totalStudents) * 100)}%</div>
           </div>
        </div>
        <div className="mt-4 flex gap-1 h-1.5 rounded-full overflow-hidden">
           <div className="h-full bg-emerald-500" style={{ width: `${(analytics.passCount / analytics.totalStudents) * 100}%` }}></div>
           <div className="h-full bg-rose-500" style={{ width: `${(analytics.failCount / analytics.totalStudents) * 100}%` }}></div>
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ icon: Icon, label, value, color, bg, sub }: any) => (
  <div className="bg-[#0a0e1a] border border-white/5 p-5 rounded-[2rem] flex flex-col justify-between group hover:border-amber-500/20 transition-all">
    <div className={`w-10 h-10 ${bg} ${color} rounded-xl flex items-center justify-center shadow-sm`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="mt-4">
      <div className="text-2xl font-black text-white tracking-tighter">{value}</div>
      <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</div>
      {sub && <div className="text-[7px] font-bold text-slate-600 uppercase mt-0.5 truncate">{sub}</div>}
    </div>
  </div>
);

export default ExamAnalyticsDashboard;
