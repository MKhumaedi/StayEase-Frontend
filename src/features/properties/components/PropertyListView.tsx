import React from 'react';
import { Property, PropertyCategory } from '../../../types';
import { Star, MapPin, Eye, Edit, Trash2, Clock } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';

interface PropertyListViewProps {
  properties: any[];
  categories: PropertyCategory[];
  onView: (p: any) => void;
  onEdit: (p: any) => void;
  onDelete: (p: any) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
  onDeleteDraft?: (id: string) => void;
  onContinueDraft?: (draft: any) => void;
}

export function PropertyListView({
  properties,
  categories,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onDeleteDraft,
  onContinueDraft
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
              <th className="py-4 px-4">{language === 'en' ? 'Progress' : 'Kemajuan'}</th>
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
                    {p.location ? (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                        <span className="truncate">{p.location}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-semibold">-</span>
                    )}
                  </td>

                  {/* Base Pricing */}
                  <td className="py-4 px-4 font-black text-indigo-950">
                    {p.basePrice > 0 ? formatCurrencyIDR(p.basePrice) : (language === 'en' ? 'Not set' : 'Belum diatur')}
                  </td>

                  {/* Rating with Star */}
                  <td className="py-4 px-4">
                    {p.isDraft ? (
                      <span className="text-slate-400 font-semibold italic text-[11px] normal-case">
                        -
                      </span>
                    ) : !p.reviewCount || p.reviewCount === 0 ? (
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

                  {/* Progress Column */}
                  <td className="py-4 px-4">
                    {p.isDraft ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="font-extrabold text-indigo-950">{p.completionPercentage}%</span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {language === 'en' ? `Step ${p.currentStep} of 8` : `Langkah ${p.currentStep} dari 8`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-semibold">-</span>
                    )}
                  </td>

                  {/* Status column */}
                  <td className="py-4 px-4">
                    {p.isDraft ? (
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          {language === 'en' ? 'Draft' : 'Draf'}
                        </span>
                        {p.draftUpdatedAt && (
                          <div className="flex items-center gap-1 text-[9px] text-slate-400 font-semibold">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>
                              {new Date(p.draftUpdatedAt).toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          p.status === 'ACTIVE' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : p.status === 'ARCHIVED'
                            ? 'bg-rose-50 text-rose-600 border-rose-100'
                            : p.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            p.status === 'ACTIVE' ? 'bg-emerald-500' :
                            p.status === 'ARCHIVED' ? 'bg-rose-500' :
                            p.status === 'PENDING' ? 'bg-amber-500' :
                            'bg-slate-400'
                          }`} />
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
                    )}
                  </td>

                  {/* Action Buttons list */}
                  <td className="py-4 px-4">
                    {p.isDraft ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onContinueDraft?.(p.rawDraft)}
                          title={language === 'en' ? 'Continue Editing Draft' : 'Lanjutkan Mengisi Draf'}
                          className="px-3 py-1.5 bg-indigo-950 hover:bg-slate-900 text-white rounded-lg text-[10px] font-black tracking-wide uppercase shadow-xs cursor-pointer transition-colors"
                        >
                          {language === 'en' ? 'Continue' : 'Lanjutkan'}
                        </button>
                        <button
                          onClick={() => onDeleteDraft?.(p.id)}
                          title={language === 'en' ? 'Discard Draft' : 'Buang Draf'}
                          className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2.5">
                        <a
                          href={`/property/${p.slug || p.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View Property Details"
                          className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-lg cursor-pointer transition-colors flex items-center justify-center"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
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
                    )}
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
