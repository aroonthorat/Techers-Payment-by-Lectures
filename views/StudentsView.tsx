
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  PlusCircle, 
  Search, 
  MoreVertical, 
  User, 
  X, 
  CheckCircle2, 
  GraduationCap, 
  Loader2,
  Filter,
  FileText,
  ClipboardList,
  AlertCircle,
  Upload,
  FileSpreadsheet,
  Check,
  ArrowRight
} from 'lucide-react';
import { Student, ClassType, MediumType } from '../types';
import { dbService } from '../firebase';

// Updated Badge component to have optional children to avoid "Property 'children' is missing" errors
const Badge = ({ children, variant = 'active' }: { children?: React.ReactNode, variant?: 'active' | 'inactive' | 'medium' }) => (
  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
    variant === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
    variant === 'medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
    'bg-slate-500/10 text-slate-500 border-slate-500/20'
  }`}>
    {children}
  </span>
);

const StudentsView: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mediumFilter, setMediumFilter] = useState<string>('All');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk Import State
  const [bulkInput, setBulkInput] = useState('');
  const [parsedStudents, setParsedStudents] = useState<Partial<Student>[]>([]);
  const [targetClassId, setTargetClassId] = useState('');

  const [newStudent, setNewStudent] = useState({
    name: '',
    classId: '',
    phone: '',
    medium: 'English' as MediumType,
    status: 'Active' as 'Active' | 'Inactive'
  });

  const loadData = async () => {
    const [s, c] = await Promise.all([dbService.getStudents(), dbService.getClasses()]);
    setStudents(s);
    setClasses(c);
  };

  useEffect(() => { loadData(); }, []);

  const generatedRollNo = useMemo(() => {
    const year = new Date().getFullYear();
    const count = (students.length + 1).toString().padStart(3, '0');
    return `U${year}${count}`;
  }, [students]);

  const handleManualSave = async () => {
    if (!newStudent.name || !newStudent.classId) return;
    setIsSaving(true);
    try {
      await dbService.addStudent({
        name: newStudent.name.toUpperCase(),
        seatNumber: generatedRollNo,
        medium: newStudent.medium,
        phone: newStudent.phone || '0000000000',
        enrollments: [{
          classId: newStudent.classId,
          totalFee: 30000,
          enrolledAt: new Date().toISOString().split('T')[0]
        }]
      });
      setShowAddDialog(false);
      setNewStudent({ name: '', classId: '', phone: '', medium: 'English', status: 'Active' });
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const processData = (text: string) => {
    // Split by lines, then by common Excel delimiters (Tabs for copy-paste, Comma for CSV)
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    const parsed: Partial<Student>[] = lines.map(line => {
      const parts = line.split(/[,\t]/).map(p => p.trim());
      
      // Heuristic parsing: Find Seat No (U...), Name (Longest string), Medium
      let seat = parts.find(p => /U\d+/i.test(p)) || '';
      let mediumRaw = parts.find(p => /ENGLISH|URDU|SEMI/i.test(p)) || 'English';
      let name = parts.find(p => p.length > 5 && !p.includes('@') && !/^\d+$/.test(p) && !/U\d+/i.test(p)) || parts[0];

      const medium: MediumType = mediumRaw.toUpperCase().includes('URDU') ? 'Urdu' : 
                                mediumRaw.toUpperCase().includes('SEMI') ? 'Semi-English' : 'English';

      return {
        seatNumber: seat.toUpperCase(),
        name: name.toUpperCase(),
        medium: medium
      };
    }).filter(s => s.name && s.name.length > 2);

    setParsedStudents(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      processData(text);
    };
    reader.readAsText(file);
  };

  const handleBulkSave = async () => {
    if (!targetClassId || parsedStudents.length === 0) return;
    setIsSaving(true);
    try {
      for (const s of parsedStudents) {
        await dbService.addStudent({
          name: s.name || 'UNKNOWN',
          seatNumber: s.seatNumber || `U${new Date().getFullYear()}000`,
          medium: s.medium || 'English',
          phone: '0000000000',
          enrollments: [{
            classId: targetClassId,
            totalFee: 30000,
            enrolledAt: new Date().toISOString().split('T')[0]
          }]
        });
      }
      setShowBulkDialog(false);
      setBulkInput('');
      setParsedStudents([]);
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.seatNumber.includes(searchQuery);
    const matchesMedium = mediumFilter === 'All' || s.medium === mediumFilter;
    return matchesSearch && matchesMedium;
  });

  return (
    <div className="space-y-6 animate-slide-up pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
            <GraduationCap className="text-emerald-500 w-6 h-6" />
            Student Directory
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Excel Import & Batch-wise Medium Classification.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={() => setShowBulkDialog(true)}
            className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg border border-white/5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel Import
          </button>
          <button 
            onClick={() => setShowAddDialog(true)}
            className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
          >
            <PlusCircle className="w-4 h-4" />
            Enroll One
          </button>
        </div>
      </div>

      <div className="bg-[#0a0e1a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 bg-white/5 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by name or seat no..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#050810] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-white focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select 
              value={mediumFilter}
              onChange={(e) => setMediumFilter(e.target.value)}
              className="bg-[#050810] border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest outline-none focus:border-emerald-500"
            >
              <option value="All">All Mediums</option>
              <option value="English">English</option>
              <option value="Semi-English">Semi-English</option>
              <option value="Urdu">Urdu</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-[0.15em]">
                <th className="px-6 py-4 w-12 text-center">Sr. No</th>
                <th className="px-6 py-4">Seat No.</th>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Batch</th>
                <th className="px-6 py-4">Medium</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-600 font-bold uppercase text-[10px] tracking-widest">
                    No matching records found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 text-[10px] font-black text-slate-600 text-center">{idx + 1}</td>
                    <td className="px-6 py-4 font-mono text-[11px] font-black text-white tracking-tight">
                      {s.seatNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                           <User className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <span className="text-[11px] font-black text-slate-200 uppercase tracking-tighter">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-400">
                      {classes.find(c => c.id === s.enrollments?.[0]?.classId)?.name || 'GEN-BATCH'}
                    </td>
                    <td className="px-6 py-4">
                      {/* Badge usage now correctly includes s.medium as a child */}
                      <Badge variant="medium">{s.medium}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-500 hover:text-emerald-400 transition-colors opacity-30 group-hover:opacity-100">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Excel / Batch Import Dialog */}
      {showBulkDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0a0e1a] border border-white/10 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/10 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                   <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Excel Batch Import</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Upload CSV or paste from spreadsheet for bulk enrollment.</p>
                </div>
              </div>
              <button onClick={() => {setShowBulkDialog(false); setParsedStudents([]);}} className="text-slate-500 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto no-scrollbar space-y-6">
              {!parsedStudents.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* File Upload Area */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 rounded-3xl p-10 flex flex-col items-center justify-center gap-4 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer group"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      accept=".csv,.txt" 
                      className="hidden" 
                    />
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-slate-400 group-hover:text-emerald-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-black text-white uppercase tracking-widest">Upload CSV File</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Exported from Excel / Sheets</p>
                    </div>
                  </div>

                  {/* Manual Paste Area */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-end mb-2">
                       <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Or Paste from Excel</label>
                       <span className="text-[8px] font-bold text-slate-600 uppercase">CMD+V to paste here</span>
                    </div>
                    <textarea 
                      value={bulkInput}
                      onChange={(e) => {setBulkInput(e.target.value); processData(e.target.value);}}
                      placeholder="Copy rows from Excel and paste here..."
                      className="w-full h-44 bg-[#050810] border border-white/10 rounded-2xl p-4 text-[10px] font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 transition-all resize-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Destination Batch</label>
                      <div className="relative">
                        <select 
                          value={targetClassId}
                          onChange={(e) => setTargetClassId(e.target.value)}
                          className="w-full bg-[#050810] border border-white/10 rounded-xl px-4 py-4 text-[10px] font-black text-white focus:outline-none focus:border-emerald-500 transition-all appearance-none"
                        >
                          <option value="">Select Target Class...</option>
                          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 rotate-90" />
                      </div>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500 font-black text-xl">
                        {parsedStudents.length}
                      </div>
                      <div>
                        <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Ready</div>
                        <div className="text-[10px] font-bold text-slate-300 uppercase">Records Parsed</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#050810] border border-white/5 rounded-2xl overflow-hidden">
                    <div className="max-h-64 overflow-y-auto no-scrollbar">
                      <table className="w-full text-left">
                        <thead className="sticky top-0 bg-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                          <tr>
                            <th className="px-6 py-3">Seat No</th>
                            <th className="px-6 py-3">Student Full Name</th>
                            <th className="px-6 py-3">Medium</th>
                            <th className="px-6 py-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {parsedStudents.map((p, i) => (
                            <tr key={i} className="text-[11px] font-bold">
                              <td className="px-6 py-3 font-mono text-slate-400">{p.seatNumber}</td>
                              <td className="px-6 py-3 text-white">{p.name}</td>
                              <td className="px-6 py-3">
                                {/* Badge usage correctly includes p.medium as a child */}
                                <Badge variant="medium">{p.medium}</Badge>
                              </td>
                              <td className="px-6 py-3 text-right">
                                <span className="flex items-center justify-end gap-1.5 text-emerald-500 text-[9px] font-black">
                                  <Check className="w-3 h-3" /> VERIFIED
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => {setParsedStudents([]); setBulkInput('');}}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
                    >
                      Reset & Back
                    </button>
                    <button 
                      onClick={handleBulkSave}
                      disabled={!targetClassId || isSaving}
                      className="flex-[2] bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-900/40"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      Start Batch Injection
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0a0e1a] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">New Enrollment</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Manual entry for individual student record.</p>
              </div>
              <button onClick={() => setShowAddDialog(false)} className="text-slate-500 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Student Name</label>
                <input 
                  type="text" 
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                  className="w-full bg-[#050810] border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition-all uppercase"
                  placeholder="e.g. SHAIKH ARMAAN SHAIKH JAVEED"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Academic Batch</label>
                  <select 
                    value={newStudent.classId}
                    onChange={(e) => setNewStudent({...newStudent, classId: e.target.value})}
                    className="w-full bg-[#050810] border border-white/10 rounded-xl px-4 py-3 text-[10px] font-black text-white focus:outline-none focus:border-emerald-500 transition-all appearance-none uppercase"
                  >
                    <option value="">Choose Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Medium</label>
                  <select 
                    value={newStudent.medium}
                    onChange={(e) => setNewStudent({...newStudent, medium: e.target.value as MediumType})}
                    className="w-full bg-[#050810] border border-white/10 rounded-xl px-4 py-3 text-[10px] font-black text-white focus:outline-none focus:border-emerald-500 transition-all appearance-none uppercase"
                  >
                    <option value="English">English</option>
                    <option value="Semi-English">Semi-English</option>
                    <option value="Urdu">Urdu</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 opacity-50">Auto-Generated Seat No.</label>
                <input 
                  type="text" 
                  value={generatedRollNo}
                  disabled
                  className="w-full bg-[#050810]/50 border border-white/5 rounded-xl px-4 py-3 text-xs font-mono font-black text-slate-600 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5 pt-4">
                 <button 
                  onClick={handleManualSave}
                  disabled={!newStudent.name || !newStudent.classId || isSaving}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 transition-all active:scale-95"
                 >
                   {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                   Finalize Enrollment
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
