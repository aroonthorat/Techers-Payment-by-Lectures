
import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  LayoutGrid, 
  Database, 
  Table as TableIcon, 
  Share2,
  AlertCircle,
  Loader2,
  ClipboardCheck,
  RefreshCcw
} from 'lucide-react';
import { useExamExport } from '../hooks/useExamExport';
import { dbService } from '../firebase';
import { Exam, ClassType, Teacher, ExamExportFilters } from '../types';
import ExamExportFiltersSidebar from './ExamExportFilters';
import ExamAnalyticsDashboard from './ExamAnalyticsDashboard';
import { generateCSV, generateJSON } from '../utils/exportHelpers';

const ExamExportView: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isReady, setIsReady] = useState(false);
  
  const { entries, loading, fetchFilteredData, analytics } = useExamExport();
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  useEffect(() => {
    Promise.all([
      dbService.getExams(),
      dbService.getClasses(),
      dbService.getTeachers()
    ]).then(([e, c, t]) => {
      setExams(e);
      setClasses(c);
      setTeachers(t);
      setIsReady(true);
    });
  }, []);

  const handleApplyFilters = (f: ExamExportFilters) => {
    fetchFilteredData(f, teachers);
    setCurrentPage(1);
  };

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return entries.slice(start, start + itemsPerPage);
  }, [entries, currentPage]);

  const handleDownload = () => {
    if (entries.length === 0) return;
    const filename = `EDU_MARK_REPORT_${new Date().toISOString().split('T')[0]}.csv`;
    if (exportFormat === 'csv') generateCSV(entries, filename);
    else if (exportFormat === 'json') generateJSON(entries, filename.replace('.csv', '.json'));
    else window.print();
  };

  if (!isReady) {
    return (
      <div className="py-40 flex flex-col items-center justify-center gap-4 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Synchronizing Data Nodes...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-slide-up pb-32">
      {/* Sidebar Filters */}
      <aside className="lg:w-[320px] shrink-0">
        <ExamExportFiltersSidebar 
          exams={exams} 
          classes={classes} 
          teachers={teachers} 
          onApply={handleApplyFilters}
          isLoading={loading}
        />
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 space-y-8 min-w-0 print:p-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6 print:hidden">
          <div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-3">
              <Database className="text-amber-500 w-8 h-8" />
              Master Archive
            </h2>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
              Multi-dimensional Mark Analysis & Extraction
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-[#0a0e1a] p-1.5 rounded-2xl border border-white/5">
             {(['csv', 'json', 'pdf'] as const).map(fmt => (
                <button 
                  key={fmt}
                  onClick={() => setExportFormat(fmt)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${exportFormat === fmt ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                >
                  {fmt}
                </button>
             ))}
          </div>
        </div>

        <ExamAnalyticsDashboard analytics={analytics} />

        <div className="bg-[#0a0e1a] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative min-h-[500px]">
          {loading ? (
            <div className="absolute inset-0 z-10 bg-[#0a0e1a]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
               <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Executing Complex Query...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="py-40 flex flex-col items-center justify-center gap-6 text-slate-700">
               <TableIcon className="w-20 h-20 opacity-10" />
               <div className="text-center">
                  <h3 className="text-lg font-black uppercase tracking-tighter opacity-40">No Data Points Loaded</h3>
                  <p className="text-[9px] font-black uppercase tracking-widest mt-2">Adjust your search parameters in the filter engine.</p>
               </div>
            </div>
          ) : (
            <div className="overflow-x-auto no-scrollbar print:overflow-visible">
              <table className="w-full text-left">
                <thead className="sticky top-0 z-10 bg-[#0a0e1a]/95 backdrop-blur-md border-b border-white/5">
                   <tr className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                      <th className="px-6 py-5">Student Identity</th>
                      <th className="px-6 py-5 text-center">Batch</th>
                      <th className="px-6 py-5 text-center">Med</th>
                      <th className="px-6 py-5 text-center">Marks</th>
                      <th className="px-6 py-5 text-center">%</th>
                      <th className="px-6 py-5 text-center">Grd</th>
                      <th className="px-6 py-5 text-right">Audit</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedEntries.map((m) => (
                    <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                           <span className="text-[11px] font-black text-white uppercase tracking-tight">{m.studentName}</span>
                           <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{m.studentSeatNo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className="text-[10px] font-black text-slate-400 uppercase">{classes.find(c => c.id === m.class)?.name.split('-')[0]}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${m.medium === 'English' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{m.medium.charAt(0)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-black text-white">{m.isAbsent ? 'ABS' : m.obtainedMarks}</span>
                        <span className="text-[8px] font-bold text-slate-600 ml-1">/{m.maxMarks}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className={`text-[11px] font-black ${m.percentage >= 40 ? 'text-emerald-500' : 'text-rose-500'}`}>{m.isAbsent ? '-' : m.percentage}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black border ${
                           m.grade.startsWith('A') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                           m.grade.startsWith('B') ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                           m.grade === 'F' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                           'bg-slate-500/10 border-slate-500/20 text-slate-500'
                         }`}>
                           {m.grade}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{m.teacherName?.split(' ')[0]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {entries.length > 0 && !loading && (
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0a0e1a] p-8 rounded-[2rem] border border-white/5 print:hidden">
             <div className="flex items-center gap-2">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-2.5 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all disabled:opacity-30"
                >
                   <RefreshCcw className="w-4 h-4" />
                </button>
                <div className="px-5 py-2.5 bg-white/5 rounded-xl border border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   Page {currentPage} / {Math.ceil(entries.length / itemsPerPage)}
                </div>
                <button 
                  disabled={currentPage >= Math.ceil(entries.length / itemsPerPage)}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-2.5 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all disabled:opacity-30 rotate-180"
                >
                   <RefreshCcw className="w-4 h-4" />
                </button>
             </div>

             <button 
               onClick={handleDownload}
               className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-emerald-900/20"
             >
                {exportFormat === 'pdf' ? <Printer className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                {exportFormat === 'pdf' ? 'Initiate Print Protocol' : `Extract ${exportFormat.toUpperCase()} Snapshot`}
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamExportView;
