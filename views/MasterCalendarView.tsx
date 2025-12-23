
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Zap, 
  Wallet, 
  X,
  Clock,
  User,
  Activity,
  Calendar as CalIcon
} from 'lucide-react';
import { Attendance, Payment, SystemEvent, Teacher, ClassType } from '../types';
import { dbService } from '../firebase';

const MasterCalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<{
    attendance: Attendance[],
    payments: Payment[],
    events: SystemEvent[],
    teachers: Teacher[],
    classes: ClassType[]
  }>({
    attendance: [],
    payments: [],
    events: [],
    teachers: [],
    classes: []
  });
  const [selectedDayEvents, setSelectedDayEvents] = useState<{
    date: string,
    attendance: Attendance[],
    payments: Payment[],
    system: SystemEvent[]
  } | null>(null);

  const load = async () => {
    const [a, p, e, t, c] = await Promise.all([
      dbService.getAttendance(),
      dbService.getPayments(),
      dbService.getActivityLog(),
      dbService.getTeachers(),
      dbService.getClasses()
    ]);
    setData({ attendance: a, payments: p, events: e, teachers: t, classes: c });
  };

  useEffect(() => { load(); }, []);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

  const calendarData = useMemo(() => {
    const map: Record<string, { attendance: Attendance[], payments: Payment[], system: SystemEvent[] }> = {};
    
    data.attendance.forEach(a => {
      if (!map[a.date]) map[a.date] = { attendance: [], payments: [], system: [] };
      map[a.date].attendance.push(a);
    });

    data.payments.forEach(p => {
      const date = p.datePaid.split('T')[0];
      if (!map[date]) map[date] = { attendance: [], payments: [], system: [] };
      map[date].payments.push(p);
    });

    data.events.forEach(e => {
      const date = e.timestamp.split('T')[0];
      if (!map[date]) map[date] = { attendance: [], payments: [], system: [] };
      map[date].system.push(e);
    });

    return map;
  }, [data]);

  const handleDayClick = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
    const dayData = calendarData[dateStr] || { attendance: [], payments: [], system: [] };
    setSelectedDayEvents({ date: dateStr, ...dayData });
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-8 animate-slide-up relative pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl md:text-5xl font-extrabold theme-text uppercase tracking-tighter leading-none">Master Pulse</h2>
          <p className="text-xs md:text-sm font-bold theme-text-muted uppercase tracking-widest opacity-60">Global visualization of academic & financial events</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} 
            className="p-4 bg-white border theme-border rounded-2xl hover:theme-bg-primary hover:text-white transition-all shadow-sm active:scale-95"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 md:flex-none bg-white border-2 theme-border px-10 py-4 rounded-[1.5rem] flex items-center justify-center min-w-[240px] shadow-lg">
            <span className="text-sm font-black theme-text uppercase tracking-[0.2em] text-center">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
          </div>
          <button 
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} 
            className="p-4 bg-white border theme-border rounded-2xl hover:theme-bg-primary hover:text-white transition-all shadow-sm active:scale-95"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden border-2 theme-border">
        <div className="grid grid-cols-7 bg-[var(--bg-main)] border-b-2 theme-border">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
            <div key={d} className="py-4 md:py-6 text-center text-[8px] md:text-[10px] font-black theme-text-muted uppercase tracking-widest">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-[var(--border)]">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={i} className="bg-[var(--bg-main)] opacity-30 h-24 md:h-44"></div>
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
            const dayMeta = calendarData[dateStr];
            const isToday = dateStr === todayStr;
            
            return (
              <div 
                key={day} 
                onClick={() => handleDayClick(day)}
                className={`
                  bg-white h-24 md:h-44 px-1.5 py-3 md:p-6 relative hover:bg-[var(--primary-light)]/40 cursor-pointer transition-all group overflow-hidden border-r border-b theme-border
                  ${isToday ? 'ring-2 ring-inset ring-[var(--primary)]' : ''}
                `}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-base md:text-2xl font-black tracking-tighter transition-colors ${isToday ? 'theme-primary' : 'theme-text opacity-90'}`}>
                    {day < 10 ? `0${day}` : day}
                  </span>
                  {isToday && (
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full theme-bg-primary animate-pulse"></div>
                  )}
                </div>

                <div className="mt-2 md:mt-4 flex flex-wrap gap-1 md:gap-2">
                  {dayMeta?.attendance && dayMeta.attendance.length > 0 && (
                    <div className="flex items-center gap-1 bg-amber-500 text-white px-1.5 py-0.5 md:px-2 md:py-1 rounded-md md:rounded-lg shadow-sm">
                       <Zap className="w-2.5 h-2.5 md:w-3 md:h-3 fill-white shrink-0" />
                       <span className="text-[8px] md:text-[10px] font-black uppercase">{dayMeta.attendance.length}</span>
                    </div>
                  )}
                  {dayMeta?.payments && dayMeta.payments.length > 0 && (
                    <div className="flex items-center gap-1 bg-emerald-500 text-white px-1.5 py-0.5 md:px-2 md:py-1 rounded-md md:rounded-lg shadow-sm">
                       <Wallet className="w-2.5 h-2.5 md:w-3 md:h-3 fill-white shrink-0" />
                    </div>
                  )}
                </div>
                
                {dayMeta?.system && dayMeta.system.length > 0 && (
                   <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 opacity-10 group-hover:opacity-30 transition-opacity">
                      <Activity className="w-4 h-4 md:w-8 md:h-8 theme-text" />
                   </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* DETAIL DRAWER - Restored Pro Aesthetic */}
      {selectedDayEvents && (
        <div className="fixed inset-0 bg-slate-900/90 z-[200] flex justify-end animate-in fade-in duration-300 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-[var(--bg-card)] h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col border-l theme-border overflow-hidden rounded-l-none md:rounded-l-[3rem]">
            <div className="p-6 md:p-10 border-b theme-border flex items-center justify-between bg-white">
              <div className="flex items-center gap-4 md:gap-5">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-[var(--primary-light)] theme-primary rounded-xl md:rounded-[1.5rem] flex items-center justify-center">
                  <CalIcon className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div>
                  <h3 className="text-xl md:text-3xl font-black theme-text uppercase tracking-tighter leading-none">Audit Ledger</h3>
                  <p className="theme-text-muted font-black text-[8px] md:text-[10px] uppercase tracking-[0.2em] mt-1 md:mt-2">
                    {new Date(selectedDayEvents.date).toLocaleDateString('en-US', { dateStyle: 'full' }).toUpperCase()}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedDayEvents(null)} className="p-3 md:p-4 theme-card rounded-xl md:rounded-2xl hover:theme-bg-primary hover:text-white transition-all shadow-sm active:scale-95">
                <X className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 md:space-y-12 pb-40 custom-scrollbar">
              {/* SECTION: ATTENDANCE */}
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-[9px] md:text-[11px] font-black theme-text-muted uppercase tracking-[0.3em] flex items-center gap-3">
                    <div className="w-4 md:w-6 h-1 bg-amber-500 rounded-full"></div>
                    LECTURE MARKINGS
                  </h4>
                  <span className="text-[9px] md:text-[11px] font-black theme-primary bg-[var(--primary-light)] px-3 py-1 md:px-4 md:py-1.5 rounded-full">{selectedDayEvents.attendance.length} UNITS</span>
                </div>
                
                {selectedDayEvents.attendance.length === 0 ? (
                   <div className="p-8 md:p-10 text-center bg-white rounded-[1.5rem] md:rounded-[2rem] border-2 border-dashed theme-border opacity-40">
                     <p className="text-[9px] md:text-[10px] font-black theme-text-muted uppercase tracking-widest">No recordings logged</p>
                   </div>
                ) : (
                  <div className="grid gap-3 md:gap-4">
                    {selectedDayEvents.attendance.map(a => {
                      const teacher = data.teachers.find(t => t.id === a.teacherId);
                      const cls = data.classes.find(c => c.id === a.classId);
                      return (
                        <div key={a.id} className="bg-white p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border theme-border shadow-sm flex flex-col gap-4 md:gap-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 md:gap-4">
                              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl theme-bg-primary flex items-center justify-center text-white shadow-lg">
                                <User className="w-5 h-5 md:w-6 md:h-6" />
                              </div>
                              <div>
                                <div className="text-sm md:text-base font-black theme-text uppercase tracking-tighter">{teacher?.name}</div>
                                <div className="text-[8px] md:text-[9px] font-black theme-primary uppercase tracking-widest">{cls?.name}</div>
                              </div>
                            </div>
                            <div className={`text-[8px] md:text-[9px] font-black px-3 py-1 md:px-4 md:py-1.5 rounded-full uppercase border-2 ${a.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                               {a.status}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 md:gap-3 px-4 py-2 md:px-5 md:py-3 bg-[var(--bg-main)] rounded-xl md:rounded-2xl border theme-border w-fit">
                            <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 theme-text opacity-40" />
                            <span className="text-[9px] md:text-[10px] font-black theme-text-muted uppercase tracking-[0.15em]">
                               Marked: {a.markedAt ? new Date(a.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'LEGACY'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* SECTION: PAYMENTS */}
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-[9px] md:text-[11px] font-black theme-text-muted uppercase tracking-[0.3em] flex items-center gap-3">
                    <div className="w-4 md:w-6 h-1 bg-emerald-500 rounded-full"></div>
                    DISBURSEMENTS
                  </h4>
                </div>
                {selectedDayEvents.payments.length === 0 ? (
                   <p className="text-[9px] md:text-[10px] font-black theme-text-muted uppercase tracking-widest opacity-40 text-center py-6">No financial settlements</p>
                ) : (
                  <div className="grid gap-3 md:gap-4">
                    {selectedDayEvents.payments.map(p => {
                      const teacher = data.teachers.find(t => t.id === p.teacherId);
                      const cls = data.classes.find(c => c.id === p.classId);
                      return (
                        <div key={p.id} className="p-6 md:p-8 bg-emerald-600 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl relative overflow-hidden text-white">
                          <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-white opacity-5 -mr-12 -mt-12 md:-mr-16 md:-mt-16 rounded-full"></div>
                          <div className="flex justify-between items-start mb-3 md:mb-4 relative z-10">
                             <div>
                               <div className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100 mb-1">RECIPIENT</div>
                               <div className="text-lg md:text-xl font-black uppercase tracking-tighter">{teacher?.name}</div>
                             </div>
                             <div className="text-2xl md:text-3xl font-black tracking-tight">₹{p.amount.toLocaleString()}</div>
                          </div>
                          <div className="flex justify-between items-end relative z-10 border-t border-emerald-500 pt-3 md:pt-4">
                            <div className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.1em] text-emerald-100">{cls?.name} • {p.lectureCount} LECTURES</div>
                            <div className="text-[7px] md:text-[8px] font-black bg-white text-emerald-700 px-3 py-1 md:px-4 md:py-1.5 rounded-full shadow-sm">VERIFIED TRANSACTION</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* SECTION: SYSTEM EVENTS */}
              <div className="space-y-4 md:space-y-6">
                <h4 className="text-[9px] md:text-[11px] font-black theme-text-muted uppercase tracking-[0.3em] flex items-center gap-3">
                  <div className="w-4 md:w-6 h-1 theme-bg-primary rounded-full"></div>
                  SYSTEM AUDIT
                </h4>
                {selectedDayEvents.system.length === 0 ? (
                   <p className="text-[9px] md:text-[10px] font-black theme-text-muted italic opacity-40">System idle.</p>
                ) : (
                  <div className="space-y-6 md:space-y-8 pl-3 md:pl-4 border-l-2 theme-border">
                    {selectedDayEvents.system.map(e => (
                      <div key={e.id} className="relative group">
                         <div className="absolute -left-[19px] md:-left-[21px] top-1 w-3 h-3 md:w-4 md:h-4 rounded-full bg-white border-2 theme-border group-hover:theme-bg-primary transition-colors"></div>
                         <div>
                            <div className="text-[10px] md:text-xs font-black theme-text uppercase tracking-tight leading-tight">{e.description}</div>
                            <div className="text-[8px] md:text-[9px] font-black theme-text-muted flex items-center gap-2 mt-2 uppercase tracking-widest">
                               <Clock className="w-3 md:w-3.5 h-3 md:h-3.5" />
                               {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterCalendarView;
