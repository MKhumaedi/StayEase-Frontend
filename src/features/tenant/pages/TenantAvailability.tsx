import React, { useState, useEffect } from 'react';
import { CalendarRange, Loader2, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';

export default function TenantAvailability() {
  const { language, formatCurrencyIDR } = useLanguage();
  const [roomId, setRoomId] = useState('room-101');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [overridePrice, setOverridePrice] = useState('520');
  const [loading, setLoading] = useState(false);
  const [calendarGrid, setCalendarGrid] = useState<any[]>([]);

  // Simple static days of June 2026 (Stitch mocks base month)
  useEffect(() => {
    const list = [];
    const basePrices = roomId === 'room-101' ? 450 : 210;
    for (let day = 1; day <= 30; day++) {
      const dateStr = `2026-06-${day.toString().padStart(2, '0')}`;
      // Simulate existing blocks/rewards
      const blocked = day === 8 || day === 11 || day === 29;
      const rate = day === 12 || day === 22 ? 520 : basePrices;

      list.push({
        date: dateStr,
        day,
        isBlocked: blocked,
        price: rate,
        isOverridden: rate !== basePrices
      });
    }
    setCalendarGrid(list);
  }, [roomId]);

  const handleSelectDay = (date: string) => {
    setSelectedDays(p => p.includes(date) ? p.filter(d => d !== date) : [...p, date]);
  };

  const handleApplyRules = async () => {
    if (selectedDays.length === 0) return;
    setLoading(true);
    try {
      await fetch('/api/properties/calendar/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          dates: selectedDays,
          isBlocked,
          priceOverride: overridePrice ? parseFloat(overridePrice) : undefined
        })
      });
      // Toggle client representation directly
      setCalendarGrid(prev => prev.map(cell => {
        if (selectedDays.includes(cell.date)) {
          return { ...cell, isBlocked, price: overridePrice ? parseFloat(overridePrice) : cell.price, isOverridden: true };
        }
        return cell;
      }));
      setSelectedDays([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-indigo-950 font-display">
            {language === 'en' ? 'Availability & Pricing' : 'Ketersediaan & Harga'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'en' ? 'Configure daily price schedules, blocked dates, and custom season rates multiplier' : 'Atur jadwal harga harian, tanggal penutupan hunian, dan multiplier pengali tarif khusus'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Calendar Representation */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm font-bold text-slate-800">June 2026</span>
            <select value={roomId} onChange={e => setRoomId(e.target.value)} className="bg-slate-50 border text-xs font-semibold rounded-lg p-2 focus:outline-hidden cursor-pointer">
              <option value="room-101">Suite 401 (Master Suite)</option>
              <option value="room-102">Studio 204 (Studio Type)</option>
            </select>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarGrid.map((c, idx) => {
              const isSelected = selectedDays.includes(c.date);
              return (
                <div 
                  key={idx} 
                  onClick={() => handleSelectDay(c.date)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all aspect-square flex flex-col justify-between ${isSelected ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600' : c.isBlocked ? 'border-red-150 bg-red-50/30' : c.isOverridden ? 'border-amber-150 bg-amber-50/30' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
                >
                  <span className="text-xs font-bold text-slate-700">{c.day}</span>
                  <span className={`text-[9px] sm:text-[10px] font-black ${c.isBlocked ? 'text-red-500 line-through' : c.isOverridden ? 'text-amber-600' : 'text-slate-550'}`}>
                    {c.isBlocked ? (language === 'en' ? 'Blocked' : 'Tutup') : formatCurrencyIDR(c.price)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Calendar Side Control Matrix */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs h-fit">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            {language === 'en' ? 'Rule Editor' : 'Atur Aturan Harga'}
          </h4>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-455 block mb-1">
                {language === 'en' ? 'Override Price' : 'Tarif Timpa Baru'}
              </label>
              <input type="number" value={overridePrice} onChange={e => setOverridePrice(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold p-2.5 rounded-lg focus:outline-hidden" />
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
              <input type="checkbox" checked={isBlocked} onChange={e => setIsBlocked(e.target.checked)} className="rounded-sm accent-indigo-900 cursor-pointer" />
              {language === 'en' ? 'Block Calendar Day(s)' : 'Tutup Akses Pemesanan Tanggal Ini'}
            </label>

            <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/50 flex gap-2">
              <CalendarRange className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-500 leading-normal font-semibold">
                {language === 'en' 
                  ? 'Select one or several daily cell tiles directly on the grid calendar, then set overrides here to apply rules.' 
                  : 'Pilih satu atau beberapa kotak tanggal di kalender, lalu masukkan harga timpa atau pilih tutup akses di sini.'}
              </p>
            </div>

            <button 
              onClick={handleApplyRules} 
              disabled={loading || selectedDays.length === 0}
              className="w-full bg-indigo-900 hover:bg-indigo-850 disabled:bg-slate-200 disabled:cursor-not-allowed text-white text-xs font-bold py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} 
              {language === 'en' ? `Apply to ${selectedDays.length} Cell(s)` : `Terapkan ke ${selectedDays.length} Tanggal`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
