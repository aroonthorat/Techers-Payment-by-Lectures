
import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Trash2, 
  Database, 
  RefreshCcw, 
  ShieldCheck, 
  AlertTriangle,
  Zap,
  HardDrive
} from 'lucide-react';
import { dbService } from '../firebase';
import { NativeBridge } from '../utils/NativeBridge';

const SettingsView: React.FC = () => {
  const [confirmText, setConfirmText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleReset = async () => {
    if (confirmText !== 'RESET') {
      alert("Please type RESET to confirm data destruction.");
      return;
    }
    
    setIsProcessing(true);
    NativeBridge.hapticFeedback('notification');
    
    try {
      await dbService.clearDatabase();
      alert("All local data has been purged.");
      window.location.reload();
    } catch (e) {
      alert("Operation failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSeed = async () => {
    if (!confirm("This will replace current data with trial records. Proceed?")) return;
    setIsProcessing(true);
    try {
      await dbService.seedDatabase();
      NativeBridge.showToast("Database seeded with trial data.");
      window.location.reload();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-slide-up pb-32 pt-4">
      <div className="space-y-2">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-3">
          <ShieldCheck className="text-amber-500 w-8 h-8" />
          Core Settings
        </h2>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
          System Maintenance & Restricted Operations
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Seed Data Card */}
        <div className="bg-[#0a0e1a] border border-white/5 rounded-[3rem] p-10 space-y-6 shadow-2xl transition-all hover:border-blue-500/20 group">
           <div className="flex items-center justify-between">
              <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                 <HardDrive className="w-7 h-7" />
              </div>
              <div className="text-right">
                 <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">Node Initialization</h3>
                 <p className="text-[9px] font-bold text-slate-500 uppercase">Trial Data Provisioning</p>
              </div>
           </div>
           
           <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight opacity-70">
              Populate the system with a comprehensive set of faculty, student, and assessment records for staging or trial purposes. This will clear existing local data.
           </p>

           <button 
             onClick={handleSeed}
             disabled={isProcessing}
             className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 border border-white/10 flex items-center justify-center gap-3"
           >
              {isProcessing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              Seed Trial Environment
           </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-[#0a0e1a] border border-rose-500/10 rounded-[3rem] p-10 space-y-8 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl -mr-16 -mt-16"></div>
           
           <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-rose-500" />
              <h3 className="text-xs font-black text-rose-500 uppercase tracking-[0.3em]">Restricted Danger Zone</h3>
           </div>

           <div className="bg-rose-500/5 border border-rose-500/10 p-6 rounded-3xl space-y-4">
              <div className="flex gap-4">
                 <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                 <p className="text-[10px] font-black text-rose-400 uppercase leading-relaxed tracking-tight">
                    Purging the data node is irreversible. This action permanently deletes all local records including attendance, payroll, and student matrices.
                 </p>
              </div>

              <div className="space-y-3">
                 <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">Type "RESET" to authorize destruction</label>
                 <input 
                   type="text" 
                   value={confirmText}
                   onChange={e => setConfirmText(e.target.value)}
                   className="w-full bg-black/40 border border-rose-500/20 rounded-xl px-5 py-3.5 text-xs font-black text-rose-500 outline-none focus:border-rose-500 transition-all text-center placeholder:text-rose-900"
                   placeholder="AUTHORIZATION CODE"
                 />
              </div>

              <button 
                onClick={handleReset}
                disabled={confirmText !== 'RESET' || isProcessing}
                className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-30 text-white py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl transition-all active:scale-95 border border-white/10 flex items-center justify-center gap-3"
              >
                {isProcessing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Purge Data Node
              </button>
           </div>

           <div className="text-center">
              <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest leading-loose">
                 Institutional audit logs recommend backing up data to Google Drive before performing node reset operations.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
