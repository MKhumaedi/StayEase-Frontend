import React from 'react';
import { Star } from 'lucide-react';
import { PropertyCategory } from '../../../../types';
import { useLanguage } from '../../../../shared/i18n';

interface WizardStep7Props {
  form: any;
  categories: PropertyCategory[];
}

export function WizardStep7({ form, categories }: WizardStep7Props) {
  const { language, formatCurrencyIDR } = useLanguage();

  const categoryName = categories.find(c => c.id === form.categoryId)?.name || 'StayEase Stays';
  const coverImage = form.imageUrls?.[form.coverImageIndex] || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&q=80';

  return (
    <div className="space-y-4">
      <div className="border-l-4 border-indigo-600 pl-3 py-1">
        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Step 8 of 8</h4>
        <h3 className="text-base font-black text-indigo-950">{language === 'en' ? 'Live StayEase Stays Preview' : 'Pratinjau Hasil Desain Card'}</h3>
      </div>

      <div className="flex flex-col sm:flex-row gap-5 items-start">
        {/* Render Live Preview Card precisely matching home listings */}
        <div className="w-full sm:max-w-xs mx-auto shrink-0 bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-xl flex flex-col pointer-events-none">
          <div className="relative aspect-video overflow-hidden bg-slate-50">
            <img src={coverImage} alt={form.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <span className="absolute top-3 left-3 bg-slate-900/90 text-white text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-md">
              {categoryName}
            </span>
            <span className="absolute top-3 right-3 bg-emerald-500/90 text-white text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-md">
              {language === 'en' ? 'Available' : 'Tersedia'}
            </span>
          </div>

          <div className="p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold">
                <span className="uppercase tracking-wide text-indigo-950/80">
                  {form.city ? `${form.city}, ${form.province || 'Indonesia'}` : 'Jakarta, Indonesia'}
                </span>
                <div className="flex items-center gap-0.5 text-amber-500">
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-slate-800 font-extrabold">5.0</span>
                </div>
              </div>

              <h4 className="font-extrabold text-slate-900 text-sm mt-1 mb-1 truncate">
                {form.name || 'StayEase Premium Sanctuary'}
              </h4>
              <p className="text-slate-400 text-[10px] line-clamp-2 leading-relaxed">
                {form.description || 'Add custom listing info to fill descriptive items...'}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-slate-50 pt-3">
              <div>
                <span className="text-[8px] font-black text-slate-450 uppercase block mb-0.5">{language === 'en' ? 'Base Overnights' : 'Tarif Dasar'}</span>
                <span className="text-xs font-black text-indigo-950">
                  {formatCurrencyIDR(form.basePrice)}
                  <span className="text-[10px] text-slate-400 font-normal"> / night</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Verification lists */}
        <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-500 text-[11px] font-bold space-y-2">
          <span className="text-xs font-black text-indigo-950 block border-b pb-1.5">{language === 'en' ? 'Review Registry Details' : 'Tinjau Rincian Katalog'}</span>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="text-[8px] text-slate-400 block uppercase">Address</span>
              <span className="truncate block font-extrabold text-slate-700">{form.fullAddress || '-'}</span>
            </div>
            <div>
              <span className="text-[8px] text-slate-400 block uppercase">Coordinates</span>
              <span className="block font-extrabold text-slate-700">{form.latitude.toFixed(3)}, {form.longitude.toFixed(3)}</span>
            </div>
            <div>
              <span className="text-[8px] text-slate-400 block uppercase">Limit Capacity</span>
              <span className="block font-extrabold text-slate-700">{form.guests} {language === 'en' ? 'Guests Max' : 'Tamu Maks'}</span>
            </div>
            <div>
              <span className="text-[8px] text-slate-400 block uppercase">Amenities</span>
              <span className="block font-extrabold text-slate-700">{form.amenities?.length || 0} items</span>
            </div>
          </div>
          <p className="text-[9px] text-indigo-650 bg-indigo-50 border border-indigo-100 p-2 rounded-xl">
            {language === 'en'
              ? 'Ready to publish. This listing matches standard StayEase requirements. Click "Publish Listing" below.'
              : 'Siap untuk dipublikasikan. Katalog ini memenuhi prasyarat platform StayEase.'}
          </p>
        </div>
      </div>
    </div>
  );
}
