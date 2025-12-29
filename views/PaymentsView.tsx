
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, 
  CheckCircle2, 
  Loader2,
  Zap,
  HandCoins,
  History,
  TrendingDown,
  Info,
  ArrowRightCircle,
  PlusCircle
} from 'lucide-react';
import { Teacher, ClassType, Attendance, AttendanceStatus, Advance } from '../types';
import { dbService } from '../firebase';

interface ClassPaymentConfig {
  lecturesToPay: number;
  manualAmount: number;
}

const PaymentsView: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [paymentConfigs, setPaymentConfigs] = useState<Record<string, ClassPaymentConfig>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [advanceAmount, setAdvanceAmount] = useState<string>('');
  const [advanceNotes, setAdvanceNotes] = useState<string>('');
  const [manualAdvanceDeduction, setManualAdvanceDeduction] = useState<number>(0);
  const [manualCashDisbursement, setManualCashDisbursement] = useState<number>(0);

  const loadData = async () => {
    try {
      const [t, c, a] = await Promise.all([
        dbService.getTeachers(), 
        dbService.getClasses(), 
        dbService.getAttendance()
      ]);
      setTeachers(t);
      setClasses(c);
      setAttendance(a);
      
      if (selectedTeacherId) {
        const adv = await dbService.getAdvances(selectedTeacherId);
        setAdvances(adv);
      } else {
        setAdvances([]);
      }
    } catch (err) {}
  };

  useEffect(() => { loadData(); }, [selectedTeacherId]);

  useEffect(() => {
    if (!selectedTeacherId) {
      setPaymentConfigs({});
      setManualAdvanceDeduction(0);
      setManualCashDisbursement(0);
      return;
    }
    const newConfigs: Record<string, ClassPaymentConfig> = {};
    const teacher = teachers.find(t => t.id === selectedTeacherId);
    if (!teacher) return;

    teacher.assignments.forEach(asg => {
      const cls = classes.find(c => c.id === asg.classId);
      // HARD RULE: Only VERIFIED lectures are payable
      const pendingCount = attendance.filter(a => 
        a.teacherId === selectedTeacherId && 
        a.classId === asg.classId && 
        a.status === AttendanceStatus.VERIFIED
      ).length;

      const defaultToPay = pendingCount >= 28 ? 28 : pendingCount;
      const ratePerLec = (cls && cls.batchSize > 0) ? asg.rate / cls.batchSize : 0;
      
      newConfigs[asg.classId] = {
        lecturesToPay: defaultToPay,
        manualAmount: Math.round(defaultToPay * ratePerLec)
      };
    });
    setPaymentConfigs(newConfigs);
  }, [selectedTeacherId, teachers, attendance, classes]);

  const advanceBalance = useMemo(() => {
    return advances.reduce((sum, a) => sum + a.remainingAmount, 0);
  }, [advances]);

  const grossTotal = useMemo(() => {
    return (Object.values(paymentConfigs) as ClassPaymentConfig[]).reduce((sum, cfg) => sum + cfg.manualAmount, 0);
  }, [paymentConfigs]);

  useEffect(() => {
    const defaultDeduction = Math.min(grossTotal, advanceBalance);
    setManualAdvanceDeduction(defaultDeduction);
    setManualCashDisbursement(grossTotal - defaultDeduction);
  }, [grossTotal, advanceBalance]);

  const handleConfigChange = (classId: string, rawValue: string | number) => {
    const teacher = teachers.find(t => t.id === selectedTeacherId);
    const asg = teacher?.assignments.find(a => a.classId === classId);
    const cls = classes.find(c => c.id === classId);
    if (!asg || !cls) return;
    const pendingCount = attendance.filter(a => a.teacherId === selectedTeacherId && a.classId === classId && a.status === AttendanceStatus.VERIFIED).length;
    let value = typeof rawValue === 'string' ? (rawValue.trim() === '' ? 0 : parseInt(rawValue)) : rawValue;
    const safeValue = Math.min(Math.max(0, value || 0), pendingCount);
    const ratePerLec = cls.batchSize > 0 ? asg.rate / cls.batchSize : 0;
    setPaymentConfigs(prev => ({ ...prev, [classId]: { lecturesToPay: safeValue, manualAmount: Math.round(safeValue * ratePerLec) } }));
  };

  const handleSetAllPending = () => {
    const newConfigs = { ...paymentConfigs };
    const teacher = teachers.find(t => t.id === selectedTeacherId);
    if (!teacher) return;
    teacher.assignments.forEach(asg => {
      const cls = classes.find(c => c.id === asg.classId);
      if (!cls) return;
      const pendingCount = attendance.filter(a => a.teacherId === selectedTeacherId && a.classId === asg.classId && a.status === AttendanceStatus.VERIFIED).length;
      const ratePerLec = cls.batchSize > 0 ? asg.rate / cls.batchSize : 0;
      newConfigs[asg.classId] = { lecturesToPay: pendingCount, manualAmount: Math.round(pendingCount * ratePerLec) };
    });
    setPaymentConfigs(newConfigs);
  };

  const classRows = useMemo(() => {
    if (!selectedTeacherId) return [];
    const teacher = teachers.find(t => t.id === selectedTeacherId);
    if (!teacher) return [];
    return teacher.assignments.map(asg => {
      const cls = classes.find(c => c.id === asg.classId);
      if (!cls) return null;
      const verifiedForClass = attendance.filter(a => a.teacherId === selectedTeacherId && a.classId === asg.classId && a.status === AttendanceStatus.VERIFIED).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const config = paymentConfigs[asg.classId] || { lecturesToPay: 0, manualAmount: 0 };
      const selectedLectures = verifiedForClass.slice(0, config.lecturesToPay);
      let dateRange = "PENDING CALCULATION";
      if (selectedLectures.length > 0) {
        dateRange = `${new Date(selectedLectures[0].date).toLocaleDateString(undefined, {month:'short', day:'numeric'})} — ${new Date(selectedLectures[selectedLectures.length - 1].date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}`;
      }
      return { id: asg.classId, className: cls.name, subject: asg.subject, pendingCount: verifiedForClass.length, lecturesToPay: config.lecturesToPay, amount: config.manualAmount, dateRange };
    }).filter(row => row !== null);
  }, [selectedTeacherId, teachers, classes, attendance, paymentConfigs]);

  const roundUpAdvance = Math.max(0, manualCashDisbursement - (grossTotal - manualAdvanceDeduction));

  const applyRounding = (amount: number) => {
    setManualCashDisbursement(amount);
  };

  const handleGrantAdvance = async () => {
    const amt = parseInt(advanceAmount);
    if (isNaN(amt) || amt <= 0 || !selectedTeacherId) return;
    setIsProcessing(true);
    try {
      await dbService.addAdvance(selectedTeacherId, amt, advanceNotes);
      setAdvanceAmount('');
      setAdvanceNotes('');
      await loadData();
    } catch (err) {
      console.error("Advance error:", err);
    } finally { setIsProcessing(false); }
  };

  const handleBulkPay = async () => {
    const targets = classRows.filter(r => (r?.lecturesToPay || 0) > 0);
    if (targets.length === 0 && roundUpAdvance === 0) return;
    setIsProcessing(true);
    try {
      if (targets.length > 0) {
        await dbService.processBulkPayment(selectedTeacherId, targets.map(t => ({ classId: t!.id, lectureCount: t!.lecturesToPay, amount: t!.amount })), manualAdvanceDeduction);
      }
      if (roundUpAdvance > 0) {
        await dbService.addAdvance(selectedTeacherId, roundUpAdvance, `Round figure excess from settlement on ${new Date().toLocaleDateString()}`);
      }
      await loadData();
    } catch (err) {
      alert("Error processing settlement: " + (err as any).message);
    } finally { setIsProcessing(false); }
  };

  const isDrawerActive = selectedTeacherId && (grossTotal > 0 || advanceBalance > 0);

  return (
    <div className={`animate-slide-up flex flex-col lg:flex-row gap-8 relative pb-32 lg:pb-0`}>
      {/* Main Content Pane */}
      <div className="flex-1 space-y-8 min-w-0">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl md:text-4xl font-extrabold theme-text uppercase tracking-tighter">FINANCIAL SETTLEMENT</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <select 
              className="flex-1 px-6 py-4 theme-card rounded-[1.5rem] text-sm font-extrabold theme-text appearance-none shadow-sm outline-none focus:border-[var(--primary)] transition-all"
              value={selectedTeacherId}
              disabled={isProcessing}
              onChange={e => setSelectedTeacherId(e.target.value)}
            >
              <option value="">Choose Staff Profile For Settlement</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {selectedTeacherId && (
              <button onClick={handleSetAllPending} className="px-6 py-4 theme-bg-primary text-white border-2 border-white/10 rounded-[1.5rem] text-[10px] font-extrabold uppercase tracking-[0.1em] flex items-center justify-center gap-2 shadow-sm transition-all hover:brightness-110 active:scale-95">
                <Zap className="w-4 h-4 fill-white" /> CALC MAX OUT
              </button>
            )}
          </div>
        </div>

        {selectedTeacherId && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
            <div className="theme-card p-8 rounded-[2.5rem] border shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-extrabold theme-text-muted uppercase tracking-widest flex items-center gap-2">
                  <History className="w-3.5 h-3.5" /> LOG ADVANCE
                </h3>
                <div className="px-4 py-1.5 bg-rose-500/10 text-rose-500 rounded-full text-[10px] font-black uppercase tracking-wider border border-rose-500/20">
                  BAL: ₹{advanceBalance.toLocaleString()}
                </div>
              </div>
              
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <input 
                    type="number"
                    placeholder="ADVANCE AMOUNT"
                    value={advanceAmount}
                    onChange={e => setAdvanceAmount(e.target.value)}
                    className="flex-1 px-5 py-3.5 bg-[var(--bg-main)] border theme-border rounded-xl text-xs font-bold outline-none focus:border-rose-500 transition-all"
                  />
                  <button 
                    onClick={handleGrantAdvance}
                    disabled={!advanceAmount || isProcessing}
                    className="px-6 bg-rose-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'GRANT'}
                  </button>
                </div>
                <input 
                  placeholder="Optional Notes"
                  value={advanceNotes}
                  onChange={e => setAdvanceNotes(e.target.value)}
                  className="px-5 py-3.5 bg-[var(--bg-main)] border theme-border rounded-xl text-[10px] font-medium outline-none"
                />
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden flex flex-col justify-center group border border-white/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)] opacity-5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10 flex items-center gap-6">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-[var(--primary)]">
                  <HandCoins className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Current Liability (Advance)</div>
                  <div className="text-3xl font-black text-white tracking-tight">₹{advanceBalance.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!selectedTeacherId ? (
          <div className="theme-card rounded-[2.5rem] p-16 text-center border-2 border-dashed theme-border animate-slide-up">
            <div className="w-24 h-24 bg-[var(--bg-main)] rounded-full flex items-center justify-center mx-auto mb-6 border theme-border">
              <Calculator className="w-12 h-12 theme-text-muted opacity-30" />
            </div>
            <h3 className="text-sm font-extrabold theme-text-muted uppercase tracking-widest opacity-40">Select staff to initialize audit</h3>
          </div>
        ) : (
          <div className="space-y-4 animate-slide-up">
            {classRows.length === 0 ? (
               <div className="bg-[var(--bg-card)] p-12 rounded-[2rem] border-2 border-dashed theme-border text-center opacity-60">
                  <Info className="w-10 h-10 theme-text-muted mx-auto mb-4 opacity-20" />
                  <p className="text-[10px] font-black theme-text-muted uppercase tracking-widest">No verified lectures available for settlement</p>
               </div>
            ) : classRows.map((row, idx) => row && (
              <div key={row.id} className="theme-card p-8 rounded-[2rem] border shadow-sm space-y-6 transition-all hover:shadow-xl hover:-translate-y-1 animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-extrabold theme-text uppercase text-sm tracking-tight">{row.className}</div>
                    <div className="text-[10px] font-extrabold theme-primary uppercase tracking-widest mt-0.5">{row.subject}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold theme-text">₹{row.amount.toLocaleString()}</div>
                    <div className="text-[10px] font-bold theme-text-muted uppercase tracking-tighter">{row.pendingCount} VERIFIED LECTURES</div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-5">
                  <div className="relative w-full md:w-56">
                    <input 
                      type="number"
                      value={row.lecturesToPay || ''}
                      placeholder="LEC QUANTITY"
                      onChange={e => handleConfigChange(row.id, e.target.value)}
                      className="w-full px-6 py-4 bg-[var(--bg-main)] border-2 border-transparent rounded-2xl text-xs font-extrabold theme-text outline-none focus:border-[var(--primary)] transition-all"
                    />
                    <button onClick={() => handleConfigChange(row.id, row.pendingCount)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-extrabold theme-primary bg-[var(--bg-card)] border theme-border px-3 py-1.5 rounded-lg hover:brightness-110 transition-colors">MAX</button>
                  </div>
                  {row.lecturesToPay > 0 && (
                    <div className="flex items-center gap-4 bg-cyan-500/10 px-5 py-4 rounded-2xl border border-cyan-500/20 flex-1 w-full animate-in fade-in slide-in-from-left-4">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                      <span className="text-[10px] font-extrabold theme-text-muted uppercase tracking-widest leading-none truncate">
                        SCOPE: <span className="theme-text">{row.dateRange}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar Settlement Panel */}
      {isDrawerActive && (
        <aside className="lg:w-[460px] lg:shrink-0 lg:sticky lg:top-8 h-fit animate-slide-up">
          <div className="bg-slate-900 p-8 md:p-10 rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden text-white relative flex flex-col max-h-[calc(100vh-12rem)]">
            <div className="absolute top-0 right-0 w-48 h-48 theme-bg-primary opacity-5 -mr-24 -mt-24 rounded-full blur-3xl"></div>
            
            <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2 flex-1 relative z-10">
              {advanceBalance > 0 && (
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-3">
                   <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Advance Recovery
                      <span className="text-rose-500">Bal: ₹{advanceBalance.toLocaleString()}</span>
                   </div>
                   <div className="relative">
                      <input 
                        type="number"
                        value={manualAdvanceDeduction}
                        max={Math.min(grossTotal, advanceBalance)}
                        onChange={e => setManualAdvanceDeduction(Math.min(Math.max(0, Number(e.target.value)), Math.min(grossTotal, advanceBalance)))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3 text-sm font-black text-white focus:outline-none focus:border-[var(--primary)] transition-all"
                      />
                      <TrendingDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500 opacity-50" />
                   </div>
                </div>
              )}

              <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
                 <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Disbursement Rounding
                    <span className="text-slate-500 italic lowercase">Excess added to advance</span>
                 </div>
                 
                 <div className="grid grid-cols-3 gap-2">
                    {[500, 1000, 5000].map(val => {
                      const nextRound = Math.ceil((grossTotal - manualAdvanceDeduction) / val) * val;
                      return (
                        <button 
                          key={val}
                          onClick={() => applyRounding(nextRound)}
                          className={`px-3 py-3 rounded-xl border text-[10px] font-black transition-all ${manualCashDisbursement === nextRound ? 'bg-[var(--primary)] border-white/20' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                        >
                          ₹{nextRound.toLocaleString()}
                        </button>
                      )
                    })}
                 </div>

                 <div className="relative">
                    <input 
                      type="number"
                      value={manualCashDisbursement}
                      onChange={e => setManualCashDisbursement(Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-lg font-black text-emerald-400 focus:outline-none focus:border-emerald-500 transition-all text-center"
                      placeholder="CASH PAYOUT"
                    />
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">₹</div>
                 </div>
              </div>

              {roundUpAdvance > 0 && (
                <div className="flex items-center gap-3 bg-rose-500/10 p-4 rounded-xl border border-rose-500/20 text-rose-200 animate-in zoom-in-95">
                   <PlusCircle className="w-5 h-5 shrink-0 text-rose-500" />
                   <p className="text-[10px] font-bold uppercase tracking-tight">
                      Rounding excess of <span className="text-white">₹{roundUpAdvance.toLocaleString()}</span> will be logged as future advance.
                   </p>
                </div>
              )}

              <div className="flex items-center justify-between mt-8 border-t border-white/10 pt-6">
                <div>
                  <div className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.25em] mb-2">
                    DISBURSEMENT
                  </div>
                  <div className="text-4xl md:text-5xl font-extrabold text-white tracking-tighter">₹{manualCashDisbursement.toLocaleString()}</div>
                </div>
                <div className="w-14 h-14 md:w-16 md:h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                  <ArrowRightCircle className="w-8 h-8 md:w-10 md:h-10 text-emerald-500" />
                </div>
              </div>
            </div>

            <div className="mt-8 relative z-10 pt-4 border-t border-white/5">
              <button 
                onClick={handleBulkPay}
                disabled={(grossTotal === 0 && roundUpAdvance === 0) || isProcessing}
                className="w-full theme-bg-primary text-white py-6 rounded-2xl font-extrabold text-xs uppercase tracking-[0.3em] shadow-xl disabled:opacity-50 flex items-center justify-center gap-3 transition-all hover:brightness-110 active:scale-95 group relative z-10 border border-white/10"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                EXECUTE SETTLEMENT
              </button>
              
              <p className="mt-4 text-[8px] font-bold text-slate-500 uppercase text-center tracking-widest flex items-center justify-center gap-2">
                <Info className="w-3 h-3" /> MATH: {grossTotal.toLocaleString()} LEC - {manualAdvanceDeduction.toLocaleString()} ADJ = {manualCashDisbursement.toLocaleString()} TOTAL
              </p>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};

export default PaymentsView;
