
import React from 'react';
import { Search, Filter, Award, BookOpen, ClipboardCheck } from 'lucide-react';
import { Exam, TeacherExamAssignment, ExamPaper } from '../types';

interface MarkEntryFiltersProps {
  exams: Exam[];
  assignments: TeacherExamAssignment[];
  papers: ExamPaper[];
  selectedExamId: string;
  selectedPaperId: string;
  searchQuery: string;
  onExamChange: (id: string) => void;
  onPaperChange: (id: string) => void;
  onSearchChange: (query: string) => void;
}

const MarkEntryFilters: React.FC<MarkEntryFiltersProps> = ({
  exams,
  assignments,
  papers,
  selectedExamId,
  selectedPaperId,
  searchQuery,
  onExamChange,
  onPaperChange,
  onSearchChange
}) => {
  return (
    <div className="bg-[#0a0e1a] border border-white/5 rounded-2xl p-4 space-y-4 shadow-xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Exam Selector */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
            <Award className="w-3 h-3" /> Select Exam
          </label>
          <select 
            value={selectedExamId}
            onChange={(e) => onExamChange(e.target.value)}
            className="w-full bg-[#050810] border border-white/10 rounded-xl px-4 py-3 text-xs font-black text-white outline-none focus:border-amber-500 transition-all appearance-none uppercase"
          >
            <option value="">Choose Exam Cycle...</option>
            {exams.map(e => (
              <option key={e.id} value={e.id}>{e.examName} ({e.academicYear})</option>
            ))}
          </select>
        </div>

        {/* Paper Selector */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
            <ClipboardCheck className="w-3 h-3" /> Select Paper
          </label>
          <select 
            value={selectedPaperId}
            disabled={!selectedExamId}
            onChange={(e) => onPaperChange(e.target.value)}
            className="w-full bg-[#050810] border border-white/10 rounded-xl px-4 py-3 text-xs font-black text-white outline-none focus:border-amber-500 transition-all appearance-none uppercase disabled:opacity-30"
          >
            <option value="">Choose Assigned Paper...</option>
            {papers.map(p => (
              <option key={p.id} value={p.id}>{p.paperName} (Max: {p.maxMarks})</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
            <Search className="w-3 h-3" /> Quick Find
          </label>
          <div className="relative">
            <input 
              type="text"
              placeholder="Search Student Name / Seat No..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#050810] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-white outline-none focus:border-amber-500 transition-all"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkEntryFilters;
