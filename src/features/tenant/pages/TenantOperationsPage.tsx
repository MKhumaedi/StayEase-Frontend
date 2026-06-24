import React, { useState, useEffect } from 'react';
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
  CheckCircle, 
  X, 
  AlertTriangle, 
  Check, 
  Play, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import TodayCheckInPage from './TodayCheckInPage';
import TodayCheckOutPage from './TodayCheckOutPage';
import TenantReviews from './TenantReviews';

interface OperationsProps {
  onNavigate: (p: string) => void;
  initialTab?: 'check-in' | 'check-out' | 'reviews' | 'housekeeping' | 'maintenance';
}

interface HousekeepingTask {
  id: string;
  roomName: string;
  propertyName: string;
  status: 'DIRTY' | 'CLEANING' | 'CLEAN';
  assignedTo: string;
  checklist: { text: string; done: boolean }[];
}

interface MaintenanceRequest {
  id: string;
  title: string;
  propertyName: string;
  roomNameName: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'RESOLVED';
  createdAt: string;
}

export default function TenantOperationsPage({ onNavigate, initialTab }: OperationsProps) {
  const { token } = useAuth();
  const { language } = useLanguage();
  const en = language === 'en';

  const [activeTab, setActiveTab] = useState<'check-in' | 'check-out' | 'reviews' | 'housekeeping' | 'maintenance'>(initialTab || 'check-in');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Housekeeping mock state (robust, interactive local storage state)
  const [housekeeping, setHousekeeping] = useState<HousekeepingTask[]>(() => {
    const saved = localStorage.getItem('stay_ease_housekeeping');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: 'hk-1',
        roomName: 'Deluxe Suite 101',
        propertyName: 'Ocean Breeze Villa',
        status: 'DIRTY',
        assignedTo: 'Andi Saputra',
        checklist: [
          { text: 'Replace King bed linens & pillows', done: false },
          { text: 'Sanitize bathroom counters & mirror', done: false },
          { text: 'Restock premium espresso capsules', done: false },
          { text: 'Sweep and mop private balcony', done: false }
        ]
      },
      {
        id: 'hk-2',
        roomName: 'Standard Room 304',
        propertyName: 'City Center Apartment',
        status: 'CLEANING',
        assignedTo: 'Rina Wijaya',
        checklist: [
          { text: 'Replace towels', done: true },
          { text: 'Disinfect remote controls', done: false },
          { text: 'Empty kitchen bin and change bags', done: true }
        ]
      },
      {
        id: 'hk-3',
        roomName: 'Penthouse Suite 501',
        propertyName: 'Urban Heights Penthouse',
        status: 'CLEAN',
        assignedTo: 'Budi Santoso',
        checklist: [
          { text: 'Damp-dust luxury light fixtures', done: true },
          { text: 'Polishing premium bath glass', done: true }
        ]
      }
    ];
  });

  // Maintenance state
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>(() => {
    const saved = localStorage.getItem('stay_ease_maintenance');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: 'm-1',
        title: 'Master bed Air Conditioning unit leaking water',
        propertyName: 'Ocean Breeze Villa',
        roomNameName: 'Deluxe Suite 101',
        priority: 'HIGH',
        status: 'PENDING',
        createdAt: '2026-06-21'
      },
      {
        id: 'm-2',
        title: 'Balcony sliding glass lock sliding system stiff',
        propertyName: 'City Center Apartment',
        roomNameName: 'Standard Room 304',
        priority: 'MEDIUM',
        status: 'PENDING',
        createdAt: '2026-06-22'
      },
      {
        id: 'm-3',
        title: 'Main living room smart TV remote unresponsive',
        propertyName: 'Urban Heights Penthouse',
        roomNameName: 'Penthouse Suite 501',
        priority: 'LOW',
        status: 'RESOLVED',
        createdAt: '2026-06-20'
      }
    ];
  });

  // Add maintenance modal fields
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueProp, setNewIssueProp] = useState('');
  const [newIssueRoom, setNewIssueRoom] = useState('');
  const [newIssuePriority, setNewIssuePriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');

  // Persistence effects
  useEffect(() => {
    localStorage.setItem('stay_ease_housekeeping', JSON.stringify(housekeeping));
  }, [housekeeping]);

  useEffect(() => {
    localStorage.setItem('stay_ease_maintenance', JSON.stringify(maintenance));
  }, [maintenance]);

  const handleToggleHKCheck = (hkId: string, taskIdx: number) => {
    setHousekeeping(prev => prev.map(hk => {
      if (hk.id === hkId) {
        const nextChecklist = [...hk.checklist];
        nextChecklist[taskIdx] = { ...nextChecklist[taskIdx], done: !nextChecklist[taskIdx].done };
        return { ...hk, checklist: nextChecklist };
      }
      return hk;
    }));
  };

  const handleUpdateHKStatus = (hkId: string, nextStatus: 'DIRTY' | 'CLEANING' | 'CLEAN') => {
    setHousekeeping(prev => prev.map(hk => {
      if (hk.id === hkId) {
        return { ...hk, status: nextStatus };
      }
      return hk;
    }));
  };

  const handleAddMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssueTitle.trim()) return;

    const request: MaintenanceRequest = {
      id: 'm-' + Date.now(),
      title: newIssueTitle.trim(),
      propertyName: newIssueProp.trim() || 'Ocean Breeze Villa',
      roomNameName: newIssueRoom.trim() || 'Deluxe Suite 101',
      priority: newIssuePriority,
      status: 'PENDING',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setMaintenance(prev => [request, ...prev]);
    setNewIssueTitle('');
    setNewIssueProp('');
    setNewIssueRoom('');
    setShowAddMaintenance(false);
  };

  const handleResolveMaintenance = (mId: string) => {
    setMaintenance(prev => prev.map(m => {
      if (m.id === mId) {
        return { ...m, status: 'RESOLVED' };
      }
      return m;
    }));
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
      <div className="flex bg-slate-105 bg-slate-100 p-1 rounded-2xl w-full lg:w-fit self-center border border-slate-200/50 overflow-x-auto text-[11px] font-bold">
        {[
          { id: 'check-in', name: en ? 'Check-In Today' : 'Check-In Hari Ini', icon: UserCheck },
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
                  : 'text-slate-655 text-slate-600 hover:text-indigo-905 hover:bg-slate-50/50'
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
          <div className="p-4 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  {en ? 'Live Housekeeping Console' : 'Arsip Pantauan Housekeeping Real-time'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {en ? 'Assign sanitation checklists, track cleaners, and update room status.' : 'Pantau penyiapan unit kamar, perbarui check-list, dan ubah status hunian siap huni.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {housekeeping.map(hk => (
                <div key={hk.id} className="bg-slate-50/70 p-5 rounded-2xl border border-slate-150 relative flex flex-col justify-between min-h-[290px]">
                  <div>
                    {/* Badge */}
                    <div className="flex justify-between items-center mb-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        hk.status === 'CLEAN' ? 'bg-emerald-50 text-emerald-600' :
                        hk.status === 'CLEANING' ? 'bg-blue-50 text-blue-600 animate-pulse' :
                        'bg-red-50 text-rose-600'
                      }`}>
                        {hk.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">{hk.assignedTo}</span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-800 font-display leading-tight">{hk.roomName}</h4>
                    <span className="text-[10px] text-slate-450 block font-semibold mb-3">{hk.propertyName}</span>

                    {/* Task checklist */}
                    <div className="flex flex-col gap-2 mt-2">
                      {hk.checklist.map((item, idx) => (
                        <label 
                          key={idx} 
                          onClick={() => handleToggleHKCheck(hk.id, idx)}
                          className="flex items-start gap-2 text-xs font-semibold text-slate-600 select-none cursor-pointer hover:text-slate-900 transition-colors"
                        >
                          <input 
                            type="checkbox" 
                            checked={item.done} 
                            readOnly
                            className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer" 
                          />
                          <span className={`${item.done ? 'line-through text-slate-400' : ''}`}>{item.text}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Operational status update drawer */}
                  <div className="border-t border-slate-200 mt-4 pt-3 flex gap-1.5">
                    <button 
                      onClick={() => handleUpdateHKStatus(hk.id, 'DIRTY')} 
                      className={`flex-1 py-1 px-2 text-[9px] rounded-lg font-extrabold border uppercase tracking-wider ${hk.status === 'DIRTY' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-white text-slate-500 hover:bg-slate-100'}`}
                    >
                      Dirty
                    </button>
                    <button 
                      onClick={() => handleUpdateHKStatus(hk.id, 'CLEANING')} 
                      className={`flex-1 py-1 px-2 text-[9px] rounded-lg font-extrabold border uppercase tracking-wider ${hk.status === 'CLEANING' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-500 hover:bg-slate-100'}`}
                    >
                      Cleaning
                    </button>
                    <button 
                      onClick={() => handleUpdateHKStatus(hk.id, 'CLEAN')} 
                      className={`flex-1 py-1 px-2 text-[9px] rounded-[8px] font-extrabold border uppercase tracking-wider ${hk.status === 'CLEAN' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white text-slate-500 hover:bg-slate-100'}`}
                    >
                      Clean
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: Maintenance Issues Ledger */}
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

            {maintenance.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-xs">
                {en ? 'No maintenance logs recorded.' : 'Belum ada masalah sarana dilaporkan.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-slate-505 text-slate-500 font-black tracking-wider uppercase text-[9px]">
                      <th className="p-3">Defect Issue Title</th>
                      <th className="p-3">Location Context</th>
                      <th className="p-3">Logged Date</th>
                      <th className="p-3">Priority Rating</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Administrative</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-650">
                    {maintenance.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <p className={`font-bold text-slate-800 leading-tight ${item.status === 'RESOLVED' ? 'line-through text-slate-400' : ''}`}>{item.title}</p>
                          <span className="text-[9px] text-slate-400 font-normal">Task Ref: {item.id}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-700">{item.roomNameName}</span>
                          <span className="text-[10px] text-slate-450 block font-normal">{item.propertyName}</span>
                        </td>
                        <td className="p-3">{item.createdAt}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold tracking-wide uppercase ${
                            item.priority === 'CRITICAL' ? 'bg-red-101 bg-red-100 text-red-700' :
                            item.priority === 'HIGH' ? 'bg-amber-101 bg-amber-100 text-amber-700' :
                            item.priority === 'MEDIUM' ? 'bg-blue-105 bg-blue-100 text-blue-700' :
                            'bg-slate-101 bg-slate-100 text-slate-500'
                          }`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${item.status === 'RESOLVED' ? 'bg-emerald-55 bg-emerald-50 text-emerald-600' : 'bg-amber-55 bg-amber-50 text-amber-600'}`}>
                            {item.status === 'RESOLVED' ? (en ? 'Resolved' : 'Selesai') : (en ? 'Pending' : 'Memerlukan Perbaikan')}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {item.status === 'PENDING' ? (
                            <button 
                              onClick={() => handleResolveMaintenance(item.id)}
                              className="px-3 py-1.5 bg-emerald-650 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-extrabold shadow-3xs cursor-pointer flex items-center gap-1 ml-auto"
                            >
                              <Check className="w-3 h-3" /> {en ? 'Resolve defect' : 'Selesaikan'}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic font-semibold flex items-center gap-1 justify-end"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 inline-block" /> {en ? 'No Action Req' : 'Selesai'}</span>
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
              <button type="button" onClick={() => setShowAddMaintenance(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"><X className="w-4 h-4" /></button>
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
                  className="w-full border p-2.5 rounded-xl bg-slate-50 focus:outline-hidden focus:bg-white text-xs font-semibold focus:ring-1 focus:ring-indigo-505 focus:ring-indigo-500" 
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
                  className="w-full border p-2.5 rounded-xl bg-slate-50 focus:outline-hidden focus:bg-white text-xs font-semibold focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="LOW">Low - Aesthetic issue only</option>
                  <option value="MEDIUM">Medium - Stiff locks, broken remotes</option>
                  <option value="HIGH">High - AC leaking, broken shower</option>
                  <option value="CRITICAL">Critical - Electricity failure, flood</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t text-xs">
              <button type="button" onClick={() => setShowAddMaintenance(false)} className="px-4 py-2 hover:bg-slate-100 rounded-xl font-bold text-slate-500">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-indigo-650 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl font-black shadow-xs cursor-pointer">
                {en ? 'Submit Log' : 'Daftarkan Kerusakan'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
