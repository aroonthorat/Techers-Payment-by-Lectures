
import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Plus, 
  Calendar, 
  BookOpen, 
  UserPlus, 
  Settings, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Trash2
} from 'lucide-react';
// Added ExamStatus to the types import list
import { Exam, ClassType, MediumType, ExamType, Subject, ExamPaper, Teacher, TeacherExamAssignment, ExamStatus } from '../types';
import { dbService } from '../firebase';

const ExamManagementView: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);

  const [formData, setFormData] = useState<Omit<Exam, 'id' | 'createdAt' | 'updatedAt'>>({
    examName: '',
    examType: 'Unit Test',
    academicYear: '2025-26',
    startDate: '',
    endDate: '',
    class: '',
    division: 'A',
    medium: 'English',
    status: 'Draft'
  });

  const loadData = async () => {
    const [e, c, t] = await Promise.all([
      dbService.getExams(),
      dbService.getClasses(),
      dbService.getTeachers()
    ]);
    setExams(e);
    setClasses(c);
    setTeachers(t);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    if (!formData.examName || !formData.class) return;
    await dbService.addExam({
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setShowAdd(false);
    loadData();
  };

  const handleInitializeMarks = async (examId: string) => {
    if (!confirm("This will generate empty marksheets for all students. Proceed?")) return;
    setIsInitializing(true);
    try {
      await dbService.initializeMarkEntries(examId);
      alert("Marksheets initialized successfully!");
    } catch (e) {
      console.error(e);
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="space-y-8 animate-slide-up pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <Award className="text-amber-500 w-8 h-8" />
            Exam Registry
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Global configuration for assessment cycles and cohorts.
          </p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95"
        >
          Create New Exam
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {exams.length === 0 ? (
          <div className="col-span-full py-20 bg-[#0a0e1a] border-2 border-dashed border-white/5 rounded-[3rem] text-center">
            <Award className="w-16 h-16 text-slate-700 mx-auto mb-4 opacity-20" />
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No active exams found in registry.</p>
          </div>
        ) : (
          exams.map(exam => (
            <div key={exam.id} className="bg-[#0a0e1a] border border-white/10 rounded-[2.5rem] p-8 space-y-6 hover:border-amber-500/30 transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${exam.status === 'Active' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-500'}`}>
                    <Award className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">{exam.examName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-black bg-white/5 text-slate-400 px-2 py-0.5 rounded-full uppercase">{exam.examType}</span>
                      <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">{exam.academicYear}</span>
                    </div>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${exam.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'}`}>
                  {exam.status}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-4 border-y border-white/5">
                <div className="text-center">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Batch</p>
                  <p className="text-xs font-black text-white uppercase">{classes.find(c => c.id === exam.class)?.name || 'UNKNOWN'}</p>
                </div>
                <div className="text-center border-x border-white/5 px-2">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Division</p>
                  <p className="text-xs font-black text-white">{exam.division}</p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Medium</p>
                  <p className="text-xs font-black text-amber-500 uppercase">{exam.medium}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleInitializeMarks(exam.id)}
                  disabled={isInitializing}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-white/5"
                >
                  {isInitializing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
                  Generate Marksheets
                </button>
                <button className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-4 rounded-xl transition-all">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Exam Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#050810] border border-white/10 w-full max-w-xl rounded-[3rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">New Assessment</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Configure academic cycle parameters.</p>
              </div>
              <button onClick={() => setShowAdd(false)} className="text-slate-500 hover:text-white"><X /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Exam Name</label>
                <input 
                  type="text" 
                  value={formData.examName}
                  onChange={e => setFormData({...formData, examName: e.target.value})}
                  className="w-full bg-[#0a0e1a] border border-white/10 rounded-2xl px-6 py-4 text-sm font-black text-white focus:outline-none focus:border-amber-500 transition-all"
                  placeholder="MIDTERM ASSESSMENT 2025"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Exam Category</label>
                <select 
                  value={formData.examType}
                  onChange={e => setFormData({...formData, examType: e.target.value as ExamType})}
                  className="w-full bg-[#0a0e1a] border border-white/10 rounded-2xl px-6 py-4 text-xs font-black text-white appearance-none outline-none focus:border-amber-500"
                >
                  <option value="Unit Test">Unit Test</option>
                  <option value="Midterm">Midterm</option>
                  <option value="Final">Final Exam</option>
                  <option value="PreBoard">Pre-Board</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Academic Batch</label>
                <select 
                  value={formData.class}
                  onChange={e => setFormData({...formData, class: e.target.value})}
                  className="w-full bg-[#0a0e1a] border border-white/10 rounded-2xl px-6 py-4 text-xs font-black text-white appearance-none outline-none focus:border-amber-500"
                >
                  <option value="">Select Class...</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Medium</label>
                <select 
                  value={formData.medium}
                  onChange={e => setFormData({...formData, medium: e.target.value as MediumType})}
                  className="w-full bg-[#0a0e1a] border border-white/10 rounded-2xl px-6 py-4 text-xs font-black text-white appearance-none outline-none focus:border-amber-500"
                >
                  <option value="English">English</option>
                  <option value="Urdu">Urdu</option>
                  <option value="Semi-English">Semi-English</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Status</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as ExamStatus})}
                  className="w-full bg-[#0a0e1a] border border-white/10 rounded-2xl px-6 py-4 text-xs font-black text-white appearance-none outline-none focus:border-amber-500"
                >
                  <option value="Draft">Draft Mode</option>
                  <option value="Active">Live (Ready for Marks)</option>
                  <option value="Completed">Completed (Locked)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Start Date</label>
                <input 
                  type="date" 
                  value={formData.startDate}
                  onChange={e => setFormData({...formData, startDate: e.target.value})}
                  className="w-full bg-[#0a0e1a] border border-white/10 rounded-2xl px-6 py-4 text-xs font-black text-white outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">End Date</label>
                <input 
                  type="date" 
                  value={formData.endDate}
                  onChange={e => setFormData({...formData, endDate: e.target.value})}
                  className="w-full bg-[#0a0e1a] border border-white/10 rounded-2xl px-6 py-4 text-xs font-black text-white outline-none"
                />
              </div>
            </div>

            <button 
              onClick={handleCreate}
              disabled={!formData.examName || !formData.class}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl transition-all active:scale-95 border border-white/10"
            >
              Finalize Exam Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamManagementView;
