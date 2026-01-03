
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { AuthUser, AppConfig } from './types';
import { dbService } from './firebase';

// Views
import TeachersView from './views/TeachersView';
import ClassesView from './views/ClassesView';
import AttendanceView from './views/AttendanceView';
import PaymentsView from './views/PaymentsView';
import DashboardView from './views/DashboardView';
import ReportsView from './views/ReportsView';
import MasterCalendarView from './views/MasterCalendarView';
import LoginView from './views/LoginView';
import TeacherHomeView from './views/TeacherHomeView';
import StudentsView from './views/StudentsView';
import StudentFeesView from './views/StudentFeesView';

type Theme = 'corporate' | 'midnight' | 'emerald' | 'crimson' | 'slate';

// DEFINE CURRENT VERSION HERE
const CURRENT_APP_VERSION = '1.0.0';

const App: React.FC = () => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('edupay_session');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [navParams, setNavParams] = useState<any>(null);
  const [theme, setTheme] = useState<Theme>('midnight'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Update State
  const [updateAvailable, setUpdateAvailable] = useState<AppConfig | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'corporate' ? '' : theme);
  }, [theme]);

  useEffect(() => {
    if (authUser?.role === 'teacher') {
      setActiveTab('home');
    } else if (authUser?.role === 'management') {
      setActiveTab('dashboard');
    }
  }, [authUser]);

  // Check for Updates on Mount
  useEffect(() => {
    const checkUpdates = async () => {
      const config = await dbService.checkAppUpdates();
      if (config && compareVersions(config.latestVersion, CURRENT_APP_VERSION) > 0) {
        setUpdateAvailable(config);
      }
    };
    checkUpdates();
  }, []);

  const compareVersions = (remote: string, local: string) => {
    const r = remote.split('.').map(Number);
    const l = local.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if (r[i] > l[i]) return 1;
      if (r[i] < l[i]) return -1;
    }
    return 0;
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Init
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogin = (user: AuthUser) => {
    setAuthUser(user);
    localStorage.setItem('edupay_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setAuthUser(null);
    localStorage.removeItem('edupay_session');
  };

  const handleNavigate = (tabId: string, params?: any) => {
    setActiveTab(tabId);
    if (params) setNavParams(params);
  };

  // --------------------------------------------------------------------------
  // NAVIGATION STRUCTURE - DIVIDED INTO SECTIONS
  // --------------------------------------------------------------------------
  const navStructure = useMemo(() => {
    if (authUser?.role === 'management') {
      return [
        {
          title: 'STAFF & OPERATIONS',
          items: [
            { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
            { id: 'master-calendar', label: 'MASTER PULSE', icon: Globe },
            { id: 'teachers', label: 'FACULTY', icon: Users },
            { id: 'classes', label: 'BATCHES', icon: BookOpen },
            { id: 'attendance', label: 'ATTENDANCE', icon: CalendarIcon },
            { id: 'payments', label: 'PAYROLL', icon: CreditCard },
            { id: 'reports', label: 'REPORTS', icon: FileText },
          ]
        },
        {
          title: 'STUDENT AFFAIRS',
          items: [
            { id: 'students', label: 'DIRECTORY', icon: GraduationCap },
            { id: 'fees', label: 'FEE TREASURY', icon: IndianRupee },
          ]
        }
      ];
    } else {
      return [
        {
          title: 'PORTAL',
          items: [
            { id: 'home', label: 'HOME', icon: Home },
            { id: 'attendance', label: 'ATTENDANCE', icon: CalendarIcon },
            { id: 'reports', label: 'HISTORY', icon: FileText },
          ]
        }
      ];
    }
  }, [authUser]);

  const themeOptions: { id: Theme; icon: any; label: string; color: string }[] = [
    { id: 'corporate', icon: Briefcase, label: 'Corporate Blue', color: 'bg-blue-600' },
    { id: 'midnight', icon: Shield, label: 'Midnight Onyx', color: 'bg-amber-500' },
    { id: 'emerald', icon: Zap, label: 'Emerald Wealth', color: 'bg-emerald-600' },
    { id: 'crimson', icon: Clock, label: 'Royal Crimson', color: 'bg-red-600' },
    { id: 'slate', icon: Settings, label: 'Executive Slate', color: 'bg-slate-700' },
  ];

  if (!authUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden relative font-sans antialiased bg-[var(--bg-main)]">
      {/* Update Notification Modal */}
      {updateAvailable && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="theme-card w-full max-w-md rounded-3xl shadow-2xl p-8 border-2 border-[var(--primary)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 theme-bg-primary"></div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 theme-bg-primary rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl animate-bounce">
                <Download className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black theme-text uppercase tracking-tighter">Update Available</h3>
              <p className="theme-text-muted text-xs font-bold uppercase tracking-widest mt-2">
                Version {updateAvailable.latestVersion} is ready
              </p>
              
              <div className="bg-[var(--bg-main)] p-4 rounded-xl border theme-border w-full mt-6 text-left">
                <p className="text-[10px] font-black theme-text-muted uppercase tracking-widest mb-1">Release Notes:</p>
                <p className="text-sm theme-text">{updateAvailable.releaseNotes || 'General improvements and bug fixes.'}</p>
              </div>

              <div className="flex flex-col gap-3 w-full mt-8">
                <a 
                  href={updateAvailable.downloadUrl} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full theme-bg-primary text-white py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:brightness-110 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download APK
                </a>
                
                {!updateAvailable.forceUpdate && (
                  <button 
                    onClick={() => setUpdateAvailable(null)}
                    className="w-full bg-[var(--bg-main)] theme-text-muted py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:brightness-95"
                  >
                    Skip for Now
                  </button>
                )}
                
                {updateAvailable.forceUpdate && (
                  <div className="flex items-center justify-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-widest">
                    <AlertCircle className="w-3 h-3" /> Critical Update Required
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        ref={sidebarRef}
        className={`
          fixed lg:static z-50 h-screen bg-[var(--bg-card)] border-r border-[var(--border)] 
          flex flex-col transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none
          ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'}
        `}
      >
        <div className={`p-6 border-b border-[var(--border)] flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={toggleSidebar}>
            <div className="w-10 h-10 theme-bg-primary rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg">
              <Zap className="w-6 h-6 fill-white" />
            </div>
            {isSidebarOpen && <span className="font-extrabold theme-text uppercase tracking-tighter text-lg">EduPay</span>}
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
          {navStructure.map((group, groupIdx) => (
            <div key={groupIdx}>
              {/* Section Header */}
              {isSidebarOpen && (
                <div className="px-4 mb-2 text-[10px] font-black theme-text-muted uppercase tracking-widest opacity-60 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full theme-bg-primary"></div>
                  {group.title}
                </div>
              )}
              
              <div className="space-y-1">
                {group.items.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (window.innerWidth < 1024) setIsSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center transition-all duration-200 group rounded-xl relative
                      ${isSidebarOpen ? 'px-4 py-3 justify-start gap-3' : 'p-3 justify-center'}
                      ${activeTab === tab.id ? 'theme-bg-primary text-white shadow-md' : 'theme-text-muted hover:bg-[var(--bg-main)] hover:theme-text'}
                    `}
                    title={tab.label}
                  >
                    <tab.icon className={`shrink-0 w-5 h-5 relative z-10 ${activeTab === tab.id ? 'stroke-[2.5px]' : ''}`} />
                    {isSidebarOpen && <span className="text-[10px] font-black uppercase tracking-widest relative z-10">{tab.label}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-[var(--border)] flex flex-col gap-3">
          {isSidebarOpen ? (
            <div className="px-3 py-3 bg-[var(--bg-main)] border border-[var(--border)] rounded-2xl flex items-center gap-3">
               <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm shrink-0">
                 {authUser.name.charAt(0)}
               </div>
               <div className="overflow-hidden">
                 <div className="text-[11px] font-black theme-text uppercase truncate leading-none mb-1">{authUser.name}</div>
                 <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{authUser.role}</div>
                 <div className="text-[8px] font-bold text-slate-500 mt-1">v{CURRENT_APP_VERSION}</div>
               </div>
            </div>
          ) : (
             <div className="w-9 h-9 mx-auto rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                {authUser.name.charAt(0)}
             </div>
          )}
          
          <button onClick={handleLogout} className={`w-full flex items-center theme-text-muted hover:bg-rose-50 hover:text-rose-600 transition-all rounded-xl ${isSidebarOpen ? 'px-4 py-3 gap-3' : 'p-3 justify-center'}`}>
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>}
          </button>
        </div>

        {/* Theme Switcher */}
        <div className="p-4 border-t border-[var(--border)]">
          <div className={`flex flex-wrap items-center justify-center gap-2 ${!isSidebarOpen && 'flex-col'}`}>
            {themeOptions.map(t => (
              <button key={t.id} onClick={() => setTheme(t.id)} className={`p-2 rounded-lg transition-all border-2 ${theme === t.id ? 'theme-border bg-[var(--primary-light)]' : 'border-transparent hover:bg-[var(--bg-main)]'}`} title={t.label}>
                <div className={`w-3 h-3 rounded-full ${t.color}`} />
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[var(--bg-main)]">
        {/* Mobile Header */}
        <header className="lg:hidden bg-[var(--bg-card)] border-b border-[var(--border)] px-4 py-3 flex items-center justify-between shrink-0 sticky top-0 z-[40]">
          <div className="flex items-center gap-3">
            <button onClick={toggleSidebar} className="p-2 -ml-2 theme-text">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 theme-primary fill-current" />
              <span className="text-sm font-extrabold theme-text uppercase tracking-tighter">EduPay</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase">
             {authUser.name.charAt(0)}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative custom-scrollbar">
          <div key={activeTab} className="max-w-7xl mx-auto pb-32 lg:pb-0 animate-slide-up">
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'master-calendar' && <MasterCalendarView />}
            {activeTab === 'attendance' && <AttendanceView forcedTeacherId={authUser.role === 'teacher' ? authUser.id : undefined} preselectedTeacherId={navParams?.teacherId} />}
            {activeTab === 'payments' && <PaymentsView />}
            {activeTab === 'teachers' && <TeachersView onNavigate={handleNavigate} />}
            {activeTab === 'students' && <StudentsView />}
            {activeTab === 'fees' && <StudentFeesView />}
            {activeTab === 'classes' && <ClassesView />}
            {activeTab === 'reports' && <ReportsView forcedTeacherId={authUser.role === 'teacher' ? authUser.id : undefined} />}
            {activeTab === 'home' && authUser.role === 'teacher' && <TeacherHomeView user={authUser} />}
          </div>
        </main>
        
        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-card)] border-t border-[var(--border)] px-4 py-2 z-[60] pb-safe">
          <nav className="flex items-center justify-between overflow-x-auto no-scrollbar gap-2">
            {navStructure.flatMap(group => group.items).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex flex-col items-center justify-center gap-1 p-2 min-w-[3.5rem] rounded-xl transition-all relative
                  ${activeTab === tab.id ? 'theme-text' : 'theme-text-muted opacity-60'}
                `}
              >
                <div className={`
                  p-1.5 rounded-lg transition-all
                  ${activeTab === tab.id ? 'bg-[var(--primary-light)] theme-primary shadow-sm' : ''}
                `}>
                  <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'stroke-[2.5px]' : ''}`} />
                </div>
                {activeTab === tab.id && (
                  <div className="w-1 h-1 rounded-full theme-bg-primary absolute bottom-1"></div>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default App;
