
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Layers, User, Phone, X, IndianRupee, Search, AlertCircle, TrendingDown, Clock, Eye, Calendar, Wallet, CheckCircle2 } from 'lucide-react';
import { Teacher, ClassType, TeacherAssignment, Advance, Attendance, AttendanceStatus } from '../types';
import { dbService } from '../firebase';

interface TeachersViewProps {
  onNavigate?: (tabId: string, params?: any) => void;
}

const TeachersView: React.FC<TeachersViewProps> = ({ onNavigate }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  
  // Modal States
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
    const metrics: Record<string, { advanceBalance: number, pendingUnits: number }> = {};
    teachers.forEach(t => {
      const balance = advances.filter(a => a.teacherId === t.id).reduce((sum, a) => sum + a.remainingAmount, 0);
      const pendingUnits = attendance.filter(a => a.teacherId === t.id && a.status === AttendanceStatus.VERIFIED).length;
      metrics[t.id] = { advanceBalance: balance, pendingUnits };
    });
    return metrics;
  }, [teachers, advances, attendance]);

  const handleAddAssignment = () => { setFormData({ ...formData, assignments: [...formData.assignments, { classId: '', subject: '', rate: 5000, activeFrom: new Date().toISOString().split('T')[0] }] }); };
  const handleRemoveAssignment = (index: number) => { const newAsg = [...formData.assignments]; newAsg.splice(index, 1); setFormData({ ...formData, assignments: newAsg }); };
  const handleAsgChange = (index: number, field: keyof TeacherAssignment, value: any) => { const newAsg = [...formData.assignments]; newAsg[index] = { ...newAsg[index], [field]: value }; setFormData({ ...formData, assignments: newAsg }); };

  const handleSave = async () => {
    if (!formData.name) return;
    if (editingId) { await dbService.updateTeacherAssignments(editingId, formData.assignments); } 
    else { await dbService.addTeacher(formData); }
    setFormData({ name: '', phone: '', assignments: [] }); setShowAdd(false); setEditingId(null); loadData();
  };

  const startEdit = (t: Teacher) => { setFormData({ name: t.name, phone: t.phone, assignments: t.assignments }); setEditingId(t.id); setShowAdd(true); };
  
  const openProfile = (id: string) => {
    setViewingId(id);
    setProfileTab('lectures');
    setShowProfile(true);
  };

  const handleGoToAttendance = (teacherId: string) => {
    if (onNavigate) {
      onNavigate('attendance', { teacherId });
    }
  };

  const filteredTeachers = teachers.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.phone.includes(searchQuery));

  // Profile Data Helpers
  const viewingTeacher = useMemo(() => teachers.find(t => t.id === viewingId), [teachers, viewingId]);
  const teacherAttendance = useMemo(() => 
    attendance.filter(a => a.teacherId === viewingId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
  [attendance, viewingId]);
  const teacherAdvances = useMemo(() => 
    advances.filter(a => a.teacherId === viewingId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
  [advances, viewingId]);

  return (
    <div className="space-y-6 animate-slide-up pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold theme-text uppercase tracking-tighter leading-none">Human Resources</h2>
          <p className="text-xs md:text-sm font-bold theme-text-muted mt-2 uppercase tracking-wide">Manage faculty profiles and contractual unit rates</p>
        </div>
        <button onClick={() => { setShowAdd(true); setEditingId(null); setFormData({ name: '', phone: '', assignments: [] }); }} className="theme-bg-primary text-white px-6 py-4 rounded-xl flex items-center gap-2 shadow-lg hover:brightness-110 active:scale-95">
          <Plus className="w-5 h-5 stroke-[3]" /> <span className="font-extrabold text-[11px] uppercase tracking-widest">ONBOARD STAFF</span>
        </button>
      </div>

      <div className="relative max-w-md">
        <input type="text" placeholder="Search Roster..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-6 py-4 theme-card rounded-xl text-sm font-bold theme-text outline-none shadow-sm" />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 theme-text-muted" />
      </div>

      <div className="theme-card rounded-[2rem] overflow-hidden shadow-sm border theme-border">
        <div className="hidden lg:grid grid-cols-[1.2fr_2fr_1fr_0.4fr] gap-6 px-10 py-5 bg-[var(--bg-card)] border-b label-header">
          <div>PERSONNEL</div> <div>ALLOCATED RATES</div> <div>FINANCIAL STATUS</div> <div className="text-right">MGMT</div>
        </div>
        <div className="divide-y theme-border">
          {filteredTeachers.map((t) => (
            <div key={t.id} className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr_1fr_0.4fr] gap-6 px-6 lg:px-10 py-6 items-center transition-colors hover:bg-[var(--primary-light)]/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 theme-card rounded-xl flex items-center justify-center theme-text-muted bg-[var(--bg-main)]"> <User className="w-6 h-6" /> </div>
                <div>
                  <div className="font-extrabold theme-text uppercase text-sm tracking-tight leading-none mb-1">{t.name}</div>
                  <div className="text-[10px] font-bold theme-text-muted flex items-center gap-1.5"> <Phone className="w-3 h-3" /> {t.phone} </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {t.assignments.map((asg, i) => (
                  <div key={i} className="px-3 py-1.5 bg-white border theme-border rounded-lg text-[10px] font-extrabold shadow-sm flex items-center gap-2">
                    <span className="theme-text-muted">{classes.find(c => c.id === asg.classId)?.name}</span> <div className="w-px h-3 bg-slate-200"></div> <span className="theme-primary">₹{asg.rate.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-6">
                 <div className="flex flex-col">
                    <div className="text-[9px] font-black theme-text-muted uppercase tracking-widest mb-1 flex items-center gap-1"> <TrendingDown className="w-3 h-3 text-rose-500" /> ADVANCE </div>
                    <div className={`text-sm font-black ${staffMetrics[t.id]?.advanceBalance > 0 ? 'text-rose-500' : 'theme-text-muted opacity-40'}`}> ₹{staffMetrics[t.id]?.advanceBalance.toLocaleString()} </div>
                 </div>
                 <div className="flex flex-col">
                    <div className="text-[9px] font-black theme-text-muted uppercase tracking-widest mb-1 flex items-center gap-1"> <Clock className="w-3 h-3 theme-primary" /> PENDING </div>
                    <div className="text-sm font-black theme-text"> {staffMetrics[t.id]?.pendingUnits} Units </div>
                 </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => handleGoToAttendance(t.id)} className="p-3 theme-text-muted hover:theme-primary hover:bg-white rounded-xl transition-all border border-transparent shadow-sm" title="Mark Attendance"> <Calendar className="w-5 h-5" /> </button>
                <button onClick={() => openProfile(t.id)} className="p-3 theme-text-muted hover:theme-primary hover:bg-white rounded-xl transition-all border border-transparent shadow-sm" title="View History"> <Eye className="w-5 h-5" /> </button>
                <button onClick={() => startEdit(t)} className="p-3 theme-text-muted hover:theme-primary hover:bg-white rounded-xl transition-all border border-transparent shadow-sm" title="Edit Profile"> <Edit2 className="w-5 h-5" /> </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit/Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="theme-card w-full max-w-3xl rounded-[2rem] shadow-2xl p-8 md:p-12 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl md:text-2xl font-extrabold theme-text uppercase tracking-tighter flex items-center gap-3"> <User className="w-7 h-7 theme-primary" /> {editingId ? 'REVISE PROFILE' : 'INITIATE ONBOARDING'} </h3>
              <button onClick={() => setShowAdd(false)} className="p-3 hover:bg-[var(--bg-main)] rounded-xl theme-text-muted transition-colors"> <X className="w-7 h-7" /> </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <input value={formData.name} disabled={!!editingId} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-5 py-4 rounded-xl font-bold theme-card text-sm" placeholder="Full Name" />
              <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-5 py-4 rounded-xl font-bold theme-card text-sm" placeholder="+91..." />
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <h4 className="label-header flex items-center gap-2"> <Layers className="w-4 h-4" /> PORTFOLIO </h4>
                <button onClick={handleAddAssignment} className="text-[10px] font-black theme-primary bg-[var(--primary-light)] px-5 py-2.5 rounded-xl border border-[var(--primary)] hover:brightness-105">+ ADD TRACK</button>
              </div>
              <div className="grid gap-4">
                {formData.assignments.map((asg, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-[var(--bg-main)] p-6 rounded-2xl border theme-border shadow-sm">
                    <select value={asg.classId} onChange={e => handleAsgChange(idx, 'classId', e.target.value)} className="p-4 text-xs font-black rounded-xl theme-card shadow-sm">
                      <option value="">Select Class</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input value={asg.subject} onChange={e => handleAsgChange(idx, 'subject', e.target.value)} className="p-4 text-xs font-black rounded-xl theme-card shadow-sm" placeholder="Subject" />
                    <input type="number" value={asg.rate} onChange={e => handleAsgChange(idx, 'rate', Number(e.target.value))} className="p-4 text-xs font-black rounded-xl theme-card shadow-sm" />
                    <button onClick={() => handleRemoveAssignment(idx)} className="text-rose-500 hover:bg-rose-50 rounded-xl p-4 transition-all"> <X className="w-6 h-6" /> </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-12 flex gap-4">
              <button onClick={handleSave} className="flex-1 theme-bg-primary text-white py-5 rounded-2xl font-black uppercase text-xs hover:brightness-110 shadow-xl"> PERSIST PROFILE </button>
              <button onClick={() => setShowAdd(false)} className="px-10 bg-slate-100 theme-text-muted py-5 rounded-2xl font-bold uppercase text-xs hover:bg-slate-200"> Cancel </button>
            </div>
          </div>
        </div>
      )}

      {/* View Profile Modal */}
      {showProfile && viewingTeacher && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="theme-card w-full max-w-2xl rounded-[2.5rem] shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-300">
            {/* Header */}
            <div className="p-8 pb-0 shrink-0">
               <div className="flex justify-between items-start mb-6">
                 <div className="flex items-center gap-5">
                   <div className="w-16 h-16 theme-bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl">
                      <User className="w-8 h-8" />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black theme-text uppercase tracking-tighter leading-none">{viewingTeacher.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-bold theme-text-muted bg-[var(--bg-main)] px-3 py-1 rounded-lg border theme-border uppercase tracking-widest flex items-center gap-1.5">
                           <Phone className="w-3 h-3" /> {viewingTeacher.phone}
                        </span>
                        <button onClick={() => handleGoToAttendance(viewingTeacher.id)} className="text-[10px] font-bold theme-primary bg-[var(--bg-main)] px-3 py-1 rounded-lg border theme-border uppercase tracking-widest flex items-center gap-1.5 hover:bg-[var(--primary-light)]">
                           <Calendar className="w-3 h-3" /> Mark Attendance
                        </button>
                      </div>
                   </div>
                 </div>
                 <button onClick={() => setShowProfile(false)} className="p-3 hover:bg-[var(--bg-main)] rounded-xl theme-text-muted transition-colors"> <X className="w-6 h-6" /> </button>
               </div>
               
               {/* Tabs */}
               <div className="flex p-1 bg-[var(--bg-main)] rounded-2xl border theme-border">
                  <button 
                    onClick={() => setProfileTab('lectures')}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${profileTab === 'lectures' ? 'bg-[var(--bg-card)] shadow-sm theme-text' : 'theme-text-muted opacity-50 hover:opacity-100'}`}
                  >
                    <Calendar className="w-4 h-4" /> Lecture Log
                  </button>
                  <button 
                    onClick={() => setProfileTab('advances')}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${profileTab === 'advances' ? 'bg-[var(--bg-card)] shadow-sm theme-text' : 'theme-text-muted opacity-50 hover:opacity-100'}`}
                  >
                    <Wallet className="w-4 h-4" /> Advance History
                  </button>
               </div>
            </div>

            {/* Content */}
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
              {profileTab === 'lectures' ? (
                <div className="space-y-3">
                  {teacherAttendance.length === 0 ? (
                    <div className="py-12 text-center theme-text-muted opacity-40 font-bold uppercase text-[10px] tracking-widest border-2 border-dashed theme-border rounded-2xl">No lectures recorded</div>
                  ) : (
                    teacherAttendance.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-4 bg-[var(--bg-main)] rounded-2xl border theme-border">
                         <div className="flex items-center gap-4">
                            <div className="text-center w-12">
                               <div className="text-[10px] font-black theme-text-muted uppercase tracking-wider">{new Date(a.date).toLocaleDateString(undefined, { month: 'short' })}</div>
                               <div className="text-xl font-black theme-text leading-none">{new Date(a.date).getDate()}</div>
                            </div>
                            <div>
                               <div className="text-xs font-black theme-text uppercase">{classes.find(c => c.id === a.classId)?.name || 'Unknown Class'}</div>
                               <div className="text-[9px] font-bold theme-text-muted uppercase tracking-widest mt-0.5 opacity-60">Marked: {a.markedAt ? new Date(a.markedAt).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit'}) : 'Manual'}</div>
                            </div>
                         </div>
                         <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${a.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : a.status === 'verified' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                            {a.status}
                         </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                   <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg mb-6">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Advance Balance</div>
                      <div className="text-3xl font-black tracking-tight">₹{staffMetrics[viewingTeacher.id]?.advanceBalance.toLocaleString()}</div>
                   </div>
                   <div className="space-y-3">
                      {teacherAdvances.length === 0 ? (
                        <div className="py-12 text-center theme-text-muted opacity-40 font-bold uppercase text-[10px] tracking-widest border-2 border-dashed theme-border rounded-2xl">No advance history</div>
                      ) : (
                        teacherAdvances.map(adv => (
                          <div key={adv.id} className="p-5 bg-[var(--bg-main)] rounded-2xl border theme-border flex justify-between items-start">
                             <div>
                                <div className="text-sm font-black theme-text uppercase tracking-tight">₹{adv.amount.toLocaleString()}</div>
                                <div className="text-[10px] font-bold theme-text-muted uppercase tracking-widest mt-1">{new Date(adv.date).toLocaleDateString()}</div>
                                {adv.notes && <div className="mt-2 text-[10px] font-medium theme-text-muted italic bg-[var(--bg-card)] px-2 py-1 rounded-md inline-block">"{adv.notes}"</div>}
                             </div>
                             <div className="text-right">
                                <div className={`text-[10px] font-black uppercase tracking-widest ${adv.remainingAmount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                   {adv.remainingAmount > 0 ? `Due: ₹${adv.remainingAmount}` : 'Fully Recovered'}
                                </div>
                             </div>
                          </div>
                        ))
                      )}
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersView;
