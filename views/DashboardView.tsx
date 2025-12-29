
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Clock, 
  Wallet, 
  Zap, 
  Activity, 
  Database, 
  Loader2, 
  Sparkles,
  Trash2,
  RefreshCcw
} from 'lucide-react';
import { AttendanceStatus, SystemEvent, EventType } from '../types';
import { dbService } from '../firebase';

const DashboardView: React.FC = () => {
  const [stats, setStats] = useState({ teacherCount: 0, classCount: 0, pendingLecs: 0, totalPaid: 0 });
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const load = async () => {
    const [t, c, a, p, logs] = await Promise.all([
      dbService.getTeachers(), dbService.getClasses(), dbService.getAttendance(),
      dbService.getPayments(), dbService.getActivityLog()
    ]);
    setStats({
      teacherCount: t.length, classCount: c.length,
      // Fix: AttendanceStatus.PENDING does not exist on the enum.
      // Replacing it with AttendanceStatus.SUBMITTED to count lectures awaiting verification.
      pendingLecs: a.filter(item => item.status === AttendanceStatus.SUBMITTED).length,
      totalPaid: p.reduce((sum, curr) => sum + curr.amount, 0)
    });
    setEvents(logs);
  };

  useEffect(() => { load(); }, []);

  const handleSeed = async () => {
    if (stats.teacherCount > 0 && !confirm("This will wipe all existing data and replace it with demo data. Proceed?")) return;
    setIsSeeding(true);
    try {
      await dbService.seedDatabase();
      await load();
    } catch (err) {
      alert("Seeding failed. Check console.");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("PERMANENTLY DELETE ALL SYSTEM DATA? This cannot be undone.")) return;
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

  const cards = [
    { label: 'STAFF', value: stats.teacherCount, icon: Users, color: 'theme-primary', text: 'theme-primary', bg: 'bg-[var(--primary-light)]', delay: 'stagger-1' },
    { label: 'CLASSES', value: stats.classCount, icon: BookOpen, color: 'theme-text', text: 'theme-text', bg: 'bg-[var(--bg-main)]', delay: 'stagger-2' },
    { label: 'PENDING', value: stats.pendingLecs, icon: Clock, color: 'text-rose-500', text: 'text-rose-500', bg: 'bg-rose-500/10', delay: 'stagger-3' },
    { label: 'TOTAL PAID', value: `₹${stats.totalPaid.toLocaleString()}`, icon: Wallet, color: 'text-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-500/10', delay: 'stagger-4' },
  ];

  return (
    <div className="space-y-8 animate-slide-up pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl md:text-5xl font-extrabold theme-text uppercase tracking-tighter">System Pulse</h2>
          <div className="flex items-center gap-3">
             <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
             <span className="text-[11px] font-bold theme-text-muted uppercase tracking-widest">Real-time System Sync</span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {stats.teacherCount === 0 ? (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-700">
              <div className="hidden lg:flex items-center gap-2 text-amber-500 bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20 shadow-sm">
                <Sparkles className="w-4 h-4" />
                <span className="text-[9px] font-black uppercase tracking-widest">System Ready</span>
              </div>
              <button 
                onClick={handleSeed}
                disabled={isSeeding}
                className="flex items-center gap-2 theme-bg-primary text-white px-6 py-3 rounded-xl shadow-xl shadow-[var(--primary-light)] text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 border-2 border-white/10"
              >
                {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                Populate Demo Data
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
               <button 
                onClick={handleSeed}
                disabled={isSeeding || isClearing}
                className="flex items-center gap-2 bg-[var(--bg-card)] theme-text-muted px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:brightness-95 transition-all active:scale-95 border theme-border"
                title="Reset environment with fresh demo data"
              >
                <RefreshCcw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
                Reset Demo
              </button>
              <button 
                onClick={handleClear}
                disabled={isSeeding || isClearing}
                className="flex items-center gap-2 bg-rose-500/10 text-rose-500 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all active:scale-95 border border-rose-500/20"
                title="Wipe all data from the database"
              >
                {isClearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Wipe Clean
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {cards.map((card, i) => (
          <div key={i} className={`theme-card p-6 md:p-8 rounded-2xl shadow-sm border group transition-all hover:border-[var(--primary)] animate-slide-up ${card.delay}`}>
            <div className={`w-12 h-12 md:w-14 md:h-14 mb-4 md:mb-6 ${card.bg} rounded-xl flex items-center justify-center shadow-sm border border-transparent group-hover:border-white/10 transition-all`}>
              <card.icon className={`w-6 h-6 md:w-7 md:h-7 ${card.text}`} />
            </div>
            <div className="text-2xl md:text-4xl font-extrabold theme-text tracking-tighter">{card.value}</div>
            <div className="text-[10px] md:text-[11px] font-black theme-text-muted uppercase tracking-widest mt-1.5">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="theme-card rounded-[2rem] p-8 md:p-12 border shadow-sm animate-slide-up stagger-4">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-xl md:text-2xl font-extrabold theme-text uppercase tracking-tight flex items-center gap-3">
            <Zap className="w-6 h-6 theme-primary" />
            Operational History
          </h3>
          <div className="flex items-center gap-2 text-[10px] font-black theme-text-muted uppercase tracking-widest">
            LIVE LOGS <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="py-24 text-center theme-text-muted font-bold text-[10px] uppercase tracking-[0.3em] border-2 border-dashed theme-border rounded-[2rem] opacity-40">
              Waiting for system activity...
            </div>
          ) : (
            events.slice(0, 10).map((event, idx) => (
              <div key={event.id} className="flex gap-6 border-b theme-border pb-6 last:border-0 last:pb-0 group hover:bg-[var(--primary-light)]/10 p-2 rounded-xl transition-colors">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full shrink-0 mt-2 ${
                    event.type === EventType.PAYMENT_PROCESSED ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                    event.type === EventType.ADVANCE_GRANTED ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
                    'theme-bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]'
                  }`}></div>
                  <div className="w-0.5 h-full theme-border border-l mt-2 group-last:hidden"></div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="text-sm font-black theme-text uppercase tracking-tight">{event.teacherName}</div>
                    <div className="text-[10px] font-black theme-text-muted uppercase tracking-widest bg-[var(--bg-main)] px-3 py-1.5 rounded-lg border theme-border">
                      {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <p className="text-xs theme-text-muted mt-2 font-bold leading-relaxed opacity-80">{event.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
