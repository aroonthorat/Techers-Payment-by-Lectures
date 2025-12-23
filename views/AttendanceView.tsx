
import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Lock, Calendar as CalIcon, User, Book } from 'lucide-react';
import { Teacher, ClassType, Attendance, AttendanceStatus } from '../types';
import { dbService } from '../firebase';

const AttendanceView: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  useEffect(() => {
    setSelectedClassId('');
    setAttendance([]);
  }, [selectedTeacherId]);

  const assignedClasses = useMemo(() => {
    if (!selectedTeacherId) return [];
    const teacher = teachers.find(t => t.id === selectedTeacherId);
    if (!teacher) return [];
    const assignedIds = new Set(teacher.assignments.map(a => a.classId));
    return classes.filter(c => assignedIds.has(c.id));
  }, [selectedTeacherId, teachers, classes]);

  const toggleDay = async (day: number) => {
    if (!selectedTeacherId || !selectedClassId) return;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0];
    try {
      await dbService.toggleAttendance(selectedTeacherId, selectedClassId, date);
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
        <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 uppercase tracking-tighter">ATTENDANCE</h2>
        <p className="text-xs md:text-sm font-medium text-slate-500">Manage lecture completion logs with secure verification</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2 animate-slide-up stagger-1">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <User className="w-3 h-3 opacity-40" /> TEACHER SELECTION
          </label>
          <div className="relative">
            <select 
              className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-extrabold text-slate-900 appearance-none outline-none focus:border-indigo-600 transition-all shadow-sm focus:ring-4 focus:ring-indigo-50"
              value={selectedTeacherId}
              onChange={e => setSelectedTeacherId(e.target.value)}
            >
              <option value="">Choose Staff Profile</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 rotate-90 pointer-events-none" />
          </div>
        </div>
        
        <div className="flex flex-col gap-2 animate-slide-up stagger-2">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <Book className="w-3 h-3 opacity-40" /> ACADEMIC CLASS
          </label>
          <div className="relative">
            <select 
              className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-extrabold text-slate-900 appearance-none outline-none focus:border-indigo-600 transition-all shadow-sm focus:ring-4 focus:ring-indigo-50 disabled:opacity-40"
              value={selectedClassId}
              disabled={!selectedTeacherId}
              onChange={e => setSelectedClassId(e.target.value)}
            >
              <option value="">Choose Class Batch</option>
              {assignedClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 rotate-90 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden animate-slide-up stagger-3">
        <div className="p-6 md:p-10 flex items-center justify-between bg-white border-b border-slate-50">
          <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-tighter">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <div className="flex gap-3">
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} 
              className="p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all active:scale-90 shadow-sm"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} 
              className="p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all active:scale-90 shadow-sm"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-slate-50">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
            <div key={d} className="py-4 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50/50">{d}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-px bg-slate-50">
          {Array.from({ length: firstDay }).map((_, i) => <div key={i} className="bg-slate-50/20 h-24 md:h-36"></div>)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0];
            const record = attendance.find(a => a.date === dateStr);
            const isPaid = record?.status === AttendanceStatus.PAID;
            const isPending = record?.status === AttendanceStatus.PENDING;
            const isFuture = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) > today;
            
            return (
              <div 
                key={day} 
                onClick={() => !isPaid && !isFuture && toggleDay(day)}
                className={`
                  bg-white h-24 md:h-36 p-4 relative transition-all duration-300 flex flex-col items-center justify-center group overflow-hidden
                  ${isPaid || isFuture ? 'cursor-default' : 'cursor-pointer hover:bg-indigo-50/30'} 
                  ${isFuture ? 'opacity-30 pointer-events-none' : ''}
                `}
              >
                <span className={`text-sm font-extrabold mb-1 transition-colors ${isPaid ? 'text-emerald-600' : isPending ? 'text-indigo-600' : 'text-slate-300 group-hover:text-slate-400'}`}>
                  {day < 10 ? `0${day}` : day}
                </span>
                
                {record && (
                  <div className={`
                    w-full h-12 md:h-16 rounded-2xl flex items-center justify-center border transition-all duration-300 shadow-sm animate-in zoom-in-50 duration-200
                    ${isPaid ? 'bg-emerald-500 border-emerald-600' : 'bg-indigo-500 border-indigo-600'}
                    group-active:scale-90
                  `}>
                    <Lock className={`w-4 h-4 md:w-5 md:h-5 text-white`} />
                  </div>
                )}
                
                {!record && !isFuture && (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-100 group-hover:bg-indigo-400 transition-colors" />
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
