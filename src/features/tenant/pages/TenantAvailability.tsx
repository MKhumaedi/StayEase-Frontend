import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalendarRange, 
  Loader2, 
  RefreshCw, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Edit3, 
  X,
  Info,
  Calendar,
  Building,
  DollarSign,
  Lock,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';
import { useAuth } from '../../../shared/context/AuthContext';

export default function TenantAvailability() {
  const { language, formatCurrencyIDR } = useLanguage();
  const { token } = useAuth();

  // Selected state
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');
  const [rules, setRules] = useState<any[]>([]);
  
  // Loading & Error states
  const [loading, setLoading] = useState(false);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Calendar view navigation
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // October 2026 default to fit mockup dates

  // Form states for rule configuration
  const [editingRuleName, setEditingRuleName] = useState<string | null>(null);
  const [ruleName, setRuleName] = useState('');
  const [applyMode, setApplyMode] = useState<'SINGLE' | 'RANGE' | 'MULTIPLE'>('RANGE');
  const [startDate, setStartDate] = useState('2026-10-12');
  const [endDate, setEndDate] = useState('2026-10-15');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [adjustmentOption, setAdjustmentOption] = useState<'PERCENTAGE' | 'FIXED' | 'DISCOUNT'>('PERCENTAGE');
  const [adjustmentValue, setAdjustmentValue] = useState<string>('20');
  const [isClosed, setIsClosed] = useState(false);
  const [closedReason, setClosedReason] = useState('');

  // 1. Fetch properties on load
  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        const res = await fetch('/api/properties?byTenant=true', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const payload = await res.json();
          const props = payload.data || [];
          setProperties(props);
          if (props.length > 0) {
            setSelectedPropertyId(props[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
  }, [token]);

  // 2. Fetch property details, rooms, and rules when selectedPropertyId changes
  const fetchPropertyData = async () => {
    if (!selectedPropertyId) return;
    try {
      setRulesLoading(true);
      // Fetch property detail (which contains rooms)
      const propRes = await fetch(`/api/properties/${selectedPropertyId}`);
      if (propRes.ok) {
        const propData = await propRes.json();
        setRooms(propData.rooms || []);
      }

      // Fetch Peak Season Rules for this property
      const rulesRes = await fetch(`/api/properties/${selectedPropertyId}/peak-seasons`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        setRules(rulesData.seasons || []);
      }
    } catch (err) {
      console.error('Error fetching property specific details:', err);
    } finally {
      setRulesLoading(false);
    }
  };

  useEffect(() => {
    fetchPropertyData();
    // Reset selected days and form states on property change
    setSelectedDates([]);
    handleResetForm();
  }, [selectedPropertyId, token]);

  // Calendar month names helper
  const monthNames = useMemo(() => {
    return language === 'en' 
      ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      : ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  }, [language]);

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Generate calendar grid for the selected month/year
  const calendarGrid = useMemo(() => {
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const totalDays = endOfMonth.getDate();
    const startDayOfWeek = startOfMonth.getDay(); // 0 is Sunday, etc.

    const list = [];
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Get basic details
    const activeRooms = selectedRoomId === 'all' ? rooms : rooms.filter(r => r.id === selectedRoomId);
    const averageBasePrice = activeRooms.length > 0 
      ? Math.round(activeRooms.reduce((sum, r) => sum + Number(r.basePrice || 0), 0) / activeRooms.length)
      : 500000;

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

      // Find matching rules for this date
      const matchingRules = rules.filter(r => r.isActive !== false && dateStr >= r.startDate && dateStr <= r.endDate);
      const isToday = dateStr === todayStr;

      // Check if there are closed/blocked rooms on this date
      let isBlocked = false;
      if (selectedRoomId !== 'all') {
        const room = rooms.find(r => r.id === selectedRoomId);
        isBlocked = room?.availabilities?.some((o: any) => o.date === dateStr && o.isBlocked) || false;
      } else {
        // If all rooms, check if at least one room is blocked
        isBlocked = rooms.some(r => r.availabilities?.some((o: any) => o.date === dateStr && o.isBlocked));
      }

      // Check if Peak Season applies
      let isPeak = false;
      let matchedRule: any = null;
      if (matchingRules.length > 0) {
        // Prioritize specific room rule or take general property rule
        const specificRule = matchingRules.find(r => r.roomId === selectedRoomId);
        const generalRule = matchingRules.find(r => !r.roomId);
        matchedRule = specificRule || generalRule || matchingRules[0];
        isPeak = matchedRule ? true : false;
      }

      // Calculate displayed price
      let displayPrice = averageBasePrice;
      if (matchedRule) {
        if (matchedRule.adjustmentType === 'FIXED_AMOUNT_INCREASE') {
          displayPrice = averageBasePrice + Number(matchedRule.adjustmentValue);
        } else {
          displayPrice = Math.round(averageBasePrice * Number(matchedRule.rateMultiplier || 1));
        }
      } else if (isWeekend) {
        displayPrice = Math.round(averageBasePrice * 1.25); // standard 25% weekend markup
      }

      list.push({
        date: dateStr,
        day,
        isWeekend,
        isToday,
        isBlocked,
        isPeak,
        matchedRule,
        price: displayPrice,
      });
    }

    // Add empty spacer items for padding alignment
    const spacers = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      spacers.push(null);
    }

    return [...spacers, ...list];
  }, [currentYear, currentMonth, selectedRoomId, rooms, rules]);

  // Click on Calendar Day cell
  const handleSelectDay = (dateStr: string) => {
    if (applyMode === 'SINGLE') {
      setStartDate(dateStr);
      setEndDate(dateStr);
      setSelectedDates([dateStr]);
    } else if (applyMode === 'RANGE') {
      if (!startDate || (startDate && endDate)) {
        setStartDate(dateStr);
        setEndDate('');
      } else {
        if (dateStr >= startDate) {
          setEndDate(dateStr);
        } else {
          setStartDate(dateStr);
          setEndDate('');
        }
      }
    } else { // MULTIPLE
      setSelectedDates(prev => 
        prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
      );
    }
  };

  // Switch apply modes and sync selections
  useEffect(() => {
    if (applyMode === 'SINGLE') {
      if (startDate) {
        setEndDate(startDate);
        setSelectedDates([startDate]);
      }
    } else if (applyMode === 'RANGE') {
      if (selectedDates.length > 0) {
        const sorted = [...selectedDates].sort();
        setStartDate(sorted[0]);
        setEndDate(sorted[sorted.length - 1] || sorted[0]);
      }
    } else { // MULTIPLE
      if (startDate && endDate) {
        // Populate dates list from range
        const dates: string[] = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        const curr = new Date(start);
        while (curr <= end) {
          const yyyy = curr.getFullYear();
          const mm = String(curr.getMonth() + 1).padStart(2, '0');
          const dd = String(curr.getDate()).padStart(2, '0');
          dates.push(`${yyyy}-${mm}-${dd}`);
          curr.setDate(curr.getDate() + 1);
        }
        setSelectedDates(dates);
      }
    }
  }, [applyMode]);

  // Calculate live preview price metrics
  const previewPriceMetrics = useMemo(() => {
    const activeRooms = selectedRoomId === 'all' ? rooms : rooms.filter(r => r.id === selectedRoomId);
    const averageBasePrice = activeRooms.length > 0 
      ? Math.round(activeRooms.reduce((sum, r) => sum + Number(r.basePrice || 0), 0) / activeRooms.length)
      : 500000;

    const valueNum = Number(adjustmentValue) || 0;
    let adjustedPrice = averageBasePrice;

    if (isClosed) {
      return { base: averageBasePrice, adjusted: 0, closed: true };
    }

    if (adjustmentOption === 'PERCENTAGE') {
      adjustedPrice = Math.round(averageBasePrice * (1 + valueNum / 100));
    } else if (adjustmentOption === 'DISCOUNT') {
      adjustedPrice = Math.round(averageBasePrice * (1 - valueNum / 100));
    } else { // FIXED
      adjustedPrice = averageBasePrice + valueNum;
    }

    return { base: averageBasePrice, adjusted: adjustedPrice, closed: false };
  }, [selectedRoomId, rooms, adjustmentOption, adjustmentValue, isClosed]);

  // Form Reset
  const handleResetForm = () => {
    setRuleName('');
    setEditingRuleName(null);
    setStartDate('2026-10-12');
    setEndDate('2026-10-15');
    setSelectedDates([]);
    setAdjustmentOption('PERCENTAGE');
    setAdjustmentValue('20');
    setIsClosed(false);
    setClosedReason('');
    setSelectedRoomId('all');
    setError(null);
    setSuccess(null);
  };

  // Populate form to edit rule
  const handleEditRuleClick = (rule: any) => {
    setError(null);
    setSuccess(null);
    setEditingRuleName(rule.name);
    setRuleName(rule.name);
    setSelectedRoomId(rule.roomId || 'all');
    
    // Set dates
    setStartDate(rule.startDate);
    setEndDate(rule.endDate);
    
    if (rule.startDate === rule.endDate) {
      setApplyMode('SINGLE');
      setSelectedDates([rule.startDate]);
    } else {
      setApplyMode('RANGE');
    }

    // Set adjustments
    if (rule.adjustmentType === 'FIXED_AMOUNT_INCREASE') {
      setAdjustmentOption('FIXED');
      setAdjustmentValue(String(Math.abs(rule.adjustmentValue)));
    } else {
      if (rule.adjustmentValue < 0) {
        setAdjustmentOption('DISCOUNT');
        setAdjustmentValue(String(Math.abs(rule.adjustmentValue)));
      } else {
        setAdjustmentOption('PERCENTAGE');
        setAdjustmentValue(String(rule.adjustmentValue));
      }
    }

    setIsClosed(rule.rateMultiplier === 0);
  };

  // Save/Submit peak season rule
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) {
      setError(language === 'en' ? 'Rule name is required.' : 'Nama aturan harus diisi.');
      return;
    }

    setSubmitLoading(true);
    setError(null);
    setSuccess(null);

    // Compute multiplier and database values
    const valueNum = Number(adjustmentValue) || 0;
    let finalMultiplier = 1.0;
    let dbAdjustmentType = 'PERCENTAGE_INCREASE';
    let dbAdjustmentValue = valueNum;

    if (isClosed) {
      finalMultiplier = 0.0;
    } else if (adjustmentOption === 'PERCENTAGE') {
      finalMultiplier = 1 + valueNum / 100;
      dbAdjustmentType = 'PERCENTAGE_INCREASE';
      dbAdjustmentValue = valueNum;
    } else if (adjustmentOption === 'DISCOUNT') {
      finalMultiplier = 1 - valueNum / 100;
      dbAdjustmentType = 'PERCENTAGE_INCREASE';
      dbAdjustmentValue = -valueNum;
    } else { // FIXED
      finalMultiplier = 1.0; // Handled directly via adjustment type inside calculation engine
      dbAdjustmentType = 'FIXED_AMOUNT_INCREASE';
      dbAdjustmentValue = valueNum;
    }

    const payload = {
      name: ruleName,
      roomId: selectedRoomId === 'all' ? null : selectedRoomId,
      applyMode,
      startDate: applyMode === 'MULTIPLE' ? selectedDates[0] : startDate,
      endDate: applyMode === 'MULTIPLE' ? selectedDates[selectedDates.length - 1] : endDate,
      dates: selectedDates,
      rateMultiplier: finalMultiplier,
      adjustmentType: dbAdjustmentType,
      adjustmentValue: dbAdjustmentValue,
      isActive: true,
      isClosed,
      closedReason
    };

    const targetUrl = editingRuleName 
      ? `/api/properties/${selectedPropertyId}/peak-seasons/${encodeURIComponent(editingRuleName)}`
      : `/api/properties/${selectedPropertyId}/peak-seasons`;

    try {
      const res = await fetch(targetUrl, {
        method: editingRuleName ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to save rule.');
      }

      setSuccess(language === 'en' ? 'Peak season rule saved successfully!' : 'Aturan musim ramai berhasil disimpan!');
      handleResetForm();
      fetchPropertyData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Toggle activation status
  const handleToggleRuleStatus = async (rule: any) => {
    setError(null);
    setSuccess(null);
    const nextStatus = !rule.isActive;
    try {
      // Optimistic update
      setRules(prev => prev.map(r => r.name === rule.name ? { ...r, isActive: nextStatus } : r));

      const res = await fetch(`/api/properties/${selectedPropertyId}/peak-seasons/${encodeURIComponent(rule.name)}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ isActive: nextStatus })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to toggle status.');
      }
    } catch (err: any) {
      setError(err.message);
      fetchPropertyData(); // rollback
    }
  };

  // Delete Rule (soft delete)
  const handleDeleteRule = async (ruleName: string) => {
    if (!window.confirm(language === 'en' ? `Are you sure you want to delete rule "${ruleName}"?` : `Apakah Anda yakin ingin menghapus aturan "${ruleName}"?`)) {
      return;
    }

    setError(null);
    setSuccess(null);
    try {
      setRules(prev => prev.filter(r => r.name !== ruleName));

      const res = await fetch(`/api/properties/${selectedPropertyId}/peak-seasons/${encodeURIComponent(ruleName)}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete rule.');
      }

      setSuccess(language === 'en' ? 'Rule deleted successfully.' : 'Aturan berhasil dihapus.');
      fetchPropertyData();
    } catch (err: any) {
      setError(err.message);
      fetchPropertyData(); // rollback
    }
  };

  // Helper to format rule periods cleanly
  const formatPeriod = (rule: any) => {
    if (rule.startDate === rule.endDate) {
      return rule.startDate;
    }
    return `${rule.startDate} ➔ ${rule.endDate}`;
  };

  // Helper to format rule adjustment text
  const formatAdjustment = (rule: any) => {
    if (rule.rateMultiplier === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-red-600 font-bold text-xs bg-red-50 px-2 py-0.5 rounded-sm">
          <Lock className="w-3 h-3" /> Closed
        </span>
      );
    }

    const value = Math.round(Number(rule.adjustmentValue));
    if (rule.adjustmentType === 'FIXED_AMOUNT_INCREASE') {
      return `+Rp ${value.toLocaleString()}`;
    }

    if (value < 0) {
      return `${value}%`;
    }
    return `+${value}%`;
  };

  const isSelectedDate = (dateStr: string) => {
    if (applyMode === 'SINGLE' || applyMode === 'RANGE') {
      if (applyMode === 'SINGLE') {
        return startDate === dateStr;
      }
      return dateStr >= startDate && dateStr <= endDate && endDate !== '';
    }
    return selectedDates.includes(dateStr);
  };

  return (
    <div id="peak-season-ext-container" className="flex flex-col gap-6 font-sans">
      
      {/* Property and Month Top Selector Grid */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <Building className="w-4 h-4 text-indigo-900 shrink-0" />
          <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-widest block shrink-0">
            {language === 'en' ? 'Manage Property:' : 'Atur Properti:'}
          </span>
          <select 
            value={selectedPropertyId} 
            onChange={e => setSelectedPropertyId(e.target.value)}
            className="flex-1 md:flex-none bg-white border border-slate-200 text-xs font-semibold rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-600 outline-hidden cursor-pointer"
          >
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between gap-4 w-full md:w-auto self-stretch">
          <span className="text-xs font-bold text-slate-500">
            {language === 'en' ? 'Configure rates for specific rooms or property-wide.' : 'Konfigurasi tarif kamar atau properti keseluruhan.'}
          </span>
          <select 
            value={selectedRoomId} 
            onChange={e => setSelectedRoomId(e.target.value)} 
            className="bg-white border border-slate-200 text-xs font-semibold rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-600 outline-hidden cursor-pointer shrink-0"
          >
            <option value="all">🌐 {language === 'en' ? 'All Rooms / General' : 'Semua Kamar / Umum'}</option>
            {rooms.map(r => (
              <option key={r.id} value={r.id}>🚪 {r.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Calendar left, Config right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Polished Interactive Calendar Grid */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          
          <div className="bg-white p-5 rounded-3xl border border-slate-150/70 shadow-xs">
            
            {/* Calendar Navigation header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-800 font-display">
                  {monthNames[currentMonth]} {currentYear}
                </h3>
              </div>
              <div className="flex gap-1.5">
                <button 
                  onClick={handlePrevMonth}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer text-slate-600 hover:text-indigo-900 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleNextMonth}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer text-slate-600 hover:text-indigo-900 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week Row */}
            <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">
              <span>{language === 'en' ? 'Sun' : 'Min'}</span>
              <span>{language === 'en' ? 'Mon' : 'Sen'}</span>
              <span>{language === 'en' ? 'Tue' : 'Sel'}</span>
              <span>{language === 'en' ? 'Wed' : 'Rab'}</span>
              <span>{language === 'en' ? 'Thu' : 'Kam'}</span>
              <span>{language === 'en' ? 'Fri' : 'Jum'}</span>
              <span>{language === 'en' ? 'Sat' : 'Sab'}</span>
            </div>

            {/* Calendar Grid Cells */}
            <div className="grid grid-cols-7 gap-2">
              {calendarGrid.map((c, idx) => {
                if (c === null) {
                  return <div key={`empty-${idx}`} className="aspect-square bg-slate-50/40 rounded-xl border border-dashed border-slate-100/50" />;
                }

                const selected = isSelectedDate(c.date);
                
                // Construct color classes based on state priority
                let bgBorderClass = 'border-slate-100 bg-white hover:bg-slate-50';
                let priceColor = 'text-slate-500';

                if (c.isBlocked) {
                  bgBorderClass = 'border-red-150 bg-red-50/50 text-red-700 hover:bg-red-50';
                  priceColor = 'text-red-500 font-bold';
                } else if (c.isPeak) {
                  bgBorderClass = 'border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100/50';
                  priceColor = 'text-purple-600 font-bold';
                } else if (c.isWeekend) {
                  bgBorderClass = 'border-amber-100 bg-amber-50/40 text-amber-800 hover:bg-amber-100/30';
                  priceColor = 'text-amber-600 font-semibold';
                } else if (c.isToday) {
                  bgBorderClass = 'border-emerald-250 bg-emerald-50 text-emerald-900 hover:bg-emerald-50 font-semibold';
                  priceColor = 'text-emerald-700 font-bold';
                }

                if (selected) {
                  bgBorderClass = 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/30 ring-offset-1';
                }

                return (
                  <button 
                    key={idx} 
                    type="button"
                    onClick={() => handleSelectDay(c.date)}
                    className={`p-2.5 rounded-2xl border text-left cursor-pointer transition-all duration-200 aspect-square flex flex-col justify-between hover:scale-[1.03] ${bgBorderClass}`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="text-xs font-bold">{c.day}</span>
                      {c.isToday && (
                        <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                      )}
                      {c.isBlocked && (
                        <Lock className="w-3 h-3 text-red-500" />
                      )}
                    </div>
                    <span className={`text-[9.5px] sm:text-[10px] tracking-tight truncate w-full ${priceColor}`}>
                      {c.isBlocked ? (language === 'en' ? 'Closed' : 'Tutup') : formatCurrencyIDR(c.price)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Color Legend Panels */}
            <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-3 sm:grid-cols-6 gap-3 text-center text-[10px] font-extrabold tracking-wider select-none">
              <div className="flex items-center gap-1.5 justify-center py-1.5 px-2 bg-slate-50 border rounded-xl text-slate-500">
                <span className="w-2.5 h-2.5 bg-white border rounded-full block" />
                <span>Normal</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center py-1.5 px-2 bg-purple-50 border border-purple-200 rounded-xl text-purple-700">
                <span className="w-2.5 h-2.5 bg-purple-500 rounded-full block" />
                <span>Peak</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center py-1.5 px-2 bg-red-50 border border-red-200 rounded-xl text-red-700">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full block" />
                <span>Closed</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center py-1.5 px-2 bg-amber-50/40 border border-amber-100 rounded-xl text-amber-700">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full block" />
                <span>Weekend</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center py-1.5 px-2 bg-emerald-50 border border-emerald-250 rounded-xl text-emerald-800">
                <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full block" />
                <span>Today</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center py-1.5 px-2 bg-indigo-50 border border-indigo-600 rounded-xl text-indigo-700">
                <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full block animate-pulse" />
                <span>Selected</span>
              </div>
            </div>

          </div>

          {/* Bottom Table: Displays active Peak Season rules list */}
          <div className="bg-white p-5 rounded-3xl border border-slate-150/70 shadow-xs">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h4 className="text-sm font-extrabold text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                {language === 'en' ? 'Active Peak Season Rules' : 'Aturan Musim Ramai Aktif'}
              </h4>
              <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-0.5">
                {rules.length} {language === 'en' ? 'Rule(s)' : 'Aturan'}
              </span>
            </div>

            {rulesLoading ? (
              <div className="py-8 flex justify-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : rules.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                {language === 'en' ? 'No peak season rules configured. Use the panel on the right to configure.' : 'Belum ada aturan musim ramai. Gunakan panel di sebelah kanan untuk membuat.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="text-[10px] font-extrabold uppercase text-slate-400 bg-slate-50/50 tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Rule</th>
                      <th className="py-2.5 px-3">Room</th>
                      <th className="py-2.5 px-3">Period</th>
                      <th className="py-2.5 px-3">Adjustment</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {rules.map((rule, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/30 transition-all">
                        <td className="py-3 px-3 font-bold text-slate-900">{rule.name}</td>
                        <td className="py-3 px-3 text-indigo-950">
                          {rule.room ? `🚪 ${rule.room.name}` : '🌐 ' + (language === 'en' ? 'All Rooms' : 'Semua Kamar')}
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{formatPeriod(rule)}</td>
                        <td className="py-3 px-3">{formatAdjustment(rule)}</td>
                        <td className="py-3 px-3">
                          <button 
                            type="button"
                            onClick={() => handleToggleRuleStatus(rule)}
                            className="cursor-pointer border-0 bg-transparent outline-hidden"
                          >
                            {rule.isActive ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-400 text-[10px] bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                Disabled
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button 
                              type="button"
                              onClick={() => handleEditRuleClick(rule)}
                              className="p-1 text-indigo-600 hover:bg-indigo-50 border-0 rounded-sm cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleDeleteRule(rule.name)}
                              className="p-1 text-red-500 hover:bg-red-50 border-0 rounded-sm cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Complete Peak Season Configuration Editor */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150/70 shadow-xs h-fit flex flex-col gap-5">
          <div className="pb-2 border-b border-slate-100 flex justify-between items-center">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {editingRuleName 
                ? (language === 'en' ? 'Edit Peak Season Rule' : 'Ubah Aturan Musim Ramai') 
                : (language === 'en' ? 'New Peak Season Rule' : 'Aturan Musim Ramai Baru')}
            </h4>
            {editingRuleName && (
              <button 
                type="button"
                onClick={handleResetForm}
                className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full cursor-pointer hover:bg-red-100 transition-all"
              >
                <X className="w-3 h-3" /> Cancel
              </button>
            )}
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs p-3.5 rounded-2xl flex gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-3.5 rounded-2xl flex gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSaveRule} className="flex flex-col gap-4">
            
            {/* Rule Name */}
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-455 block mb-1">
                {language === 'en' ? 'Rule Name' : 'Nama Aturan'}
              </label>
              <input 
                type="text" 
                required
                placeholder="e.g. Christmas Peak, Lebaran Premium" 
                value={ruleName} 
                onChange={e => setRuleName(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-hidden focus:bg-white transition-all" 
              />
            </div>

            {/* Target Room / Applicability */}
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-455 block mb-1">
                {language === 'en' ? 'Apply To Room(s)' : 'Terapkan Ke Kamar'}
              </label>
              <select 
                value={selectedRoomId} 
                onChange={e => setSelectedRoomId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-hidden cursor-pointer"
              >
                <option value="all">{language === 'en' ? 'All Rooms / General' : 'Semua Kamar / Umum'}</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {/* Apply Mode Selector Switch */}
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-455 block mb-1.5">
                {language === 'en' ? 'Apply Mode' : 'Mode Penerapan'}
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-1 rounded-xl text-center text-[10px] font-bold">
                {[
                  { id: 'SINGLE', name: language === 'en' ? 'Single Date' : 'Satu Hari' },
                  { id: 'RANGE', name: language === 'en' ? 'Date Range' : 'Rentang Hari' },
                  { id: 'MULTIPLE', name: language === 'en' ? 'Multiple' : 'Banyak Hari' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setApplyMode(mode.id as any)}
                    className={`py-2 px-1 rounded-lg font-black transition-all border-0 cursor-pointer ${
                      applyMode === mode.id 
                        ? 'bg-indigo-900 text-white shadow-xs' 
                        : 'text-slate-600 hover:text-indigo-900'
                    }`}
                  >
                    {mode.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional Date Selection inputs */}
            {applyMode === 'SINGLE' && (
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-455 block mb-1">
                  {language === 'en' ? 'Selected Date' : 'Tanggal Terpilih'}
                </label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={e => { setStartDate(e.target.value); setEndDate(e.target.value); }} 
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-hidden focus:bg-white" 
                />
              </div>
            )}

            {applyMode === 'RANGE' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-455 block mb-1">
                    {language === 'en' ? 'Start Date' : 'Tanggal Mulai'}
                  </label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-hidden focus:bg-white" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-455 block mb-1">
                    {language === 'en' ? 'End Date' : 'Tanggal Selesai'}
                  </label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-hidden focus:bg-white" 
                  />
                </div>
              </div>
            )}

            {applyMode === 'MULTIPLE' && (
              <div className="bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100/50">
                <div className="flex gap-2 items-start mb-2">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-[10.5px] text-slate-500 font-semibold leading-normal">
                    {language === 'en' 
                      ? 'Click on individual daily cells directly on the calendar grid to select multiple dates.' 
                      : 'Tekan kotak tanggal di kalender secara bebas untuk memilih banyak hari sekaligus.'}
                  </p>
                </div>
                {selectedDates.length > 0 ? (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9.5px] font-black uppercase text-indigo-950 tracking-wider">
                        {selectedDates.length} {language === 'en' ? 'Date(s) Selected' : 'Tanggal Terpilih'}:
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setSelectedDates([])}
                        className="text-[9.5px] text-red-500 font-bold hover:underline bg-transparent border-0 cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-25 overflow-y-auto scrollbar-none">
                      {selectedDates.map(d => (
                        <span key={d} className="text-[9px] font-mono font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                          {d}
                          <button 
                            type="button" 
                            onClick={() => setSelectedDates(prev => prev.filter(v => v !== d))}
                            className="p-0 text-indigo-400 hover:text-indigo-600 font-black border-0 bg-transparent cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <span className="text-[10.5px] text-indigo-900/60 font-black block text-center py-1">
                    {language === 'en' ? 'No dates selected yet.' : 'Belum ada tanggal terpilih.'}
                  </span>
                )}
              </div>
            )}

            {/* Adjustment Type Selector Button group */}
            {!isClosed && (
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-455 block mb-1.5">
                  {language === 'en' ? 'Price Adjustment' : 'Penyesuaian Tarif'}
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-1 rounded-xl text-center text-[10px] font-bold">
                  {[
                    { id: 'PERCENTAGE', name: language === 'en' ? 'Percentage (+%)' : 'Persentase (+%)' },
                    { id: 'FIXED', name: language === 'en' ? 'Fixed (+Rp)' : 'Tarif Tetap (+Rp)' },
                    { id: 'DISCOUNT', name: language === 'en' ? 'Discount (-%)' : 'Diskon (-%)' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAdjustmentOption(opt.id as any)}
                      className={`py-2 px-1 rounded-lg font-black transition-all border-0 cursor-pointer ${
                        adjustmentOption === opt.id 
                          ? 'bg-indigo-900 text-white shadow-xs' 
                          : 'text-slate-600 hover:text-indigo-900'
                      }`}
                    >
                      {opt.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Value adjustment field */}
            {!isClosed && (
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-455 block mb-1">
                  {language === 'en' ? 'Adjustment Value' : 'Nilai Penyesuaian'}
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    required={!isClosed}
                    value={adjustmentValue} 
                    onChange={e => setAdjustmentValue(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-hidden focus:bg-white transition-all pl-8" 
                  />
                  <span className="absolute left-3 top-3.5 text-[10px] text-slate-400 font-extrabold">
                    {adjustmentOption === 'FIXED' ? 'Rp' : '%'}
                  </span>
                </div>
              </div>
            )}

            {/* Booking Closed Toggle */}
            <div className="border-t border-slate-100 pt-3">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isClosed} 
                  onChange={e => setIsClosed(e.target.checked)} 
                  className="rounded-sm accent-indigo-900 cursor-pointer border border-slate-300 w-4 h-4" 
                />
                {language === 'en' ? 'Booking Closed (Block Dates)' : 'Tutup Akses Pemesanan (Blokir Tanggal)'}
              </label>
            </div>

            {/* Closed Reason */}
            {isClosed && (
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-455 block mb-1">
                  {language === 'en' ? 'Reason for Blocking (Optional)' : 'Alasan Penutupan (Opsional)'}
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Renovation, Private Event" 
                  value={closedReason} 
                  onChange={e => setClosedReason(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-hidden" 
                />
              </div>
            )}

            {/* Dynamic Live Price Preview Container */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150/70 text-xs font-semibold flex flex-col gap-1.5 shadow-inner">
              <div className="flex justify-between items-center text-slate-400 text-[10.5px]">
                <span>Base Average Nightly Rate:</span>
                <span className="font-mono">{formatCurrencyIDR(previewPriceMetrics.base)}</span>
              </div>
              
              <div className="flex justify-between items-center text-slate-400 text-[10.5px]">
                <span>Adjustment Formula:</span>
                <span>
                  {previewPriceMetrics.closed ? (
                    <span className="text-red-500 uppercase font-black tracking-widest text-[9.5px]">Blocked</span>
                  ) : adjustmentOption === 'PERCENTAGE' ? (
                    `+ ${adjustmentValue}%`
                  ) : adjustmentOption === 'DISCOUNT' ? (
                    `- ${adjustmentValue}%`
                  ) : (
                    `+ Rp ${Number(adjustmentValue).toLocaleString()}`
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-800 text-[11px] pt-1.5 border-t border-dashed border-slate-200">
                <span className="font-bold">Projected Rate:</span>
                <span className="font-black text-indigo-950 text-sm font-display">
                  {previewPriceMetrics.closed ? (
                    <span className="text-red-600">CLOSED</span>
                  ) : (
                    formatCurrencyIDR(previewPriceMetrics.adjusted)
                  )}
                </span>
              </div>
            </div>

            {/* Save Button */}
            <button 
              type="submit" 
              disabled={submitLoading || (applyMode === 'MULTIPLE' && selectedDates.length === 0)}
              className="w-full bg-indigo-900 hover:bg-indigo-850 disabled:bg-slate-200 disabled:cursor-not-allowed text-white text-xs font-bold py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {submitLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} 
              {editingRuleName 
                ? (language === 'en' ? 'Update Peak Season Rule' : 'Update Aturan Musim Ramai')
                : (language === 'en' ? 'Save Peak Season Rule' : 'Simpan Aturan Musim Ramai')}
            </button>

          </form>
        </div>

      </div>

    </div>
  );
}
