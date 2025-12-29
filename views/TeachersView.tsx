
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, Layers, User, Phone, X, IndianRupee, Search, AlertCircle } from 'lucide-react';
import { Teacher, ClassType, TeacherAssignment } from '../types';
import { dbService } from '../firebase';

const TeachersView: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<Omit<Teacher, 'id'>>({ 
    name: '', phone: '', assignments: [] 
  });

  const loadData = async () => {
    const [t, c] = await Promise.all([dbService.getTeachers(), dbService.getClasses()]);
    setTeachers(t);
    setClasses(c);
  };

  useEffect(() => { loadData(); }, []);

  const handleAddAssignment = () => {
    setFormData({
      ...formData,
      assignments: [...formData.assignments, { classId: '', subject: '', rate: 5000, activeFrom: new Date().toISOString().split('T')[0] }]
    });
  };

  const handleRemoveAssignment = (index: number) => {
    const newAsg = [...formData.assignments];
    newAsg.splice(index, 1);
    setFormData({ ...formData, assignments: newAsg });
  };

  const handleAsgChange = (index: number, field: keyof TeacherAssignment, value: any) => {
    const newAsg = [...formData.assignments];
    newAsg[index] = { ...newAsg[index], [field]: value };
    setFormData({ ...formData, assignments: newAsg });
  };

  const handleSave = async () => {
    if (!formData.name) return;
    if (editingId) {
      await dbService.updateTeacherAssignments(editingId, formData.assignments);
    } else {
      await dbService.addTeacher(formData);
    }
    setFormData({ name: '', phone: '', assignments: [] });
    setShowAdd(false);
    setEditingId(null);
    loadData();
  };

  const startEdit = (t: Teacher) => {
    setFormData({ name: t.name, phone: t.phone, assignments: t.assignments });
    setEditingId(t.id);
    setShowAdd(true);
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6 animate-slide-up pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold theme-text uppercase tracking-tighter leading-none">Human Resources</h2>
          <p className="text-xs md:text-sm font-bold theme-text-muted mt-2 uppercase tracking-wide">Configure staffing profiles and contractual unit rates</p>
        </div>
        <button 
          onClick={() => { setShowAdd(true); setEditingId(null); setFormData({ name: '', phone: '', assignments: [] }); }}
          className="theme-bg-primary text-white px-6 py-4 rounded-xl flex items-center gap-2 transition-all shadow-lg hover:brightness-110 active:scale-95"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span className="font-extrabold text-[11px] uppercase tracking-widest">ONBOARD STAFF</span>
        </button>
      </div>

      <div className="relative max-w-md">
        <input 
          type="text"
          placeholder="Search Roster..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-6 py-4 theme-card rounded-xl text-sm font-bold theme-text outline-none transition-all"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 theme-text-muted" />
      </div>

      <div className="theme-card rounded-2xl overflow-hidden shadow-sm">
        <div className="hidden lg:grid grid-cols-[1.2fr_2fr_0.4fr] gap-6 px-10 py-5 bg-[var(--bg-main)] border-b border-[var(--border)] label-header">
          <div>PERSONNEL</div>
          <div>ALLOCATED RATES</div>
          <div className="text-right">OPERATIONS</div>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {filteredTeachers.length === 0 ? (
            <div className="py-24 text-center">
              <User className="w-12 h-12 theme-text-muted mx-auto mb-4 opacity-20" />
              <p className="theme-text-muted font-extrabold text-xs uppercase tracking-widest">No personnel records found</p>
            </div>
          ) : (
            filteredTeachers.map((t, idx) => (
              <div 
                key={t.id} 
                className="group grid grid-cols-1 lg:grid-cols-[1.2fr_2fr_0.4fr] gap-6 px-6 lg:px-10 py-5 items-center transition-colors hover:bg-[var(--primary-light)]/20"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 theme-card rounded-lg flex items-center justify-center theme-text-muted">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold theme-text uppercase text-sm tracking-tight leading-none mb-1">{t.name}</div>
                    <div className="text-[10px] font-bold theme-text-muted flex items-center gap-1.5">
                      <Phone className="w-3 h-3" />
                      {t.phone}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {t.assignments.length === 0 ? (
                    <span className="text-[10px] font-bold theme-text-muted uppercase italic opacity-40">Unassigned</span>
                  ) : (
                    t.assignments.map((asg, i) => (
                      <div key={i} className="px-3 py-1.5 theme-card rounded-lg text-[10px] font-extrabold shadow-sm flex items-center gap-2">
                        <span className="theme-text-muted">{classes.find(c => c.id === asg.classId)?.name || 'Unit'}</span>
                        <span className="theme-primary font-black">₹{asg.rate}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => startEdit(t)} 
                    className="p-2.5 theme-text-muted hover:theme-primary hover:bg-[var(--bg-main)] rounded-lg transition-all"
                    title="REVISE PROFILE"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4">
          <div className="theme-card w-full max-w-3xl rounded-2xl shadow-2xl p-8 md:p-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl md:text-2xl font-extrabold theme-text uppercase tracking-tighter flex items-center gap-3">
                 <User className="w-7 h-7 theme-primary" />
                 {editingId ? 'REVISE PROFILE' : 'INITIATE ONBOARDING'}
              </h3>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-[var(--bg-main)] rounded-lg theme-text-muted">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="flex flex-col gap-2">
                <label className="label-header">PRIMARY IDENTIFICATION</label>
                <input 
                  value={formData.name}
                  disabled={!!editingId}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-4 rounded-xl font-bold disabled:opacity-50 theme-card" 
                  placeholder="Official Name"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="label-header">TELEMETRY ACCESS (PHONE)</label>
                <input 
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-4 rounded-xl font-bold theme-card"
                  placeholder="+91..."
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <h4 className="label-header flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  ACADEMIC PORTFOLIO
                </h4>
                <button onClick={handleAddAssignment} className="text-[10px] font-extrabold theme-primary bg-[var(--primary-light)] px-4 py-2 rounded-lg border border-[var(--border)] hover:brightness-95 transition-colors">
                  + APPEND UNIT
                </button>
              </div>

              {classes.length === 0 && (
                <div className="flex items-center gap-3 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                    No classes found. Please create a class in the "CLASSES" tab first.
                  </p>
                </div>
              )}

              <div className="grid gap-4">
                {formData.assignments.map((asg, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[var(--bg-main)] p-6 rounded-xl border border-[var(--border)]">
                    <div className="flex flex-col gap-1.5">
                      <label className="label-header opacity-75">CLASS</label>
                      <select 
                        value={asg.classId}
                        onChange={e => handleAsgChange(idx, 'classId', e.target.value)}
                        className="w-full p-3 text-xs font-bold rounded-lg theme-card"
                      >
                        <option value="">Select Target</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="label-header opacity-75">SUBJECT</label>
                      <input 
                        value={asg.subject}
                        onChange={e => handleAsgChange(idx, 'subject', e.target.value)}
                        className="w-full p-3 text-xs font-bold rounded-lg theme-card"
                        placeholder="e.g. Physics"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="label-header opacity-75">RATE</label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={asg.rate}
                          onChange={e => handleAsgChange(idx, 'rate', Number(e.target.value))}
                          className="w-full p-3 pl-8 text-xs font-bold rounded-lg theme-card"
                        />
                        <IndianRupee className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 theme-text-muted opacity-50" />
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button onClick={() => handleRemoveAssignment(idx)} className="text-rose-500 hover:bg-rose-500/10 p-3 rounded-lg transition-all w-full flex justify-center border border-transparent hover:border-rose-500/20">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 flex gap-4">
              <button onClick={handleSave} className="flex-1 theme-bg-primary text-white py-5 rounded-xl font-extrabold uppercase tracking-widest text-xs hover:brightness-110 transition-all">
                PERSIST PROFILE
              </button>
              <button onClick={() => setShowAdd(false)} className="px-10 bg-[var(--bg-main)] theme-text-muted py-5 rounded-xl font-bold uppercase tracking-widest text-xs hover:brightness-95">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersView;
