
import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Lock, Calendar as CalIcon, User, Book, CheckCircle, ShieldAlert, AlertCircle } from 'lucide-react';
import { Teacher, ClassType, Attendance, AttendanceStatus, AuthUser } from '../types';
import { dbService } from '../firebase';

interface AttendanceViewProps {
  forcedTeacherId?: string;
  preselectedTeacherId?: string;
}

const AttendanceView: React.FC<AttendanceViewProps> = ({ forcedTeacherId, preselectedTeacherId }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(forcedTeacherId || preselectedTeacherId || '');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const authUser: AuthUser | null = useMemo(() => {
    const saved = localStorage.getItem('edupay_session');
    return saved ? JSON.parse(saved) : null;
  }, []);

  const isAdmin = authUser?.role === 'management';

  const loadData = async () => {
    const [t, c] = await Promise.all([dbService.getTeachers(), dbService.getClasses()]);
    setTeachers(t);
    setClasses(c);
  };

  const loadContext = async () => {
    if (!selectedTeacherId || !selectedClassId) return;
    const att = await dbService.getAttendance(selectedTeacherId, selectedClassId);
    setAttendance(att);
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { loadContext(); }, [selectedTeacherId, selectedClassId]);
  
  // Handle preselection updates
  useEffect(() => {
    if (preselectedTeacherId && !forcedTeacherId) {
      setSelectedTeacherId(preselectedTeacherId);
    }
  }, [preselectedTeacherId, forcedTeacherId]);

  useEffect(() => {
    if (!forcedTeacherId && !selectedTeacherId) {
      setSelectedClassId('');
      setAttendance([]);
    }
  }, [selectedTeacherId, forcedTeacherId]);

  const assignedClasses = useMemo(() => {
    if (!selectedTeacherId) return [];
    const teacher = teachers.find(t => t.id === selectedTeacherId);
    if (!teacher) return [];
    const assignedIds = new Set(teacher.assignments.map(a => a.classId));
    return classes.filter(c => assignedIds.has(c.id));
  }, [selectedTeacherId, teachers, classes]);

  const toggleDay = async (day: number) => {
    if (!selectedTeacherId || !selectedClassId) return;
    const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0];
    const existing = attendance.find(a => a.date === dateStr);

    if (existing) {
      if (existing.status === AttendanceStatus.PAID) return;
      
      // Admin Verification Workflow
      if (isAdmin && existing.status === AttendanceStatus.SUBMITTED) {
        if (confirm("Verify this submitted lecture?")) {
          await dbService.verifyAttendance(existing.id);
          loadContext();
        }
        return;
      }

      // Teacher Workflow: Cannot toggle if verified
      if (!isAdmin && existing.status !== AttendanceStatus.SUBMITTED) {
        alert("Verified records cannot be modified. Contact administration.");
        return;
      }
    }

    // Normal Toggle (Create Pending for Teacher, Create Verified for Admin)
    try {
      await dbService.toggleAttendance(selectedTeacherId, selectedClassId, dateStr, isAdmin);
      loadContext();
    } catch (err: any) { 
      alert(err.message); 
    }
  };

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl md:text-4xl font-extrabold theme-text uppercase tracking-tighter">ATTENDANCE</h2>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
           <p className="text-xs md:text-sm font-medium theme-text-muted">
            {forcedTeacherId ? 'Click a date to submit your lecture for approval.' : 'Review and verify staff submissions below.'}
          </p>
          <div className="flex gap-4">
             <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <span className="text-[9px] font-black theme-text-muted uppercase tracking-widest opacity-60">Submitted (Pending)</span>
             </div>
             <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full theme-bg-primary"></div>
                <span className="text-[9px] font-black theme-text-muted uppercase tracking-widest opacity-60">Verified</span>
             </div>
             <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-[9px] font-black theme-text-muted uppercase tracking-widest opacity-60">Paid</span>
             </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2 animate-slide-up stagger-1">
          <label className="text-[10px] font-extrabold theme-text-muted uppercase tracking-widest ml-1 flex items-center gap-2">
            <User className="w-3 h-3 opacity-40" /> {forcedTeacherId ? 'YOUR PROFILE' : 'TEACHER SELECTION'}
          </label>
          <div className="relative">
            <select 
              className="w-full px-6 py-4 theme-card rounded-2xl text-sm font-extrabold theme-text appearance-none outline-none focus:border-[var(--primary)] transition-all shadow-sm focus:ring-4 focus:ring-[var(--primary-light)] disabled:bg-[var(--bg-card)] disabled:text-[var(--text-muted)]"
              value={selectedTeacherId}
              disabled={!!forcedTeacherId}
              onChange={e => setSelectedTeacherId(e.target.value)}
            >
              <option value="">Choose Staff Profile</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {!forcedTeacherId && <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 theme-text-muted rotate-90 pointer-events-none" />}
          </div>
        </div>
        
        <div className="flex flex-col gap-2 animate-slide-up stagger-2">
          <label className="text-[10px] font-extrabold theme-text-muted uppercase tracking-widest ml-1 flex items-center gap-2">
            <Book className="w-3 h-3 opacity-40" /> ACADEMIC CLASS
          </label>
          <div className="relative">
            <select 
              className="w-full px-6 py-4 theme-card rounded-2xl text-sm font-extrabold theme-text appearance-none outline-none focus:border-[var(--primary)] transition-all shadow-sm focus:ring-4 focus:ring-[var(--primary-light)] disabled:opacity-40"
              value={selectedClassId}
              disabled={!selectedTeacherId}
              onChange={e => setSelectedClassId(e.target.value)}
            >
              <option value="">Choose Class Batch</option>
              {assignedClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 theme-text-muted rotate-90 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="theme-card rounded-[2.5rem] shadow-xl border overflow-hidden animate-slide-up stagger-3">
        <div className="p-6 md:p-10 flex items-center justify-between bg-[var(--bg-card)] border-b theme-border">
          <h3 className="text-xl font-extrabold theme-text uppercase tracking-tighter">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <div className="flex gap-3">
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} 
              className="p-3 theme-card rounded-xl hover:bg-[var(--bg-main)] transition-all active:scale-90 shadow-sm"
            >
              <ChevronLeft className="w-5 h-5 theme-text" />
            </button>
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} 
              className="p-3 theme-card rounded-xl hover:bg-[var(--bg-main)] transition-all active:scale-90 shadow-sm"
            >
              <ChevronRight className="w-5 h-5 theme-text" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-[var(--border)]">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
            <div key={d} className="py-4 text-center text-[10px] font-extrabold theme-text-muted uppercase tracking-widest bg-[var(--bg-card)]">{d}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-px bg-[var(--border)]">
          {Array.from({ length: firstDay }).map((_, i) => <div key={i} className="bg-[var(--bg-card)] opacity-40 h-24 md:h-36"></div>)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0];
            const record = attendance.find(a => a.date === dateStr);
            const isPaid = record?.status === AttendanceStatus.PAID;
            const isVerified = record?.status === AttendanceStatus.VERIFIED;
            const isSubmitted = record?.status === AttendanceStatus.SUBMITTED;
            const isFuture = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) > today;
            
            // Logic for visual state
            let boxClass = 'cursor-pointer hover:bg-[var(--primary-light)]/20';
            if (isFuture) boxClass = 'opacity-30 pointer-events-none cursor-default';
            if (isPaid) boxClass = 'cursor-default';
            // Teachers cannot modify verified records
            if (!isAdmin && isVerified) boxClass = 'cursor-default opacity-80';

            return (
              <div 
                key={day} 
                onClick={() => !isPaid && !isFuture && toggleDay(day)}
                className={`
                  bg-[var(--bg-card)] h-24 md:h-36 p-4 relative transition-all duration-300 flex flex-col items-center justify-center group overflow-hidden
                  ${boxClass}
                `}
              >
                <span className={`text-sm font-extrabold mb-1 transition-colors ${isPaid ? 'text-emerald-500' : isVerified ? 'theme-primary' : isSubmitted ? 'text-amber-500' : 'theme-text-muted opacity-40 group-hover:opacity-80'}`}>
                  {day < 10 ? `0${day}` : day}
                </span>
                
                {record && (
                  <div className={`
                    w-full h-12 md:h-16 rounded-2xl flex items-center justify-center border transition-all duration-300 shadow-sm animate-in zoom-in-50 duration-200
                    ${isPaid ? 'bg-emerald-500 border-emerald-600' : isVerified ? 'theme-bg-primary border-[var(--primary)]' : 'bg-amber-500 border-amber-600'}
                    group-active:scale-90
                  `}>
                    {isPaid ? <Lock className="w-4 h-4 md:w-5 md:h-5 text-white" /> : isVerified ? <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-white" /> : <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-white animate-pulse" />}
                  </div>
                )}
                
                {!record && !isFuture && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--border)] group-hover:theme-bg-primary transition-colors" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AttendanceView;
