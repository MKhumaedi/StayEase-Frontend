import React, { useState, useEffect } from 'react';
import { Property, PropertyCategory } from '../../../types';
import { Plus, Layout, Loader2, Building2, Hotel, CalendarRange } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';
import { usePropertyView } from '../../properties/hooks/usePropertyView';
import { PropertyListView } from '../../properties/components/PropertyListView';
import { PropertyGridView } from '../../properties/components/PropertyGridView';
import { PropertyViewSwitcher } from '../../properties/components/PropertyViewSwitcher';
import { PropertyDetailModal } from '../../properties/components/PropertyDetailModal';
import { DeleteConfirmModal } from '../../properties/components/DeleteConfirmModal';
import { PropertyWizardModal } from '../../properties/components/PropertyWizardModal';
import { useAuth } from '../../../shared/context/AuthContext';
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
  const { token } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<PropertyCategory[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

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
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);

  const [showDetail, setShowDetail] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // Initialize Idempotency Keys and hooks
  const { idempotencyKey: saveIdempKey, rotateKey: rotateSaveKey } = useIdempotency();
  const { idempotencyKey: deleteIdempKey, rotateKey: rotateDeleteKey } = useIdempotency();


  // Fetch initial parameters
  const retrieveData = async () => {
    try {
      setLoading(true);
      const propRes = await fetch('/api/properties?byTenant=true', token ? {
        headers: { 'Authorization': `Bearer ${token}` }
      } : undefined);
      if (propRes.ok) {
        const propData = await propRes.json();
        setProperties(propData.data || []);
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
  }, []);

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

  // Quick Action: Delete Stays (Soft deleted index) using protection hook + idempotency
  const { execute: handleDeleteConfirm, isLoading: isDeleting } = useAsyncAction(async () => {
    if (!propertyToDelete) return;
    try {
      const res = await fetch(`/api/properties/${propertyToDelete.id}`, { 
        method: 'DELETE',
        headers: {
          'x-idempotency-key': deleteIdempKey,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        setProperties(prev => prev.filter(p => p.id !== propertyToDelete.id));
        clearFilterOptionsCache();
      }
    } catch (err) {
      console.error(err);
    } finally {
      rotateDeleteKey();
      setShowDelete(false);
      setPropertyToDelete(null);
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
              className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border-0 ${
                activeSubTab === tab.id 
                  ? 'bg-indigo-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-indigo-900 hover:bg-slate-50'
              }`}
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
            {loading ? (
              <div id="properties-loading-stage" className="py-24 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                <span className="text-[10px] uppercase font-black tracking-widest">{en ? 'Retrieving listings index...' : 'Memuat properti...'}</span>
              </div>
            ) : properties.length === 0 ? (
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
            ) : (
              <div id="properties-rendered-stage" className="transition-all duration-300">
                {view === 'list' ? (
                  <PropertyListView 
                    properties={properties} 
                    categories={categories}
                    onView={(p) => { setSelectedProperty(p); setShowDetail(true); }}
                    onEdit={(p) => { setEditingProperty(p); setShowWizard(true); }}
                    onDelete={(p) => { setPropertyToDelete(p); setShowDelete(true); }}
                    onToggleStatus={handleToggleStatus}
                  />
                ) : (
                  <PropertyGridView 
                    properties={properties} 
                    categories={categories}
                    onView={(p) => { setSelectedProperty(p); setShowDetail(true); }}
                    onEdit={(p) => { setEditingProperty(p); setShowWizard(true); }}
                    onDelete={(p) => { setPropertyToDelete(p); setShowDelete(true); }}
                    onToggleStatus={handleToggleStatus}
                  />
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
        propertyName={propertyToDelete?.name || ''} 
        isDeleting={isDeleting} 
        onConfirm={handleDeleteConfirm} 
        onClose={() => { setShowDelete(false); setPropertyToDelete(null); }} 
      />

      <PropertyWizardModal 
        isOpen={showWizard} 
        categories={categories} 
        editingProperty={editingProperty} 
        onClose={() => { setShowWizard(false); setEditingProperty(null); }} 
        onSubmit={handleWizardSubmit} 
      />
    </div>
  );
}
