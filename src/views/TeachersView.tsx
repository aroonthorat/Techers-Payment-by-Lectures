
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Layers, User, Phone, X, Search, TrendingDown, Clock, Eye, Calendar, Wallet } from 'lucide-react';
import { Teacher, ClassType, TeacherAssignment, Advance, Attendance, AttendanceStatus } from '../types';
import { dbService } from '../lib/netlify-client';

interface TeachersViewProps {
  onNavigate?: (tabId: string, params?: any) => void;
}

const TeachersView: React.FC<TeachersViewProps> = ({ onNavigate }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  
  const [showAdd, setShowAdd] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<Omit<Teacher, 'id'>>({ name: '', phone: '', assignments: [] });
  const [profileTab, setProfileTab] = useState<'lectures' | 'advances'>('lectures');

  const loadData = async () => {
    const [t, c, adv, att] = await Promise.all([dbService.getTeachers(), dbService.getClasses(), dbService.getAdvances(), dbService.getAttendance()]);
    setTeachers(t); setClasses(c); setAdvances(adv); setAttendance(att);
  };

  useEffect(() => { loadData(); }, []);

  const staffMetrics = useMemo(() => {
    const metrics: Record<string, { balance: number, pending: number }> = {};
    teachers.forEach(t => {
      metrics[t.id] = { 
        balance: advances.filter(a => a.teacherId === t.id).reduce((s, a) => s + a.remainingAmount, 0),
        pending: attendance.filter(a => a.teacherId === t.id && a.status === AttendanceStatus.VERIFIED).length
      };
    });
    return metrics;
  }, [teachers, advances, attendance]);

  const handleSave = async () => {
    if (!formData.name) return;
    if (editingId) await dbService.updateTeacherAssignments(editingId, formData.assignments);
    else await dbService.addTeacher(formData);
    setShowAdd(false); setEditingId(null); loadData();
  };

  const filtered = teachers.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6 animate-slide-up pb-10 pt-4">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">Faculty Roster</h2>
          <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Profiles & Pay Scales</p>
        </div>
        <button 
          onClick={() => { setShowAdd(true); setEditingId(null); }} 
          className="bg-amber-500 text-white p-4 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-slate-600" />
        </div>
        <input 
          type="text" 
          placeholder="Search roster..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className="w-full bg-[#0a0e1a]/50 border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-white outline-none focus:border-amber-500/50 transition-all placeholder:text-slate-700" 
        />
      </div>

      <div className="h-px bg-white/5 w-full"></div>

      <div className="theme-card rounded-[2rem] overflow-hidden shadow-2xl border theme-border bg-[#0a0e1a]">
        <div className="divide-y theme-border">
          {filtered.length === 0 ? (
            <div className="py-20 text-center text-slate-600 font-black uppercase text-[10px] tracking-widest">
              No faculty members found
            </div>
          ) : (
            filtered.map((t) => (
              <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 hover:bg-white/[0.02] transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-black text-white uppercase text-[13px] tracking-tight leading-none">{t.name}</div>
                    <div className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">{t.phone}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <div className="flex gap-6">
                     <div className="text-center">
                        <div className="text-[8px] font-black text-rose-500/60 uppercase tracking-widest mb-1">Advance</div>
                        <div className="text-xs font-black text-white">₹{staffMetrics[t.id]?.balance.toLocaleString()}</div>
                     </div>
                     <div className="text-center">
                        <div className="text-[8px] font-black text-amber-500/60 uppercase tracking-widest mb-1">Pending</div>
                        <div className="text-xs font-black text-white">{staffMetrics[t.id]?.pending} Lec</div>
                     </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { if(onNavigate) onNavigate('attendance', { teacherId: t.id }); }} className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 transition-all"> <Calendar className="w-4 h-4" /> </button>
                    <button onClick={() => { setViewingId(t.id); setShowProfile(true); }} className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 transition-all"> <Eye className="w-4 h-4" /> </button>
                    <button onClick={() => { setEditingId(t.id); setShowAdd(true); setFormData({ name: t.name, phone: t.phone, assignments: t.assignments }); }} className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 transition-all"> <Edit2 className="w-4 h-4" /> </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {showProfile && viewingId && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#050810] border border-white/10 w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 md:p-10 border-b border-white/5 flex justify-between items-start bg-[#0a0e1a]">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
                     <User className="w-8 h-8" />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{teachers.find(t => t.id === viewingId)?.name}</h3>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{teachers.find(t => t.id === viewingId)?.phone}</p>
                  </div>
               </div>
               <button onClick={() => setShowProfile(false)} className="p-3 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="p-8">
               <div className="flex gap-2 p-1.5 bg-[#0a0e1a] rounded-2xl border border-white/5 mb-8">
                  <button onClick={() => setProfileTab('lectures')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${profileTab === 'lectures' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}>Active Lectures</button>
                  <button onClick={() => setProfileTab('advances')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${profileTab === 'advances' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}>Financial Log</button>
               </div>

               <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-3 pr-2">
                  {profileTab === 'lectures' ? (
                     attendance.filter(a => a.teacherId === viewingId).length === 0 ? (
                        <div className="py-20 text-center text-slate-700 font-black uppercase text-[10px] tracking-widest border-2 border-dashed border-white/5 rounded-3xl">No records found</div>
                     ) : (
                        attendance.filter(a => a.teacherId === viewingId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(a => (
                           <div key={a.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className="bg-slate-800 p-3 rounded-xl text-slate-400"><Calendar className="w-4 h-4" /></div>
                                 <div>
                                    <div className="text-xs font-black text-white uppercase">{classes.find(c => c.id === a.classId)?.name}</div>
                                    <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{new Date(a.date).toLocaleDateString()}</div>
                                 </div>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${a.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{a.status}</div>
                           </div>
                        ))
                     )
                  ) : (
                     advances.filter(a => a.teacherId === viewingId).length === 0 ? (
                        <div className="py-20 text-center text-slate-700 font-black uppercase text-[10px] tracking-widest border-2 border-dashed border-white/5 rounded-3xl">No financial history</div>
                     ) : (
                        advances.filter(a => a.teacherId === viewingId).map(a => (
                           <div key={a.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className="bg-rose-500/10 p-3 rounded-xl text-rose-500"><TrendingDown className="w-4 h-4" /></div>
                                 <div>
                                    <div className="text-xs font-black text-white uppercase">₹{a.amount.toLocaleString()}</div>
                                    <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{new Date(a.date).toLocaleDateString()}</div>
                                 </div>
                              </div>
                              <div className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Bal: ₹{a.remainingAmount.toLocaleString()}</div>
                           </div>
                        ))
                     )
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#050810] border border-white/10 w-full max-w-xl rounded-[3rem] p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-start mb-10">
                <div>
                   <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{editingId ? 'Modify Faculty' : 'Enroll Faculty'}</h3>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Personal Identity & Assignments</p>
                </div>
                <button onClick={() => setShowAdd(false)} className="p-3 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all"><X className="w-6 h-6" /></button>
             </div>

             <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Identity</label>
                      <input 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                        className="w-full bg-[#0a0e1a] border border-white/10 rounded-2xl px-6 py-4 text-xs font-black text-white outline-none focus:border-amber-500 transition-all"
                        placeholder="e.g. TONY STARK"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Contact Link</label>
                      <input 
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})} 
                        className="w-full bg-[#0a0e1a] border border-white/10 rounded-2xl px-6 py-4 text-xs font-black text-white outline-none focus:border-amber-500 transition-all"
                        placeholder="000-000-0000"
                      />
                   </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                   <div className="flex justify-between items-center mb-6">
                      <h4 className="text-[11px] font-black text-white uppercase tracking-tighter">Academic Assignments</h4>
                      <button 
                        onClick={() => setFormData({...formData, assignments: [...formData.assignments, { classId: '', subject: '', rate: 1000, activeFrom: new Date().toISOString() }]})}
                        className="text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1 hover:text-amber-400 transition-all"
                      >
                         <Plus className="w-3 h-3" /> Add Track
                      </button>
                   </div>
                   
                   <div className="max-h-[250px] overflow-y-auto no-scrollbar space-y-3 pr-2">
                      {formData.assignments.map((asg, i) => (
                         <div key={i} className="p-5 bg-[#0a0e1a] rounded-[2rem] border border-white/10 relative group">
                            <button 
                              onClick={() => {
                                const newAsgs = [...formData.assignments];
                                newAsgs.splice(i, 1);
                                setFormData({...formData, assignments: newAsgs});
                              }}
                              className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                            >
                               <X className="w-3 h-3" />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                               <select 
                                 value={asg.classId}
                                 onChange={e => {
                                   const newAsgs = [...formData.assignments];
                                   newAsgs[i].classId = e.target.value;
                                   setFormData({...formData, assignments: newAsgs});
                                 }}
                                 className="w-full bg-[#050810] border border-white/5 rounded-xl px-4 py-3 text-[10px] font-black text-white outline-none focus:border-amber-500"
                               >
                                  <option value="">Choose Class</option>
                                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                               </select>
                               <input 
                                 placeholder="Subject Name"
                                 value={asg.subject}
                                 onChange={e => {
                                   const newAsgs = [...formData.assignments];
                                   newAsgs[i].subject = e.target.value;
                                   setFormData({...formData, assignments: newAsgs});
                                 }}
                                 className="w-full bg-[#050810] border border-white/5 rounded-xl px-4 py-3 text-[10px] font-black text-white outline-none focus:border-amber-500"
                               />
                               <div className="md:col-span-2 relative">
                                  <input 
                                    type="number"
                                    placeholder="Rate per Lecture"
                                    value={asg.rate}
                                    onChange={e => {
                                      const newAsgs = [...formData.assignments];
                                      newAsgs[i].rate = Number(e.target.value);
                                      setFormData({...formData, assignments: newAsgs});
                                    }}
                                    className="w-full bg-[#050810] border border-white/5 rounded-xl px-10 py-3 text-[10px] font-black text-emerald-400 outline-none focus:border-emerald-500"
                                  />
                                  <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                               </div>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>

                <button onClick={handleSave} className="w-full bg-amber-500 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-amber-500/20 active:scale-95 transition-all mt-4 border border-white/10">
                   {editingId ? 'Update Faculty Roster' : 'Finalize Enrollment'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersView;
