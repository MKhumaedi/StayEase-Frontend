import React, { useState, useEffect } from 'react';
import { Property, PropertyCategory } from '../../../types';
import { Plus, Layout, Loader2, Building2, Hotel, CalendarRange, Sparkles, MapPin, Clock, Search } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';
import { usePropertyView } from '../../properties/hooks/usePropertyView';
import { PropertyListView } from '../../properties/components/PropertyListView';
import { PropertyGridView } from '../../properties/components/PropertyGridView';
import { PropertyViewSwitcher } from '../../properties/components/PropertyViewSwitcher';
import { PropertyDetailModal } from '../../properties/components/PropertyDetailModal';
import { DeleteConfirmModal } from '../../properties/components/DeleteConfirmModal';
import { PropertyWizardModal } from '../../properties/components/PropertyWizardModal';
import { useAuth } from '../../../shared/context/AuthContext';
import { useWishlist } from '../../../shared/context/WishlistContext';
import { useAsyncAction, useIdempotency } from '../../../protection';
import { clearFilterOptionsCache } from '../../../hooks/usePropertyFilterOptions';

// Import sub components
import TenantRooms from './TenantRooms';
import TenantAvailability from './TenantAvailability';

const DEFAULT_CATEGORIES: PropertyCategory[] = [
  { id: 'cat-1', name: 'Luxury Villas', slug: 'luxury-villas' },
  { id: 'cat-2', name: 'Penthouses', slug: 'penthouses' },
  { id: 'cat-3', name: 'Cabins', slug: 'cabins' }
];

export default function TenantProperties({ initialTab }: { initialTab?: 'list' | 'rooms' | 'calendar' }) {
  const { language } = useLanguage();
  const { token, user } = useAuth();
  const { triggerToast } = useWishlist();
  const [properties, setProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<PropertyCategory[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  // Drafts state
  const [drafts, setDrafts] = useState<any[]>([]);
  const [editingDraft, setEditingDraft] = useState<any | null>(null);

  // Search, filter, sort & pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Sub-tabs state control
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'rooms' | 'calendar'>(initialTab || 'list');

  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);

  // Modular Component State Controls
  const { view, setView } = usePropertyView();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [propertyToDelete, setPropertyToDelete] = useState<any | null>(null);

  const [showDetail, setShowDetail] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // Initialize Idempotency Keys and hooks
  const { idempotencyKey: saveIdempKey, rotateKey: rotateSaveKey } = useIdempotency();
  const { idempotencyKey: deleteIdempKey, rotateKey: rotateDeleteKey } = useIdempotency();

  // Load drafts
  const loadDrafts = () => {
    const savedDraftsRaw = localStorage.getItem('stay_ease_property_drafts');
    if (savedDraftsRaw) {
      try {
        const parsed = JSON.parse(savedDraftsRaw);
        const tenantId = user?.id || 'anonymous';
        const filtered = parsed.filter((d: any) => d.tenantId === tenantId);
        setDrafts(filtered);
      } catch (e) {
        console.error('Failed to parse drafts:', e);
      }
    } else {
      setDrafts([]);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, [user]);

  // Active Draft Browser Refresh restore
  useEffect(() => {
    const activeDraftId = localStorage.getItem('stay_ease_active_draft_id');
    if (activeDraftId) {
      const savedDraftsRaw = localStorage.getItem('stay_ease_property_drafts');
      if (savedDraftsRaw) {
        try {
          const parsed = JSON.parse(savedDraftsRaw);
          const activeDraft = parsed.find((d: any) => d.id === activeDraftId);
          if (activeDraft) {
            setEditingProperty(null);
            setEditingDraft(activeDraft);
            setShowWizard(true);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // Reset pagination on search, filter or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy]);

  const handleContinueDraft = (draft: any) => {
    setEditingProperty(null);
    setEditingDraft(draft);
    setShowWizard(true);
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      await fetch(`/api/properties/${draftId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
    } catch (e) {
      console.error('Failed to delete draft from server:', e);
    }

    const savedDraftsRaw = localStorage.getItem('stay_ease_property_drafts');
    if (savedDraftsRaw) {
      try {
        const parsed = JSON.parse(savedDraftsRaw);
        const filtered = parsed.filter((d: any) => d.id !== draftId);
        localStorage.setItem('stay_ease_property_drafts', JSON.stringify(filtered));
        
        const activeDraftId = localStorage.getItem('stay_ease_active_draft_id');
        if (activeDraftId === draftId) {
          localStorage.removeItem('stay_ease_active_draft_id');
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadDrafts();
  };

  // Fetch initial parameters
  const retrieveData = async () => {
    try {
      setLoading(true);
      const propRes = await fetch('/api/properties?byTenant=true', token ? {
        headers: { 'Authorization': `Bearer ${token}` }
      } : undefined);
      if (propRes.ok) {
        const propData = await propRes.json();
        const allProps = propData.data || [];
        
        // Filter out drafts from normal properties list
        const nonDraftProps = allProps.filter((p: any) => p.status !== 'DRAFT');
        setProperties(nonDraftProps);

        // Map drafts from DB format to wizard form format
        const dbDraftsMapped = allProps
          .filter((p: any) => p.status === 'DRAFT')
          .map((p: any) => {
            const formRooms = p.rooms ? p.rooms.map((r: any) => {
              let parsedFloor = { bedCount: 1, bathCount: 1, quantity: 1 };
              try {
                if (r.floor && r.floor.trim().startsWith('{')) {
                  parsedFloor = JSON.parse(r.floor);
                }
              } catch (e) {}
              return {
                id: r.id,
                name: r.name,
                type: r.type,
                capacity: r.capacity,
                basePrice: r.basePrice || 500000,
                description: r.wing || r.description || '',
                bedCount: parsedFloor.bedCount || 1,
                bathCount: parsedFloor.bathCount || 1,
                quantity: parsedFloor.quantity || 1,
                image: r.image || ''
              };
            }) : [];

            return {
              id: p.id,
              tenantId: p.tenantId,
              currentStep: p.currentWizardStep || 1,
              completionPercentage: p.progressPercentage || 0,
              draftUpdatedAt: p.updatedAt || new Date().toISOString(),
              status: 'DRAFT',
              form: {
                name: p.name || '',
                categoryId: p.categoryId || '',
                description: p.description || '',
                fullAddress: p.address || p.location || '',
                city: p.city || '',
                province: p.province || '',
                latitude: p.latitude || -8.7209,
                longitude: p.longitude || 115.1691,
                imageUrls: p.imageUrls || [],
                coverImageIndex: 0,
                bedrooms: p.beds || 1,
                bathrooms: p.baths || 1,
                guests: p.guests || 2,
                areaSqm: p.sqft || 35,
                basePrice: p.basePrice || 500000,
                cleaningFee: p.cleaningFee || 0,
                serviceFee: p.serviceFee || 0,
                securityDeposit: p.securityDeposit || 0,
                status: 'DRAFT',
                rooms: formRooms,
                amenities: p.amenities || []
              }
            };
          });

        setDrafts(dbDraftsMapped);
        localStorage.setItem('stay_ease_property_drafts', JSON.stringify(dbDraftsMapped));
      }
      const catRes = await fetch('/api/categories');
      if (catRes.ok) {
        const catData = await catRes.json();
        if (catData.categories && catData.categories.length > 0) {
          setCategories(catData.categories);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    retrieveData();
  }, [token]);

  // Quick Action: Toggle Stays Status (Active/Draft)
  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      setProperties(prev => prev.map(p => p.id === id ? { ...p, status: nextStatus as any } : p));
      await fetch(`/api/properties/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: nextStatus })
      });
    } catch (err) {
      console.error('Failed status toggle', err);
    }
  };

  // Quick Action: Delete Stays (Draft or Soft deleted index) using protection hook + idempotency
  const { execute: handleDeleteConfirm, isLoading: isDeleting } = useAsyncAction(async () => {
    if (!propertyToDelete) return;
    const isDraft = !!propertyToDelete.isDraft || propertyToDelete.status === 'DRAFT';
    try {
      const res = await fetch(`/api/properties/${propertyToDelete.id}`, { 
        method: 'DELETE',
        headers: {
          'x-idempotency-key': deleteIdempKey,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (res.ok || isDraft) {
        if (isDraft) {
          // Clean up draft from local storage
          const savedDraftsRaw = localStorage.getItem('stay_ease_property_drafts');
          if (savedDraftsRaw) {
            try {
              const parsed = JSON.parse(savedDraftsRaw);
              const filtered = parsed.filter((d: any) => d.id !== propertyToDelete.id);
              localStorage.setItem('stay_ease_property_drafts', JSON.stringify(filtered));
              
              const activeDraftId = localStorage.getItem('stay_ease_active_draft_id');
              if (activeDraftId === propertyToDelete.id) {
                localStorage.removeItem('stay_ease_active_draft_id');
              }
            } catch (e) {
              console.error(e);
            }
          }
          loadDrafts();
        } else {
          setProperties(prev => prev.filter(p => p.id !== propertyToDelete.id));
        }

        clearFilterOptionsCache();
        triggerToast(
          language === 'en' ? 'Property deleted successfully.' : 'Properti berhasil dihapus.',
          'success'
        );
        setShowDelete(false);
        setPropertyToDelete(null);
      } else {
        const errorData = await res.json().catch(() => ({}));
        const errMsg = errorData.error || (language === 'en' ? 'Failed to delete property.' : 'Gagal menghapus properti.');
        triggerToast(errMsg, 'error');
      }
    } catch (err: any) {
      console.error(err);
      if (isDraft) {
        // Fallback for draft offline/database deletion error to ensure local draft cleanup works
        const savedDraftsRaw = localStorage.getItem('stay_ease_property_drafts');
        if (savedDraftsRaw) {
          try {
            const parsed = JSON.parse(savedDraftsRaw);
            const filtered = parsed.filter((d: any) => d.id !== propertyToDelete.id);
            localStorage.setItem('stay_ease_property_drafts', JSON.stringify(filtered));
            
            const activeDraftId = localStorage.getItem('stay_ease_active_draft_id');
            if (activeDraftId === propertyToDelete.id) {
              localStorage.removeItem('stay_ease_active_draft_id');
            }
          } catch (e) {
            console.error(e);
          }
        }
        loadDrafts();
        clearFilterOptionsCache();
        triggerToast(
          language === 'en' ? 'Property deleted successfully.' : 'Properti berhasil dihapus.',
          'success'
        );
        setShowDelete(false);
        setPropertyToDelete(null);
      } else {
        triggerToast(
          err?.message || (language === 'en' ? 'Failed to delete property.' : 'Gagal menghapus properti.'),
          'error'
        );
      }
    } finally {
      rotateDeleteKey();
    }
  });

  // Quick Action: Insert/Update Stays records using protection hook + idempotency
  const { execute: handleWizardSubmit } = useAsyncAction(async (formData: any) => {
    const method = editingProperty ? 'PUT' : 'POST';
    const endpoint = editingProperty ? `/api/properties/${editingProperty.id}` : '/api/properties';
    const payload = {
      ...formData,
      beds: formData.bedrooms,
      baths: formData.bathrooms,
      sqft: formData.areaSqm,
      location: `${formData.city}, ${formData.province}`
    };

    const res = await fetch(endpoint, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'x-idempotency-key': saveIdempKey,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit stay');
    }

    clearFilterOptionsCache();
    rotateSaveKey();
    await retrieveData();
  });

  const en = language === 'en';

  const mappedDrafts = drafts.map(d => ({
    id: d.id,
    name: d.form.name || (en ? 'Untitled Property' : 'Properti Tanpa Nama'),
    categoryId: d.form.categoryId,
    description: d.form.description,
    address: d.form.fullAddress || '',
    location: d.form.city && d.form.province ? `${d.form.city}, ${d.form.province}` : (d.form.fullAddress || ''),
    city: d.form.city || '',
    province: d.form.province || '',
    imageUrls: d.form.imageUrls || [],
    basePrice: d.form.basePrice || 0,
    status: 'DRAFT' as const,
    rating: 0,
    reviewCount: 0,
    isDraft: true,
    completionPercentage: d.completionPercentage,
    currentStep: d.currentStep,
    draftUpdatedAt: d.draftUpdatedAt,
    rawDraft: d
  }));

  const combinedList = [...mappedDrafts, ...properties];

  // Apply search
  let searchedList = combinedList;
  if (searchTerm.trim() !== '') {
    const query = searchTerm.toLowerCase();
    searchedList = searchedList.filter(p => 
      p.name.toLowerCase().includes(query) ||
      (p.location && p.location.toLowerCase().includes(query)) ||
      (p.description && p.description.toLowerCase().includes(query))
    );
  }

  // Apply status filter
  let filteredList = searchedList;
  if (statusFilter !== 'ALL') {
    filteredList = filteredList.filter(p => p.status.toUpperCase() === statusFilter);
  }

  // Apply sorting
  const sortedList = [...filteredList].sort((a, b) => {
    if (sortBy === 'name_asc') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'name_desc') {
      return b.name.localeCompare(a.name);
    } else if (sortBy === 'price_asc') {
      return a.basePrice - b.basePrice;
    } else if (sortBy === 'price_desc') {
      return b.basePrice - a.basePrice;
    } else {
      // newest: drafts first (sorted by draftUpdatedAt) then published
      const timeA = (a as any).isDraft ? new Date((a as any).draftUpdatedAt).getTime() : 0;
      const timeB = (b as any).isDraft ? new Date((b as any).draftUpdatedAt).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      // fallback to name comparison if neither are drafts
      return a.name.localeCompare(b.name);
    }
  });

  // Apply pagination
  const totalItems = sortedList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedProperties = sortedList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div id="tenant-properties-page" className="flex flex-col gap-6 pb-12">
      {/* Extranet Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-indigo-950 font-display flex items-center gap-2">
            <Layout className="w-5 h-5 text-indigo-960 block shrink-0" />
            {en ? 'Properties & Inventories' : 'Pengelolaan Aset & Inventaris'}
          </h2>
          <p className="text-xs text-slate-500">
            {en 
              ? 'List new vacation homes, configure rates metrics, manage room configuration, and map out maintenance patterns.' 
              : 'Daftarkan penginapan, edit tarif kamar, konfigurasi inventaris kamar, dan kalender pemblokiran kuota.'}
          </p>
        </div>

        {activeSubTab === 'list' && (
          <div className="flex items-center gap-2.5 self-stretch sm:self-auto shrink-0 select-none">
            <PropertyViewSwitcher view={view} onChange={setView} />
            
            <button 
              id="add-property-ext-btn"
              onClick={() => { setEditingProperty(null); setShowWizard(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-950 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-950/10 cursor-pointer transition-all hover:scale-102"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{en ? 'Add Property Listing' : 'Tambah Iklan Properti'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Horizontal horizontal sub-bar */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-full lg:w-fit self-center border border-slate-200/50 overflow-x-auto text-[11px] font-bold">
        {[
          { id: 'list', name: en ? 'Property List' : 'Daftar Properti', icon: Layout },
          { id: 'rooms', name: en ? 'Room Inventory' : 'Inventaris Kamar', icon: Hotel },
          { id: 'calendar', name: en ? 'Pricing & Calendar' : 'Tarif & Kalender', icon: CalendarRange }
        ].map(tab => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border-0 bg-transparent text-slate-600 hover:text-indigo-900 hover:bg-slate-50"
              style={{
                backgroundColor: activeSubTab === tab.id ? '#312e81' : 'transparent',
                color: activeSubTab === tab.id ? '#ffffff' : '#475569'
              }}
            >
              <TabIcon className="w-3.5 h-3.5" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Extranet Content Frames */}
      <div className="bg-white rounded-2xl border border-slate-50 p-1">
        
        {activeSubTab === 'list' && (
          <>
            {/* Search, Filter, Sort and Pagination Bar */}
            <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
                {/* Search input */}
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={en ? "Search properties..." : "Cari properti..."}
                    className="pl-9 pr-4 py-2 w-full bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-850"
                  />
                </div>

                {/* Status Filter buttons/tabs */}
                <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  {(['ALL', 'DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'] as const).map((status) => {
                    const label = status === 'ALL' ? (en ? 'All' : 'Semua') :
                                  status === 'DRAFT' ? (en ? 'Draft' : 'Draf') :
                                  status === 'ACTIVE' ? (en ? 'Active' : 'Aktif') :
                                  status === 'INACTIVE' ? (en ? 'Inactive' : 'Nonaktif') :
                                  status === 'ARCHIVED' ? (en ? 'Archived' : 'Arsip') : status;
                    
                    return (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all border-0 ${
                          statusFilter === status
                            ? 'bg-white text-indigo-950 shadow-xs font-black'
                            : 'text-slate-500 hover:text-indigo-955 hover:bg-white/50 bg-transparent'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-between sm:justify-start">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {en ? 'Sort By' : 'Urutkan'}
                </span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="newest">{en ? 'Recently Updated' : 'Baru Diperbarui'}</option>
                  <option value="name_asc">{en ? 'Name (A-Z)' : 'Nama (A-Z)'}</option>
                  <option value="name_desc">{en ? 'Name (Z-A)' : 'Nama (Z-A)'}</option>
                  <option value="price_asc">{en ? 'Price: Low to High' : 'Harga: Rendah ke Tinggi'}</option>
                  <option value="price_desc">{en ? 'Price: High to Low' : 'Harga: Tinggi ke Rendah'}</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div id="properties-loading-stage" className="py-24 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                <span className="text-[10px] uppercase font-black tracking-widest">{en ? 'Retrieving listings index...' : 'Memuat properti...'}</span>
              </div>
            ) : combinedList.length === 0 ? (
              <div id="properties-empty-stage" className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-205">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-extrabold text-slate-800 text-sm">{en ? 'No Stays Registered' : 'Belum Ada Properti Terdaftar'}</h3>
                <p className="text-xs text-slate-405 mt-1 max-w-xs mx-auto">{en ? 'Initiate your rental catalog to start hosting globally.' : 'Mulai bisnis penginapan Anda dengan mendaftarkan properti pertama!'}</p>
                <button 
                  onClick={() => { setEditingProperty(null); setShowWizard(true); }}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-950 text-white rounded-xl text-xs font-bold hover:bg-indigo-900 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> <span>{en ? 'List First Property' : 'Daftarkan Properti Pertama'}</span>
                </button>
              </div>
            ) : sortedList.length === 0 ? (
              <div id="properties-filtered-empty-stage" className="text-center py-20 bg-white">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-extrabold text-slate-800 text-sm">{en ? 'No Matching Properties' : 'Tidak Ada Properti yang Cocok'}</h3>
                <p className="text-xs text-slate-450 mt-1 max-w-xs mx-auto">
                  {en ? 'No listings found matching your search or filters. Try adjusting your filter settings.' : 'Tidak ada properti yang cocok dengan pencarian atau filter Anda. Silakan ubah filter Anda.'}
                </p>
                <button
                  onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); setSortBy('newest'); }}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  <span>{en ? 'Reset Filters' : 'Atur Ulang Filter'}</span>
                </button>
              </div>
            ) : (
              <div id="properties-rendered-stage" className="transition-all duration-300">
                {view === 'list' ? (
                  <PropertyListView 
                    properties={paginatedProperties} 
                    categories={categories}
                    onView={(p) => { setSelectedProperty(p); setShowDetail(true); }}
                    onEdit={(p) => { setEditingProperty(p); setShowWizard(true); }}
                    onDelete={(p) => { setPropertyToDelete(p); setShowDelete(true); }}
                    onToggleStatus={handleToggleStatus}
                    onDeleteDraft={(id) => {
                      const draft = combinedList.find(item => item.id === id);
                      if (draft) {
                        setPropertyToDelete(draft);
                        setShowDelete(true);
                      }
                    }}
                    onContinueDraft={handleContinueDraft}
                  />
                ) : (
                  <PropertyGridView 
                    properties={paginatedProperties} 
                    categories={categories}
                    onView={(p) => { setSelectedProperty(p); setShowDetail(true); }}
                    onEdit={(p) => { setEditingProperty(p); setShowWizard(true); }}
                    onDelete={(p) => { setPropertyToDelete(p); setShowDelete(true); }}
                    onToggleStatus={handleToggleStatus}
                    onDeleteDraft={(id) => {
                      const draft = combinedList.find(item => item.id === id);
                      if (draft) {
                        setPropertyToDelete(draft);
                        setShowDelete(true);
                      }
                    }}
                    onContinueDraft={handleContinueDraft}
                  />
                )}

                {/* Pagination footer */}
                {totalPages > 1 && (
                  <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <span className="text-[11px] font-semibold text-slate-500">
                      {en 
                        ? `Showing ${Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)} to ${Math.min(totalItems, currentPage * itemsPerPage)} of ${totalItems} properties` 
                        : `Menampilkan ${Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)} sampai ${Math.min(totalItems, currentPage * itemsPerPage)} dari ${totalItems} properti`}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        {en ? 'Previous' : 'Sebelumnya'}
                      </button>
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        {en ? 'Next' : 'Berikutnya'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeSubTab === 'rooms' && (
          <TenantRooms />
        )}

        {activeSubTab === 'calendar' && (
          <TenantAvailability />
        )}

      </div>

      {/* MODAL WRAPPERS */}
      <PropertyDetailModal 
        isOpen={showDetail} 
        property={selectedProperty} 
        categories={categories} 
        onClose={() => { setShowDetail(false); setSelectedProperty(null); }} 
      />

      <DeleteConfirmModal 
        isOpen={showDelete} 
        property={propertyToDelete}
        isDeleting={isDeleting} 
        onConfirm={handleDeleteConfirm} 
        onClose={() => { setShowDelete(false); setPropertyToDelete(null); }} 
      />

      <PropertyWizardModal 
        isOpen={showWizard} 
        categories={categories} 
        editingProperty={editingProperty} 
        editingDraft={editingDraft}
        onClose={() => { 
          setShowWizard(false); 
          setEditingProperty(null); 
          setEditingDraft(null); 
        }} 
        onSubmit={handleWizardSubmit} 
        onSaveDraft={loadDrafts}
      />
    </div>
  );
}
