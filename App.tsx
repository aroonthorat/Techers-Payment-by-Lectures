
import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  BookOpen, 
  Calendar as CalendarIcon, 
  CreditCard, 
  LayoutDashboard,
  FileText,
  Globe,
  Palette,
  Briefcase,
  Shield,
  Zap,
  Clock,
  Settings
} from 'lucide-react';
import { dbService } from './firebase';

// Views
import TeachersView from './views/TeachersView';
import ClassesView from './views/ClassesView';
import AttendanceView from './views/AttendanceView';
import PaymentsView from './views/PaymentsView';
import DashboardView from './views/DashboardView';
import ReportsView from './views/ReportsView';
import MasterCalendarView from './views/MasterCalendarView';

type Theme = 'corporate' | 'midnight' | 'emerald' | 'crimson' | 'slate';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'master-calendar' | 'teachers' | 'classes' | 'attendance' | 'payments' | 'reports'>('dashboard');
  const [theme, setTheme] = useState<Theme>('corporate');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'corporate' ? '' : theme);
  }, [theme]);

  const tabs = [
    { id: 'dashboard', label: 'HOME', icon: LayoutDashboard },
    { id: 'master-calendar', label: 'PULSE', icon: Globe },
    { id: 'attendance', label: 'ENTRY', icon: CalendarIcon },
    { id: 'payments', label: 'PAY', icon: CreditCard },
    { id: 'teachers', label: 'STAFF', icon: Users },
    { id: 'classes', label: 'CLASSES', icon: BookOpen },
    { id: 'reports', label: 'LOGS', icon: FileText },
  ];

  const themeOptions: { id: Theme; icon: any; label: string; color: string }[] = [
    { id: 'corporate', icon: Briefcase, label: 'Corporate Blue', color: 'bg-blue-600' },
    { id: 'midnight', icon: Shield, label: 'Midnight Onyx', color: 'bg-amber-500' },
    { id: 'emerald', icon: Zap, label: 'Emerald Wealth', color: 'bg-emerald-600' },
    { id: 'crimson', icon: Clock, label: 'Royal Crimson', color: 'bg-red-600' },
    { id: 'slate', icon: Settings, label: 'Executive Slate', color: 'bg-slate-700' },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden relative font-sans antialiased">
      
      {/* Sidebar for Desktop */}
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
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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
          {isSidebarOpen && (
             <p className="text-[8px] font-black text-center mt-3 theme-text-muted uppercase tracking-[0.2em] opacity-40">System Aesthetics</p>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[var(--bg-main)]">
        
        {/* Top Bar Mobile / Responsive */}
        <header className="lg:hidden bg-[var(--bg-card)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between shrink-0 sticky top-0 z-[60]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 theme-bg-primary rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-extrabold theme-text uppercase tracking-tighter">EduPay Pro</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-[9px] font-black theme-primary bg-[var(--primary-light)] px-3 py-1.5 rounded-lg uppercase tracking-widest border border-[var(--border)]">
              {tabs.find(t => t.id === activeTab)?.label}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative custom-scrollbar">
          <div key={activeTab} className="max-w-7xl mx-auto pb-32 lg:pb-0 animate-slide-up">
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'master-calendar' && <MasterCalendarView />}
            {activeTab === 'teachers' && <TeachersView />}
            {activeTab === 'classes' && <ClassesView />}
            {activeTab === 'attendance' && <AttendanceView />}
            {activeTab === 'payments' && <PaymentsView />}
            {activeTab === 'reports' && <ReportsView />}
          </div>
        </main>

        {/* Bottom Nav for Mobile */}
        <nav className="lg:hidden fixed bottom-6 left-6 right-6 bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-around px-2 py-3 z-50 shadow-2xl rounded-2xl">
          {tabs.slice(0, 5).map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
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
