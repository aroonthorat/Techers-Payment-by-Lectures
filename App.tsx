
import React, { useState, useEffect, useRef } from 'react';
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
  Home
} from 'lucide-react';
import { AuthUser } from './types';

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

type Theme = 'corporate' | 'midnight' | 'emerald' | 'crimson' | 'slate';

const App: React.FC = () => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('edupay_session');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [theme, setTheme] = useState<Theme>('midnight'); // Defaulting to Midnight (Dark) theme
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'corporate' ? '' : theme);
  }, [theme]);

  // Set default tab based on role
  useEffect(() => {
    if (authUser?.role === 'teacher') {
      setActiveTab('home');
    } else if (authUser?.role === 'management') {
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

  const adminTabs = [
    { id: 'dashboard', label: 'HOME', icon: LayoutDashboard },
    { id: 'master-calendar', label: 'PULSE', icon: Globe },
    { id: 'attendance', label: 'ENTRY', icon: CalendarIcon },
    { id: 'payments', label: 'PAY', icon: CreditCard },
    { id: 'teachers', label: 'STAFF', icon: Users },
    { id: 'classes', label: 'CLASSES', icon: BookOpen },
    { id: 'reports', label: 'LOGS', icon: FileText },
  ];

  const teacherTabs = [
    { id: 'home', label: 'HOME', icon: Home },
    { id: 'attendance', label: 'ATTENDANCE', icon: CalendarIcon },
    { id: 'reports', label: 'PAYMENTS', icon: FileText },
  ];

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

  const currentTabs = authUser.role === 'management' ? adminTabs : teacherTabs;
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden relative font-sans antialiased bg-[var(--bg-main)]">
      
      {/* Dynamic Sidebar */}
      <aside 
        ref={sidebarRef}
        className={`
          hidden lg:flex fixed lg:static z-50 h-screen bg-[var(--bg-card)] border-r border-[var(--border)] 
          flex-col transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'w-64' : 'w-20'}
        `}
      >
        <div className={`p-6 border-b border-[var(--border)] flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={toggleSidebar}>
            <div className="w-10 h-10 theme-bg-primary rounded-xl flex items-center justify-center text-white shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            {isSidebarOpen && <span className="font-extrabold theme-text uppercase tracking-tighter text-lg animate-in fade-in">EduPay</span>}
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {currentTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                w-full flex items-center transition-all duration-200 group rounded-xl relative
                ${isSidebarOpen ? 'px-4 py-3 justify-start gap-3' : 'p-3 justify-center'}
                ${activeTab === tab.id ? 'theme-bg-primary text-white shadow-md' : 'theme-text-muted hover:bg-[var(--bg-main)]'}
              `}
              title={tab.label}
            >
              <tab.icon className={`shrink-0 w-5 h-5 relative z-10 ${activeTab === tab.id ? 'stroke-[2.5px]' : ''}`} />
              {isSidebarOpen && <span className="text-[11px] font-black uppercase tracking-widest relative z-10">{tab.label}</span>}
            </button>
          ))}
        </nav>

        {/* Auth Summary / Logout */}
        <div className="p-4 border-t border-[var(--border)] flex flex-col gap-3">
          {isSidebarOpen && (
            <div className="px-2 py-3 bg-slate-50 border border-[var(--border)] rounded-2xl flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                 {authUser.name.charAt(0)}
               </div>
               <div className="overflow-hidden">
                 <div className="text-[10px] font-black theme-text uppercase truncate text-slate-900">{authUser.name}</div>
                 <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{authUser.role}</div>
               </div>
            </div>
          )}
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center theme-text-muted hover:bg-rose-50 hover:text-rose-600 transition-all rounded-xl ${isSidebarOpen ? 'px-4 py-3 gap-3' : 'p-3 justify-center'}`}
            title="Terminate Session"
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>}
          </button>
        </div>

        {/* Theme Switcher Suite */}
        <div className="p-4 border-t border-[var(--border)]">
          <div className={`flex flex-wrap items-center justify-center gap-2 ${!isSidebarOpen && 'flex-col'}`}>
            {themeOptions.map(t => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`p-2 rounded-lg transition-all border-2 ${theme === t.id ? 'theme-border bg-[var(--primary-light)]' : 'border-transparent hover:bg-[var(--bg-main)]'}`}
                title={t.label}
              >
                <div className={`w-3 h-3 rounded-full ${t.color}`} />
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[var(--bg-main)]">
        
        {/* Top Bar Mobile */}
        <header className="lg:hidden bg-[var(--bg-card)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between shrink-0 sticky top-0 z-[60]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 theme-bg-primary rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-extrabold theme-text uppercase tracking-tighter">EduPay Pro</span>
          </div>
          <button onClick={handleLogout} className="p-2 text-rose-500 bg-rose-50 rounded-lg">
             <LogOut className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative custom-scrollbar">
          <div key={activeTab} className="max-w-7xl mx-auto pb-32 lg:pb-0 animate-slide-up">
            {/* MANAGEMENT VIEWS */}
            {authUser.role === 'management' && (
              <>
                {activeTab === 'dashboard' && <DashboardView />}
                {activeTab === 'master-calendar' && <MasterCalendarView />}
                {activeTab === 'attendance' && <AttendanceView />}
                {activeTab === 'payments' && <PaymentsView />}
                {activeTab === 'teachers' && <TeachersView />}
                {activeTab === 'classes' && <ClassesView />}
                {activeTab === 'reports' && <ReportsView />}
              </>
            )}

            {/* TEACHER VIEWS */}
            {authUser.role === 'teacher' && (
              <>
                {activeTab === 'home' && <TeacherHomeView user={authUser} />}
                {activeTab === 'attendance' && <AttendanceView forcedTeacherId={authUser.id} />}
                {activeTab === 'reports' && <ReportsView forcedTeacherId={authUser.id} />}
              </>
            )}
          </div>
        </main>

        {/* Bottom Nav for Mobile */}
        <nav className="lg:hidden fixed bottom-6 left-6 right-6 bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-around px-2 py-3 z-50 shadow-2xl rounded-2xl">
          {currentTabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-300 w-12 h-12 active:scale-90 ${isActive ? 'z-10 theme-primary' : 'theme-text-muted'}`}
              >
                <tab.icon className={`w-5 h-5 transition-all ${isActive ? 'scale-110 stroke-[2.5px]' : ''}`} />
                <span className={`text-[8px] font-black uppercase tracking-tighter transition-all ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  {tab.label}
                </span>
                {isActive && <div className="absolute -bottom-1 w-1 h-1 theme-bg-primary rounded-full" />}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  );
};

export default App;
