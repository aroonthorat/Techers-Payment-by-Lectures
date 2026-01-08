
import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  IndianRupee, 
  Zap, 
  Activity, 
  RefreshCcw,
  Users,
  Globe,
  PieChart,
  TrendingUp,
  Database
} from 'lucide-react';
import { dbService } from '../firebase';
import { Student, FeePayment, ClassType } from '../types';

const StudentDashboardView: React.FC = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalRevenue: 0,
    pendingFees: 0,
    mediumBreakdown: { English: 0, 'Semi-English': 0, Urdu: 0 }
  });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  const loadData = async () => {
    const [s, fp, c] = await Promise.all([
      dbService.getStudents(),
      dbService.getFeePayments(),
      dbService.getClasses()
    ]);

    const expected = s.reduce((sum, stu) => sum + (stu.enrollments?.reduce((eSum, enr) => eSum + enr.totalFee, 0) || 0), 0);
    const collected = fp.reduce((sum, curr) => sum + curr.amount, 0);
    
    const breakdown = s.reduce((acc: any, curr) => {
      acc[curr.medium] = (acc[curr.medium] || 0) + 1;
      return acc;
    }, { English: 0, 'Semi-English': 0, Urdu: 0 });

    setStats({
      totalStudents: s.length,
      totalRevenue: collected,
      pendingFees: expected - collected,
      mediumBreakdown: breakdown
    });

    const enrichedPayments = fp.slice(-5).reverse().map(p => ({
      ...p,
      studentName: s.find(stu => stu.id === p.studentId)?.name || 'Unknown Student'
    }));
    setRecentPayments(enrichedPayments);
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div className="space-y-6 animate-slide-up pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-3">
            <GraduationCap className="text-emerald-500 w-8 h-8" />
            Student Command
          </h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            Academic & Fee Treasury Overview
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0a0e1a] border border-white/5 p-6 rounded-3xl shadow-sm">
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-white">{stats.totalStudents}</div>
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Total Enrollment</div>
        </div>

        <div className="bg-[#0a0e1a] border border-white/5 p-6 rounded-3xl shadow-sm">
          <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-4">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-white">₹{stats.totalRevenue.toLocaleString()}</div>
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Collected Revenue</div>
        </div>

        <div className="bg-[#0a0e1a] border border-white/5 p-6 rounded-3xl shadow-sm">
          <div className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center mb-4">
            <Zap className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-white">₹{stats.pendingFees.toLocaleString()}</div>
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Outstanding Dues</div>
        </div>

        <div className="bg-[#0a0e1a] border border-white/5 p-6 rounded-3xl shadow-sm">
          <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center mb-4">
            <Globe className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-white">
            {/* Added type assertion to number to fix operator '>' cannot be applied to unknown error */}
            {Object.values(stats.mediumBreakdown).filter(count => (count as number) > 0).length}
          </div>
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Active Mediums</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#0a0e1a] border border-white/5 rounded-3xl p-6">
          <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Recent Fee Collections
          </h3>
          <div className="space-y-3">
            {recentPayments.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-[10px]">
                    {p.studentName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-[11px] font-black text-white uppercase">{p.studentName}</div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{new Date(p.date).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="text-xs font-black text-emerald-500">+ ₹{p.amount}</div>
              </div>
            ))}
            {recentPayments.length === 0 && (
              <div className="py-10 text-center text-slate-600 uppercase text-[10px] font-black tracking-widest">No recent transactions</div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -mr-16 -mt-16"></div>
          <h3 className="text-xs font-black uppercase tracking-widest mb-6 relative z-10">Medium Distribution</h3>
          <div className="space-y-4 relative z-10">
            {Object.entries(stats.mediumBreakdown).map(([medium, count]) => (
              <div key={medium}>
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-1.5">
                  <span className="text-slate-400">{medium}</span>
                  <span className="text-white">{count as number}</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-1000" 
                    /* Added type assertion to number to fix arithmetic operation error */
                    style={{ width: `${stats.totalStudents ? ((count as number) / stats.totalStudents) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
             <button onClick={loadData} className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2 mx-auto hover:text-emerald-400">
               <RefreshCcw className="w-3 h-3" /> Refresh Ledger
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardView;
