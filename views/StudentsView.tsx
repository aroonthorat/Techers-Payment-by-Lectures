
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, User, Phone, X, IndianRupee, Search, GraduationCap, Calendar, Upload, FileText, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Student, ClassType, Enrollment, FeePayment } from '../types';
import { dbService } from '../firebase';

const StudentsView: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  
  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<Omit<Student, 'id'>>({ 
    name: '', phone: '', enrollments: [] 
  });

  // Bulk State
  const [bulkData, setBulkData] = useState<string>('');
  const [bulkPreview, setBulkPreview] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = async () => {
    const [s, c] = await Promise.all([dbService.getStudents(), dbService.getClasses()]);
    setStudents(s);
    setClasses(c);
  };

  useEffect(() => { loadData(); }, []);

  const handleAddEnrollment = () => {
    setFormData({
      ...formData,
      enrollments: [...formData.enrollments, { classId: '', totalFee: 30000, enrolledAt: new Date().toISOString().split('T')[0] }]
    });
  };

  const handleRemoveEnrollment = (index: number) => {
    const newEnr = [...formData.enrollments];
    newEnr.splice(index, 1);
    setFormData({ ...formData, enrollments: newEnr });
  };

  const handleEnrChange = (index: number, field: keyof Enrollment, value: any) => {
    const newEnr = [...formData.enrollments];
    newEnr[index] = { ...newEnr[index], [field]: value };
    setFormData({ ...formData, enrollments: newEnr });
  };

  const handleSave = async () => {
    if (!formData.name) return;
    if (editingId) {
      await dbService.updateStudent(editingId, { name: formData.name, phone: formData.phone, enrollments: formData.enrollments });
    } else {
      await dbService.addStudent(formData);
    }
    setFormData({ name: '', phone: '', enrollments: [] });
    setShowAdd(false);
    setEditingId(null);
    loadData();
  };

  const startEdit = (s: Student) => {
    setFormData({ name: s.name, phone: s.phone, enrollments: s.enrollments || [] });
    setEditingId(s.id);
    setShowAdd(true);
  };

  const parseBulkData = () => {
    const lines = bulkData.trim().split('\n');
    const preview: any[] = [];
    
    lines.forEach(line => {
      // Expected Format: Name, Phone, Class, Date, TotalFee, PaymentHistory(Amount:Date|Amount:Date)
      // Example: John Doe, 9999, JEE A, 2024-01-01, 50000, 10000:2024-01-01|5000:2024-02-01
      const cols = line.split(',').map(c => c.trim());
      if (cols.length < 5) return; // Basic validation

      const name = cols[0];
      const phone = cols[1];
      const className = cols[2];
      const date = cols[3];
      const totalFee = Number(cols[4]);
      const paymentString = cols[5] || '';

      // Find Class
      const matchedClass = classes.find(c => c.name.toLowerCase() === className.toLowerCase());
      
      // Parse Payments
      const payments: { amount: number, date: string }[] = [];
      if (paymentString) {
        paymentString.split('|').forEach(p => {
           const [amt, payDate] = p.split(':').map(x => x.trim());
           if (amt && !isNaN(Number(amt))) {
             payments.push({ amount: Number(amt), date: payDate || date }); // Default to join date if no date provided
           }
        });
      }

      preview.push({
        name,
        phone,
        className,
        classId: matchedClass?.id || null,
        date,
        totalFee,
        payments
      });
    });
    setBulkPreview(preview);
  };

  const executeBulkImport = async () => {
    setIsProcessing(true);
    const validItems = bulkPreview.filter(i => i.classId && i.name);
    
    const payload = validItems.map(item => ({
      student: {
        name: item.name,
        phone: item.phone,
        enrollments: [{
          classId: item.classId,
          totalFee: item.totalFee,
          enrolledAt: item.date
        }]
      },
      payments: item.payments.map((p: any) => ({
        amount: p.amount,
        date: p.date,
        notes: 'Bulk Import Entry'
      }))
    }));

    try {
      await dbService.bulkImportStudents(payload);
      setShowBulk(false);
      setBulkData('');
      setBulkPreview([]);
      loadData();
    } catch (err) {
      alert("Import failed. Check console.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6 animate-slide-up pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold theme-text uppercase tracking-tighter leading-none">Student Roster</h2>
          <p className="text-xs md:text-sm font-bold theme-text-muted mt-2 uppercase tracking-wide">Manage enrollments and individual student portfolios</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => { setShowBulk(true); setBulkData(''); setBulkPreview([]); }}
            className="theme-card text-theme-muted px-6 py-4 rounded-xl flex items-center gap-2 transition-all shadow-sm hover:bg-[var(--bg-card)] hover:theme-primary border theme-border"
          >
            <Upload className="w-5 h-5 stroke-[2.5]" />
            <span className="font-extrabold text-[11px] uppercase tracking-widest">BULK UPLOAD</span>
          </button>
          <button 
            onClick={() => { setShowAdd(true); setEditingId(null); setFormData({ name: '', phone: '', enrollments: [] }); }}
            className="theme-bg-primary text-white px-6 py-4 rounded-xl flex items-center gap-2 transition-all shadow-lg hover:brightness-110 active:scale-95"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span className="font-extrabold text-[11px] uppercase tracking-widest">ENROLL STUDENT</span>
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <input 
          type="text"
          placeholder="Search Students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-6 py-4 theme-card rounded-xl text-sm font-bold theme-text outline-none transition-all"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 theme-text-muted" />
      </div>

      <div className="theme-card rounded-2xl overflow-hidden shadow-sm">
        <div className="hidden lg:grid grid-cols-[1.5fr_2fr_0.4fr] gap-6 px-10 py-5 bg-[var(--bg-main)] border-b border-[var(--border)] label-header">
          <div>STUDENT PROFILE</div>
          <div>ENROLLED CLASSES</div>
          <div className="text-right">ACTIONS</div>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {filteredStudents.length === 0 ? (
            <div className="py-24 text-center">
              <GraduationCap className="w-12 h-12 theme-text-muted mx-auto mb-4 opacity-20" />
              <p className="theme-text-muted font-extrabold text-xs uppercase tracking-widest">No student records found</p>
            </div>
          ) : (
            filteredStudents.map((s) => (
              <div 
                key={s.id} 
                className="group grid grid-cols-1 lg:grid-cols-[1.5fr_2fr_0.4fr] gap-6 px-6 lg:px-10 py-6 items-center transition-colors hover:bg-[var(--primary-light)]/20"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 theme-card rounded-xl flex items-center justify-center theme-text-muted bg-[var(--bg-main)]">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-extrabold theme-text uppercase text-sm tracking-tight leading-none mb-1">{s.name}</div>
                    <div className="text-[10px] font-bold theme-text-muted flex items-center gap-1.5">
                      <Phone className="w-3 h-3" />
                      {s.phone}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!s.enrollments || s.enrollments.length === 0 ? (
                    <span className="text-[10px] font-bold theme-text-muted uppercase italic opacity-40">Not Enrolled</span>
                  ) : (
                    s.enrollments.map((enr, i) => (
                      <div key={i} className="px-3 py-1.5 bg-white border theme-border rounded-lg text-[10px] font-extrabold shadow-sm flex items-center gap-3">
                        <span className="theme-text-muted">{classes.find(c => c.id === enr.classId)?.name || 'Class'}</span>
                        <div className="w-px h-3 bg-slate-200"></div>
                        <span className="theme-primary">₹{enr.totalFee.toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => startEdit(s)} 
                    className="p-3 theme-text-muted hover:theme-primary hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 shadow-sm"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
      </div>

      {/* Manual Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4">
          <div className="theme-card w-full max-w-4xl rounded-3xl shadow-2xl p-8 md:p-12 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-xl md:text-2xl font-extrabold theme-text uppercase tracking-tighter flex items-center gap-3">
                   <GraduationCap className="w-8 h-8 theme-primary" />
                   {editingId ? 'REVISE STUDENT' : 'NEW ENROLLMENT'}
                </h3>
                <p className="text-[10px] font-bold theme-text-muted uppercase tracking-widest mt-1 opacity-60">Complete the student's academic profile</p>
              </div>
              <button onClick={() => setShowAdd(false)} className="p-3 hover:bg-[var(--bg-main)] rounded-xl theme-text-muted transition-colors">
                <X className="w-7 h-7" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="flex flex-col gap-2">
                <label className="label-header">STUDENT NAME</label>
                <input 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-5 py-4 rounded-xl font-bold theme-card text-sm" 
                  placeholder="Full Name"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="label-header">CONTACT TELEMETRY</label>
                <input 
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-5 py-4 rounded-xl font-bold theme-card text-sm"
                  placeholder="+91..."
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <h4 className="label-header flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  ACADEMIC SUBSCRIPTIONS
                </h4>
                <button onClick={handleAddEnrollment} className="text-[10px] font-black theme-primary bg-[var(--primary-light)] px-5 py-2.5 rounded-xl border border-[var(--primary)] hover:brightness-105 transition-all">
                  + ADD CLASS
                </button>
              </div>

              <div className="grid gap-4">
                {formData.enrollments.map((enr, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-[var(--bg-main)] p-6 rounded-2xl border theme-border shadow-sm">
                    <div className="flex flex-col gap-2">
                      <label className="label-header opacity-60">TARGET CLASS</label>
                      <select 
                        value={enr.classId}
                        onChange={e => handleEnrChange(idx, 'classId', e.target.value)}
                        className="w-full p-4 text-xs font-black rounded-xl theme-card"
                      >
                        <option value="">Select Batch</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="label-header opacity-60">TOTAL FEE PAYABLE</label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={enr.totalFee}
                          onChange={e => handleEnrChange(idx, 'totalFee', Number(e.target.value))}
                          className="w-full p-4 pl-10 text-xs font-black rounded-xl theme-card"
                        />
                        <IndianRupee className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 theme-text-muted opacity-40" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="label-header opacity-60">ENROLLMENT DATE</label>
                      <div className="relative">
                        <input 
                          type="date"
                          value={enr.enrolledAt}
                          onChange={e => handleEnrChange(idx, 'enrolledAt', e.target.value)}
                          className="w-full p-4 pl-10 text-xs font-black rounded-xl theme-card"
                        />
                        <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 theme-text-muted opacity-40" />
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button onClick={() => handleRemoveEnrollment(idx)} className="text-rose-500 hover:bg-rose-50 rounded-xl p-4 transition-all w-full flex justify-center border border-transparent hover:border-rose-200">
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 flex gap-4">
              <button onClick={handleSave} className="flex-1 theme-bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:brightness-110 shadow-xl transition-all">
                PERSIST STUDENT PROFILE
              </button>
              <button onClick={() => setShowAdd(false)} className="px-10 bg-slate-100 theme-text-muted py-5 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-200 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulk && (
        <div className="fixed inset-0 bg-slate-900/90 z-[150] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="theme-card w-full max-w-5xl rounded-3xl shadow-2xl h-[85vh] flex flex-col overflow-hidden">
            <div className="p-8 border-b theme-border flex justify-between items-center bg-[var(--bg-card)]">
               <div>
                  <h3 className="text-2xl font-black theme-text uppercase tracking-tighter flex items-center gap-3">
                     <Upload className="w-6 h-6 theme-primary" />
                     Bulk Onboarding
                  </h3>
                  <p className="text-[10px] font-bold theme-text-muted uppercase tracking-widest mt-1 opacity-60">Paste CSV data to enroll multiple students with payment history</p>
               </div>
               <button onClick={() => setShowBulk(false)} className="p-3 hover:bg-[var(--bg-main)] rounded-xl theme-text-muted transition-colors">
                  <X className="w-6 h-6" />
               </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
               <div className="flex-1 p-8 flex flex-col gap-4 border-r theme-border overflow-y-auto custom-scrollbar bg-[var(--bg-main)]">
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-amber-700 text-[10px] font-medium leading-relaxed">
                     <strong>Format Required:</strong><br/>
                     Name, Phone, Class Name, JoinDate(YYYY-MM-DD), TotalFee, History(Amount:Date|Amount:Date)<br/><br/>
                     
                     <strong>Example:</strong><br/>
                     <span className="font-mono bg-white/50 px-1 rounded">Rohan Das, 9998887776, JEE Batch A, 2024-01-15, 50000, 10000:2024-01-15|5000:2024-02-01</span>
                  </div>
                  
                  <textarea 
                    className="flex-1 w-full bg-[var(--bg-card)] border theme-border rounded-xl p-6 text-xs font-mono resize-none focus:outline-none focus:border-[var(--primary)]"
                    placeholder="Paste CSV data here..."
                    value={bulkData}
                    onChange={(e) => setBulkData(e.target.value)}
                  />
                  
                  <button 
                    onClick={parseBulkData}
                    disabled={!bulkData}
                    className="w-full theme-bg-primary text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:brightness-110 disabled:opacity-50"
                  >
                    Analyze Data
                  </button>
               </div>

               <div className="flex-1 p-8 flex flex-col bg-[var(--bg-card)]">
                  <div className="flex justify-between items-center mb-4">
                     <h4 className="label-header">PREVIEW STAGE</h4>
                     <span className="text-[10px] font-bold theme-text-muted">{bulkPreview.length} RECORDS FOUND</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                     {bulkPreview.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                           <FileText className="w-12 h-12 theme-text-muted mb-4" />
                           <p className="text-[10px] font-bold uppercase theme-text-muted">No data parsed yet</p>
                        </div>
                     ) : (
                        bulkPreview.map((item, idx) => (
                           <div key={idx} className={`p-4 rounded-xl border flex flex-col gap-2 ${!item.classId ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
                              <div className="flex justify-between items-start">
                                 <div>
                                    <div className="text-xs font-black uppercase theme-text">{item.name}</div>
                                    <div className="text-[10px] theme-text-muted">{item.phone}</div>
                                 </div>
                                 {!item.classId ? (
                                    <span className="flex items-center gap-1 text-[9px] font-bold text-rose-500 bg-rose-100 px-2 py-1 rounded">
                                       <AlertTriangle className="w-3 h-3" /> Class Not Found
                                    </span>
                                 ) : (
                                    <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                       <CheckCircle2 className="w-3 h-3" /> Valid
                                    </span>
                                 )}
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-1 text-[9px] font-medium theme-text-muted uppercase">
                                 <div>Class: {item.className}</div>
                                 <div>Fee: {item.totalFee}</div>
                                 <div className="col-span-2">
                                    Payments: {item.payments.length > 0 ? item.payments.map((p:any) => `${p.amount} (${p.date})`).join(', ') : 'None'}
                                 </div>
                              </div>
                           </div>
                        ))
                     )}
                  </div>
                  
                  <button 
                     onClick={executeBulkImport}
                     disabled={bulkPreview.length === 0 || isProcessing}
                     className="w-full mt-4 bg-emerald-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                     {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                     IMPORT {bulkPreview.filter(i => i.classId).length} RECORDS
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsView;
