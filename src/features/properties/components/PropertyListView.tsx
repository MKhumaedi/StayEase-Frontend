import React from 'react';
import { Property, PropertyCategory } from '../../../types';
import { Star, MapPin, Eye, Edit, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';

interface PropertyListViewProps {
  properties: Property[];
  categories: PropertyCategory[];
  onView: (p: Property) => void;
  onEdit: (p: Property) => void;
  onDelete: (p: Property) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
}

export function PropertyListView({
  properties,
  categories,
  onView,
  onEdit,
  onDelete,
  onToggleStatus
}: PropertyListViewProps) {
  const { language, formatCurrencyIDR } = useLanguage();

  return (
    <div id="properties-list-view" className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
      {/* Desktop Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-wider">
              <th className="py-4 px-5">{language === 'en' ? 'Property' : 'Properti'}</th>
              <th className="py-4 px-4">{language === 'en' ? 'Location' : 'Lokasi'}</th>
              <th className="py-4 px-4">{language === 'en' ? 'Price/Night' : 'Harga/Malam'}</th>
              <th className="py-4 px-4">{language === 'en' ? 'Rating' : 'Nilai'}</th>
              <th className="py-4 px-4">{language === 'en' ? 'Status' : 'Status'}</th>
              <th className="py-4 px-4 text-center">{language === 'en' ? 'Actions' : 'Aksi'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {properties.map(p => {
              const cat = categories.find(c => c.id === p.categoryId);
              const coverImage = p.imageUrls?.[0] || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=150&q=80';
              
              return (
                <tr id={`list-view-row-${p.id}`} key={p.id} className="hover:bg-slate-50/30 transition-colors">
                  {/* Property Cover Thumbnail + Name */}
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-105 shrink-0 border border-slate-100">
                        <img 
                          src={coverImage} 
                          alt={p.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0 max-w-[240px]">
                        <h5 className="font-extrabold text-indigo-950 truncate font-display text-sm leading-tight mb-1">{p.name}</h5>
                        <span className="inline-block bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {cat?.name || (language === 'en' ? 'Stays' : 'Penginapan')}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Location Column */}
                  <td className="py-4 px-4 text-slate-500 font-semibold max-w-[150px] truncate">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                      <span className="truncate">{p.location}</span>
                    </div>
                  </td>

                  {/* Base Pricing */}
                  <td className="py-4 px-4 font-black text-indigo-950">
                    {formatCurrencyIDR(p.basePrice)}
                  </td>

                  {/* Rating with Star */}
                  <td className="py-4 px-4">
                    {!p.reviewCount || p.reviewCount === 0 ? (
                      <span className="text-slate-400 font-semibold italic text-[11px] normal-case">
                        {language === 'en' ? 'No reviews' : 'Belum ada ulasan'}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1 font-bold text-slate-700">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                        <span>{parseFloat(p.rating.toString()).toFixed(1)}</span>
                        <span className="text-slate-400 font-medium font-sans text-[10px]">
                          ({p.reviewCount})
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Status Toggle Box */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        p.status === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${p.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {p.status}
                      </span>
                      <button
                        onClick={() => onToggleStatus(p.id, p.status)}
                        className={`text-[9px] font-extrabold uppercase hover:underline cursor-pointer ${
                          p.status === 'ACTIVE' ? 'text-indigo-600' : 'text-slate-400'
                        }`}
                      >
                        {p.status === 'ACTIVE' ? (language === 'en' ? 'Deactivate' : 'Nonaktifkan') : (language === 'en' ? 'Activate' : 'Aktifkan')}
                      </button>
                    </div>
                  </td>

                  {/* Action Buttons list */}
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center gap-2.5">
                      <button
                        onClick={() => onView(p)}
                        title={language === 'en' ? 'View Property Detail' : 'Lihat Detail'}
                        className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-lg cursor-pointer transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(p)}
                        title={language === 'en' ? 'Edit Details' : 'Ubah Detail'}
                        className="p-1.5 bg-slate-50 hover:bg-amber-50 text-slate-500 hover:text-amber-700 rounded-lg cursor-pointer transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(p)}
                        title={language === 'en' ? 'Delete' : 'Hapus'}
                        className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
