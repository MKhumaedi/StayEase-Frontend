import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Plus, Calendar, Edit2, Trash2, ShieldAlert,
  Loader2, BadgePercent, CheckCircle, XCircle, Search, Home, Building
} from 'lucide-react';

interface PeakSeasonManagementProps {
  properties: any[];
}

const fetchAdmin = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('stayease_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
};

export default function PeakSeasonManagement({ properties }: PeakSeasonManagementProps) {
  const [seasons, setSeasons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  
  // Form State
  const [fieldName, setFieldName] = useState('');
  const [fieldPropertyId, setFieldPropertyId] = useState('');
  const [fieldRoomId, setFieldRoomId] = useState('all');
  const [fieldStartDate, setFieldStartDate] = useState('');
  const [fieldEndDate, setFieldEndDate] = useState('');
  const [fieldRateMultiplier, setFieldRateMultiplier] = useState('1.35');
  const [fieldIsActive, setFieldIsActive] = useState(true);
  
  // Selected Property's Rooms
  const [propertyRooms, setPropertyRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const fetchSeasons = async () => {
    setLoading(true);
    try {
      const data = await fetchAdmin('/api/admin/peak-seasons');
      if (data.success) {
        setSeasons(data.seasons);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch peak season rates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeasons();
  }, []);

  // Fetch rooms on property selection
  useEffect(() => {
    if (!fieldPropertyId || fieldPropertyId === '') {
      setPropertyRooms([]);
      return;
    }
    const loadRooms = async () => {
      setLoadingRooms(true);
      try {
        const data = await fetchAdmin(`/api/admin/properties/${fieldPropertyId}/rooms`);
        if (data.success) {
          setPropertyRooms(data.rooms);
        }
      } catch (err: any) {
        console.error('Failed to load rooms:', err);
      } finally {
        setLoadingRooms(false);
      }
    };
    loadRooms();
  }, [fieldPropertyId]);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedSeasonId(null);
    setFieldName('');
    setFieldPropertyId(properties[0]?.id || '');
    setFieldRoomId('all');
    setFieldStartDate('');
    setFieldEndDate('');
    setFieldRateMultiplier('1.35');
    setFieldIsActive(true);
    setErrorMsg('');
    setSuccessMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (season: any) => {
    setModalMode('edit');
    setSelectedSeasonId(season.id);
    setFieldName(season.name);
    setFieldPropertyId(season.propertyId);
    setFieldRoomId(season.roomId || 'all');
    setFieldStartDate(season.startDate);
    setFieldEndDate(season.endDate);
    setFieldRateMultiplier(String(season.rateMultiplier));
    setFieldIsActive(season.isActive);
    setErrorMsg('');
    setSuccessMsg('');
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (id: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetchAdmin(`/api/admin/peak-seasons/${id}/toggle`, {
        method: 'PUT'
      });
      if (res.success) {
        setSeasons(prev => prev.map(s => s.id === id ? res.season : s));
        setSuccessMsg('Status toggled successfully.');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Toggle failed.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleDeleteSeason = async (id: string) => {
    if (!confirm('Are you sure you want to delete this peak season rate? This action cannot be undone.')) {
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetchAdmin(`/api/admin/peak-seasons/${id}`, {
        method: 'DELETE'
      });
      if (res.success) {
        setSeasons(prev => prev.filter(s => s.id !== id));
        setSuccessMsg('Peak season rate deleted successfully.');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Deletion failed.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fieldName || !fieldPropertyId || !fieldStartDate || !fieldEndDate || !fieldRateMultiplier) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (new Date(fieldStartDate) > new Date(fieldEndDate)) {
      setErrorMsg('Start date cannot be after the end date.');
      return;
    }

    const payload = {
      name: fieldName,
      propertyId: fieldPropertyId,
      roomId: fieldRoomId === 'all' ? null : fieldRoomId,
      startDate: fieldStartDate,
      endDate: fieldEndDate,
      rateMultiplier: Number(fieldRateMultiplier),
      isActive: fieldIsActive
    };

    try {
      if (modalMode === 'create') {
        const res = await fetchAdmin('/api/admin/peak-seasons', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (res.success) {
          setSeasons(prev => [res.season, ...prev]);
          setSuccessMsg('Peak season rate activated successfully!');
          setTimeout(() => {
            setIsModalOpen(false);
            setSuccessMsg('');
          }, 1500);
        }
      } else {
        const res = await fetchAdmin(`/api/admin/peak-seasons/${selectedSeasonId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        if (res.success) {
          setSeasons(prev => prev.map(s => s.id === selectedSeasonId ? res.season : s));
          setSuccessMsg('Peak season pricing updated successfully.');
          setTimeout(() => {
            setIsModalOpen(false);
            setSuccessMsg('');
          }, 1500);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit peak season rate.');
    }
  };

  const filteredSeasons = seasons.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.property?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" id="peak-seasons-admin-module">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            Peak Season Dynamic Price Engine
          </h2>
          <p className="text-sm text-gray-500">Configure holiday rates and seasonal multiplier adjustments property-wide or per room.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/15 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Create Peak Season Rate
        </button>
      </div>

      {/* Global Toast Messages */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-3 text-xs text-emerald-700 flex items-center gap-2 animate-pulse">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && !isModalOpen && (
        <div className="bg-rose-50 border border-rose-150 rounded-xl p-3 text-xs text-rose-700 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search Filter Box */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-4 flex items-center gap-3">
        <Search className="h-4 w-4 text-gray-400" />
        <input 
          type="text" 
          placeholder="Filter by season name or property..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-xs text-gray-700 bg-transparent outline-none w-full placeholder-gray-400"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-2">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Syncing seasons with database...</p>
        </div>
      ) : filteredSeasons.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-12 text-center flex flex-col items-center justify-center space-y-3">
          <Calendar className="h-12 w-12 text-gray-300" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">No active peak season configurations found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">Create and activate special rates for summer, holiday weeks, or premium weekends easily.</p>
          </div>
          <button 
            onClick={openCreateModal}
            className="border border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-xs font-semibold px-3.5 py-2 rounded-xl transition"
          >
            Activate First Season Rate
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6">Season ID / Name</th>
                  <th className="py-3.5 px-6">Properties Affected</th>
                  <th className="py-3.5 px-6">Dates Range</th>
                  <th className="py-3.5 px-6">Multiplier Override</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 divide-dashed text-xs text-gray-700">
                {filteredSeasons.map((season) => (
                  <tr key={season.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-gray-900">{season.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{season.id}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Building className="h-3.5 w-3.5 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">{season.property?.name || 'All Properties'}</div>
                          {season.roomId ? (
                            <div className="text-[10px] text-indigo-650 bg-indigo-50 px-1.5 py-0.5 rounded font-medium inline-block mt-0.5">
                              Room: {season.room?.name || 'Specified Unit'}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium inline-block mt-0.5">
                              Property-wide
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 font-medium text-gray-700">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span>{season.startDate} to {season.endDate}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 font-semibold text-indigo-600 bg-indigo-100/50 px-2 py-1 rounded-lg w-max">
                        <BadgePercent className="h-4 w-4 text-indigo-500" />
                        <span>{Number(season.rateMultiplier).toFixed(2)}x</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <button 
                        onClick={() => handleToggleStatus(season.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight uppercase leading-none transition cursor-pointer ${
                          season.isActive 
                            ? 'bg-emerald-105 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        {season.isActive ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-emerald-555 text-emerald-600" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 text-rose-600" />
                            <span>Deactivated</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 text-gray-400">
                        <button 
                          onClick={() => openEditModal(season)}
                          className="p-1 px-2 rounded hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="Edit pricing details"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteSeason(season.id)}
                          className="p-1 px-2 rounded hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete pricing rate"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[2000] animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden transform animate-scale-up">
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-white border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                {modalMode === 'create' ? 'Create Dynamic Peak Season Pricing' : 'Modify Peak Season Parameters'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 px-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-150 rounded-xl p-3.5 text-xs text-rose-700 flex items-center gap-2.5">
                  <ShieldAlert className="h-4.5 w-4.5 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-3.5 text-xs text-emerald-700 flex items-center gap-2.5 animate-pulse">
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Season Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Summer Break, Eid Holidays, New Year Season" 
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  className="w-full text-xs text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 focus:border-indigo-500 focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Select Property *</label>
                  <select 
                    value={fieldPropertyId}
                    onChange={(e) => {
                      setFieldPropertyId(e.target.value);
                      setFieldRoomId('all');
                    }}
                    className="w-full text-xs text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 focus:border-indigo-500 focus:outline-none bg-white transition"
                  >
                    <option value="" disabled>-- Choose Property --</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    Select Room Scope
                    {loadingRooms && <Loader2 className="h-3 w-3 text-indigo-500 animate-spin" />}
                  </label>
                  <select 
                    value={fieldRoomId}
                    onChange={(e) => setFieldRoomId(e.target.value)}
                    disabled={!fieldPropertyId}
                    className="w-full text-xs text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 focus:border-indigo-500 focus:outline-none bg-white transition disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="all">All Rooms (Property-wide)</option>
                    {propertyRooms.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Start Date *</label>
                  <input 
                    type="date"
                    required 
                    value={fieldStartDate}
                    onChange={(e) => setFieldStartDate(e.target.value)}
                    className="w-full text-xs text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 focus:border-indigo-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">End Date *</label>
                  <input 
                    type="date"
                    required 
                    value={fieldEndDate}
                    onChange={(e) => setFieldEndDate(e.target.value)}
                    className="w-full text-xs text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 focus:border-indigo-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Rate Multiplier * (e.g. 1.35)</label>
                  <input 
                    type="number"
                    required
                    step="0.01"
                    min="1.0"
                    max="10.0"
                    placeholder="1.35" 
                    value={fieldRateMultiplier}
                    onChange={(e) => setFieldRateMultiplier(e.target.value)}
                    className="w-full text-xs text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 focus:border-indigo-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Activation Status</label>
                  <div className="flex items-center mt-2">
                    <input 
                      type="checkbox" 
                      id="form-is-active"
                      checked={fieldIsActive}
                      onChange={(e) => setFieldIsActive(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5"
                    />
                    <label htmlFor="form-is-active" className="ml-2.5 text-xs text-gray-600 font-medium select-none">
                      Active immediately
                    </label>
                  </div>
                </div>
              </div>

              <div className="px-1 py-1 text-[10px] text-gray-400 bg-slate-50 border border-slate-100 rounded-lg p-2 flex items-start gap-1.5 mt-2">
                <ShieldAlert className="h-4 w-4 text-slate-500 shrink-0" />
                <span>Creating a rate with the same timeline will cause an error due to overlap prevention block validation.</span>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-150">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-transparent text-gray-500 hover:bg-gray-100 text-xs font-semibold px-4 py-2.5 rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-indigo-650 bg-indigo-600 text-white hover:bg-slate-900 text-xs font-bold px-5 py-2.5 rounded-xl transition shadow shadow-indigo-650/15"
                >
                  {modalMode === 'create' ? 'Activate Season Rate' : 'Save Adjustments'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
