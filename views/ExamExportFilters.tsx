
import React, { useState, useEffect } from 'react';
import { Filter, Award, BookOpen, Layers, Globe, Search, RefreshCw, Bookmark } from 'lucide-react';
import { Exam, ClassType, MediumType, ExamExportFilters as ExamExportFiltersType, Teacher, ExamPaper, ExamSubject } from '../types';
import { dbService } from '../firebase';

interface Props {
  exams: Exam[];
  classes: ClassType[];
  teachers: Teacher[];
  onApply: (filters: ExamExportFiltersType) => void;
  isLoading: boolean;
}

const ExamExportFilters: React.FC<Props> = ({ exams, classes, teachers, onApply, isLoading }) => {
  const [filters, setFilters] = useState<ExamExportFiltersType>({
    examId: '',
    classIds: [],
    divisions: [],
    mediums: [],
    subjectIds: [],
    paperIds: []
  });

  const [subjects, setSubjects] = useState<ExamSubject[]>([]);
  const [papers, setPapers] = useState<ExamPaper[]>([]);

  useEffect(() => {
    if (filters.examId) {
      dbService.getExamSubjects(filters.examId).then(setSubjects);
      dbService.getExamPapers(filters.examId).then(setPapers);
    } else {
      setSubjects([]);
      setPapers([]);
    }
  }, [filters.examId]);

  const toggleMulti = (key: keyof ExamExportFiltersType, val: any) => {
    setFilters(prev => {
      const current = (prev[key] as any[]) || [];
      const updated = current.includes(val)
        ? current.filter(item => item !== val)
        : [...current, val];
      return { ...prev, [key]: updated };
    });
  };

  const handleReset = () => setFilters({ examId: '', classIds: [], divisions: [], mediums: [], subjectIds: [], paperIds: [] });

  return (
    <div className="bg-[#0a0e1a] border border-white/5 rounded-[2rem] p-6 space-y-8 sticky top-8 shadow-2xl max-h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
          <Filter className="w-4 h-4 text-amber-500" />
          Filter Engine
        </h3>
        <button onClick={handleReset} className="text-[9px] font-bold text-slate-500 hover:text-white uppercase transition-colors">Reset</button>
      </div>

      {/* Primary Exam Picker */}
      <div className="space-y-2">
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Academic Cycle</label>
        <select
          value={filters.examId}
          onChange={e => setFilters({ ...filters, examId: e.target.value })}
          className="w-full bg-[#050810] border border-white/10 rounded-xl px-4 py-3.5 text-xs font-black text-white outline-none focus:border-amber-500 appearance-none uppercase"
        >
          <option value="">Select Exam...</option>
          {exams.map(e => (
            <option key={e.id} value={e.id}>{e.examName} ({e.academicYear})</option>
          ))}
        </select>
      </div>

      {/* Multi-select Mediums */}
      <div className="space-y-3">
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
          <Globe className="w-3 h-3" /> Mediums
        </label>
        <div className="flex flex-wrap gap-2">
          {['English', 'Semi-English', 'Urdu'].map(m => (
            <button
              key={m}
              onClick={() => toggleMulti('mediums', m)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border ${filters.mediums?.includes(m as MediumType)
                ? 'bg-amber-500 border-amber-400 text-white'
                : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'
                }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Multi-select Classes */}
      <div className="space-y-3">
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
          <BookOpen className="w-3 h-3" /> Targeted Batches
        </label>
        <div className="space-y-1.5">
          {classes.map(c => (
            <button
              key={c.id}
              onClick={() => toggleMulti('classIds', c.id)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all border ${filters.classIds?.includes(c.id)
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                : 'bg-white/5 border-white/5 text-slate-500'
                }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Divisions */}
      <div className="space-y-3">
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
          <Layers className="w-3 h-3" /> Divisions
        </label>
        <div className="grid grid-cols-4 gap-2">
          {['A', 'B', 'C', 'D'].map(d => (
            <button
              key={d}
              onClick={() => toggleMulti('divisions', d)}
              className={`py-2 rounded-lg text-[10px] font-black transition-all border ${filters.divisions?.includes(d)
                ? 'bg-blue-500 border-blue-400 text-white'
                : 'bg-white/5 border-white/5 text-slate-500'
                }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Teacher Selection */}
      <div className="space-y-2">
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Marking Personnel</label>
        <select
          value={filters.teacherId}
          onChange={e => setFilters({ ...filters, teacherId: e.target.value })}
          className="w-full bg-[#050810] border border-white/10 rounded-xl px-4 py-3.5 text-xs font-black text-white outline-none focus:border-amber-500 appearance-none uppercase"
        >
          <option value="">Any Teacher...</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <button
        onClick={() => onApply(filters)}
        disabled={isLoading || !filters.examId}
        className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-30 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/10"
      >
        {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        Analyze Registry
      </button>

      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
        <p className="text-[8px] font-bold text-slate-500 uppercase leading-relaxed text-center tracking-widest">
          Complex queries are computed client-side to ensure maximum precision across draft and active cycles.
        </p>
      </div>
    </div>
  );
};

export default ExamExportFilters;
