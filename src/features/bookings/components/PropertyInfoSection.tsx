import React from 'react';
import { Home, Calendar, BedDouble } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';

interface PropertyProps {
  propertyName: string;
  roomName: string;
  startDate: string;
  endDate: string;
  nights: number;
}

export default function PropertyInfoSection({
  propertyName,
  roomName,
  startDate,
  endDate,
  nights
}: PropertyProps) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  return (
    <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex flex-col gap-3">
      <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1">
        <Home className="w-3.5 h-3.5 text-indigo-600" /> Lodging & Stay Details
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
        <div className="bg-white p-4 border rounded-xl flex items-start gap-3">
          <BedDouble className="w-8 h-8 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] text-slate-400 block pb-0.5">Assigned Room</span>
            <div className="text-slate-800 font-bold block text-sm">{propertyName}</div>
            <div className="text-slate-500 text-[11px] block mt-0.5">{roomName}</div>
          </div>
        </div>

        <div className="bg-white p-4 border rounded-xl flex items-start gap-3">
          <Calendar className="w-8 h-8 text-indigo-500 shrink-0 mt-0.5" />
          <div className="w-full">
            <span className="text-[10px] text-slate-400 block pb-0.5">Stay Period</span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Check In</span>
                <span className="text-slate-800">{startDate}</span>
              </div>
              <div className="text-center font-bold text-slate-400 border-l border-r px-1 self-center">
                {nights} {isEn ? 'Nights' : 'Malam'}
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Check Out</span>
                <span className="text-slate-800">{endDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
