import React from 'react';
import { Bed, Bath, Users, Maximize, Check } from 'lucide-react';
import { useLanguage } from '../../../../shared/i18n';

const AMENITIES_LIST = [
  'Free high-speed WiFi',
  'Air Conditioning',
  'Infinity Swimming Pool',
  'Private Hot Tub',
  'Luxury Spa & Sauna',
  'Chef\'s Professional Kitchen',
  'Home Cinema Room',
  'Direct Sandy Beach Access',
  'Lush Mountain View',
  'Secure Private Garage',
  'Private Fitness Gym',
  'Smart TV with Streaming'
];

interface WizardStep4Props {
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
}

export function WizardStep4({ form, setForm }: WizardStep4Props) {
  const { language } = useLanguage();

  const handleNum = (field: string, val: number) => {
    setForm((prev: any) => ({
      ...prev,
      [field]: val
    }));
  };

  const toggleAmenity = (name: string) => {
    setForm((prev: any) => {
      const current = prev.amenities || [];
      const updated = current.includes(name) 
        ? current.filter((x: string) => x !== name) 
        : [...current, name];
      return { ...prev, amenities: updated };
    });
  };

  return (
    <div className="space-y-4">
      <div className="border-l-4 border-indigo-600 pl-3 py-1">
        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Step 3 of 8</h4>
        <h3 className="text-base font-black text-indigo-950">{language === 'en' ? 'Spatial & Amenities Checklist' : 'Fasilitas & Kapasitas Ruang'}</h3>
      </div>

      <div className="space-y-4">
        {/* Spatial counter cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col items-center justify-between text-center">
            <Bed className="w-5 h-5 text-indigo-600" />
            <span className="text-[10px] font-bold text-slate-600 mt-1">{language === 'en' ? 'Bedrooms' : 'Kamar'}</span>
            <div className="flex items-center gap-2.5 mt-2">
              <button type="button" onClick={() => handleNum('bedrooms', Math.max(1, form.bedrooms - 1))} className="w-6 h-6 border rounded-md flex items-center justify-center text-xs bg-white hover:bg-slate-100 font-bold">-</button>
              <span className="text-xs font-bold text-slate-800">{form.bedrooms}</span>
              <button type="button" onClick={() => handleNum('bedrooms', form.bedrooms + 1)} className="w-6 h-6 border rounded-md flex items-center justify-center text-xs bg-white hover:bg-slate-100 font-bold">+</button>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col items-center justify-between text-center">
            <Bath className="w-5 h-5 text-indigo-600" />
            <span className="text-[10px] font-bold text-slate-600 mt-1">{language === 'en' ? 'Bathrooms' : 'Mandi'}</span>
            <div className="flex items-center gap-2.5 mt-2">
              <button type="button" onClick={() => handleNum('bathrooms', Math.max(1, form.bathrooms - 1))} className="w-6 h-6 border rounded-md flex items-center justify-center text-xs bg-white hover:bg-slate-100 font-bold">-</button>
              <span className="text-xs font-bold text-slate-800">{form.bathrooms}</span>
              <button type="button" onClick={() => handleNum('bathrooms', form.bathrooms + 1)} className="w-6 h-6 border rounded-md flex items-center justify-center text-xs bg-white hover:bg-slate-100 font-bold">+</button>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col items-center justify-between text-center">
            <Users className="w-5 h-5 text-indigo-600" />
            <span className="text-[10px] font-bold text-slate-600 mt-1">{language === 'en' ? 'Max Guests' : 'Tamu Maks'}</span>
            <div className="flex items-center gap-2.5 mt-2">
              <button type="button" onClick={() => handleNum('guests', Math.max(1, form.guests - 1))} className="w-6 h-6 border rounded-md flex items-center justify-center text-xs bg-white hover:bg-slate-100 font-bold">-</button>
              <span className="text-xs font-bold text-slate-800">{form.guests}</span>
              <button type="button" onClick={() => handleNum('guests', form.guests + 1)} className="w-6 h-6 border rounded-md flex items-center justify-center text-xs bg-white hover:bg-slate-100 font-bold">+</button>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col items-center justify-between text-center">
            <Maximize className="w-5 h-5 text-indigo-600" />
            <span className="text-[10px] font-bold text-slate-600 mt-1">{language === 'en' ? 'Area Sqm' : 'Luas (m²)'}</span>
            <div className="flex items-center gap-1 mt-2">
              <input 
                type="number"
                value={form.areaSqm}
                onChange={(e) => handleNum('areaSqm', Math.max(5, parseInt(e.target.value) || 5))}
                className="w-12 bg-white border border-slate-200 py-0.5 rounded-md text-xs text-center font-bold text-slate-800"
              />
              <span className="text-[9px] text-slate-400 font-bold">m²</span>
            </div>
          </div>
        </div>

        {/* Perks / Amenities selector */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-indigo-950 block">{language === 'en' ? 'Select Perks & Amenities' : 'Pilih Fasilitas & Layanan Tersedia'}</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AMENITIES_LIST.map((am) => {
              const active = form.amenities?.includes(am);
              return (
                <div
                  key={am}
                  onClick={() => toggleAmenity(am)}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-semibold cursor-pointer transition-all select-none ${
                    active 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-950' 
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                    active ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-350 bg-white'
                  }`}>
                    {active && <Check className="w-2.5 h-2.5" />}
                  </div>
                  <span className="truncate">{am}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
