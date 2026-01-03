
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  BookOpen, 
  Clock, 
  Wallet, 
  Zap, 
  Activity, 
  RefreshCcw,
  GraduationCap,
  IndianRupee,
  Briefcase,
  Database,
  Cloud,
  HardDrive,
  Download,
  ShieldCheck
} from 'lucide-react';
import { AttendanceStatus, SystemEvent } from '../types';
import { dbService } from '../firebase';

const DashboardView: React.FC = () => {
  const [stats, setStats] = useState({ 
    teacherCount: 0, 
    classCount: 0, 
    pendingLecs: 0, 
    totalPaidSalaries: 0,
    studentCount: 0,
    totalRevenue: 0,
    pendingFees: 0
  });
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [dbInfo, setDbInfo] = useState({ type: 'Local', status: 'Connected' });

  const load = async () => {
    const [t, c, a, p, logs, s, fp] = await Promise.all([
      dbService.getTeachers(), 
      dbService.getClasses(), 
      dbService.getAttendance(),
      dbService.getPayments(), 
      dbService.getActivityLog(),
      dbService.getStudents(),
      dbService.getFeePayments()
    ]);

    const totalExpectedFee = s.reduce((sum, stu) => sum + (stu.enrollments?.reduce((eSum, enr) => eSum + enr.totalFee, 0) || 0), 0);
    const totalCollected = fp.reduce((sum, curr) => sum + curr.amount, 0);

    setStats({
      teacherCount: t.length, 
      classCount: c.length,
      pendingLecs: a.filter(item => item.status === AttendanceStatus.SUBMITTED).length,
      totalPaidSalaries: p.reduce((sum, curr) => sum + curr.amount, 0),
      studentCount: s.length,
      totalRevenue: totalCollected,
      pendingFees: totalExpectedFee - totalCollected
    });
    setEvents(logs);
    
    const config = await dbService.checkAppUpdates();
    setDbInfo({
      type: config ? 'Cloud' : 'Offline',
      status: 'Active'
    });
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6 animate-slide-up pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-4xl font-black theme-text uppercase tracking-tighter leading-none">Command Center</h2>
          <div className="flex items-center gap-2 mt-1.5">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[8px] font-black theme-text-muted uppercase tracking-widest">Real-time Ecosystem Monitor</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-[var(--bg-card)] p-1.5 rounded-xl border theme-border">
          <div className="flex flex-col items-end pr-3 border-r theme-border">
            <span className="text-[7px] font-black theme-text-muted uppercase tracking-widest">Engine</span>
            <span className="text-[9px] font-black theme-text">{dbInfo.type}</span>
          </div>
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${dbInfo.type === 'Cloud' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-slate-500/10 text-slate-500'}`}>
             {dbInfo.type === 'Cloud' ? <Cloud className="w-4 h-4" /> : <HardDrive className="w-4 h-4" />}
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-3 ml-1">
           <Briefcase className="w-4 h-4 theme-primary" />
           <h3 className="text-xs font-black theme-text uppercase tracking-tight">Staff Operations</h3>
           <div className="flex-1 h-px bg-[var(--border)] opacity-20"></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Faculty" value={stats.teacherCount} icon={Users} color="indigo" />
          <StatCard label="Batches" value={stats.classCount} icon={BookOpen} color="amber" />
          <StatCard label="Pending" value={stats.pendingLecs} icon={Clock} color="rose" />
          <StatCard label="Salaries" value={`₹${stats.totalPaidSalaries.toLocaleString()}`} icon={Wallet} color="emerald" />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3 ml-1">
           <GraduationCap className="w-4 h-4 text-emerald-500" />
           <h3 className="text-xs font-black theme-text uppercase tracking-tight">Student Affairs</h3>
           <div className="flex-1 h-px bg-[var(--border)] opacity-20"></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard label="Students" value={stats.studentCount} icon={GraduationCap} color="cyan" />
          <StatCard label="Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={IndianRupee} color="emerald" />
          <StatCard label="Due Fees" value={`₹${stats.pendingFees.toLocaleString()}`} icon={Zap} color="rose" />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 theme-card rounded-2xl p-6 border shadow-sm flex flex-col">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black theme-text uppercase tracking-tight flex items-center gap-2">
                <Activity className="w-4 h-4 theme-primary" />
                Live Feed
              </h3>
              <button onClick={load} className="p-1.5 theme-text-muted hover:theme-text transition-all"><RefreshCcw className="w-4 h-4" /></button>
           </div>
           <div className="space-y-2 max-h-[220px] overflow-y-auto no-scrollbar">
             {events.length === 0 ? (
               <div className="py-10 text-center opacity-20 font-black uppercase text-[9px]">Waiting for events...</div>
             ) : (
               events.map(ev => (
                 <div key={ev.id} className="flex gap-3 items-start p-2.5 bg-black/5 rounded-xl border border-white/5">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${ev.type.includes('payment') ? 'bg-emerald-500' : 'theme-bg-primary'}`}></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[9px] font-black theme-text uppercase">{ev.teacherName}</span>
                        <span className="text-[7px] font-bold theme-text-muted">{new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[9px] font-bold theme-text-muted leading-tight opacity-70">{ev.description}</p>
                    </div>
                 </div>
               ))
             )}
           </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col border border-white/10">
           <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-2 mb-4 relative z-10">
             <Database className="w-4 h-4 text-[var(--primary)]" />
             Storage Node
           </h3>
           <div className="space-y-3 relative z-10">
              <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Sync Status: Active</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                 <button onClick={() => {}} className="flex flex-col items-center gap-1.5 p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all">
                    <Download className="w-4 h-4 text-indigo-400" />
                    <span className="text-[7px] font-black uppercase tracking-widest">Backup</span>
                 </button>
                 <button onClick={async () => { await dbService.seedDatabase(); await load(); }} className="flex flex-col items-center gap-1.5 p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all">
                    <RefreshCcw className="w-4 h-4 text-amber-400" />
                    <span className="text-[7px] font-black uppercase tracking-widest">Reset</span>
                 </button>
              </div>
              <button 
                onClick={async () => { if(confirm("Wipe all data?")) { await dbService.clearDatabase(); await load(); } }}
                className="w-full py-2.5 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20 text-[8px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
              >
                Destroy Data
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: any) => {
  const colorMap: any = {
    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-500' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-500' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-500' }
  };
  const theme = colorMap[color] || colorMap.indigo;

  return (
    <div className="theme-card p-4 rounded-2xl border shadow-sm group hover:shadow-md transition-all">
       <div className={`w-9 h-9 ${theme.bg} ${theme.text} rounded-xl flex items-center justify-center mb-3 shadow-sm border theme-border`}>
          <Icon className="w-4 h-4" />
       </div>
       <div className="text-lg font-black theme-text tracking-tighter leading-none mb-1">{value}</div>
       <div className="text-[8px] font-black theme-text-muted uppercase tracking-widest">{label}</div>
    </div>
  );
};

export default DashboardView;
