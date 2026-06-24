import React from 'react';
import { Property, PropertyCategory } from '../../../types';
import { Star, MapPin, Eye, Edit, Trash2, Bed, Bath, Maximize } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';

interface PropertyCardProps {
  property: Property;
  categoryName?: string;
  onView: (p: Property) => void;
  onEdit: (p: Property) => void;
  onDelete: (p: Property) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
}

export function PropertyCard({
  property,
  categoryName,
  onView,
  onEdit,
  onDelete,
  onToggleStatus
}: PropertyCardProps) {
  const { language, formatCurrencyIDR } = useLanguage();

  const coverImage = property.imageUrls?.[0] || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&q=80';

  return (
    <div 
      id={`property-grid-card-${property.id}`}
      className="bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between overflow-hidden group hover:shadow-lg transition-all duration-300 h-full"
    >
      {/* Top Image & Badge section */}
      <div className="relative aspect-video overflow-hidden bg-slate-50 w-full shrink-0">
        <img 
          src={coverImage} 
          alt={property.name} 
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          referrerPolicy="no-referrer"
        />
        
        {/* Category Name Badge */}
        <span className="absolute top-3 left-3 bg-slate-900/90 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg backdrop-blur-xs">
          {categoryName || (language === 'en' ? 'Stays' : 'Penginapan')}
        </span>

        {/* Status Badge in active/inactive view */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider backdrop-blur-xs shadow-md ${
            property.status === 'ACTIVE' 
              ? 'bg-emerald-500/90 text-white' 
              : 'bg-slate-600/90 text-white'
          }`}>
            {property.status}
          </span>
        </div>
      </div>

      {/* Card Info Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          {/* Rating and Location */}
          <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400 gap-1.5 flex-wrap">
            <span className="truncate flex items-center gap-1 max-w-[55%]">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{property.location}</span>
            </span>
            {(!property.reviewCount || property.reviewCount === 0) ? (
              <span className="text-slate-400 font-semibold italic text-[9px] normal-case shrink-0">
                {language === 'en' ? 'No reviews yet' : 'Belum ada ulasan'}
              </span>
            ) : (
              <div className="flex items-center gap-0.5 text-amber-500 font-extrabold shrink-0">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
                <span>{parseFloat(property.rating.toString()).toFixed(1)}</span>
                <span className="text-slate-400 font-bold ml-1 font-sans text-[9px] lowercase">
                  ({property.reviewCount} {language === 'en' ? 'reviews' : 'ulasan'})
                </span>
              </div>
            )}
          </div>

          {/* Property Name */}
          <h4 className="font-extrabold text-indigo-950 font-display text-sm truncate" title={property.name}>
            {property.name}
          </h4>

          {/* Quick Specifications */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[8px] font-black uppercase text-slate-500 bg-slate-50 px-2 py-1 rounded-md flex items-center gap-0.5">
              <Bed className="w-2.5 h-2.5" /> {property.beds} Bed
            </span>
            <span className="text-[8px] font-black uppercase text-slate-500 bg-slate-50 px-2 py-1 rounded-md flex items-center gap-0.5">
              <Bath className="w-2.5 h-2.5" /> {property.baths} Bath
            </span>
            <span className="text-[8px] font-black uppercase text-slate-500 bg-slate-50 px-2 py-1 rounded-md flex items-center gap-0.5">
              <Maximize className="w-2.5 h-2.5" /> {property.sqft} m²
            </span>
          </div>
        </div>

        {/* Pricing and Action buttons footer section */}
        <div className="flex flex-col gap-3 border-t border-slate-50 mt-4 pt-3.5">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[8px] font-black text-slate-400 uppercase block leading-none mb-1">
                {language === 'en' ? 'Base Rental' : 'Harga Dasar'}
              </span>
              <span className="font-extrabold text-indigo-950 text-xs">
                {formatCurrencyIDR(property.basePrice)}
                <span className="text-[9px] text-slate-500 font-normal"> /night</span>
              </span>
            </div>

            {/* Toggle Status slider */}
            <button
              onClick={() => onToggleStatus(property.id, property.status)}
              className="text-xs font-semibold text-slate-400 hover:text-indigo-900 transition-colors pointer-events-auto"
              title={language === 'en' ? 'Toggle Status' : 'Ubah Status'}
            >
              <span className="text-[9px] font-bold text-slate-400 mr-1.5 uppercase">
                {property.status === 'ACTIVE' ? 'Active' : 'Draft'}
              </span>
            </button>
          </div>

          {/* View, Edit, Delete Quick Button bar */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-50/50">
            <button
              onClick={() => onView(property)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-100 rounded-lg text-[10px] font-black uppercase text-slate-600 transition-all"
            >
              <Eye className="w-3 h-3" />
              <span>{language === 'en' ? 'View' : 'Lihat'}</span>
            </button>
            <button
              onClick={() => onEdit(property)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-50 hover:bg-amber-50 hover:text-amber-700 border border-slate-100 rounded-lg text-[10px] font-black uppercase text-slate-600 transition-all"
            >
              <Edit className="w-3 h-3" />
              <span>{language === 'en' ? 'Edit' : 'Ubah'}</span>
            </button>
            <button
              onClick={() => onDelete(property)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-100 rounded-lg text-[10px] font-black uppercase text-rose-500 transition-all"
            >
              <Trash2 className="w-3" />
              <span>{language === 'en' ? 'Delete' : 'Hapus'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
