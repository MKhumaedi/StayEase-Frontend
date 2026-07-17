import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface CalendarDatePickerProps {
  startDate: string;
  endDate: string;
  onSelectStartDate: (date: string) => void;
  onSelectEndDate: (date: string) => void;
  language: string;
  activeField: 'checkIn' | 'checkOut';
  setActiveField: (field: 'checkIn' | 'checkOut') => void;
  onClose: () => void;
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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Get local midnight today
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

  // Open on current month (Today's month is always the first visible month)
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const todayObj = getTodayLocalDate();
    return new Date(todayObj.getFullYear(), todayObj.getMonth(), 1);
  });

  // Click outside to close
  React.useEffect(() => {
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

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Prevent navigating to months entirely before today
  const canGoPrev = !(year < today.getFullYear() || (year === today.getFullYear() && month <= today.getMonth()));

  const handlePrevMonth = () => {
    if (canGoPrev) {
      setCurrentMonth(new Date(year, month - 1, 1));
    }
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleDayClick = (dayNum: number) => {
    const cellDate = new Date(year, month, dayNum);
    const cellDateStr = formatLocalDate(cellDate);

    if (cellDate < today) return; // Prevent selection of past dates

    if (activeField === 'checkIn') {
      onSelectStartDate(cellDateStr);
      // Auto-switch to checkout selection
      setActiveField('checkOut');
    } else {
      // If user selects check-out date on or before check-in, set check-in to this date instead and stay on check-out
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
    'Juli', 'Agustus', 'September', 'Oktobor', 'November', 'Desember'
  ];

  const monthName = language === 'en' ? monthNamesEn[month] : monthNamesId[month];

  const daysOfWeekEn = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const daysOfWeekId = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const daysOfWeek = language === 'en' ? daysOfWeekEn : daysOfWeekId;

  return (
    <div 
      ref={containerRef}
      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl border border-slate-150 shadow-2xl p-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200"
    >
      {/* Calendar Header */}
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
        {/* Empty cells for padding */}
        {Array.from({ length: firstDayIndex }).map((_, idx) => (
          <div key={`empty-${idx}`} className="aspect-square" />
        ))}

        {/* Calendar days */}
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

          let btnClasses = 'w-full aspect-square text-xs font-semibold flex items-center justify-center transition-all focus:outline-none ';

          if (isDisabled) {
            btnClasses += 'text-slate-300 opacity-25 cursor-not-allowed ';
          } else if (isSelected) {
            btnClasses += 'bg-indigo-600 text-white font-extrabold rounded-full shadow-sm scale-105 ring-2 ring-indigo-600/20 ';
          } else if (isRange) {
            btnClasses += 'bg-indigo-50 text-indigo-950 font-bold rounded-lg hover:bg-indigo-100/70 ';
          } else if (isHoverRange) {
            btnClasses += 'bg-indigo-50/40 text-indigo-900 rounded-lg ';
          } else if (isTodayCell) {
            btnClasses += 'border border-indigo-300 text-indigo-600 font-bold rounded-full hover:bg-slate-50 ';
          } else {
            btnClasses += 'text-slate-700 hover:bg-slate-100 rounded-full ';
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
              {dayNum}
            </button>
          );
        })}
      </div>

      {/* Active Selection Help Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
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
          className="text-indigo-600 hover:text-indigo-800 font-extrabold"
        >
          {language === 'en' ? 'Close' : 'Tutup'}
        </button>
      </div>
    </div>
  );
};
