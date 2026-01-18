
import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCircle2, Briefcase, ChevronRight, Loader2, BookOpen, Sparkles } from 'lucide-react';
import { AuthUser, Teacher, UserRole } from '../types';
import { dbService } from '../firebase';
import { NativeBridge } from '../utils/NativeBridge';

interface LoginViewProps {
  onLogin: (user: AuthUser) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const t = await dbService.getTeachers();
      setTeachers(t);
    };
    load();
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    NativeBridge.hapticFeedback('impact');
    await new Promise(r => setTimeout(r, 800));
    
    let user: AuthUser | null = null;
    
    if (role === 'management') {
      user = { id: 'admin', name: 'Administrator', role: 'management' };
    } else if (role === 'teacher' && selectedTeacherId) {
      const teacher = teachers.find(t => t.id === selectedTeacherId);
      if (teacher) {
        user = { id: teacher.id, name: teacher.name, role: 'teacher' };
      }
    }

    if (user) {
      await NativeBridge.showToast(`Authenticated as ${user.name}`);
      onLogin(user);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-6 font-sans">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-[var(--primary)] opacity-10 -skew-y-3 origin-top-left -z-10 shadow-2xl"></div>
      
      <div className="w-full max-w-lg animate-slide-up">
        <div className="text-center mb-10 theme-text">
          <div className="w-20 h-20 theme-card rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <BookOpen className="w-10 h-10 theme-primary" />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">EduPay Pro</h1>
          <p className="theme-text-muted font-bold text-xs uppercase tracking-[0.3em] mt-2 opacity-60">Institutional Settlement Suite</p>
        </div>

        <div className="theme-card rounded-[3rem] p-10 md:p-12 shadow-2xl border theme-border">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-black theme-text uppercase tracking-tight">System Access</h2>
            <p className="theme-text-muted text-xs font-bold uppercase tracking-widest mt-1 opacity-60">Select your organizational function</p>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-8">
            <button 
              onClick={() => { setRole('management'); setSelectedTeacherId(''); NativeBridge.hapticFeedback('selection'); }}
              className={`flex items-center gap-5 p-6 rounded-[2rem] border-2 transition-all group ${role === 'management' ? 'border-[var(--primary)] bg-[var(--primary-light)]/20' : 'theme-border bg-[var(--bg-main)] hover:brightness-110'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${role === 'management' ? 'theme-bg-primary text-white' : 'bg-[var(--bg-card)] theme-text-muted group-hover:theme-primary'}`}>
                <Briefcase className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className={`text-sm font-black uppercase tracking-tight ${role === 'management' ? 'theme-text' : 'theme-text opacity-70'}`}>Management</div>
                <div className="text-[10px] font-bold theme-text-muted uppercase tracking-widest mt-0.5">Admin & Bulk Payments</div>
              </div>
              {role === 'management' && <ShieldCheck className="w-5 h-5 theme-primary ml-auto animate-in zoom-in" />}
            </button>

            <button 
              onClick={() => { setRole('teacher'); NativeBridge.hapticFeedback('selection'); }}
              className={`flex items-center gap-5 p-6 rounded-[2rem] border-2 transition-all group ${role === 'teacher' ? 'border-[var(--primary)] bg-[var(--primary-light)]/20' : 'theme-border bg-[var(--bg-main)] hover:brightness-110'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${role === 'teacher' ? 'theme-bg-primary text-white' : 'bg-[var(--bg-card)] theme-text-muted group-hover:theme-primary'}`}>
                <UserCircle2 className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className={`text-sm font-black uppercase tracking-tight ${role === 'teacher' ? 'theme-text' : 'theme-text opacity-70'}`}>Staff Member</div>
                <div className="text-[10px] font-bold theme-text-muted uppercase tracking-widest mt-0.5">Personal Portal & History</div>
              </div>
              {role === 'teacher' && <ShieldCheck className="w-5 h-5 theme-primary ml-auto animate-in zoom-in" />}
            </button>
          </div>

          {role === 'teacher' && (
            <div className="mb-10 animate-in slide-in-from-top-4 duration-300">
              <label className="text-[10px] font-black theme-text-muted uppercase tracking-widest ml-1 mb-2 block">Choose Your Profile</label>
              <select 
                value={selectedTeacherId}
                onChange={e => { setSelectedTeacherId(e.target.value); NativeBridge.hapticFeedback('selection'); }}
                className="w-full theme-card rounded-2xl px-6 py-4 text-sm font-black theme-text focus:outline-none focus:border-[var(--primary)] transition-all appearance-none cursor-pointer"
              >
                <option value="">Choose Profile...</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}

          <button 
            onClick={handleLogin}
            disabled={!role || (role === 'teacher' && !selectedTeacherId) || isLoading}
            className="w-full theme-bg-primary text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 border border-white/10"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                Initialize Session
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        <p className="text-center mt-10 text-[9px] font-black theme-text-muted uppercase tracking-[0.2em] flex items-center justify-center gap-2 opacity-40">
          <Sparkles className="w-3 h-3 theme-primary" /> Secure Encryption Active
        </p>
      </div>
    </div>
  );
};

export default LoginView;
