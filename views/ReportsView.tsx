
import React, { useState, useEffect } from 'react';
import { Download, FileText, Calendar, IndianRupee, User, Info, ArrowDownRight } from 'lucide-react';
import { Teacher, ClassType, Payment } from '../types';
import { dbService } from '../firebase';

const ReportsView: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [filterTeacher, setFilterTeacher] = useState('');

  const load = async () => {
    const [p, t, c] = await Promise.all([
      dbService.getPayments(),
      dbService.getTeachers(),
      dbService.getClasses()
    ]);
    setPayments(p);
    setTeachers(t);
    setClasses(c);
  };

  useEffect(() => { load(); }, []);

  const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || 'Unknown';
  const getClassName = (id: string) => classes.find(c => c.id === id)?.name || 'Unknown';

  const filteredPayments = payments.filter(p => !filterTeacher || p.teacherId === filterTeacher);

  const exportCSV = () => {
    const headers = ['Date Paid', 'Teacher', 'Class', 'Lectures', 'Gross Amount', 'Advance Adj', 'Net Paid', 'Start Date', 'End Date'];
    const rows = filteredPayments.map(p => [
      new Date(p.datePaid).toLocaleDateString(),
      getTeacherName(p.teacherId),
      getClassName(p.classId),
      p.lectureCount,
      p.amount,
      p.advanceDeduction || 0,
      p.netDisbursement || p.amount,
      new Date(p.startDateCovered).toLocaleDateString(),
      new Date(p.endDateCovered).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financial_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-slide-up pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl md:text-5xl font-extrabold theme-text uppercase tracking-tighter leading-none">Financial Audits</h2>
          <p className="text-xs md:text-sm font-bold theme-text-muted uppercase tracking-widest opacity-60">Verified disbursement logs & historical data</p>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
             <select 
              className="w-full px-6 py-4 theme-card rounded-[1.5rem] text-xs font-black theme-text outline-none appearance-none cursor-pointer shadow-sm border-2 focus:border-[var(--primary)] transition-all"
              value={filterTeacher}
              onChange={e => setFilterTeacher(e.target.value)}
            >
              <option value="">ALL PERSONNEL ROSTER</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>)}
            </select>
          </div>
          <button 
            onClick={exportCSV}
            className="flex-1 md:flex-none theme-bg-primary text-white px-8 py-4 rounded-[1.5rem] flex items-center justify-center gap-3 hover:brightness-110 transition-all font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95"
          >
            <Download className="w-5 h-5" />
            EXTRACT DATA
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredPayments.length === 0 ? (
          <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed theme-border">
            <FileText className="w-16 h-16 theme-text-muted mx-auto mb-6 opacity-10" />
            <p className="theme-text-muted font-black text-xs uppercase tracking-[0.3em]">No verified transactions recorded</p>
          </div>
        ) : (
          filteredPayments.sort((a,b) => new Date(b.datePaid).getTime() - new Date(a.datePaid).getTime()).map((p, idx) => (
            <div key={p.id} className="bg-white p-8 md:p-10 rounded-[2.5rem] border theme-border shadow-sm hover:shadow-xl transition-all animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-[var(--primary-light)] theme-primary rounded-2xl flex items-center justify-center shrink-0">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="text-xl font-black theme-text uppercase tracking-tighter leading-none mb-1">{getTeacherName(p.teacherId)}</div>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-black theme-primary bg-[var(--primary-light)] px-3 py-1 rounded-lg uppercase tracking-widest">{getClassName(p.classId)}</span>
                       <div className="flex items-center gap-1.5 text-[10px] font-bold theme-text-muted uppercase tracking-widest">
                          <Calendar className="w-3 h-3" />
                          {new Date(p.datePaid).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                       </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 md:text-right">
                  <div className="hidden md:block">
                     <div className="text-[10px] font-black theme-text-muted uppercase tracking-widest mb-1">Gross Billing</div>
                     <div className="text-xl font-bold theme-text uppercase tracking-tight opacity-70">₹{p.amount.toLocaleString()}</div>
                  </div>
                  
                  {p.advanceDeduction > 0 && (
                    <div className="hidden md:block text-rose-500">
                      <div className="text-[10px] font-black uppercase tracking-widest mb-1">Advance Adj.</div>
                      <div className="text-xl font-bold tracking-tight flex items-center justify-end gap-1">
                        <ArrowDownRight className="w-4 h-4" />
                        ₹{p.advanceDeduction.toLocaleString()}
                      </div>
                    </div>
                  )}

                  <div className="h-10 w-px bg-[var(--border)] hidden md:block"></div>
                  
                  <div>
                    <div className="text-[10px] font-black theme-text-muted uppercase tracking-widest mb-1">Net Disbursed</div>
                    <div className="text-3xl font-black theme-primary flex items-center gap-1">
                      <IndianRupee className="w-5 h-5" />
                      {(p.netDisbursement ?? p.amount).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReportsView;
