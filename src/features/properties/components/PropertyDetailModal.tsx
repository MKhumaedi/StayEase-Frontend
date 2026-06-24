import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Property, PropertyCategory } from '../../../types';
import { X, Star, MapPin, Bed, Bath, Maximize, Check, Award, Calculator } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';

interface PropertyDetailModalProps {
  isOpen: boolean;
  property: Property | null;
  categories: PropertyCategory[];
  onClose: () => void;
}

const ModalHeader = ({ coverImage, name, categoryName, onClose, closeTitle }: { coverImage: string, name: string, categoryName: string, onClose: () => void, closeTitle: string }) => (
  <div className="relative h-48 bg-slate-100 shrink-0">
    <img src={coverImage} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-slate-100 rounded-full text-slate-700 cursor-pointer shadow-md transition-colors" title={closeTitle}>
      <X className="w-4 h-4" />
    </button>
    <div className="absolute bottom-4 left-5 right-5 text-white">
      <span className="text-[9px] font-black uppercase tracking-widest bg-indigo-600/90 text-white px-2.5 py-1 rounded-lg">{categoryName}</span>
      <h3 className="font-extrabold text-lg mt-2 font-display truncate leading-tight">{name}</h3>
    </div>
  </div>
);

const StatBox = ({ icon: Icon, value, label }: { icon: any, value: string | number, label: string }) => (
  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
    <Icon className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
    <span className="font-extrabold text-slate-800 block text-xs">{value}</span>
    <span className="text-[9px] text-slate-450 uppercase font-black">{label}</span>
  </div>
);

const ModalStats = ({ rating, count, beds, baths, sqft, lang }: { rating?: number, count?: number, beds: number, baths: number, sqft: number, lang: string }) => {
  const hasReviews = count !== undefined && count > 0;
  return (
    <div className="grid grid-cols-4 gap-2.5 text-center select-none">
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50 flex flex-col justify-center items-center min-h-[4.5rem]">
        {hasReviews ? (
          <>
            <Star className="w-3.5 h-3.5 text-amber-500 mx-auto mb-0.5 fill-amber-500 shrink-0" />
            <span className="font-extrabold text-slate-800 block text-xs leading-none">{rating ? Number(rating).toFixed(1) : '0.0'}</span>
            <span className="text-[8px] text-slate-450 font-bold block mt-0.5 leading-none">
              ({count} {lang === 'en' ? 'reviews' : 'ulasan'})
            </span>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <span className="text-[8px] font-bold text-slate-400 italic block leading-tight text-center">
              {lang === 'en' ? 'No reviews' : 'Belum ada ulasan'}
            </span>
          </div>
        )}
      </div>
      <StatBox icon={Bed} value={`${beds} Rooms`} label="Bedrooms" />
      <StatBox icon={Bath} value={`${baths} Baths`} label="Bathrooms" />
      <StatBox icon={Maximize} value={`${sqft} sqm`} label="Space Size" />
    </div>
  );
};

const ModalLocation = ({ location, address }: { location: string, address?: string | null }) => (
  <div className="flex items-center gap-1.5 p-3 bg-indigo-50/50 border border-indigo-100/30 rounded-xl font-bold text-slate-755">
    <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
    <span>{location} (Address: {address || location})</span>
  </div>
);

const ModalOverview = ({ title, description }: { title: string, description: string }) => (
  <div className="space-y-1.5">
    <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1">
      <Award className="w-4 h-4 text-indigo-600" />
      {title}
    </h4>
    <p className="leading-relaxed text-slate-500 font-medium whitespace-pre-line bg-slate-50 p-3.5 rounded-xl text-xs border border-slate-100">{description}</p>
  </div>
);

const ModalAmenities = ({ title, amenities }: { title: string, amenities?: string[] }) => {
  if (!amenities?.length) return null;
  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider">{title} ({amenities.length})</h4>
      <div className="grid grid-cols-2 gap-2 text-slate-500 font-semibold select-none">
        {amenities.map((am, i) => (
          <div key={`${am}-${i}`} className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
            <Check className="w-3.5 h-3.5 text-indigo-600" />
            <span className="truncate">{am}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const FinanceRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between">
    <span>{label}</span>
    <span className="text-indigo-950 font-extrabold">{value}</span>
  </div>
);

const ModalPricing = ({ title, property, lang, formatter }: { title: string, property: Property, lang: string, formatter: any }) => (
  <div className="space-y-1.5 border-t pt-4">
    <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1">
      <Calculator className="w-4 h-4 text-indigo-600" />
      {title}
    </h4>
    <div className="grid grid-cols-2 gap-x-6 gap-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-500 font-bold">
      <FinanceRow label={lang === 'en' ? 'Base Nightly Rent:' : 'Harga Dasar per Malam:'} value={formatter(property.basePrice)} />
      <FinanceRow label={lang === 'en' ? 'Cleaning Surcharge:' : 'Tarif Kebersihan:'} value={formatter(property.cleaningFee || 0)} />
      <FinanceRow label={lang === 'en' ? 'Service Fee:' : 'Biaya Konsesi Layanan:'} value={formatter(property.serviceFee || 0)} />
      <FinanceRow label={lang === 'en' ? 'Security Escrow Deposit:' : 'Uang Jaminan Escrow:'} value={formatter(property.securityDeposit || 0)} />
    </div>
  </div>
);

const ModalFooter = ({ label, onClose }: { label: string, onClose: () => void }) => (
  <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end shrink-0">
    <button type="button" onClick={onClose} className="px-5 py-2 bg-indigo-950 hover:bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors">{label}</button>
  </div>
);

export function PropertyDetailModal({
  isOpen,
  property,
  categories,
  onClose
}: PropertyDetailModalProps) {
  const { language, formatCurrencyIDR } = useLanguage();

  if (!property) return null;

  const categoryName = categories.find(c => c.id === property.categoryId)?.name || 'StayEase Stays';
  const coverImage = property.imageUrls?.[0] || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-indigo-950/60 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh]"
          >
            <ModalHeader coverImage={coverImage} name={property.name} categoryName={categoryName} onClose={onClose} closeTitle={language === 'en' ? 'Close' : 'Tutup'} />
            <div className="p-6 md:p-8 overflow-y-auto space-y-5 text-xs text-slate-600">
              <ModalStats rating={property.rating} count={property.reviewCount} beds={property.beds} baths={property.baths} sqft={property.sqft} lang={language} />
              <ModalLocation location={property.location} address={property.address} />
              <ModalOverview title={language === 'en' ? 'Stay Overview' : 'Ikhtisar Penginapan'} description={property.description} />
              <ModalAmenities title={language === 'en' ? 'Stays Features & Perks' : 'Fasilitas & Layanan'} amenities={property.amenities} />
              <ModalPricing title={language === 'en' ? 'Pricing Policy Details' : 'Rincian Kebijakan Tarif'} property={property} lang={language} formatter={formatCurrencyIDR} />
            </div>
            <ModalFooter label={language === 'en' ? 'Close Panel' : 'Tutup Panel'} onClose={onClose} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
