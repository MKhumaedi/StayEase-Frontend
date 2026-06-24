import React from 'react';
import { CalendarDays } from 'lucide-react';
import { useLanguage } from '../../../../shared/i18n';

interface WizardStep6Props {
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
}

export function WizardStep6({ form, setForm }: WizardStep6Props) {
  const { language } = useLanguage();

  // Helper arrays for calendar generation
  const getDaysInMonth = (offsetMonths: number) => {
    const d = new Date();
    const year = d.getFullYear();
    const month = d.getMonth() + offsetMonths;
    const days: Date[] = [];
    const date = new Date(year, month, 1);
    while (date.getMonth() === (d.getMonth() + offsetMonths) % 12) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const daysFirst = getDaysInMonth(0);
  const daysSecond = getDaysInMonth(1);

  const toggleCalendarDate = (dateStr: string) => {
    setForm((prev: any) => {
      const blocked = prev.blockedDates || [];
      const updated = blocked.includes(dateStr)
        ? blocked.filter((x: string) => x !== dateStr)
        : [...blocked, dateStr];
      return { ...prev, blockedDates: updated };
    });
  };

  return (
    <div className="space-y-4">
      <div className="border-l-4 border-indigo-600 pl-3 py-1">
        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Step 7 of 8</h4>
        <h3 className="text-base font-black text-indigo-950">{language === 'en' ? 'Stays Host Calendar Blocks' : 'Pengaturan Blokir Kalender'}</h3>
      </div>

      <div className="space-y-3">
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-500 leading-relaxed flex items-start gap-2 select-none">
          <CalendarDays className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            {language === 'en' 
              ? 'Click any date below to block off rentals for preparation or maintenance. Red dates represent blocked/inactive days.' 
              : 'Klik slot tanggal di bawah ini untuk menandai libur atau hari perawatan sehingga tamu tidak dapat memesan.'}
          </span>
        </div>

        {/* Calendar views scroll */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 select-none">
          {/* Current Month */}
          <div className="border border-slate-150 rounded-xl p-3 bg-white space-y-1.5">
            <span className="text-[11px] font-black text-indigo-950 block">
              {new Date().toLocaleString(language === 'en' ? 'en' : 'id', { month: 'long', year: 'numeric' })}
            </span>
            <div className="grid grid-cols-7 gap-0.5 text-center font-bold text-[9px] text-slate-400 border-b pb-1">
              <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {daysFirst.map((d, i) => {
                const dateStr = d.toISOString().split('T')[0];
                const active = form.blockedDates?.includes(dateStr);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleCalendarDate(dateStr)}
                    className={`aspect-square rounded-md text-[9px] font-black cursor-pointer transition-colors ${
                      active 
                        ? 'bg-rose-600 text-white shadow-xs' 
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Next Month */}
          <div className="border border-slate-150 rounded-xl p-3 bg-white space-y-1.5">
            <span className="text-[11px] font-black text-indigo-950 block">
              {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleString(language === 'en' ? 'en' : 'id', { month: 'long', year: 'numeric' })}
            </span>
            <div className="grid grid-cols-7 gap-0.5 text-center font-bold text-[9px] text-slate-400 border-b pb-1">
              <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {daysSecond.map((d, i) => {
                const dateStr = d.toISOString().split('T')[0];
                const active = form.blockedDates?.includes(dateStr);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleCalendarDate(dateStr)}
                    className={`aspect-square rounded-md text-[9px] font-black cursor-pointer transition-colors ${
                      active 
                        ? 'bg-rose-600 text-white shadow-xs' 
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
