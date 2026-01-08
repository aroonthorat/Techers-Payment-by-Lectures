
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Loader2, 
  CheckCircle2, 
  CloudSync, 
  LayoutGrid, 
  Save, 
  RefreshCcw,
  Users,
  AlertTriangle
} from 'lucide-react';
import { AuthUser, ExamPaper } from '../types';
import { useTeacherAssignments } from '../hooks/useTeacherAssignments';
import { useMarkEntry } from '../hooks/useMarkEntry';
import MarkEntryFilters from './MarkEntryFilters';
import MarkEntryRow from './MarkEntryRow';
import { dbService } from '../firebase';

interface MarkEntryViewProps {
  user: AuthUser;
}

const MarkEntryView: React.FC<MarkEntryViewProps> = ({ user }) => {
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedPaperId, setSelectedPaperId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [availablePapers, setAvailablePapers] = useState<ExamPaper[]>([]);
  
  const { assignments, exams, loading: assignmentsLoading } = useTeacherAssignments(user.id);
  const { entries, loading: entriesLoading, syncing, updateEntryLocally, bulkSave } = useMarkEntry({
    examId: selectedExamId,
    paperId: selectedPaperId,
    teacherId: user.id
  });

  // Focus management refs for keyboard navigation
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // When exam changes, fetch and filter papers
  useEffect(() => {
    if (selectedExamId) {
      dbService.getExamPapers(selectedExamId).then(allPapers => {
        // Only show papers that the teacher is assigned to for this exam
        const assignedPaperIds = new Set(assignments.filter(a => a.examId === selectedExamId).map(a => a.paperId));
        setAvailablePapers(allPapers.filter(p => assignedPaperIds.has(p.id)));
      });
    } else {
      setAvailablePapers([]);
      setSelectedPaperId('');
    }
  }, [selectedExamId, assignments]);

  const filteredEntries = useMemo(() => {
    return entries.filter(e => 
      e.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      e.studentSeatNo.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [entries, searchQuery]);

  const stats = useMemo(() => {
    const total = entries.length;
    const completed = entries.filter(e => e.obtainedMarks !== null || e.isAbsent).length;
    const absent = entries.filter(e => e.isAbsent).length;
    return { total, completed, absent };
  }, [entries]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      const nextEntry = filteredEntries[index + 1];
      if (nextEntry) inputRefs.current[nextEntry.id]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevEntry = filteredEntries[index - 1];
      if (prevEntry) inputRefs.current[prevEntry.id]?.focus();
    }
  };

  if (assignmentsLoading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center gap-4 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Initializing Portal Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <ClipboardCheck className="text-amber-500 w-8 h-8" />
            Marks Repository
          </h2>
          <div className="flex items-center gap-3 mt-1">
             <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${syncing ? 'text-amber-400' : 'text-emerald-500'}`}>
                {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CloudSync className="w-3 h-3" />}
                {syncing ? 'Cloud Sync In Progress' : 'All Changes Saved'}
             </div>
             <div className="w-1 h-1 rounded-full bg-slate-700"></div>
             <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Teacher ID: {user.id.toUpperCase()}</span>
          </div>
        </div>
        
        {entries.length > 0 && (
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex-1 md:flex-none bg-slate-900 border border-white/5 rounded-2xl px-5 py-3 flex items-center gap-4">
               <div className="text-right">
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Progress</div>
                  <div className="text-sm font-black text-white tracking-tighter">{stats.completed} / {stats.total}</div>
               </div>
               <div className="w-px h-8 bg-white/10"></div>
               <div className="text-right">
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Absent</div>
                  <div className="text-sm font-black text-rose-500 tracking-tighter">{stats.absent}</div>
               </div>
            </div>
            <button 
              onClick={bulkSave}
              disabled={syncing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Finalize
            </button>
          </div>
        )}
      </div>

      <MarkEntryFilters 
        exams={exams}
        assignments={assignments}
        papers={availablePapers}
        selectedExamId={selectedExamId}
        selectedPaperId={selectedPaperId}
        searchQuery={searchQuery}
        onExamChange={setSelectedExamId}
        onPaperChange={setSelectedPaperId}
        onSearchChange={setSearchQuery}
      />

      <div className="bg-[#0a0e1a] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative min-h-[400px]">
        {entriesLoading ? (
          <div className="absolute inset-0 z-10 bg-[#0a0e1a]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Syncing Student Roster...</p>
          </div>
        ) : !selectedPaperId ? (
          <div className="py-40 flex flex-col items-center justify-center gap-6 opacity-30 text-slate-500">
             <LayoutGrid className="w-20 h-20" />
             <div className="text-center">
                <h3 className="text-xl font-black uppercase tracking-tighter">Cohort Selection Required</h3>
                <p className="text-[9px] font-black uppercase tracking-widest mt-2">Pick an Exam Cycle and Paper from the filters above.</p>
             </div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-40 flex flex-col items-center justify-center gap-6 text-slate-600">
             <AlertTriangle className="w-16 h-16" />
             <p className="text-[10px] font-black uppercase tracking-[0.2em]">No students match your current criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead className="sticky top-0 z-10 bg-[#0a0e1a]/95 backdrop-blur-md border-b border-white/5">
                <tr className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  <th className="px-6 py-5 w-20">Seat No</th>
                  <th className="px-6 py-5">Student Identity</th>
                  <th className="px-6 py-5 text-center w-24">Is Absent</th>
                  <th className="px-6 py-5 text-center w-48">Obtained Marks</th>
                  <th className="px-6 py-5">Teacher Remarks</th>
                  <th className="px-6 py-5 text-right w-16">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredEntries.map((entry, index) => (
                  <MarkEntryRow 
                    key={entry.id}
                    entry={entry}
                    index={index}
                    onUpdate={updateEntryLocally}
                    inputRef={(el) => inputRefs.current[entry.id] = el}
                    onKeyDown={handleKeyDown}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedPaperId && !entriesLoading && (
        <div className="flex justify-between items-center px-8 py-4 bg-white/5 rounded-2xl border border-white/5 animate-in slide-in-from-bottom-4">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Completed: {stats.completed}</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Absentee: {stats.absent}</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pending: {stats.total - stats.completed}</span>
              </div>
           </div>
           <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2 hover:text-amber-400 transition-colors">
              <RefreshCcw className="w-3 h-3" /> Back to top
           </button>
        </div>
      )}
    </div>
  );
};

export default MarkEntryView;
