
import React, { useState, useEffect, useMemo } from 'react';
import { Wallet, Clock, Zap, Star, LayoutGrid, CalendarDays, ArrowRight, CheckCircle2, AlertCircle, TrendingDown } from 'lucide-react';
import { AuthUser, Teacher, Attendance, ClassType, AttendanceStatus, Payment, Advance } from '../types';
import { dbService } from '../firebase';

interface TeacherHomeViewProps {
  user: AuthUser;
}

const TeacherHomeView: React.FC<TeacherHomeViewProps> = ({ user }) => {
  const [data, setData] = useState<{
    teacher: Teacher | null,
    attendance: Attendance[],
    classes: ClassType[],
    payments: Payment[],
    advances: Advance[]
  }>({
    teacher: null,
    attendance: [],
    classes: [],
    payments: [],
    advances: []
  });

  const [activeHistoryTab, setActiveHistoryTab] = useState<'lectures' | 'advances'>('lectures');

  useEffect(() => {
    const load = async () => {
      const [teachers, attendance, classes, payments, advances] = await Promise.all([
        dbService.getTeachers(),
        dbService.getAttendance(user.id),
        dbService.getClasses(),
        dbService.getPayments(),
        dbService.getAdvances(user.id)
      ]);
      setData({
        teacher: teachers.find(t => t.id === user.id) || null,
        attendance,
        classes,
        payments: payments.filter(p => p.teacherId === user.id),
        advances
      });
    };
    load();
  }, [user.id]);

  const stats = useMemo(() => {
    const pending = data.attendance.filter(a => a.status !== AttendanceStatus.PAID).length;
    const totalEarned = data.payments.reduce((sum, p) => sum + p.amount, 0);
    const classesCount = data.teacher?.assignments.length || 0;
    
    return [
      { label: 'Unsettled Dues', value: pending, unit: 'Lectures', icon: Clock, color: 'text-rose-500', bg: 'bg-rose-500/10' },
      { label: 'Historical Earnings', value: `₹${totalEarned.toLocaleString()}`, unit: 'Total', icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
      { label: 'Active Tracks', value: classesCount, unit: 'Classes', icon: LayoutGrid, color: 'theme-primary', bg: 'bg-[var(--primary-light)]' },
    ];
  }, [data]);

  const advanceBalance = useMemo(() => {
    return data.advances.reduce((sum, a) => sum + a.remainingAmount, 0);
  }, [data.advances]);

  return (
    <div className="space-y-10 animate-slide-up pb-20">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
           <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-[11px] font-black theme-text-muted uppercase tracking-widest opacity-60">Active Portal Session</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-black theme-text uppercase tracking-tighter leading-none">
          Welcome, {user.name.split(' ')[0]}
        </h2>
        <p className="text-xs font-bold theme-text-muted uppercase tracking-widest opacity-60">Academic Performance & Compensation Dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="theme-card p-8 rounded-[2.5rem] border shadow-sm flex flex-col justify-between hover:shadow-xl transition-all group">
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 shadow-sm border border-white/5`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <div>
              <div className="text-3xl font-black theme-text tracking-tighter">{stat.value}</div>
              <div className="text-[10px] font-black theme-text-muted uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 p-8 md:p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-white/5 flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 theme-bg-primary opacity-5 -mr-32 -mt-32 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                Latest Settlement
              </h3>
              <ArrowRight className="w-5 h-5 text-slate-500" />
            </div>

            {data.payments.length === 0 ? (
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest py-10 opacity-40">No payments processed yet.</p>
            ) : (
              <div>
                <div className="text-5xl font-black tracking-tighter mb-4">₹{data.payments[0].amount.toLocaleString()}</div>
                <div className="flex items-center gap-3">
                  <span className="bg-white/10 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-indigo-100">
                    {data.classes.find(c => c.id === data.payments[0].classId)?.name}
                  </span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    Paid on {new Date(data.payments[0].datePaid).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {advanceBalance > 0 && (
            <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
               <div className="flex items-center gap-3 text-rose-300">
                  <TrendingDown className="w-5 h-5" />
                  <span className="text-xs font-black uppercase tracking-widest">Outstanding Advance: ₹{advanceBalance.toLocaleString()}</span>
               </div>
            </div>
          )}
        </div>

        <div className="theme-card p-8 md:p-12 rounded-[3rem] border shadow-sm">
          <div className="flex items-center justify-between mb-10">
             <h3 className="text-xl font-black theme-text uppercase tracking-tight flex items-center gap-3">
                <CalendarDays className="w-6 h-6 theme-primary" />
                Assigned Tracks
             </h3>
          </div>
          
          <div className="space-y-4">
            {data.teacher?.assignments.map((asg, idx) => {
              const cls = data.classes.find(c => c.id === asg.classId);
              return (
                <div key={idx} className="flex items-center justify-between p-5 bg-[var(--bg-main)] rounded-2xl border theme-border group hover:bg-[var(--bg-card)] hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 theme-card rounded-xl flex items-center justify-center theme-text-muted group-hover:theme-primary shadow-sm">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-black theme-text uppercase tracking-tight">{cls?.name}</div>
                      <div className="text-[10px] font-bold theme-text-muted uppercase tracking-widest mt-0.5">{asg.subject}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black theme-primary">₹{asg.rate.toLocaleString()}</div>
                    <div className="text-[9px] font-bold theme-text-muted uppercase tracking-widest opacity-60">Unit Price</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="theme-card rounded-[3rem] p-8 md:p-10 border shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
           <h3 className="text-2xl font-black theme-text uppercase tracking-tighter">My History</h3>
           <div className="flex p-1 bg-[var(--bg-main)] rounded-xl border theme-border">
              <button 
                onClick={() => setActiveHistoryTab('lectures')}
                className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeHistoryTab === 'lectures' ? 'theme-bg-primary text-white shadow-sm' : 'theme-text-muted hover:bg-[var(--bg-card)]'}`}
              >
                Lecture Log
              </button>
              <button 
                onClick={() => setActiveHistoryTab('advances')}
                className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeHistoryTab === 'advances' ? 'theme-bg-primary text-white shadow-sm' : 'theme-text-muted hover:bg-[var(--bg-card)]'}`}
              >
                Advance History
              </button>
           </div>
        </div>

        <div className="overflow-y-auto max-h-[500px] custom-scrollbar pr-2">
          {activeHistoryTab === 'lectures' ? (
             <div className="space-y-3">
               {data.attendance.length === 0 ? (
                 <div className="py-16 text-center border-2 border-dashed theme-border rounded-[2rem] theme-text-muted opacity-40 font-bold uppercase text-xs tracking-widest">No lectures recorded yet</div>
               ) : (
                 data.attendance.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(a => (
                   <div key={a.id} className="flex items-center justify-between p-5 bg-[var(--bg-main)] rounded-2xl border theme-border hover:shadow-sm transition-all">
                      <div className="flex items-center gap-4">
                         <div className="text-center w-14 bg-[var(--bg-card)] rounded-xl py-2 border theme-border">
                            <div className="text-[10px] font-black theme-text-muted uppercase tracking-wider">{new Date(a.date).toLocaleDateString(undefined, { month: 'short' })}</div>
                            <div className="text-xl font-black theme-text leading-none">{new Date(a.date).getDate()}</div>
                         </div>
                         <div>
                            <div className="text-sm font-black theme-text uppercase tracking-tight">{data.classes.find(c => c.id === a.classId)?.name}</div>
                            <div className="text-[10px] font-bold theme-text-muted uppercase tracking-widest mt-0.5 opacity-60 flex items-center gap-1.5">
                               <Clock className="w-3 h-3" />
                               {a.markedAt ? new Date(a.markedAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : 'Logged'}
                            </div>
                         </div>
                      </div>
                      <div className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${a.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : a.status === 'verified' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                         {a.status === 'paid' && <CheckCircle2 className="w-3 h-3" />}
                         {a.status === 'submitted' && <AlertCircle className="w-3 h-3" />}
                         {a.status}
                      </div>
                   </div>
                 ))
               )}
             </div>
          ) : (
             <div className="space-y-4">
               {data.advances.length === 0 ? (
                 <div className="py-16 text-center border-2 border-dashed theme-border rounded-[2rem] theme-text-muted opacity-40 font-bold uppercase text-xs tracking-widest">No advance history found</div>
               ) : (
                 data.advances.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(adv => (
                   <div key={adv.id} className="p-6 bg-[var(--bg-main)] rounded-[2rem] border theme-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-all">
                      <div className="flex items-center gap-5">
                         <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100">
                            <TrendingDown className="w-6 h-6" />
                         </div>
                         <div>
                            <div className="text-lg font-black theme-text uppercase tracking-tight">₹{adv.amount.toLocaleString()}</div>
                            <div className="text-[10px] font-bold theme-text-muted uppercase tracking-widest mt-1">{new Date(adv.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
                         </div>
                      </div>
                      <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                         {adv.notes && (
                            <span className="text-[10px] font-medium theme-text-muted italic bg-[var(--bg-card)] px-3 py-1.5 rounded-lg border theme-border">
                               "{adv.notes}"
                            </span>
                         )}
                         <div className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl ${adv.remainingAmount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {adv.remainingAmount > 0 ? `DUE: ₹${adv.remainingAmount}` : 'SETTLED'}
                         </div>
                      </div>
                   </div>
                 ))
               )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherHomeView;
