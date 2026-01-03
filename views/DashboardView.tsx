
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Clock, 
  Wallet, 
  Zap, 
  Activity, 
  Loader2, 
  Trash2,
  RefreshCcw,
  GraduationCap,
  IndianRupee,
  LayoutGrid,
  Briefcase
} from 'lucide-react';
import { AttendanceStatus, SystemEvent, EventType } from '../types';
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
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

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

  useEffect(() => { load(); }, []);

  const handleSeed = async () => {
    if (stats.teacherCount > 0 && !confirm("This will replace all existing data with demo data. Proceed?")) return;
    setIsSeeding(true);
    try {
      await dbService.seedDatabase();
      await load();
    } catch (err) {
      alert("Seeding failed.");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Wipe all system data?")) return;
    setIsClearing(true);
    try {
      await dbService.clearDatabase();
      await load();
    } catch (err) {
      alert("Wipe failed.");
    } finally {
      setIsClearing(false);
    }
  };

  const staffCards = [
    { label: 'STAFF MEMBERS', value: stats.teacherCount, icon: Users, bg: 'bg-indigo-500/10', text: 'text-indigo-500', delay: 'stagger-1' },
    { label: 'ACTIVE BATCHES', value: stats.classCount, icon: BookOpen, bg: 'bg-amber-500/10', text: 'text-amber-500', delay: 'stagger-2' },
    { label: 'PENDING VERIFICATION', value: stats.pendingLecs, icon: Clock, bg: 'bg-rose-500/10', text: 'text-rose-500', delay: 'stagger-3' },
    { label: 'DISBURSED SALARY', value: `₹${stats.totalPaidSalaries.toLocaleString()}`, icon: Wallet, bg: 'bg-emerald-500/10', text: 'text-emerald-500', delay: 'stagger-4' },
  ];

  const studentCards = [
    { label: 'ENROLLED STUDENTS', value: stats.studentCount, icon: GraduationCap, bg: 'bg-cyan-500/10', text: 'text-cyan-500', delay: 'stagger-1' },
    { label: 'FEE REVENUE', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: IndianRupee, bg: 'bg-emerald-500/10', text: 'text-emerald-500', delay: 'stagger-2' },
    { label: 'PENDING FEES', value: `₹${stats.pendingFees.toLocaleString()}`, icon: Zap, bg: 'bg-rose-500/10', text: 'text-rose-500', delay: 'stagger-3' },
  ];

  return (
    <div className="space-y-10 animate-slide-up pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl md:text-5xl font-extrabold theme-text uppercase tracking-tighter">Command Center</h2>
          <div className="flex items-center gap-3">
             <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
             <span className="text-[11px] font-bold theme-text-muted uppercase tracking-widest">System Overview</span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleSeed}
            disabled={isSeeding || isClearing}
            className="flex items-center gap-2 bg-[var(--bg-card)] theme-text-muted px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:brightness-95 border theme-border"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
            RESET DEMO
          </button>
          <button 
            onClick={handleClear}
            disabled={isSeeding || isClearing}
            className="flex items-center gap-2 bg-rose-500/10 text-rose-500 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-500/20 border border-rose-500/20"
          >
            {isClearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            WIPE DATA
          </button>
        </div>
      </div>

      {/* Staff Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 opacity-60 ml-2">
           <Briefcase className="w-4 h-4 theme-text" />
           <h3 className="text-xs font-black theme-text uppercase tracking-[0.2em]">Staff & Operations</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {staffCards.map((card, i) => (
            <div key={i} className={`theme-card p-6 md:p-8 rounded-[2rem] shadow-sm border group transition-all hover:border-[var(--primary)] animate-slide-up ${card.delay}`}>
              <div className={`w-12 h-12 md:w-14 md:h-14 mb-4 md:mb-6 ${card.bg} rounded-2xl flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 md:w-7 md:h-7 ${card.text}`} />
              </div>
              <div className="text-xl md:text-3xl font-black theme-text tracking-tighter leading-none">{card.value}</div>
              <div className="text-[9px] md:text-[10px] font-black theme-text-muted uppercase tracking-widest mt-2">{card.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Student Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 opacity-60 ml-2">
           <GraduationCap className="w-4 h-4 theme-text" />
           <h3 className="text-xs font-black theme-text uppercase tracking-[0.2em]">Student Affairs</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {studentCards.map((card, i) => (
            <div key={i} className={`theme-card p-6 md:p-8 rounded-[2rem] shadow-sm border group transition-all hover:border-[var(--primary)] animate-slide-up ${card.delay}`}>
              <div className={`w-12 h-12 md:w-14 md:h-14 mb-4 md:mb-6 ${card.bg} rounded-2xl flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 md:w-7 md:h-7 ${card.text}`} />
              </div>
              <div className="text-xl md:text-3xl font-black theme-text tracking-tighter leading-none">{card.value}</div>
              <div className="text-[9px] md:text-[10px] font-black theme-text-muted uppercase tracking-widest mt-2">{card.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="theme-card rounded-[2.5rem] p-8 md:p-10 border shadow-sm animate-slide-up stagger-4">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl md:text-2xl font-extrabold theme-text uppercase tracking-tight flex items-center gap-3">
              <Activity className="w-6 h-6 theme-primary" />
              Activity Stream
            </h3>
          </div>
          
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="py-24 text-center theme-text-muted font-bold text-[10px] uppercase tracking-[0.3em] border-2 border-dashed theme-border rounded-[2rem] opacity-40">
                Waiting for system activity...
              </div>
            ) : (
              events.slice(0, 8).map((event) => (
                <div key={event.id} className="flex gap-4 border-b theme-border pb-4 last:border-0 last:pb-0 group hover:bg-slate-50 p-2 rounded-xl transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                    event.type === EventType.PAYMENT_PROCESSED ? 'bg-emerald-500' : 'theme-bg-primary'
                  }`}></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div className="text-xs font-black theme-text uppercase tracking-tight">{event.teacherName}</div>
                      <div className="text-[8px] font-black theme-text-muted uppercase opacity-40">
                        {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <p className="text-[10px] theme-text-muted mt-1 font-bold leading-tight">{event.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="theme-card rounded-[2.5rem] p-8 md:p-10 border shadow-sm flex flex-col justify-center items-center text-center animate-slide-up stagger-5">
           <div className="w-20 h-20 bg-[var(--primary-light)] theme-primary rounded-3xl flex items-center justify-center mb-6 shadow-xl">
             <LayoutGrid className="w-10 h-10 fill-current" />
           </div>
           <h4 className="text-2xl font-black theme-text uppercase tracking-tight mb-2">Centralized Hub</h4>
           <p className="text-xs font-bold theme-text-muted uppercase tracking-widest max-w-xs leading-relaxed">
             Managing compensation loads for {stats.teacherCount} faculty and tracking fees for {stats.studentCount} students.
           </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
