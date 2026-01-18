
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Clock, 
  Wallet, 
  Activity, 
  RefreshCcw,
  GraduationCap,
  IndianRupee,
  Briefcase,
  Database,
  Cloud,
  Download,
  ShieldCheck,
  UploadCloud,
  Zap,
  Globe
} from 'lucide-react';
import { AttendanceStatus, SystemEvent } from '../types';
import { dbService } from '../firebase';
import { GoogleDriveService } from '../utils/GoogleDriveService';

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
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(localStorage.getItem('edupay_last_sync'));

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
  };

  const handleDriveSync = async () => {
    setSyncing(true);
    try {
      const localData = localStorage.getItem('edupay_v2_db');
      if (localData) {
        const success = await GoogleDriveService.syncToDrive(JSON.parse(localData));
        if (success) {
          setLastSync(new Date().toISOString());
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  const handleDriveRestore = async () => {
    if (!confirm("This will replace all local data with Drive backup. Continue?")) return;
    setSyncing(true);
    try {
      const cloudData = await GoogleDriveService.fetchFromDrive();
      if (cloudData) {
        localStorage.setItem('edupay_v2_db', JSON.stringify(cloudData));
        window.location.reload();
      } else {
        alert("No Drive backup found.");
      }
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6 md:space-y-10 animate-slide-up pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl md:text-5xl font-black theme-text uppercase tracking-tighter leading-none">Management Hub</h2>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
             <span className="text-[10px] font-black theme-text-muted uppercase tracking-[0.2em]">Institutional Operations Center</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-[#0a0e1a] p-2 rounded-2xl border border-white/5">
          <div className="px-4 border-r border-white/10 hidden lg:block">
            <span className="text-[8px] font-black text-slate-500 uppercase block tracking-widest">Last Cloud Sync</span>
            <span className="text-[11px] font-black text-white">{lastSync ? new Date(lastSync).toLocaleTimeString() : 'Inbound'}</span>
          </div>
          <button 
            onClick={handleDriveSync}
            disabled={syncing}
            className="flex items-center gap-2.5 h-12 px-5 bg-amber-500 text-[#050810] rounded-xl hover:brightness-110 transition-all disabled:opacity-50 font-black btn-active shadow-lg shadow-amber-500/10"
          >
            <UploadCloud className={`w-4 h-4 ${syncing ? 'animate-bounce' : ''}`} />
            <span className="text-[10px] uppercase tracking-widest">Backup</span>
          </button>
          <button 
            onClick={handleDriveRestore}
            disabled={syncing}
            className="flex items-center gap-2.5 h-12 px-5 bg-blue-600 text-white rounded-xl hover:brightness-110 transition-all disabled:opacity-50 font-black btn-active shadow-lg shadow-blue-600/10"
          >
            <Download className="w-4 h-4" />
            <span className="text-[10px] uppercase tracking-widest">Restore</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-6">
          <div className="flex items-center gap-3">
             <Briefcase className="w-5 h-5 theme-primary" />
             <h3 className="text-xs font-black theme-text uppercase tracking-[0.2em]">Personnel Metrics</h3>
             <div className="flex-1 h-px bg-white/5"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Faculty" value={stats.teacherCount} icon={Users} color="indigo" />
            <StatCard label="Batches" value={stats.classCount} icon={BookOpen} color="amber" />
            <StatCard label="Pending" value={stats.pendingLecs} icon={Clock} color="rose" />
            <StatCard label="Paid Out" value={`₹${stats.totalPaidSalaries.toLocaleString()}`} icon={Wallet} color="emerald" />
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
             <GraduationCap className="w-5 h-5 text-blue-400" />
             <h3 className="text-xs font-black theme-text uppercase tracking-[0.2em]">Financial Treasury</h3>
             <div className="flex-1 h-px bg-white/5"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Students" value={stats.studentCount} icon={GraduationCap} color="cyan" />
            <StatCard label="Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={IndianRupee} color="emerald" />
            <StatCard label="Due" value={`₹${stats.pendingFees.toLocaleString()}`} icon={Zap} color="rose" />
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 theme-card rounded-[2.5rem] p-8 md:p-10 border shadow-2xl flex flex-col min-h-[400px]">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black theme-text uppercase tracking-[0.2em] flex items-center gap-3">
                <Activity className="w-5 h-5 theme-primary" />
                Live Audit Trail
              </h3>
              <button onClick={load} className="p-2 theme-text-muted hover:theme-text transition-all active:rotate-180 duration-500"><RefreshCcw className="w-5 h-5" /></button>
           </div>
           <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar max-h-[400px]">
             {events.length === 0 ? (
               <div className="h-full flex items-center justify-center opacity-30 font-black uppercase text-[10px] tracking-widest border-2 border-dashed theme-border rounded-[2rem]">System idle — No recordings</div>
             ) : (
               events.map(ev => (
                 <div key={ev.id} className="flex gap-4 items-start p-4 bg-white/[0.02] rounded-2xl border theme-border hover:border-amber-500/20 transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${ev.type.includes('payment') ? 'bg-emerald-500' : 'theme-bg-primary'}`}></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-black theme-text uppercase tracking-tight">{ev.teacherName}</span>
                        <span className="text-[8px] font-black theme-text-muted uppercase tracking-widest">{new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[11px] font-bold theme-text-muted leading-relaxed opacity-80 uppercase tracking-tight">{ev.description}</p>
                    </div>
                 </div>
               ))
             )}
           </div>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col border border-white/10">
           <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 blur-3xl -mr-24 -mt-24"></div>
           <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3 mb-8 relative z-10">
             <Database className="w-5 h-5 text-amber-500" />
             Core Node
           </h3>
           
           <div className="space-y-6 relative z-10">
              <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5">
                <div className="flex items-center gap-3 mb-4">
                   <div className={`w-2.5 h-2.5 rounded-full ${lastSync ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 animate-pulse'}`}></div>
                   <span className="text-[10px] font-black uppercase tracking-widest">{lastSync ? 'Node Status: Synchronized' : 'Node Status: Local'}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div className="p-4 bg-[#050810] rounded-2xl border border-white/5">
                      <span className="text-[8px] text-slate-500 uppercase block mb-1 tracking-widest">Primary</span>
                      <span className="text-[10px] font-black uppercase">LocalStorage</span>
                   </div>
                   <div className="p-4 bg-[#050810] rounded-2xl border border-white/5">
                      <span className="text-[8px] text-slate-500 uppercase block mb-1 tracking-widest">Secondary</span>
                      <span className="text-[10px] font-black uppercase flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-blue-400" /> G-Drive</span>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <button onClick={handleDriveSync} className="flex flex-col items-center justify-center gap-3 py-6 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] hover:bg-amber-500/20 transition-all group btn-active">
                    <Cloud className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-200">Force Sync</span>
                 </button>
                 <button onClick={async () => { await load(); }} className="flex flex-col items-center justify-center gap-3 py-6 bg-blue-500/10 border border-blue-500/20 rounded-[2rem] hover:bg-blue-500/20 transition-all group btn-active">
                    <RefreshCcw className="w-6 h-6 text-blue-400 group-hover:rotate-180 transition-transform duration-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-200">Refresh</span>
                 </button>
              </div>

              <div className="p-6 bg-amber-500/5 rounded-[2rem] border border-amber-500/10 text-center">
                 <p className="text-[8px] font-black text-amber-500/60 uppercase tracking-widest leading-relaxed">
                    Access the secure settings tab to perform data maintenance or node reset operations.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: any) => {
  const colorMap: any = {
    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/20' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/20' }
  };
  const theme = colorMap[color] || colorMap.indigo;

  return (
    <div className="theme-card p-6 rounded-[2rem] border shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
       <div className={`absolute top-0 right-0 w-24 h-24 ${theme.bg} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
       <div className={`w-10 h-10 ${theme.bg} ${theme.text} ${theme.border} rounded-xl flex items-center justify-center mb-4 border transition-transform group-hover:scale-110`}>
          <Icon className="w-5 h-5" />
       </div>
       <div className="text-xl md:text-2xl font-black theme-text tracking-tighter leading-none mb-1">{value}</div>
       <div className="text-[9px] font-black theme-text-muted uppercase tracking-widest">{label}</div>
    </div>
  );
};

export default DashboardView;
