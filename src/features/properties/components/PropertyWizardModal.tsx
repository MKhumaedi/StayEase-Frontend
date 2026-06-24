import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ChevronLeft, ChevronRight, Loader2, Check, AlertTriangle,
  Building, MapPin, Sparkles, Image as ImageIcon, BedDouble, 
  CreditCard, Calendar, Eye, Users, Bath, Receipt, ShieldCheck, Info
} from 'lucide-react';
import { Property, PropertyCategory } from '../../../types';
import { useLanguage } from '../../../shared/i18n';
import { PricingService } from '../services/PricingService';
import { WizardStep1 } from './wizard/WizardStep1';
import { WizardStep2 } from './wizard/WizardStep2';
import { WizardStep3 } from './wizard/WizardStep3'; // Media
import { WizardStep4 } from './wizard/WizardStep4'; // Amenities
import { WizardStep5 } from './wizard/WizardStep5'; // Pricing
import { WizardStep6 } from './wizard/WizardStep6'; // Calendar
import { WizardStep7 } from './wizard/WizardStep7'; // Publish preview
import { WizardStepRoomConfig } from './wizard/WizardStepRoomConfig';
import { useAuth } from '../../../shared/context/AuthContext';

interface PropertyWizardModalProps {
  isOpen: boolean;
  categories: PropertyCategory[];
  editingProperty: Property | null;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
}

export function PropertyWizardModal({
  isOpen,
  categories,
  editingProperty,
  onClose,
  onSubmit
}: PropertyWizardModalProps) {
  const { language, formatCurrencyIDR } = useLanguage();
  const { token } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Core Form State
  const [form, setForm] = useState<any>({
    name: '', categoryId: '', description: '', fullAddress: '', city: '',
    province: '', postalCode: '', latitude: -8.7209, longitude: 115.1691,
    imageUrls: [], coverImageIndex: 0, bedrooms: 1, bathrooms: 1, guests: 2,
    areaSqm: 35, basePrice: 500000, cleaningFee: 25000, serviceFee: 15000,
    securityDeposit: 0, blockedDates: [], status: 'ACTIVE', rooms: []
  });

  // Pre-populate if editing
  useEffect(() => {
    if (editingProperty) {
      setForm({
        name: editingProperty.name,
        categoryId: editingProperty.categoryId || categories[0]?.id || '',
        description: editingProperty.description,
        fullAddress: editingProperty.address || editingProperty.location,
        city: editingProperty.city || '',
        province: editingProperty.province || '',
        postalCode: (editingProperty as any).postalCode || '',
        latitude: editingProperty.latitude || -8.7209,
        longitude: editingProperty.longitude || 115.1691,
        imageUrls: editingProperty.imageUrls || [],
        coverImageIndex: 0,
        bedrooms: editingProperty.beds || 1,
        bathrooms: editingProperty.baths || 1,
        guests: editingProperty.guests || 2,
        areaSqm: editingProperty.sqft || 35,
        basePrice: editingProperty.basePrice,
        cleaningFee: editingProperty.cleaningFee || 0,
        serviceFee: editingProperty.serviceFee || 0,
        securityDeposit: editingProperty.securityDeposit || 0,
        blockedDates: (editingProperty as any).blockedDates || [],
        status: editingProperty.status,
        rooms: []
      });

      // Fetch actual rooms from server to ensure editing works with DB rooms
      fetch(`/api/properties/${editingProperty.id}`, token ? {
        headers: { 'Authorization': `Bearer ${token}` }
      } : undefined)
        .then(res => res.json())
        .then(resData => {
          if (resData && resData.rooms) {
            setForm((prev: any) => ({
              ...prev,
              rooms: resData.rooms.map((r: any) => {
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
                  basePrice: r.basePrice || r.pricePerNight || 500000,
                  description: r.wing || r.description || '',
                  bedCount: parsedFloor.bedCount || 1,
                  bathCount: parsedFloor.bathCount || 1,
                  quantity: parsedFloor.quantity || 1,
                  image: r.image || ''
                };
              })
            }));
          }
        })
        .catch(err => {
          console.error("Failed to load property rooms: ", err);
        });
    } else {
      setForm({
        name: '', categoryId: categories[0]?.id || '', description: '',
        fullAddress: '', city: '', province: '', postalCode: '', latitude: -8.7209,
        longitude: 115.1691, imageUrls: [], coverImageIndex: 0, bedrooms: 1,
        bathrooms: 1, guests: 2, areaSqm: 35, basePrice: 500000, cleaningFee: 25000,
        serviceFee: 15000, securityDeposit: 0, blockedDates: [], status: 'ACTIVE',
        rooms: []
      });
    }
    setCurrentStep(1);
    setErrorMsg('');
  }, [editingProperty, isOpen, categories]);

  const handleInputChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const validateStep = (stepToValidate = currentStep): boolean => {
    setErrorMsg('');
    if (stepToValidate === 1) {
      if (!form.name.trim()) return fail(language === 'en' ? 'Property Name is required' : 'Nama properti harus diisi');
      if (!form.description.trim() || form.description.length < 10) return fail(language === 'en' ? 'Provide a description of at least 10 letters' : 'Deskripsi minimal 10 karakter');
    } else if (stepToValidate === 2) {
      if (!form.fullAddress.trim() || !form.city.trim() || !form.province.trim()) return fail(language === 'en' ? 'Complete address, city & state specifiers' : 'Isi alamat, kota & provinsi lengkap');
    } else if (stepToValidate === 3) {
      // Step 3 is Amenities
    } else if (stepToValidate === 4) {
      // Step 4 is Media
      if (!form.imageUrls || form.imageUrls.length === 0) return fail(language === 'en' ? 'Please upload at least 1 photograph' : 'Harap unggah minimal 1 foto');
    } else if (stepToValidate === 5) {
      // Step 5 is Room Configuration
      if (!form.rooms || form.rooms.length === 0) {
        return fail(language === 'en' ? 'Property must have at least one room configuration' : 'Properti harus memiliki minimal satu konfigurasi kamar');
      }
      for (const [idx, room] of form.rooms.entries()) {
        if (!room.name?.trim()) {
          return fail(language === 'en' ? `Room #${idx+1} is missing a Name` : `Kamar ke-${idx+1} belum memiliki nama`);
        }
        if (!room.basePrice || room.basePrice < 50000) {
          return fail(language === 'en' ? `Room #${idx+1} (${room.name}) must have a price of at least Rp 50.000` : `Harga kamar ke-${idx+1} (${room.name}) minimal Rp 50.000`);
        }
        if (!room.capacity || room.capacity < 1) {
          return fail(language === 'en' ? `Room #${idx+1} (${room.name}) must have capacity of at least 1 guest` : `Kapasitas kamar ke-${idx+1} (${room.name}) minimal untuk 1 tamu`);
        }
      }
    } else if (stepToValidate === 6) {
      // Step 6 is Pricing & Fees
      if (form.basePrice < 50000) {
        return fail(language === 'en' ? 'Minimum base price is Rp 50.000' : 'Harga dasar sewa minimal Rp 50.000');
      }
      if (form.cleaningFee < 0 || form.serviceFee < 0 || form.securityDeposit < 0) {
        return fail(language === 'en' ? 'Fees cannot be negative values' : 'Biaya tambahan tidak boleh bernilai negatif');
      }
    }
    return true;
  };

  const fail = (msg: string) => { setErrorMsg(msg); return false; };
  
  const handleStepSelect = (stepNum: number) => {
    // Validate current step before switching to a higher step
    if (stepNum > currentStep) {
      for (let s = currentStep; s < stepNum; s++) {
        if (!validateStep(s)) return;
      }
    }
    setCurrentStep(stepNum);
    setErrorMsg('');
  };

  const handleNext = () => { if (validateStep()) setCurrentStep(p => p + 1); };
  const handlePrev = () => setCurrentStep(p => Math.max(1, p - 1));

  const handleCloseAttempt = () => {
    if (!editingProperty && (form.name || form.description || form.imageUrls.length > 0)) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const handleFinish = async () => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      await onSubmit(form);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit stay parameters');
    } finally {
      setSubmitting(false);
    }
  };

  // Setup sidebar step list details
  const steps = [
    { number: 1, labelEn: 'Basic Information', labelId: 'Informasi Dasar', icon: Building },
    { number: 2, labelEn: 'Location Specification', labelId: 'Spesifikasi Lokasi', icon: MapPin },
    { number: 3, labelEn: 'Amenities Checklist', labelId: 'Fasilitas & Kapasitas', icon: Sparkles },
    { number: 4, labelEn: 'Visual Media/Photos', labelId: 'Galeri Foto', icon: ImageIcon },
    { number: 5, labelEn: 'Room Configuration', labelId: 'Konfigurasi Kamar', icon: BedDouble },
    { number: 6, labelEn: 'Pricing & Channels', labelId: 'Tarif & Saluran', icon: CreditCard },
    { number: 7, labelEn: 'Blocking Calendar', labelId: 'Blokir Kalender', icon: Calendar },
    { number: 8, labelEn: 'Publish & Preview', labelId: 'Tinjau & Publikasi', icon: Eye }
  ];

  // Live Metrics Calculations using Centralized PricingService for 1 night
  const pricingInput = {
    basePrice: form.basePrice || 0,
    cleaningFee: form.cleaningFee || 0,
    serviceFee: form.serviceFee || 0,
    peakSeasonRates: []
  };
  const quote = PricingService.calculateQuote(pricingInput, null, '2026-10-12', '2026-10-13');

  const basePrice = quote.nightlyRate;
  const cleaningFee = quote.cleaningFee;
  const serviceFee = quote.serviceFee;
  const securityDeposit = form.securityDeposit || 0;

  const estimatedTax = quote.tax;
  const guestInvoiceTotal = quote.total;
  
  // Host net takehome revenue: pricing minus commission or default channel fees (basePrice + cleaningFee minus any default parameter)
  const estimatedHostEarnings = (quote.subtotal + cleaningFee);

  // Selected Category representation
  const selectedCategory = categories.find(c => c.id === form.categoryId);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/45 backdrop-blur-xs overflow-hidden md:p-4">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            className="bg-white flex flex-col justify-between w-full h-full md:h-[90vh] md:max-h-[920px] md:w-[94vw] lg:w-[90vw] xl:w-[88vw] md:max-w-[1440px] xl:max-w-[1520px] md:rounded-3xl border border-slate-150 shadow-2xl relative overflow-hidden transition-all duration-300"
          >
            {/* Modal Master Header (Enterprise Status Style) */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold font-mono">
                  {currentStep}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-850 text-sm tracking-tight">
                      {editingProperty 
                        ? (language === 'en' ? 'Property Extranet Workspace' : 'Workspace Ekstranet Properti')
                        : (language === 'en' ? 'New Asset Onboarding' : 'Pendaftaran Aset Hunian Baru')}
                    </h3>
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 leading-none">
                      {editingProperty ? (language === 'en' ? 'Edit Mode' : 'Mode Edit') : (language === 'en' ? 'Creation Draft' : 'Draf Baru')}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-slate-400 font-semibold leading-none mt-0.5">
                    {language === 'en' 
                      ? 'StayEase channel manager and live hospitality dashboard specs.' 
                      : 'Spesifikasi pengelolaan saluran stayease dan ketersediaan langsung.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={handleCloseAttempt} 
                  className="p-1.5 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-full cursor-pointer text-slate-400 shrink-0 transition-colors"
                  title={language === 'en' ? 'Close Workspace' : 'Tutup Workspace'}
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Error notifications */}
            {errorMsg && (
              <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-100 text-rose-750 text-xs font-bold flex items-center gap-2 transition-all">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Three Column Extranet Layout Container */}
            <div className="flex flex-1 overflow-hidden min-h-0 bg-white">
              
              {/* PANEL 1: Left Persistent Navigation (Sidebar Menu) */}
              <div className="hidden md:block w-56 lg:w-64 border-r border-slate-100 bg-slate-50/50 p-4 shrink-0 overflow-y-auto">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 block mb-3">
                    {language === 'en' ? 'Onboarding flow' : 'Alur Pendaftaran'}
                  </span>
                  {steps.map(s => {
                    const isActive = currentStep === s.number;
                    const isCompleted = s.number < currentStep;
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.number}
                        type="button"
                        onClick={() => handleStepSelect(s.number)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all border outline-none cursor-pointer ${
                          isActive 
                            ? 'bg-white border-slate-200 text-indigo-950 shadow-xs' 
                            : isCompleted
                              ? 'bg-transparent border-transparent text-emerald-600 hover:bg-white hover:border-slate-100'
                              : 'bg-transparent border-transparent text-slate-450 hover:bg-white hover:border-slate-100'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                          isActive 
                            ? 'bg-indigo-600 text-white shadow-xs' 
                            : isCompleted
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : 'bg-slate-100 text-slate-400'
                        }`}>
                          {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Icon className="w-3.5 h-3.5" />}
                        </span>
                        <div className="flex-1 line-clamp-1">
                          {language === 'en' ? s.labelEn : s.labelId}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 p-3 rounded-2xl bg-indigo-50/40 border border-indigo-100/50 space-y-1.5 select-none">
                  <div className="flex items-center gap-1.5 text-indigo-950 text-[11px] font-black">
                    <Info className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
                    <span>{language === 'en' ? 'Extranet Workspace' : 'Workspace Ekstranet'}</span>
                  </div>
                  <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">
                    {language === 'en'
                      ? 'You can freely skip back to any completed steps anytime to adjust details.'
                      : 'Anda bebas kembali ke langkah yang telah dilewati untuk mengubah rincian.'}
                  </p>
                </div>
              </div>

              {/* PANEL 2: Central Forms Console (Core Content Workbench) */}
              <div className="flex-1 overflow-y-auto px-5 py-6 md:p-8 bg-white" id="extranet-form-view-viewport">
                <div className="max-w-3xl mx-auto space-y-1 pb-10">
                  {currentStep === 1 && <WizardStep1 form={form} categories={categories} onChange={handleInputChange} />}
                  {currentStep === 2 && <WizardStep2 form={form} setForm={setForm} onChange={handleInputChange} />}
                  {currentStep === 3 && <WizardStep4 form={form} setForm={setForm} />} {/* Amenities */}
                  {currentStep === 4 && <WizardStep3 form={form} setForm={setForm} />} {/* Media */}
                  {currentStep === 5 && <WizardStepRoomConfig form={form} setForm={setForm} />} {/* Room Configuration */}
                  {currentStep === 6 && <WizardStep5 form={form} setForm={setForm} />} {/* Pricing & Fees */}
                  {currentStep === 7 && <WizardStep6 form={form} setForm={setForm} />} {/* Calendar blocks */}
                  {currentStep === 8 && <WizardStep7 form={form} categories={categories} />} {/* Publish */}
                </div>
              </div>

              {/* PANEL 3: Right Live Preview Summary Ledger Side Panel */}
              <div className="hidden lg:flex w-76 xl:w-88 border-l border-slate-100 bg-slate-50/50 flex-col shrink-0 overflow-y-auto p-5 justify-between">
                
                {/* Visual Listing Card Preview */}
                <div className="space-y-4">
                  <div className="space-y-1 pb-2 border-b border-slate-150 select-none">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Eye className="w-3 h-3 text-slate-400" />
                      {language === 'en' ? 'Live listing preview' : 'Pratinjau Hasil Pasang'}
                    </span>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      {language === 'en' ? 'How guests see your stay' : 'Tampilan iklan di mata tamu'}
                    </p>
                  </div>

                  {/* Thumbnail display card */}
                  <div className="bg-white border border-slate-150 rounded-2xl p-3 shadow-xs space-y-3 shrink-0">
                    <div className="aspect-[4/3] rounded-xl bg-slate-100 overflow-hidden relative border border-slate-50">
                      {form.imageUrls && form.imageUrls.length > 0 ? (
                        <img 
                          src={form.imageUrls[form.coverImageIndex || 0] || form.imageUrls[0]} 
                          alt="Stay Preview" 
                          className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-50 text-slate-350 font-semibold select-none">
                          <ImageIcon className="w-8 h-8 opacity-60 text-indigo-400" />
                          <span className="text-[10px] uppercase tracking-widest">{language === 'en' ? 'No photo found' : 'Belum Ada Foto'}</span>
                        </div>
                      )}
                      
                      {selectedCategory && (
                        <span className="absolute top-2.5 left-2.5 text-[9px] font-black uppercase text-indigo-950 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded shadow-xs leading-none">
                          {selectedCategory.name}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 border-none text-xs line-clamp-1">
                        {form.name || (language === 'en' ? 'Unnamed Draft stay' : 'Draf Hunian Tanpa Nama')}
                      </h4>
                      <p className="text-[10.5px] text-slate-450 font-semibold line-clamp-1 leading-normal flex items-center gap-1 select-none">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        {form.city || form.province ? `${form.city || ''}, ${form.province || ''}` : (language === 'en' ? 'Specify Location' : 'Tentukan Lokasi')}
                      </p>
                    </div>

                    {/* Specifications badges */}
                    <div className="flex items-center gap-2 border-t border-slate-50 pt-2 text-[10px] text-slate-450 font-bold select-none">
                      <span className="flex items-center gap-0.5" title={language === 'en' ? 'Guests limit' : 'Kapasitas tamu'}>
                        <Users className="w-3 h-3 text-slate-350" /> {form.guests || 1}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5" title={language === 'en' ? 'Bedrooms count' : 'Kamar mandi'}>
                        <BedDouble className="w-3 h-3 text-slate-350" /> {form.bedrooms || 1}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5" title={language === 'en' ? 'Bath count' : 'Kamar mandi'}>
                        <Bath className="w-3 h-3 text-slate-350" /> {form.bathrooms || 1}
                      </span>
                      {form.rooms && form.rooms.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-600 bg-indigo-50/50 px-1 rounded text-[9.5px]">
                            {form.rooms.length} {language === 'en' ? 'suites' : 'kamar'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Financial Ledgers details */}
                  <div className="space-y-3 bg-white border border-slate-150 rounded-2xl p-4 shadow-xs">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 border-b border-slate-50 pb-2 select-none">
                      <Receipt className="w-3.5 h-3.5 text-slate-500" />
                      {language === 'en' ? 'Revenue breakdown' : 'Distribusi Pendapatan'}
                    </span>
                    
                    <div className="space-y-2 text-[11px] text-slate-600 leading-normal">
                      <div className="flex items-center justify-between">
                        <span>{language === 'en' ? 'Base Stay Rate' : 'Harga Dasar Sewa'}</span>
                        <span className="font-semibold text-slate-800 font-mono">{formatCurrencyIDR(basePrice)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{language === 'en' ? 'Cleaning Surcharge' : 'Biaya Kebersihan'}</span>
                        <span className="font-semibold text-slate-800 font-mono">{formatCurrencyIDR(cleaningFee)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{language === 'en' ? 'StayEase System Fee' : 'Biaya Layanan Jasa'}</span>
                        <span className="font-semibold text-slate-800 font-mono">{formatCurrencyIDR(serviceFee)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{language === 'en' ? 'Escrow Room Deposit' : 'Deposit Jaminan'}</span>
                        <span className="font-semibold text-slate-800 font-mono">{formatCurrencyIDR(securityDeposit)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{language === 'en' ? 'Estimated Stays Tax (10%)' : 'PPN / Pajak Daerah (10%)'}</span>
                        <span className="font-semibold text-slate-800 font-mono">{formatCurrencyIDR(estimatedTax)}</span>
                      </div>

                      {/* Guest Grand Bill Rate */}
                      <div className="border-t border-slate-100 pt-2 flex flex-col gap-0.5">
                        <div className="flex items-baseline justify-between">
                          <span className="font-bold text-slate-800 text-xs">
                            {language === 'en' ? 'Guest Invoice' : 'Total Tagihan Tamu'}
                          </span>
                          <span className="text-xs font-black text-blue-600 font-mono">
                            {formatCurrencyIDR(guestInvoiceTotal)}
                          </span>
                        </div>
                        <span className="text-[8.5px] text-slate-400 tracking-wide select-none">
                          {language === 'en' ? '*Estimated billing to checkout forms.' : '*Estimasi tagihan pada menu checkout.'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sticky Host Net takehome earnings badge */}
                <div className="bg-emerald-500 text-white rounded-2xl p-4 shadow-sm select-none mt-4 shrink-0 space-y-1 border border-emerald-450">
                  <span className="text-[9px] font-black uppercase text-emerald-100 tracking-widest block">
                    {language === 'en' ? 'Estimated Host Earnings' : 'Estimasi Bersih Penerimaan Hos'}
                  </span>
                  <div className="flex items-baseline justify-between pt-0.5">
                    <span className="text-[11px] font-semibold text-emerald-50">{language === 'en' ? 'Net per night' : 'Bersih /malam'}</span>
                    <span className="text-[17px] font-black font-mono tracking-tight leading-none">
                      {formatCurrencyIDR(estimatedHostEarnings)}
                    </span>
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Bottom Control Action Bar */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-755 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                  {language === 'en' ? 'Back' : 'Kembali'}
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 select-none mr-2">
                  {language === 'en' ? `Step ${currentStep} of 8` : `Langkah ${currentStep} dari 8`}
                </span>
                
                {currentStep < 8 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                  >
                    {language === 'en' ? 'Continue' : 'Lanjutkan'}
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={submitting}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-755 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-colors"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>{language === 'en' ? 'Saving Stays...' : 'Menyimpan...'}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-white stroke-[2.5]" />
                        <span>{editingProperty ? (language === 'en' ? 'Save Changes' : 'Simpan Perubahan') : (language === 'en' ? 'Publish Listing' : 'Publikasikan Iklan')}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Confirmation of Close card */}
      <AnimatePresence>
        {showConfirmClose && (
          <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-indigo-950/70 backdrop-blur-xs select-none">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 border border-slate-100 shadow-xl">
              <div className="text-left space-y-2">
                <div className="p-2 bg-amber-55 text-amber-700 rounded-xl w-fit border border-amber-100">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-indigo-950 font-display text-sm">{language === 'en' ? 'Discard Unsaved Changes?' : 'Batalkan Perubahan?'}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{language === 'en' ? 'You will lose all inputted stays parameters.' : 'Data properti yang telah diisi akan hilang.'}</p>
              </div>
              <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-slate-50">
                <button onClick={() => setShowConfirmClose(false)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 cursor-pointer">{language === 'en' ? 'Keep Editing' : 'Batal'}</button>
                <button onClick={() => { setShowConfirmClose(false); onClose(); }} className="px-3 py-1.5 bg-rose-650 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer">{language === 'en' ? 'Discard' : 'Buang'}</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
