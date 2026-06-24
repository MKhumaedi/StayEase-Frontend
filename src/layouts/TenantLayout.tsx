import React from 'react';
import { 
  LayoutDashboard, 
  Building, 
  BookOpenCheck, 
  DollarSign, 
  ClipboardList 
} from 'lucide-react';
import { useLanguage } from '../shared/i18n';

interface TenantLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export default function TenantLayout({ children, activeTab, onSelectTab }: TenantLayoutProps) {
  const { language } = useLanguage();

  const menuItems = [
    { 
      id: 'dashboard', 
      label: language === 'en' ? 'Dashboard' : 'Dasbor', 
      icon: LayoutDashboard
    },
    { 
      id: 'properties', 
      label: language === 'en' ? 'Properties' : 'Properti', 
      icon: Building
    },
    { 
      id: 'reservations', 
      label: language === 'en' ? 'Reservations' : 'Reservasi', 
      icon: BookOpenCheck
    },
    { 
      id: 'finance', 
      label: language === 'en' ? 'Finance' : 'Keuangan', 
      icon: DollarSign
    },
    { 
      id: 'operations', 
      label: language === 'en' ? 'Operations' : 'Operasional', 
      icon: ClipboardList
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar Panel */}
        <aside className="lg:col-span-3 flex flex-col gap-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
          <div className="px-3 py-1">
            <span className="text-[10px] font-bold text-indigo-650 uppercase tracking-widest block bg-indigo-50/50 py-1 px-2.5 rounded-md inline-block">
              {language === 'en' ? 'Host Console' : 'Konsol Host'}
            </span>
          </div>

          <nav className="flex flex-row overflow-x-auto lg:flex-col gap-1.5 pb-2 lg:pb-0 scrollbar-none w-full">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-left text-xs font-semibold select-none transition-all duration-200 cursor-pointer shrink-0 lg:shrink lg:w-full ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-650 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Pane */}
        <main className="lg:col-span-9 flex flex-col gap-6">
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}

export type { TenantLayoutProps };
