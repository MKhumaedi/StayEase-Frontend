import React from 'react';
import { List, Grid } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';

interface PropertyViewSwitcherProps {
  view: 'list' | 'grid';
  onChange: (view: 'list' | 'grid') => void;
}

export function PropertyViewSwitcher({ view, onChange }: PropertyViewSwitcherProps) {
  const { language } = useLanguage();

  return (
    <div id="property-view-switcher" className="inline-flex items-center bg-slate-150 p-1 rounded-xl border border-slate-100 gap-1 shadow-inner h-9">
      <button
        id="switch-list-btn"
        onClick={() => onChange('list')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          view === 'list'
            ? 'bg-white text-indigo-950 shadow-sm'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <List className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{language === 'en' ? 'List View' : 'Tampilan Daftar'}</span>
      </button>
      <button
        id="switch-grid-btn"
        onClick={() => onChange('grid')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          view === 'grid'
            ? 'bg-white text-indigo-950 shadow-sm'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Grid className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{language === 'en' ? 'Grid View' : 'Tampilan Grid'}</span>
      </button>
    </div>
  );
}
