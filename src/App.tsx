
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  BookOpen, 
  Calendar as CalendarIcon, 
  CreditCard, 
  LayoutDashboard,
  FileText, 
  Globe, 
  Briefcase, 
  Shield, 
  Zap, 
  Clock, 
  Settings, 
  LogOut, 
  Home, 
  GraduationCap, 
  IndianRupee, 
  Menu, 
  Download, 
  AlertCircle, 
  Database, 
  UserCheck, 
  ChevronRight, 
  Smartphone,
  X,
  LayoutGrid,
  ClipboardCheck,
  Award,
  Archive,
  BarChart3,
  GitCompare,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { AuthUser, AppConfig } from './types';
// UPDATED IMPORT
import { dbService } from './lib/netlify-client';

// Views
import DashboardView from './views/DashboardView';
import StudentDashboardView from './views/StudentDashboardView';
import TeachersView from './views/TeachersView';
import StudentsView from './views/StudentsView';
import StudentFeesView from './views/StudentFeesView';
import AttendanceView from './views/AttendanceView';
import PaymentsView from './views/PaymentsView';
import ClassesView from './views/ClassesView';
import ReportsView from './views/ReportsView';
import MasterCalendarView from './views/MasterCalendarView';
import LoginView from './views/LoginView';
import TeacherHomeView from './views/TeacherHomeView';
import ExamManagementView from './views/ExamManagementView';
import MarkEntryView from './views/MarkEntryView';
import ExamExportView from './views/ExamExportView';
import StudentPerformanceView from './views/StudentPerformanceView';
import ComparativeAnalysisView from './views/ComparativeAnalysisView';
import AssessmentQualityView from './views/AssessmentQualityView';
import StudentDetailedReportView from './views/StudentDetailedReportView';
import ProgressTrackingView from './views/ProgressTrackingView';
import SettingsView from './views/SettingsView';

type Theme = 'corporate' | 'midnight' | 'emerald' | 'crimson' | 'slate';
type ManagementMode = 'staff' | 'students' | 'exams' | 'system';

const App: React.FC = () => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('edupay_session');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);
  
  const [managementMode, setManagementMode] = useState<ManagementMode>(() => {
    const saved = localStorage.getItem('edupay_mode');
    return (saved as ManagementMode) || 'students';
  });
  const [navParams, setNavParams] = useState<any>(null);
  const [theme, setTheme] = useState<Theme>('midnight'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'corporate' ? '' : theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('edupay_mode', managementMode);
  }, [managementMode]);

  useEffect(() => {
    if (authUser?.role === 'teacher') {
      setActiveTab('home');
    } else {
      setActiveTab('dashboard');
    }
  }, [authUser]);

  const handleLogin = (user: AuthUser) => {
    setAuthUser(user);
    localStorage.setItem('edupay_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setAuthUser(null);
    localStorage.removeItem('edupay_session');
  };

  const handleTabClick = (id: string) => {
    setViewingStudentId(null);
    setActiveTab(id);
    if (isSidebarOpen) setIsSidebarOpen(false);
  };

  const navStructure = useMemo(() => {
    if (authUser?.role !== 'management') {
      return [{
        title: 'TEACHER PORTAL',
        items: [
          { id: 'home', label: 'DASHBOARD', icon: Home },
          { id: 'mark-entry', label: 'MARK ENTRY', icon: ClipboardCheck },
          { id: 'performance', label: 'PERFORMANCE', icon: BarChart3 },
          { id: 'attendance', label: 'ATTENDANCE', icon: CalendarIcon },
        ]
      }];
    }

    if (managementMode === 'staff') {
      return [{
        title: 'STAFF OPERATIONS',
        items: [
          { id: 'dashboard', label: 'STAFF HUB', icon: LayoutGrid },
          { id: 'master-calendar', label: 'MASTER PULSE', icon: Globe },
          { id: 'teachers', label: 'FACULTY', icon: Users },
          { id: 'classes', label: 'BATCHES', icon: BookOpen },
          { id: 'attendance', label: 'VERIFICATION', icon: UserCheck },
          { id: 'payments', label: 'PAYROLL', icon: CreditCard },
          { id: 'reports', label: 'AUDIT LOGS', icon: FileText },
        ]
      }];
    } else if (managementMode === 'students') {
      return [{
        title: 'STUDENT AFFAIRS',
        items: [
          { id: 'dashboard', label: 'STUDENT HUB', icon: LayoutGrid },
          { id: 'students', label: 'DIRECTORY', icon: GraduationCap },
          { id: 'performance', label: 'ACADEMIC AUDIT', icon: BarChart3 },
          { id: 'comparative', label: 'PEER VARIANCE', icon: GitCompare },
          { id: 'fees', label: 'FEE TREASURY', icon: IndianRupee },
        ]
      }];
    } else if (managementMode === 'exams') {
      return [{
        title: 'ACADEMIC SYSTEM',
        items: [
          { id: 'exams', label: 'EXAM MASTER', icon: Award },
          { id: 'progress', label: 'TRACKER', icon: Activity },
          { id: 'mark-entry', label: 'CENTRAL MARKS', icon: ClipboardCheck },
          { id: 'exam-export', label: 'MARK ARCHIVE', icon: Archive },
          { id: 'quality', label: 'EXAM QUALITY', icon: ShieldCheck },
        ]
      }];
    } else {
      return [{
        title: 'INSTITUTIONAL CORE',
        items: [
          { id: 'dashboard', label: 'CONSOLE', icon: LayoutDashboard },
          { id: 'settings', label: 'MAINTENANCE', icon: Settings },
        ]
      }];
    }
  }, [authUser, managementMode]);

  const mobileBottomNavItems = useMemo(() => {
    if (authUser?.role !== 'management') {
       return [
        { id: 'home', label: 'HOME', icon: Home },
        { id: 'mark-entry', label: 'MARKS', icon: ClipboardCheck },
        { id: 'performance', label: 'ANALYTICS', icon: BarChart3 },
      ];
    }
    if (managementMode === 'students') {
      return [
        { id: 'dashboard', label: 'HUB', icon: LayoutGrid },
        { id: 'performance', label: 'AUDIT', icon: BarChart3 },
        { id: 'fees', label: 'FEES', icon: IndianRupee },
      ];
    } else if (managementMode === 'staff') {
      return [
        { id: 'dashboard', label: 'HUB', icon: LayoutGrid },
        { id: 'teachers', label: 'FACULTY', icon: Users },
        { id: 'attendance', label: 'LOGS', icon: CalendarIcon },
      ];
    } else if (managementMode === 'exams') {
      return [
        { id: 'exams', label: 'EXAMS', icon: Award },
        { id: 'progress', label: 'TRACKER', icon: Activity },
        { id: 'exam-export', label: 'ARCHIVE', icon: Archive },
      ]
    } else {
      return [
        { id: 'dashboard', label: 'CONSOLE', icon: LayoutDashboard },
        { id: 'settings', label: 'SETUP', icon: Settings },
      ]
    }
  }, [navStructure, authUser, managementMode]);

  if (!authUser) return <LoginView onLogin={handleLogin} />;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--bg-main)]">
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar Drawer */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-[110] h-full bg-[var(--bg-card)] border-r border-[var(--border)] 
        flex flex-col transition-all duration-300 ease-[cubic-bezier(0.33, 1, 0.68, 1)]
        ${isSidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'}
      `}>
        {authUser.role === 'management' && isSidebarOpen && (
          <div className="px-4 pt-6 pb-2">
            <div className="bg-[#050810] p-1 rounded-2xl border border-white/5 flex w-full">
              <button 
                onClick={() => { setManagementMode('staff'); setActiveTab('dashboard'); }}
                className={`flex-1 flex flex-col items-center py-2.5 rounded-xl transition-all ${managementMode === 'staff' ? 'bg-[#0a0e1a] shadow-lg border border-white/10' : 'opacity-40 hover:opacity-100'}`}
              >
                <Briefcase className={`w-4 h-4 ${managementMode === 'staff' ? 'text-blue-400' : 'text-slate-500'}`} />
                <span className="text-[7px] font-black mt-1 uppercase tracking-widest text-slate-400">STAFF</span>
              </button>
              <button 
                onClick={() => { setManagementMode('students'); setActiveTab('dashboard'); }}
                className={`flex-1 flex flex-col items-center py-2.5 rounded-xl transition-all ${managementMode === 'students' ? 'bg-[#0a0e1a] shadow-lg border border-white/10' : 'opacity-40 hover:opacity-100'}`}
              >
                <GraduationCap className={`w-4 h-4 ${managementMode === 'students' ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span className="text-[7px] font-black mt-1 uppercase tracking-widest text-slate-400">STUDENTS</span>
              </button>
              <button 
                onClick={() => { setManagementMode('exams'); setActiveTab('exams'); }}
                className={`flex-1 flex flex-col items-center py-2.5 rounded-xl transition-all ${managementMode === 'exams' ? 'bg-[#0a0e1a] shadow-lg border border-white/10' : 'opacity-40 hover:opacity-100'}`}
              >
                <Award className={`w-4 h-4 ${managementMode === 'exams' ? 'text-amber-400' : 'text-slate-500'}`} />
                <span className="text-[7px] font-black mt-1 uppercase tracking-widest text-slate-400">EXAMS</span>
              </button>
              <button 
                onClick={() => { setManagementMode('system'); setActiveTab('settings'); }}
                className={`flex-1 flex flex-col items-center py-2.5 rounded-xl transition-all ${managementMode === 'system' ? 'bg-[#0a0e1a] shadow-lg border border-white/10' : 'opacity-40 hover:opacity-100'}`}
              >
                <Settings className={`w-4 h-4 ${managementMode === 'system' ? 'text-rose-400' : 'text-slate-500'}`} />
                <span className="text-[7px] font-black mt-1 uppercase tracking-widest text-slate-400">SYS</span>
              </button>
            </div>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto no-scrollbar">
          {navStructure.map((group, idx) => (
            <div key={idx} className="space-y-2">
              {isSidebarOpen && (
                <h4 className="px-3 text-[8px] font-black theme-text-muted uppercase tracking-[0.2em] opacity-30">
                  {group.title}
                </h4>
              )}
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group btn-active
                    ${activeTab === item.id ? 'sidebar-active-btn' : 'theme-text-muted hover:bg-white/5'}
                    ${!isSidebarOpen && 'justify-center px-0'}
                  `}
                >
                  <item.icon className={`w-4 h-4 shrink-0 ${activeTab === item.id ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                  {isSidebarOpen && <span className="text-[9px] font-black uppercase tracking-[0.1em]">{item.label}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-4">
           {isSidebarOpen && (
             <div className="flex items-center justify-center gap-2">
                {['midnight', 'emerald', 'crimson', 'slate'].map((t) => (
                  <button 
                    key={t} onClick={() => setTheme(t as Theme)}
                    className={`w-4 h-4 rounded-full border border-white/20 transition-all ${theme === t ? 'ring-2 ring-amber-500 scale-110' : 'opacity-40'}`}
                    style={{ backgroundColor: t === 'midnight' ? '#0a0e1a' : t === 'emerald' ? '#059669' : t === 'crimson' ? '#dc2626' : '#334155'}}
                  />
                ))}
             </div>
           )}
           <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all ${!isSidebarOpen && 'justify-center px-0'}`}>
             <LogOut className="w-4 h-4" />
             {isSidebarOpen && <span className="text-[9px] font-black uppercase tracking-widest">Logout</span>}
           </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-[#050810]">
        {/* Header */}
        <header className="flex h-12 lg:h-16 border-b border-white/5 bg-[#0a0e1a] px-4 lg:px-10 items-center justify-between shrink-0 z-40 pt-safe">
          <div className="flex items-center gap-3">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-1.5 text-slate-400 hover:text-white btn-active">
               <Menu className="w-5 h-5" />
             </button>
             <span className="hidden md:inline text-[8px] font-black text-slate-500 uppercase tracking-widest opacity-40">
               {managementMode.toUpperCase()} /
             </span>
             <span className="text-xs font-black text-white uppercase tracking-tighter">
                {activeTab.replace('-', ' ')}
             </span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-7 h-7 rounded-lg theme-bg-primary text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                {authUser.name.charAt(0)}
             </div>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-24 lg:pb-8 pt-3 px-3 md:px-8 overscroll-none">
          <div className="max-w-7xl mx-auto w-full">
            {viewingStudentId ? (
              <StudentDetailedReportView studentId={viewingStudentId} onBack={() => setViewingStudentId(null)} />
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  managementMode === 'staff' ? <DashboardView /> : <StudentDashboardView />
                )}
                {activeTab === 'teachers' && <TeachersView onNavigate={(tab, params) => { setActiveTab(tab); setNavParams(params); }} />}
                {activeTab === 'students' && <StudentsView />}
                {activeTab === 'fees' && <StudentFeesView />}
                {activeTab === 'attendance' && <AttendanceView forcedTeacherId={authUser.role === 'teacher' ? authUser.id : undefined} preselectedTeacherId={navParams?.teacherId} />}
                {activeTab === 'payments' && <PaymentsView />}
                {activeTab === 'classes' && <ClassesView />}
                {activeTab === 'reports' && <ReportsView forcedTeacherId={authUser.role === 'teacher' ? authUser.id : undefined} />}
                {activeTab === 'master-calendar' && <MasterCalendarView />}
                {activeTab === 'home' && authUser.role === 'teacher' && <TeacherHomeView user={authUser} />}
                {activeTab === 'exams' && <ExamManagementView />}
                {activeTab === 'progress' && <ProgressTrackingView />}
                {activeTab === 'mark-entry' && <MarkEntryView user={authUser} />}
                {activeTab === 'exam-export' && <ExamExportView />}
                {activeTab === 'performance' && <StudentPerformanceView onViewStudent={(id) => setViewingStudentId(id)} />}
                {activeTab === 'comparative' && <ComparativeAnalysisView />}
                {activeTab === 'quality' && <AssessmentQualityView />}
                {activeTab === 'settings' && <SettingsView />}
              </>
            )}
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0a0e1a] border-t border-white/5 px-4 pt-2 pb-safe z-50 shadow-[0_-12px_30px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {mobileBottomNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`flex flex-col items-center justify-center gap-1 min-w-[3.5rem] pb-1.5 transition-all duration-300 ${activeTab === item.id ? 'text-amber-500' : 'text-slate-500'}`}
              >
                <div className={`p-2 rounded-xl transition-all ${activeTab === item.id ? 'bg-amber-500/10' : ''}`}>
                  <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                </div>
                <span className="text-[7px] font-black uppercase tracking-widest">{item.label.split(' ')[0]}</span>
              </button>
            ))}
            <button onClick={() => setIsSidebarOpen(true)} className="flex flex-col items-center justify-center gap-1 min-w-[3.5rem] pb-1.5 text-slate-500">
              <div className="p-2">
                <Menu className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="text-[7px] font-black uppercase tracking-widest">MORE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
