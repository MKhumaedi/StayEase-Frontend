import React from 'react';
import { PropertyCategory } from '../../../../types';
import { useLanguage } from '../../../../shared/i18n';

interface WizardStep1Props {
  form: any;
  categories: PropertyCategory[];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export function WizardStep1({ form, categories, onChange }: WizardStep1Props) {
  const { language } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="border-l-4 border-indigo-600 pl-3 py-1">
        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Step 1 of 8</h4>
        <h3 className="text-base font-black text-indigo-950">{language === 'en' ? 'Asset Concept & Naming' : 'Nama & Jenis Properti'}</h3>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-indigo-950">{language === 'en' ? 'Property Title' : 'Nama Properti'} <span className="text-rose-500">*</span></label>
          <input 
            type="text"
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="e.g. Montecito Ocean Cliff Sanctuary"
            className="bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600 transition-colors text-slate-800"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-indigo-950">{language === 'en' ? 'Property Category' : 'Kategori Properti'} <span className="text-rose-500">*</span></label>
          <select
            name="categoryId"
            value={form.categoryId}
            onChange={onChange}
            className="bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600 transition-colors text-slate-800"
          >
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-indigo-950">{language === 'en' ? 'Description' : 'Deskripsi'} <span className="text-rose-500">*</span></label>
          <textarea
            name="description"
            rows={4}
            value={form.description}
            onChange={onChange}
            placeholder="Provide a detailed, elegant description of the unique architecture and stay feelings..."
            className="bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600 transition-colors leading-relaxed text-slate-800"
          />
          <span className="text-[10px] text-slate-400 font-medium">Minimum 10 characters.</span>
        </div>
      </div>
    </div>
  );
}
