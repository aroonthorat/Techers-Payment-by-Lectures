
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, 
  CheckCircle2, 
  Loader2,
  Zap,
  HandCoins,
  History,
  TrendingDown,
  Info
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
  
  // Advance management states
  const [advanceAmount, setAdvanceAmount] = useState<string>('');
  const [advanceNotes, setAdvanceNotes] = useState<string>('');
  const [useAdvanceBalance, setUseAdvanceBalance] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const [t, c, a, adv] = await Promise.all([
        dbService.getTeachers(), 
        dbService.getClasses(), 
        dbService.getAttendance(),
        selectedTeacherId ? dbService.getAdvances(selectedTeacherId) : Promise.resolve([])
      ]);
      setTeachers(t);
      setClasses(c);
      setAttendance(a);
      setAdvances(adv);
    } catch (err) {}
  };

  useEffect(() => { loadData(); }, [selectedTeacherId]);

  useEffect(() => {
    if (!selectedTeacherId) {
      setPaymentConfigs({});
      return;
    }
    const newConfigs: Record<string, ClassPaymentConfig> = {};
    const teacher = teachers.find(t => t.id === selectedTeacherId);
    if (!teacher) return;

    teacher.assignments.forEach(asg => {
      const cls = classes.find(c => c.id === asg.classId);
      const pendingCount = attendance.filter(a => 
        a.teacherId === selectedTeacherId && 
        a.classId === asg.classId && 
        a.status === AttendanceStatus.PENDING
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

  const handleConfigChange = (classId: string, rawValue: string | number) => {
    const teacher = teachers.find(t => t.id === selectedTeacherId);
    const asg = teacher?.assignments.find(a => a.classId === classId);
    const cls = classes.find(c => c.id === classId);
    if (!asg || !cls) return;
    const pendingCount = attendance.filter(a => a.teacherId === selectedTeacherId && a.classId === classId && a.status === AttendanceStatus.PENDING).length;
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
      const pendingCount = attendance.filter(a => a.teacherId === selectedTeacherId && a.classId === asg.classId && a.status === AttendanceStatus.PENDING).length;
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
      const pendingForClass = attendance.filter(a => a.teacherId === selectedTeacherId && a.classId === asg.classId && a.status === AttendanceStatus.PENDING).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const config = paymentConfigs[asg.classId] || { lecturesToPay: 0, manualAmount: 0 };
      const selectedLectures = pendingForClass.slice(0, config.lecturesToPay);
      let dateRange = "PENDING CALCULATION";
      if (selectedLectures.length > 0) {
        dateRange = `${new Date(selectedLectures[0].date).toLocaleDateString(undefined, {month:'short', day:'numeric'})} — ${new Date(selectedLectures[selectedLectures.length - 1].date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}`;
      }
      return { id: asg.classId, className: cls.name, subject: asg.subject, pendingCount: pendingForClass.length, lecturesToPay: config.lecturesToPay, amount: config.manualAmount, dateRange };
    }).filter(row => row !== null);
  }, [selectedTeacherId, teachers, classes, attendance, paymentConfigs]);

  const grossTotal = classRows.reduce((sum, row) => sum + (row?.amount || 0), 0);
  const adjustedAdvance = useAdvanceBalance ? Math.min(grossTotal, advanceBalance) : 0;
  const netDisbursement = grossTotal - adjustedAdvance;

  const handleGrantAdvance = async () => {
    const amt = parseInt(advanceAmount);
    if (isNaN(amt) || amt <= 0 || !selectedTeacherId) return;
    setIsProcessing(true);
    try {
      await dbService.addAdvance(selectedTeacherId, amt, advanceNotes);
      setAdvanceAmount('');
      setAdvanceNotes('');
      await loadData();
    } catch (err) {} finally { setIsProcessing(false); }
  };

  const handleBulkPay = async () => {
    const targets = classRows.filter(r => (r?.lecturesToPay || 0) > 0);
    if (targets.length === 0) return;
    setIsProcessing(true);
    try {
      await dbService.processBulkPayment(selectedTeacherId, targets.map(t => ({ classId: t!.id, lectureCount: t!.lecturesToPay, amount: t!.amount })), useAdvanceBalance);
      await loadData();
    } catch (err) {} finally { setIsProcessing(false); }
  };

  return (
    <div className={`space-y-8 animate-slide-up ${grossTotal > 0 ? 'pb-[28rem] lg:pb-80' : 'pb-40'}`}>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 uppercase tracking-tighter">FINANCIAL SETTLEMENT</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <select 
            className="flex-1 px-6 py-4 bg-white border-2 border-slate-100 rounded-[1.5rem] text-sm font-extrabold text-slate-900 appearance-none shadow-sm outline-none focus:border-indigo-600 transition-all"
            value={selectedTeacherId}
            disabled={isProcessing}
            onChange={e => setSelectedTeacherId(e.target.value)}
          >
            <option value="">Choose Staff Profile For Settlement</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          {selectedTeacherId && (
            <button onClick={handleSetAllPending} className="px-6 py-4 bg-indigo-50 text-indigo-700 border-2 border-indigo-100 rounded-[1.5rem] text-[10px] font-extrabold uppercase tracking-[0.1em] flex items-center justify-center gap-2 shadow-sm transition-all hover:bg-indigo-100 active:scale-95">
              <Zap className="w-4 h-4 fill-indigo-500" /> CALC MAX OUT
            </button>
          )}
        </div>
      </div>

      {selectedTeacherId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
          {/* ADVANCE LEDGER */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <History className="w-3.5 h-3.5" /> ADVANCE LEDGER
              </h3>
              <div className="px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-rose-100">
                BAL: ₹{advanceBalance.toLocaleString()}
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <input 
                  type="number"
                  placeholder="ADVANCE AMOUNT (ROUND)"
                  value={advanceAmount}
                  onChange={e => setAdvanceAmount(e.target.value)}
                  className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-rose-500 transition-all"
                />
                <button 
                  onClick={handleGrantAdvance}
                  disabled={!advanceAmount || isProcessing}
                  className="px-6 bg-rose-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all disabled:opacity-50"
                >
                  GRANT
                </button>
              </div>
              <input 
                placeholder="Optional Notes (e.g. Personal emergency)"
                value={advanceNotes}
                onChange={e => setAdvanceNotes(e.target.value)}
                className="px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-medium outline-none"
              />
            </div>
          </div>

          {/* ADVANCE SUMMARY */}
          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="relative z-10 flex items-center gap-6">
              <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 text-indigo-400">
                <HandCoins className="w-8 h-8" />
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Outstanding Advance</div>
                <div className="text-3xl font-black text-white tracking-tight">₹{advanceBalance.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!selectedTeacherId ? (
        <div className="bg-white rounded-[2.5rem] p-16 text-center border-2 border-dashed border-slate-200 animate-slide-up">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calculator className="w-12 h-12 text-slate-300" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest">Select staff to initialize audit</h3>
        </div>
      ) : (
        <div className="space-y-4 animate-slide-up">
          {classRows.map((row, idx) => row && (
            <div key={row.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6 transition-all hover:shadow-xl hover:-translate-y-1 animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-extrabold text-slate-900 uppercase text-sm tracking-tight">{row.className}</div>
                  <div className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest mt-0.5">{row.subject}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-slate-900">₹{row.amount.toLocaleString()}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{row.pendingCount} LECTURES PENDING AUDIT</div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-5">
                <div className="relative w-full md:w-56">
                  <input 
                    type="number"
                    value={row.lecturesToPay || ''}
                    placeholder="LEC QUANTITY"
                    onChange={e => handleConfigChange(row.id, e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-xs font-extrabold text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all"
                  />
                  <button onClick={() => handleConfigChange(row.id, row.pendingCount)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-extrabold text-indigo-600 bg-white border border-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">MAX</button>
                </div>
                {row.lecturesToPay > 0 && (
                  <div className="flex items-center gap-4 bg-cyan-50/30 px-5 py-4 rounded-2xl border border-cyan-100/50 flex-1 w-full animate-in fade-in slide-in-from-left-4">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse-electric"></div>
                    <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest leading-none truncate">
                      SETTLEMENT SCOPE: <span className="text-slate-900">{row.dateRange}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTeacherId && grossTotal > 0 && (
        <div className="fixed bottom-24 lg:bottom-12 left-6 right-6 md:left-auto md:right-12 md:w-[450px] bg-indigo-950 p-8 rounded-[3rem] z-[100] shadow-2xl animate-slide-up border border-white/10 overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500 opacity-10 -mr-24 -mt-24 rounded-full blur-3xl"></div>
          
          <div className="space-y-4 mb-8 relative z-10">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
               GROSS BILLING <span className="text-slate-300">₹{grossTotal.toLocaleString()}</span>
            </div>
            
            {advanceBalance > 0 && (
              <div 
                className={`flex justify-between items-center p-4 rounded-2xl border cursor-pointer transition-all ${useAdvanceBalance ? 'bg-indigo-900/50 border-indigo-500/50' : 'bg-transparent border-slate-800 opacity-60'}`}
                onClick={() => setUseAdvanceBalance(!useAdvanceBalance)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${useAdvanceBalance ? 'bg-indigo-500 border-indigo-400' : 'bg-transparent border-slate-700'}`}>
                    {useAdvanceBalance && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-indigo-300">DEDUCT FROM ADVANCE</div>
                    <div className="text-[11px] font-bold text-white">Using ₹{adjustedAdvance.toLocaleString()} from balance</div>
                  </div>
                </div>
                <TrendingDown className="w-5 h-5 text-indigo-400 opacity-50" />
              </div>
            )}

            <div className="h-px bg-slate-800 my-4"></div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-[0.25em] mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  FINAL DISBURSEMENT
                </div>
                <div className="text-4xl font-extrabold text-white tracking-tighter">₹{netDisbursement.toLocaleString()}</div>
              </div>
              <div className="w-14 h-14 bg-indigo-900 rounded-2xl flex items-center justify-center border border-indigo-800">
                <Calculator className="w-8 h-8 text-indigo-200" />
              </div>
            </div>
          </div>

          <button 
            onClick={handleBulkPay}
            disabled={grossTotal === 0 || isProcessing}
            className="w-full bg-white text-indigo-950 py-6 rounded-2xl font-extrabold text-xs uppercase tracking-[0.3em] shadow-xl disabled:opacity-50 flex items-center justify-center gap-3 transition-all hover:bg-emerald-50 active:scale-95 group relative z-10"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-6 h-6 group-hover:scale-110 transition-transform" />}
            EXECUTE SETTLEMENT
          </button>
          
          <p className="mt-4 text-[8px] font-bold text-slate-500 uppercase text-center tracking-widest flex items-center justify-center gap-2">
            <Info className="w-3 h-3" /> AUDIT TRAIL WILL BE LOGGED PERMANENTLY
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentsView;
