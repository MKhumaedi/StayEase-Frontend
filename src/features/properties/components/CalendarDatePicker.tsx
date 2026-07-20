import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Info } from 'lucide-react';

export interface DatePriceInfo {
  price: number;
  badge?: string;
  isPeak?: boolean;
  isPromo?: boolean;
}

interface CalendarDatePickerProps {
  startDate: string;
  endDate: string;
  onSelectStartDate: (date: string) => void;
  onSelectEndDate: (date: string) => void;
  language: string;
  activeField: 'checkIn' | 'checkOut';
  setActiveField: (field: 'checkIn' | 'checkOut') => void;
  onClose: () => void;
  ratesMap?: Record<string, DatePriceInfo>;
  basePrice?: number;
}

export const CalendarDatePicker: React.FC<CalendarDatePickerProps> = ({
  startDate,
  endDate,
  onSelectStartDate,
  onSelectEndDate,
  language,
  activeField,
  setActiveField,
  onClose,
  ratesMap = {},
  basePrice = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const getTodayLocalDate = (): Date => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const today = getTodayLocalDate();

  const parseLocalDate = (dateStr: string): Date => {
    if (!dateStr) return getTodayLocalDate();
    const parts = dateStr.split('-');
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  };

  const formatLocalDate = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const todayObj = getTodayLocalDate();
    return new Date(todayObj.getFullYear(), todayObj.getMonth(), 1);
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const canGoPrev = !(year < today.getFullYear() || (year === today.getFullYear() && month <= today.getMonth()));

  const handlePrevMonth = () => {
    if (canGoPrev) {
      setCurrentMonth(new Date(year, month - 1, 1));
    }
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatCompactCurrency = (val: number) => {
    if (!val || val <= 0) return '';
    if (val >= 1000000) {
      return (val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1) + 'jt';
    }
    if (val >= 1000) {
      return (val / 1000).toFixed(0) + 'k';
    }
    return val.toString();
  };

  const getDatePriceInfo = (isoDate: string): DatePriceInfo => {
    if (ratesMap[isoDate]) {
      return ratesMap[isoDate];
    }
    const d = parseLocalDate(isoDate);
    const day = d.getDay();
    const isWeekend = day === 0 || day === 5 || day === 6;
    const rate = isWeekend && basePrice > 0 ? basePrice * 1.2 : basePrice;

    return {
      price: rate,
      badge: isWeekend ? (language === 'en' ? 'Weekend' : 'Akhir Pekan') : undefined,
      isPeak: false,
      isPromo: false
    };
  };

  const handleDayClick = (dayNum: number) => {
    const cellDate = new Date(year, month, dayNum);
    const cellDateStr = formatLocalDate(cellDate);

    if (cellDate < today) return;

    if (activeField === 'checkIn') {
      onSelectStartDate(cellDateStr);
      setActiveField('checkOut');
    } else {
      const checkInObj = parseLocalDate(startDate);
      if (cellDate <= checkInObj) {
        onSelectStartDate(cellDateStr);
        const nextDay = new Date(cellDate);
        nextDay.setDate(nextDay.getDate() + 1);
        onSelectEndDate(formatLocalDate(nextDay));
        setActiveField('checkOut');
      } else {
        onSelectEndDate(cellDateStr);
        onClose();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, dayNum: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDayClick(dayNum);
    }
  };

  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthNamesId = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const monthName = language === 'en' ? monthNamesEn[month] : monthNamesId[month];

  const daysOfWeekEn = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const daysOfWeekId = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const daysOfWeek = language === 'en' ? daysOfWeekEn : daysOfWeekId;

  const activeSelectedIso = activeField === 'checkIn' ? startDate : endDate;
  const activePriceInfo = activeSelectedIso ? getDatePriceInfo(activeSelectedIso) : null;

  return (
    <div 
      ref={containerRef}
      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl border border-slate-150 shadow-2xl p-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200"
    >
      {/* Header Kalender */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-extrabold text-slate-800 font-display">
          {monthName} {year}
        </h4>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={!canGoPrev}
            onClick={handlePrevMonth}
            className={`p-1.5 rounded-xl border transition-all ${
              canGoPrev 
                ? 'border-slate-150 text-slate-600 hover:bg-slate-50 cursor-pointer' 
                : 'border-slate-100 text-slate-300 cursor-not-allowed opacity-40'
            }`}
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl border border-slate-150 text-slate-600 hover:bg-slate-50 cursor-pointer transition-all"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekdays Header */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {daysOfWeek.map((day) => (
          <span key={day} className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            {day}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div 
        className="grid grid-cols-7 gap-1 text-center"
        onMouseLeave={() => setHoveredDate(null)}
      >
        {Array.from({ length: firstDayIndex }).map((_, idx) => (
          <div key={`empty-${idx}`} className="h-11" />
        ))}

        {Array.from({ length: totalDays }).map((_, idx) => {
          const dayNum = idx + 1;
          const cellDate = new Date(year, month, dayNum);
          const cellDateStr = formatLocalDate(cellDate);

          const isDisabled = cellDate < today;
          const isTodayCell = cellDate.getTime() === today.getTime();
          const isCheckIn = cellDateStr === startDate;
          const isCheckOut = cellDateStr === endDate;
          const isSelected = isCheckIn || isCheckOut;
          const isRange = startDate && endDate && cellDateStr > startDate && cellDateStr < endDate;
          const isHoverRange = !isRange && activeField === 'checkOut' && startDate && hoveredDate && cellDateStr > startDate && cellDateStr <= hoveredDate;

          const priceInfo = getDatePriceInfo(cellDateStr);

          let btnClasses = 'w-full h-11 text-xs font-semibold flex flex-col items-center justify-center transition-all focus:outline-none cursor-pointer ';

          if (isDisabled) {
            btnClasses += 'text-slate-300 opacity-25 cursor-not-allowed ';
          } else if (isSelected) {
            btnClasses += 'bg-indigo-600 text-white font-extrabold rounded-xl shadow-md shadow-indigo-200 scale-105 z-10 ';
          } else if (isRange) {
            btnClasses += 'bg-indigo-50 text-indigo-950 font-bold rounded-none ';
          } else if (isHoverRange) {
            btnClasses += 'bg-indigo-50/40 text-indigo-900 rounded-none ';
          } else if (isTodayCell) {
            btnClasses += 'border border-indigo-300 text-indigo-600 font-bold rounded-xl hover:bg-slate-50 ';
          } else {
            btnClasses += 'text-slate-700 hover:bg-slate-100 rounded-xl ';
          }

          return (
            <button
              key={`day-${dayNum}`}
              type="button"
              disabled={isDisabled}
              tabIndex={isDisabled ? -1 : 0}
              onClick={() => handleDayClick(dayNum)}
              onKeyDown={(e) => handleKeyDown(e, dayNum)}
              onMouseEnter={() => {
                if (!isDisabled) {
                  setHoveredDate(cellDateStr);
                }
              }}
              className={btnClasses}
            >
              <span className="leading-none">{dayNum}</span>
              {!isDisabled && priceInfo.price > 0 && (
                <span className={`text-[8px] font-medium leading-tight mt-0.5 ${
                  isSelected 
                    ? 'text-indigo-100 font-semibold' 
                    : priceInfo.isPeak 
                    ? 'text-purple-600 font-bold' 
                    : priceInfo.isPromo 
                    ? 'text-emerald-600 font-bold' 
                    : 'text-slate-400'
                }`}>
                  {formatCompactCurrency(priceInfo.price)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Section Nominal Harga di Kolom Bawah Kalender saat Tanggal Klik */}
      {activeSelectedIso && activePriceInfo && activePriceInfo.price > 0 && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 bg-indigo-50/50 -mx-5 -mb-5 p-3.5 rounded-b-3xl flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-wider text-indigo-900/70">
              {activeField === 'checkIn' 
                ? (language === 'en' ? 'Check-in Rate' : 'Harga Check-in') 
                : (language === 'en' ? 'Check-out Date Rate' : 'Harga Check-out')}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-bold text-slate-700">
                {parseLocalDate(activeSelectedIso).toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              {activePriceInfo.badge && (
                <span className="text-[8px] font-black bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded uppercase">
                  {activePriceInfo.badge}
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="block text-sm font-extrabold text-indigo-950">
              {formatCurrency(activePriceInfo.price)}
            </span>
            <span className="text-[9px] font-medium text-slate-500">
              / {language === 'en' ? 'night' : 'malam'}
            </span>
          </div>
        </div>
      )}

      {/* Footer Navigasi */}
      <div className="mt-3 pt-2 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5 font-bold">
          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
          <span>
            {activeField === 'checkIn' 
              ? (language === 'en' ? 'Select Check-In Date' : 'Pilih Tanggal Check-In')
              : (language === 'en' ? 'Select Check-Out Date' : 'Pilih Tanggal Check-Out')}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-indigo-600 hover:text-indigo-800 font-extrabold cursor-pointer"
        >
          {language === 'en' ? 'Close' : 'Tutup'}
        </button>
      </div>
    </div>
  );
};