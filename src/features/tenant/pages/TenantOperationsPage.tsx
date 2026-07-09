import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/i18n';
import { 
  ClipboardList, 
  UserCheck, 
  LogOut, 
  Star, 
  Sparkles, 
  Wrench, 
  Plus, 
  X, 
  Check, 
  CheckCircle2, 
  Clock,
  Loader2,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  User,
  Building2,
  RotateCcw
} from 'lucide-react';
import TodayCheckInPage from './TodayCheckInPage';
import TodayStayingPage from './TodayStayingPage';
import TodayCheckOutPage from './TodayCheckOutPage';
import TenantReviews from './TenantReviews';

interface OperationsProps {
  onNavigate: (p: string) => void;
  initialTab?: 'check-in' | 'staying' | 'check-out' | 'reviews' | 'housekeeping' | 'maintenance';
}

interface HousekeepingTask {
  id: string; // maps to roomId
  roomName: string;
  propertyName: string;
  status: 'DIRTY' | 'CLEANING' | 'INSPECTING' | 'READY' | 'OUT_OF_SERVICE';
  assignedTo: string;
  checklist: { text: string; done: boolean }[];
}

interface MaintenanceRequest {
  id: string;
  title: string;
  propertyName: string;
  roomNameName: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  createdAt: string;
}

export default function TenantOperationsPage({ onNavigate, initialTab }: OperationsProps) {
  const { token } = useAuth();
  const { language } = useLanguage();
  const en = language === 'en';

  const [activeTab, setActiveTab] = useState<'check-in' | 'staying' | 'check-out' | 'reviews' | 'housekeeping' | 'maintenance'>(initialTab || 'check-in');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [housekeeping, setHousekeeping] = useState<HousekeepingTask[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search States (Housekeeping only)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  
  // Expanded room cards map state
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({});

  // Add maintenance modal fields
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueProp, setNewIssueProp] = useState('');
  const [newIssueRoom, setNewIssueRoom] = useState('');
  const [newIssuePriority, setNewIssuePriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');

  const fetchHousekeeping = async () => {
    try {
      const authHeader: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch('/api/housekeeping', { headers: authHeader });
      const data = await res.json();
      if (Array.isArray(data)) {
        setHousekeeping(data);
      }
    } catch (e) {
      console.error('Error fetching housekeeping:', e);
    }
  };

  const fetchMaintenance = async () => {
    try {
      const authHeader: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch('/api/maintenance', { headers: authHeader });
      const data = await res.json();
      if (Array.isArray(data)) {
        setMaintenance(data);
      }
    } catch (e) {
      console.error('Error fetching maintenance:', e);
    }
  };

  useEffect(() => {
    if (!token) return;

    if (activeTab === 'housekeeping') {
      setLoading(true);
      fetchHousekeeping().finally(() => setLoading(false));

      const interval = setInterval(() => {
        fetchHousekeeping();
      }, 5000);

      return () => clearInterval(interval);
    } else if (activeTab === 'maintenance') {
      setLoading(true);
      fetchMaintenance().finally(() => setLoading(false));

      const interval = setInterval(() => {
        fetchMaintenance();
      }, 5000);

      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [token, activeTab]);

  const handleToggleHKCheck = async (roomId: string, taskIdx: number) => {
    let updatedTask: HousekeepingTask | null = null;
    setHousekeeping(prev => prev.map(hk => {
      if (hk.id === roomId) {
        const nextChecklist = [...hk.checklist];
        nextChecklist[taskIdx] = { ...nextChecklist[taskIdx], done: !nextChecklist[taskIdx].done };
        updatedTask = { ...hk, checklist: nextChecklist };
        return updatedTask;
      }
      return hk;
    }));

    if (updatedTask) {
      try {
        const authHeader: HeadersInit = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
        await fetch(`/api/housekeeping/${roomId}`, {
          method: 'PUT',
          headers: authHeader,
          body: JSON.stringify({ checklist: (updatedTask as HousekeepingTask).checklist })
        });
      } catch (e) {
        console.error('Failed to sync checklist on server:', e);
      }
    }
  };

  const handleUpdateHKStatus = async (roomId: string, nextStatus: HousekeepingTask['status']) => {
    setHousekeeping(prev => prev.map(hk => {
      if (hk.id === roomId) {
        return { ...hk, status: nextStatus };
      }
      return hk;
    }));

    try {
      const authHeader: HeadersInit = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
      await fetch(`/api/housekeeping/${roomId}`, {
        method: 'PUT',
        headers: authHeader,
        body: JSON.stringify({ status: nextStatus })
      });
      fetchHousekeeping();
    } catch (e) {
      console.error('Failed to sync status on server:', e);
    }
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssueTitle.trim()) return;

    try {
      const authHeader: HeadersInit = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          title: newIssueTitle.trim(),
          propertyName: newIssueProp.trim() || 'Ocean Breeze Villa',
          roomNameName: newIssueRoom.trim() || 'Deluxe Suite 101',
          priority: newIssuePriority,
          status: 'OPEN'
        })
      });
      if (res.ok) {
        setNewIssueTitle('');
        setNewIssueProp('');
        setNewIssueRoom('');
        setShowAddMaintenance(false);
        fetchMaintenance();
      }
    } catch (e) {
      console.error('Failed to create maintenance defect:', e);
    }
  };

  const handleUpdateMaintenanceStatus = async (id: string, nextStatus: MaintenanceRequest['status']) => {
    setMaintenance(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, status: nextStatus };
      }
      return m;
    }));

    try {
      const authHeader: HeadersInit = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
      await fetch(`/api/maintenance/${id}/status`, {
        method: 'PUT',
        headers: authHeader,
        body: JSON.stringify({ status: nextStatus })
      });
      fetchMaintenance();
    } catch (e) {
      console.error('Failed to update maintenance status:', e);
    }
  };

  // --- HOUSEKEEPING DERIVED STATS & FILTERING ---
  const counts = useMemo(() => {
    const accum = { READY: 0, CLEANING: 0, DIRTY: 0, INSPECTING: 0, OUT_OF_SERVICE: 0 };
    housekeeping.forEach(hk => {
      if (accum[hk.status] !== undefined) {
        accum[hk.status]++;
      }
    });
    return accum;
  }, [housekeeping]);

  const uniqueProperties = useMemo(() => 
    Array.from(new Set(housekeeping.map(hk => hk.propertyName).filter(Boolean))),
    [housekeeping]
  );

  const uniqueStaff = useMemo(() => 
    Array.from(new Set(housekeeping.map(hk => hk.assignedTo).filter(Boolean))),
    [housekeeping]
  );

  const filteredHousekeeping = useMemo(() => {
    return housekeeping.filter(hk => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        hk.roomName.toLowerCase().includes(query) || 
        hk.propertyName.toLowerCase().includes(query) || 
        (hk.assignedTo && hk.assignedTo.toLowerCase().includes(query));
      
      const matchesProperty = !selectedProperty || hk.propertyName === selectedProperty;
      const matchesStatus = !selectedStatus || hk.status === selectedStatus;
      const matchesStaff = !selectedStaff || hk.assignedTo === selectedStaff;

      return matchesSearch && matchesProperty && matchesStatus && matchesStaff;
    });
  }, [housekeeping, searchQuery, selectedProperty, selectedStatus, selectedStaff]);

  const handleToggleCardExpand = (id: string) => {
    setExpandedRooms(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedProperty('');
    setSelectedStatus('');
    setSelectedStaff('');
  };

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-800">
      
      {/* Header operations area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-4">
        <div>
          <h2 className="text-xl font-bold text-indigo-950 font-display">
            {en ? 'Operations Desk' : 'Pusat Operasional Lapangan'}
          </h2>
          <p className="text-xs text-slate-500">
            {en 
              ? 'Comprehensive frontline check-ins, scheduled check-outs, client feedback, room housekeeping, and maintenance resolution protocols.' 
              : 'Pusat kontrol lobi depan untuk check-in, check-out, tanggapan ulasan, kebersihan kamar, dan perbaikan sarana.'}
          </p>
        </div>
      </div>

      {/* Segmented Horizontal Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-full lg:w-fit self-center border border-slate-200/50 overflow-x-auto text-[11px] font-bold">
        {[
          { id: 'check-in', name: en ? 'Check-In Today' : 'Check-In Hari Ini', icon: UserCheck },
          { id: 'staying', name: en ? 'Guest Staying' : 'Tamu Menginap', icon: ClipboardList },
          { id: 'check-out', name: en ? 'Check-Out Today' : 'Check-Out Hari Ini', icon: LogOut },
          { id: 'reviews', name: en ? 'Guest Reviews' : 'Ulasan Tamu', icon: Star },
          { id: 'housekeeping', name: en ? 'Housekeeping Status' : 'Penyiapan & Pembersihan', icon: Sparkles },
          { id: 'maintenance', name: en ? 'Maintenance Reports' : 'Perbaikan Sarana', icon: Wrench }
        ].map(tab => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border-0 ${
                activeTab === tab.id 
                  ? 'bg-indigo-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-indigo-950 hover:bg-slate-50/50'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Screen Output */}
      <div className="bg-white rounded-2xl border border-slate-100/80 shadow-3xs p-1">
        
        {activeTab === 'check-in' && (
          <div className="p-3">
            <TodayCheckInPage onNavigate={onNavigate} />
          </div>
        )}

        {activeTab === 'staying' && (
          <div className="p-3">
            <TodayStayingPage onNavigate={onNavigate} />
          </div>
        )}

        {activeTab === 'check-out' && (
          <div className="p-3">
            <TodayCheckOutPage onNavigate={onNavigate} />
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="p-3">
            <TenantReviews />
          </div>
        )}

        {activeTab === 'housekeeping' && (
          <div className="p-4 flex flex-col gap-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  {en ? 'Live Housekeeping Console' : 'Arsip Pantauan Housekeeping Real-time'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {en ? 'Assign sanitation checklists, track cleaners, and update room status.' : 'Pantau penyiapan unit kamar, perbarui check-list, dan ubah status hunian siap huni.'}
                </p>
              </div>
            </div>

            {/* Redesigned Metric Analytics Header */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { status: 'READY', label: en ? 'Ready' : 'Siap Huni', color: 'border-emerald-200 bg-emerald-50/40 text-emerald-700', value: counts.READY },
                { status: 'CLEANING', label: en ? 'Cleaning' : 'Dibersihkan', color: 'border-blue-200 bg-blue-50/40 text-blue-700', value: counts.CLEANING },
                { status: 'DIRTY', label: en ? 'Dirty' : 'Kotor', color: 'border-rose-200 bg-rose-50/40 text-rose-700', value: counts.DIRTY },
                { status: 'INSPECTING', label: en ? 'Inspecting' : 'Diinspeksi', color: 'border-purple-200 bg-purple-50/40 text-purple-700', value: counts.INSPECTING },
                { status: 'OUT_OF_SERVICE', label: en ? 'Out of Service' : 'Rusak/Perbaikan', color: 'border-slate-200 bg-slate-50/60 text-slate-700', value: counts.OUT_OF_SERVICE }
              ].map(stat => (
                <div 
                  key={stat.status} 
                  onClick={() => setSelectedStatus(selectedStatus === stat.status ? '' : stat.status)}
                  className={`border p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] shadow-3xs ${stat.color} ${selectedStatus === stat.status ? 'ring-2 ring-indigo-600 ring-offset-1' : ''}`}
                >
                  <span className="text-[11px] font-black tracking-wide uppercase">{stat.label}</span>
                  <span className="text-lg font-black font-display">{stat.value}</span>
                </div>
              ))}
            </div>

            {/* Filter and Search Action Toolbar */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 flex flex-wrap gap-2 items-center text-xs">
              <div className="relative flex-1 min-w-50">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder={en ? "Search room, property, or staff..." : "Cari kamar, properti, atau staf..."}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                />
              </div>

              <select 
                value={selectedProperty} 
                onChange={e => setSelectedProperty(e.target.value)}
                className="bg-white border border-slate-200 p-1.5 rounded-lg font-bold text-slate-600 focus:outline-hidden text-xs cursor-pointer"
              >
                <option value="">{en ? 'All Properties' : 'Semua Properti'}</option>
                {uniqueProperties.map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              <select 
                value={selectedStaff} 
                onChange={e => setSelectedStaff(e.target.value)}
                className="bg-white border border-slate-200 p-1.5 rounded-lg font-bold text-slate-600 focus:outline-hidden text-xs cursor-pointer"
              >
                <option value="">{en ? 'All Staff' : 'Semua Staf'}</option>
                {uniqueStaff.map(s => <option key={s} value={s}>{s || (en ? 'Unassigned' : 'Belum Ditugaskan')}</option>)}
              </select>

              {(searchQuery || selectedProperty || selectedStatus || selectedStaff) && (
                <button 
                  onClick={handleResetFilters}
                  className="p-1.5 text-slate-500 hover:text-indigo-900 font-bold flex items-center gap-1 transition-colors border-0 bg-transparent cursor-pointer"
                  title={en ? "Reset Filters" : "Reset Filter"}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">{en ? 'Reset' : 'Atur Ulang'}</span>
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12 text-indigo-900">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : filteredHousekeeping.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-xs">
                {en ? 'No matching rooms found.' : 'Tidak ada unit kamar yang sesuai kriteria.'}
              </div>
            ) : (
              /* Grid Layout Matrix */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredHousekeeping.map(hk => {
                  const totalTasks = hk.checklist.length;
                  const doneTasks = hk.checklist.filter(t => t.done).length;
                  const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
                  const isExpanded = !!expandedRooms[hk.id];

                  return (
                    <div 
                      key={hk.id} 
                      className={`bg-white rounded-xl border transition-all flex flex-col justify-between ${
                        isExpanded ? 'border-indigo-200 shadow-xs ring-1 ring-indigo-50/50' : 'border-slate-150 hover:border-slate-300 shadow-3xs'
                      }`}
                    >
                      {/* Card Workspace Header */}
                      <div className="p-4 flex flex-col gap-2.5">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-slate-900 font-display leading-tight truncate" title={hk.roomName}>
                              {hk.roomName}
                            </h4>
                            <div className="flex items-center gap-1 mt-0.5 text-slate-400">
                              <Building2 className="w-3 h-3 shrink-0" />
                              <span className="text-[10px] font-semibold truncate max-w-35">{hk.propertyName}</span>
                            </div>
                          </div>
                          
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shrink-0 ${
                            hk.status === 'READY' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            hk.status === 'CLEANING' ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse' :
                            hk.status === 'INSPECTING' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                            hk.status === 'OUT_OF_SERVICE' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {hk.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {/* Middle Meta Info Area */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium bg-slate-50/60 p-2 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-1.5 truncate">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate font-semibold">
                              {hk.assignedTo ? hk.assignedTo : <span className="text-slate-400 italic">{en ? 'Unassigned' : 'Belum Ada Staf'}</span>}
                            </span>
                          </div>
                          <span className="text-slate-400 shrink-0 font-bold">{doneTasks}/{totalTasks} Tasks</span>
                        </div>

                        {/* Visual Progress bar widget */}
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[9px] font-bold text-slate-400">
                            <span>{en ? 'Progress' : 'Kemajuan'}</span>
                            <span className="text-slate-600">{progressPct}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 rounded-full ${
                                progressPct === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Expandable Accordion Checklist Panel */}
                      {isExpanded && totalTasks > 0 && (
                        <div className="px-4 pb-3 border-t border-slate-100 pt-3 bg-slate-50/50 flex flex-col gap-1.5">
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1">
                            {en ? 'Task Checklist' : 'Daftar Tugas Kebersihan'}
                          </p>
                          {hk.checklist.map((item, idx) => (
                            <label 
                              key={idx} 
                              onClick={() => handleToggleHKCheck(hk.id, idx)}
                              className="flex items-start gap-2 text-[11px] font-semibold text-slate-600 select-none cursor-pointer hover:text-slate-900 transition-colors py-0.5"
                            >
                              <input 
                                type="checkbox" 
                                checked={item.done} 
                                readOnly
                                className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer" 
                              />
                              <span className={`wrap-break-words ${item.done ? 'line-through text-slate-400 font-normal' : ''}`}>{item.text}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* Card Operational Control Block Footer */}
                      <div className="p-3 border-t border-slate-100 bg-white rounded-b-xl flex flex-col gap-2">
                        {/* Segmented Control Line Selector */}
                        <div className="flex p-0.5 bg-slate-100 rounded-lg overflow-x-auto scrollbar-none border border-slate-200/40">
                          {[
                            { key: 'DIRTY', label: en ? 'Dirty' : 'Kotor' },
                            { key: 'CLEANING', label: en ? 'Clean' : 'Seka' },
                            { key: 'INSPECTING', label: en ? 'Insp' : 'Cek' },
                            { key: 'READY', label: en ? 'Ready' : 'Siap' },
                            { key: 'OUT_OF_SERVICE', label: en ? 'OOS' : 'OOS' }
                          ].map(btn => {
                            const isCurrent = hk.status === btn.key;
                            return (
                              <button
                                key={btn.key}
                                onClick={() => handleUpdateHKStatus(hk.id, btn.key as any)}
                                title={btn.key}
                                className={`flex-1 text-[9px] font-black uppercase tracking-wider py-1 px-1 rounded-md transition-all border-0 cursor-pointer min-w-9 ${
                                  isCurrent 
                                    ? 'bg-white text-indigo-950 shadow-3xs font-black ring-1 ring-black/5' 
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                                }`}
                              >
                                {btn.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Interactive Toggle Trigger Bar */}
                        {totalTasks > 0 && (
                          <button
                            onClick={() => handleToggleCardExpand(hk.id)}
                            className="w-full py-1 text-[10px] text-slate-500 hover:text-indigo-900 bg-slate-50 hover:bg-slate-100 rounded-md font-bold transition-all flex items-center justify-center gap-1 border-0 cursor-pointer"
                          >
                            <span>{isExpanded ? (en ? 'Hide Tasks' : 'Sembunyikan Tugas') : (en ? 'View Tasks' : 'Lihat Tugas')}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: Maintenance Issues Ledger */}
        {activeTab === 'maintenance' && (
          <div className="p-4 flex flex-col gap-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  {en ? 'Host Facility Maintenance Request Ledger' : 'Arsip Laporan Kerusakan Sarana Kamar & Properti'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {en ? 'Log physical assets issues, assign priorities, and track technical solutions.' : 'Catat kerusakan fasilitas fisik kamar, tentukan peringkat prioritas rujukan, dan selesaikan perbaikan.'}
                </p>
              </div>

              <button 
                onClick={() => setShowAddMaintenance(true)}
                className="text-xs bg-indigo-900 border-0 text-white font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 hover:bg-indigo-950 cursor-pointer shadow-2xs transition-all"
              >
                <Plus className="w-4 h-4" /> {en ? 'Log Facility Defect' : 'Daftarkan Kerusakan'}
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12 text-indigo-900">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : maintenance.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-xs">
                {en ? 'No maintenance logs recorded.' : 'Belum ada masalah sarana dilaporkan.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-black tracking-wider uppercase text-[9px]">
                      <th className="p-3">Defect Issue Title</th>
                      <th className="p-3">Location Context</th>
                      <th className="p-3">Logged Date</th>
                      <th className="p-3">Priority Rating</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Administrative</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                    {maintenance.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <p className={`font-bold text-slate-800 leading-tight ${item.status === 'DONE' ? 'line-through text-slate-400' : ''}`}>{item.title}</p>
                          <span className="text-[9px] text-slate-400 font-normal">Task Ref: {item.id}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-700">{item.roomNameName}</span>
                          <span className="text-[10px] text-slate-450 block font-normal">{item.propertyName}</span>
                        </td>
                        <td className="p-3">{item.createdAt}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold tracking-wide uppercase ${
                            item.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                            item.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                            item.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            item.status === 'DONE' ? 'bg-emerald-50 text-emerald-600' : 
                            item.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600 animate-pulse' :
                            item.status === 'CANCELLED' ? 'bg-slate-100 text-slate-550' :
                            'bg-amber-50 text-amber-600'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {item.status !== 'DONE' && item.status !== 'CANCELLED' ? (
                            <div className="flex gap-1.5 justify-end">
                              {item.status === 'OPEN' && (
                                <button 
                                  onClick={() => handleUpdateMaintenanceStatus(item.id, 'IN_PROGRESS')}
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-extrabold cursor-pointer border-0"
                                >
                                  Start
                                </button>
                              )}
                              {item.status === 'IN_PROGRESS' && (
                                <button 
                                  onClick={() => handleUpdateMaintenanceStatus(item.id, 'DONE')}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-extrabold cursor-pointer border-0"
                                >
                                  Done
                                </button>
                              )}
                              <button 
                                onClick={() => handleUpdateMaintenanceStatus(item.id, 'CANCELLED')}
                                className="px-2 py-1 border border-slate-200 hover:bg-slate-100 text-slate-650 rounded-lg text-[10px] font-extrabold cursor-pointer bg-white"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic font-semibold flex items-center gap-1 justify-end">
                              {item.status === 'DONE' ? (
                                <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 inline-block" /> Finished</>
                              ) : (
                                <><X className="w-3.5 h-3.5 text-slate-400 inline-block" /> Cancelled</>
                              )}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Log Defect Maintenance Popup Drawer */}
      {showAddMaintenance && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddMaintenance} className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-100 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-bold text-sm text-indigo-950 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-indigo-600" />
                {en ? 'Log Facility Defect Request' : 'Laporkan Kerusakan Fasilitas'}
              </span>
              <button type="button" onClick={() => setShowAddMaintenance(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg border-0 bg-transparent"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Issue Description / Defect Detail</label>
                <input 
                  required 
                  type="text" 
                  value={newIssueTitle} 
                  onChange={e => setNewIssueTitle(e.target.value)} 
                  placeholder={en ? 'E.g., Bathroom sink pipe leak' : 'Contoh: Pipa wastafel bocor'} 
                  className="w-full border p-2.5 rounded-xl bg-slate-50 focus:outline-hidden focus:bg-white text-xs font-semibold focus:ring-1 focus:ring-indigo-500" 
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Property Name Context</label>
                <input 
                  required 
                  type="text" 
                  value={newIssueProp} 
                  onChange={e => setNewIssueProp(e.target.value)} 
                  placeholder="Ocean Breeze Villa"
                  className="w-full border p-2.5 rounded-xl bg-slate-50 focus:outline-hidden focus:bg-white text-xs font-semibold focus:ring-1 focus:ring-indigo-500" 
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Room or Suite Specifier</label>
                <input 
                  required 
                  type="text" 
                  value={newIssueRoom} 
                  onChange={e => setNewIssueRoom(e.target.value)} 
                  placeholder="Deluxe Suite 101"
                  className="w-full border p-2.5 rounded-xl bg-slate-50 focus:outline-hidden focus:bg-white text-xs font-semibold focus:ring-1 focus:ring-indigo-500" 
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Severity / Priority Rating</label>
                <select 
                  value={newIssuePriority} 
                  onChange={e => setNewIssuePriority(e.target.value as any)} 
                  className="w-full border p-2.5 rounded-xl bg-slate-50 focus:outline-hidden focus:bg-white text-xs font-semibold focus:ring-1 focus:ring-indigo-500 cursor-pointer text-slate-700"
                >
                  <option value="LOW">Low - Aesthetic issue only</option>
                  <option value="MEDIUM">Medium - Stiff locks, broken remotes</option>
                  <option value="HIGH">High - AC leaking, broken shower</option>
                  <option value="CRITICAL">Critical - Electricity failure, flood</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t text-xs">
              <button type="button" onClick={() => setShowAddMaintenance(false)} className="px-4 py-2 hover:bg-slate-100 rounded-xl font-bold text-slate-500 border-0 bg-transparent">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-indigo-650 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl font-black shadow-xs cursor-pointer border-0">
                {en ? 'Submit Log' : 'Daftarkan Kerusakan'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}