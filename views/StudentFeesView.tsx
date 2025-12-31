
import React, { useState, useEffect, useMemo } from 'react';
import { 
  IndianRupee, 
  Search, 
  Plus, 
  History, 
  TrendingUp, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Info,
  CreditCard,
  Download,
  Clock,
  LayoutGrid
} from 'lucide-react';
import { Student, FeePayment, ClassType } from '../types';
import { dbService } from '../firebase';

const StudentFeesView: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [feePayments, setFeePayments] = useState<FeePayment[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = async () => {
    const [s, c, p] = await Promise.all([
      dbService.getStudents(),
      dbService.getClasses(),
      dbService.getFeePayments()
    ]);
    setStudents(s);
    setClasses(c);
    setFeePayments(p);
  };

  useEffect(() => { loadData(); }, []);

  const selectedStudent = useMemo(() => 
    students.find(s => s.id === selectedStudentId), 
  [selectedStudentId, students]);

  const studentFinancials = useMemo(() => {
    if (!selectedStudent) return null;
    
    const totalExpected = (selectedStudent.enrollments || []).reduce((sum, e) => sum + e.totalFee, 0);
    const totalPaid = feePayments.filter(p => p.studentId === selectedStudent.id).reduce((sum, p) => sum + p.amount, 0);
    const balance = totalExpected - totalPaid;

    const history = feePayments
      .filter(p => p.studentId === selectedStudent.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { totalExpected, totalPaid, balance, history };
  }, [selectedStudent, feePayments]);

  const handleCollectFee = async () => {
    const amt = parseInt(paymentAmount);
    if (isNaN(amt) || amt <= 0 || !selectedStudentId) return;
    setIsProcessing(true);
    try {
      await dbService.addFeePayment({
        studentId: selectedStudentId,
        amount: amt,
        date: new Date().toISOString(),
        notes: paymentNotes || 'Fee Collection'
      });
      setPaymentAmount('');
      setPaymentNotes('');
      await loadData();
    } catch (err) {
      console.error(err);
    } finally { setIsProcessing(false); }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportReport = () => {
    const headers = ['Student', 'Date', 'Amount Paid', 'Notes'];
    const rows = feePayments.map(p => {
      const student = students.find(s => s.id === p.studentId);
      return [
        student?.name || 'Unknown',
        new Date(p.date).toLocaleDateString(),
        p.amount,
        p.notes || ''
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fee_collection_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-slide-up space-y-8 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl md:text-5xl font-black theme-text uppercase tracking-tighter leading-none">Fee Treasury</h2>
          <p className="text-xs md:text-sm font-bold theme-text-muted mt-2 uppercase tracking-wide">Financial audit and receivable management for students</p>
        </div>
        <button 
          onClick={exportReport}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl flex items-center gap-3 transition-all shadow-xl hover:brightness-110 font-black text-[10px] uppercase tracking-[0.2em]"
        >
          <Download className="w-5 h-5" />
          EXTRACT LEDGER
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.8fr] gap-8">
        {/* Student Selector Pane */}
        <div className="space-y-6">
          <div className="relative">
            <input 
              type="text"
              placeholder="Search Student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 theme-card rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-[var(--primary)] transition-all shadow-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 theme-text-muted opacity-40" />
          </div>

          <div className="theme-card rounded-[2rem] border overflow-hidden shadow-sm max-h-[600px] overflow-y-auto custom-scrollbar">
            <div className="divide-y theme-border">
              {filteredStudents.length === 0 ? (
                 <div className="p-12 text-center theme-text-muted opacity-40 font-bold uppercase text-[10px] tracking-widest">No profiles found</div>
              ) : filteredStudents.map(s => (
                <button 
                  key={s.id}
                  onClick={() => setSelectedStudentId(s.id)}
                  className={`w-full p-6 flex items-center justify-between text-left transition-all hover:bg-[var(--primary-light)]/20 ${selectedStudentId === s.id ? 'bg-[var(--primary-light)] border-r-4 border-[var(--primary)]' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedStudentId === s.id ? 'theme-bg-primary text-white' : 'bg-[var(--bg-main)] theme-text-muted'}`}>
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold theme-text uppercase text-xs tracking-tight">{s.name}</div>
                      <div className="text-[9px] font-bold theme-text-muted uppercase tracking-widest opacity-60">
                        {s.enrollments?.length || 0} TRACKS
                      </div>
                    </div>
                  </div>
                  <ArrowRight className={`w-4 h-4 transition-transform ${selectedStudentId === s.id ? 'theme-primary translate-x-1' : 'theme-text-muted opacity-20'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Financial Details Pane */}
        <div className="space-y-8">
          {!selectedStudent ? (
            <div className="h-full flex flex-col items-center justify-center theme-card rounded-[3rem] p-20 border-2 border-dashed theme-border animate-slide-up">
              <div className="w-24 h-24 bg-[var(--bg-main)] rounded-full flex items-center justify-center mb-6 border theme-border">
                 <CreditCard className="w-12 h-12 theme-text-muted opacity-20" />
              </div>
              <h3 className="text-sm font-black theme-text-muted uppercase tracking-[0.3em] opacity-40">Initialize financial audit</h3>
            </div>
          ) : (
            <div className="space-y-8 animate-slide-up">
              {/* Summary Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 theme-bg-primary opacity-5 -mr-16 -mt-16 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">TOTAL RECEIVABLE</div>
                  <div className="text-2xl font-black tracking-tighter">₹{studentFinancials?.totalExpected.toLocaleString()}</div>
                </div>
                <div className="theme-card p-8 rounded-[2rem] border shadow-sm">
                  <div className="text-[9px] font-black theme-text-muted uppercase tracking-widest mb-1">TOTAL COLLECTED</div>
                  <div className="text-2xl font-black theme-primary tracking-tighter">₹{studentFinancials?.totalPaid.toLocaleString()}</div>
                </div>
                <div className="bg-rose-500 p-8 rounded-[2rem] text-white shadow-xl shadow-rose-500/10">
                  <div className="text-[9px] font-black text-rose-100 uppercase tracking-widest mb-1">REMAINING DUES</div>
                  <div className="text-2xl font-black tracking-tighter">₹{studentFinancials?.balance.toLocaleString()}</div>
                </div>
              </div>

              {/* Action: Collect Payment */}
              <div className="theme-card p-8 md:p-10 rounded-[2.5rem] border shadow-md space-y-6 bg-white">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black theme-text uppercase tracking-widest flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 theme-primary" />
                    COLLECT FEE REVENUE
                  </h4>
                  {studentFinancials?.balance === 0 && (
                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ACCOUNT SETTLED
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <input 
                      type="number"
                      placeholder="PAYMENT AMOUNT"
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                      className="w-full px-6 py-4 bg-[var(--bg-main)] border theme-border rounded-xl text-sm font-black outline-none focus:border-[var(--primary)] transition-all"
                    />
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-8 text-center text-slate-400 font-bold">₹</div>
                  </div>
                  <input 
                    placeholder="Reference / Notes"
                    value={paymentNotes}
                    onChange={e => setPaymentNotes(e.target.value)}
                    className="w-full px-6 py-4 bg-[var(--bg-main)] border theme-border rounded-xl text-xs font-bold outline-none"
                  />
                </div>
                <button 
                  onClick={handleCollectFee}
                  disabled={isProcessing || !paymentAmount}
                  className="w-full theme-bg-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:brightness-110 transition-all disabled:opacity-50 active:scale-95"
                >
                  {isProcessing ? 'Processing Ledger Update...' : 'RECORD TRANSACTION'}
                </button>
              </div>

              {/* Payment History Ledger */}
              <div className="space-y-4">
                <h4 className="label-header flex items-center gap-2 ml-1">
                  <History className="w-4 h-4" />
                  HISTORICAL LEDGER
                </h4>
                
                <div className="space-y-3">
                  {studentFinancials?.history.length === 0 ? (
                    <div className="p-10 text-center theme-card rounded-2xl border-2 border-dashed theme-border opacity-40">
                      <p className="text-[10px] font-bold uppercase tracking-widest">No previous collections</p>
                    </div>
                  ) : (
                    studentFinancials?.history.map(p => (
                      <div key={p.id} className="theme-card p-6 rounded-2xl border shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-[var(--primary-light)] theme-primary rounded-xl flex items-center justify-center">
                            <IndianRupee className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="text-sm font-black theme-text uppercase tracking-tight">₹{p.amount.toLocaleString()}</div>
                            <div className="text-[10px] font-bold theme-text-muted uppercase tracking-widest mt-1">
                              {new Date(p.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                            </div>
                          </div>
                        </div>
                        {p.notes && (
                           <div className="text-right">
                              <span className="text-[10px] font-black bg-[var(--bg-main)] px-4 py-2 rounded-xl border theme-border theme-text-muted uppercase tracking-tighter italic">
                                "{p.notes}"
                              </span>
                           </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentFeesView;
