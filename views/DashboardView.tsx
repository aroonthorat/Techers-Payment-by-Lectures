
import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Clock, Wallet, Zap, Activity } from 'lucide-react';
import { AttendanceStatus, SystemEvent, EventType } from '../types';
import { dbService } from '../firebase';

const DashboardView: React.FC = () => {
  const [stats, setStats] = useState({ teacherCount: 0, classCount: 0, pendingLecs: 0, totalPaid: 0 });
  const [events, setEvents] = useState<SystemEvent[]>([]);

  const load = async () => {
    const [t, c, a, p, logs] = await Promise.all([
      dbService.getTeachers(), dbService.getClasses(), dbService.getAttendance(),
      dbService.getPayments(), dbService.getActivityLog()
    ]);
    setStats({
      teacherCount: t.length, classCount: c.length,
      pendingLecs: a.filter(item => item.status === AttendanceStatus.PENDING).length,
      totalPaid: p.reduce((sum, curr) => sum + curr.amount, 0)
    });
    setEvents(logs);
  };

  useEffect(() => { load(); }, []);

  const cards = [
    { label: 'STAFF', value: stats.teacherCount, icon: Users, color: 'bg-indigo-700', text: 'text-indigo-700', bg: 'bg-indigo-50', delay: 'stagger-1' },
    { label: 'CLASSES', value: stats.classCount, icon: BookOpen, color: 'bg-slate-800', text: 'text-slate-800', bg: 'bg-slate-100', delay: 'stagger-2' },
    { label: 'PENDING', value: stats.pendingLecs, icon: Clock, color: 'bg-rose-700', text: 'text-rose-700', bg: 'bg-rose-50', delay: 'stagger-3' },
    { label: 'TOTAL PAID', value: `₹${stats.totalPaid.toLocaleString()}`, icon: Wallet, color: 'bg-emerald-700', text: 'text-emerald-700', bg: 'bg-emerald-50', delay: 'stagger-4' },
  ];

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 uppercase tracking-tighter">System Pulse</h2>
          <div className="flex items-center gap-3">
             <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
             <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Real-time System Sync</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm">
          <Activity className="w-4 h-4 text-cyan-600" />
          <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Active Monitoring</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {cards.map((card, i) => (
          <div key={i} className={`bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 group transition-all hover:border-indigo-300 animate-slide-up ${card.delay}`}>
            <div className={`w-12 h-12 md:w-14 md:h-14 mb-4 md:mb-6 ${card.bg} rounded-xl flex items-center justify-center text-white shadow-sm border border-transparent group-hover:border-white transition-all`}>
              <card.icon className={`w-6 h-6 md:w-7 md:h-7 ${card.text}`} />
            </div>
            <div className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tighter">{card.value}</div>
            <div className="text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest mt-1.5">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-8 md:p-10 border border-slate-200 shadow-sm animate-slide-up stagger-4">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-3">
            <Zap className="w-6 h-6 text-indigo-700" />
            Operational History
          </h3>
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            LOGS <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
          </div>
        </div>
        
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="py-20 text-center text-slate-400 font-bold text-xs uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-2xl">
              No interactions logged
            </div>
          ) : (
            events.slice(0, 10).map((event, idx) => (
              <div key={event.id} className="flex gap-5 border-b border-slate-100 pb-5 last:border-0 last:pb-0 group">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-2 ${event.type === EventType.PAYMENT_PROCESSED ? 'bg-emerald-600' : 'bg-indigo-600'}`}></div>
                  <div className="w-0.5 h-full bg-slate-100 mt-2 group-last:hidden"></div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">{event.teacherName}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase bg-slate-50 px-2 py-1 rounded-md">{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-medium">{event.description}</p>
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
