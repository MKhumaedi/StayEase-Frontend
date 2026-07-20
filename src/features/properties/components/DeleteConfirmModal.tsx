import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, Loader2, MapPin, Clock, HelpCircle, X, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';
import { useAuth } from '../../../shared/context/AuthContext';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  property: any | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  property,
  isDeleting,
  onConfirm,
  onClose
}: DeleteConfirmModalProps) {
  const { language } = useLanguage();
  const { token } = useAuth();
  const en = language === 'en';

  const [checkingReservations, setCheckingReservations] = useState(false);
  const [hasActiveReservations, setHasActiveReservations] = useState(false);

  const isDraft = !!property?.isDraft || property?.status === 'DRAFT';
  const propertyId = property?.id;
  const propertyName = property?.name || '';
  const propertyLocation = property?.location || property?.address || '';
  const draftProgress = property?.completionPercentage !== undefined 
    ? `${en ? 'Step' : 'Langkah'} ${property?.currentStep || 1} ${en ? 'of' : 'dari'} 8` 
    : '';
  const draftUpdatedAt = property?.draftUpdatedAt;

  // Fetch reservations to check for active books when modal is opened on a published property
  useEffect(() => {
    if (isOpen && propertyId && !isDraft) {
      setCheckingReservations(true);
      setHasActiveReservations(false);
      const authHeader: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      fetch('/api/bookings', { headers: authHeader })
        .then(res => res.json())
        .then(data => {
          const list = data.data || [];
          const active = list.some((b: any) => 
            b.propertyId === propertyId && 
            (b.status === 'CONFIRMED' || b.status === 'PENDING')
          );
          setHasActiveReservations(active);
        })
        .catch(err => {
          console.error('Failed to audit active property reservations:', err);
        })
        .finally(() => {
          setCheckingReservations(false);
        });
    } else {
      setHasActiveReservations(false);
      setCheckingReservations(false);
    }
  }, [isOpen, propertyId, isDraft, token]);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isDeleting, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          onClick={() => {
            if (!isDeleting) onClose();
          }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-indigo-950/70 backdrop-blur-xs select-none"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-sm sm:max-w-md p-6 sm:p-7 border border-slate-100 shadow-2xl relative overflow-hidden"
          >
            {/* Header Close Button */}
            {!isDeleting && (
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <div className="text-left space-y-4">
              {/* Icon Panel depending on Status / Reservation blockers */}
              {hasActiveReservations ? (
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit">
                  <ShieldAlert className="w-6 h-6 animate-bounce" />
                </div>
              ) : isDraft ? (
                <div className="p-3 bg-slate-50 text-slate-500 rounded-2xl w-fit border border-slate-100">
                  <Clock className="w-6 h-6" />
                </div>
              ) : (
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl w-fit">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
              )}

              {/* Dynamic Titles */}
              <div>
                <h4 className="font-extrabold text-indigo-950 font-display text-base sm:text-lg">
                  {hasActiveReservations 
                    ? (en ? 'Deletion Blocked' : 'Penghapusan Diblokir')
                    : isDraft 
                    ? (en ? 'Delete Draft Property?' : 'Hapus Draf Properti?')
                    : (en ? 'Delete Property?' : 'Hapus Properti?')}
                </h4>

                {/* Info Card containing Property Details */}
                <div className="mt-3.5 p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                  <div className="font-black text-indigo-950 text-sm sm:text-base leading-snug">
                    {propertyName}
                  </div>

                  {isDraft ? (
                    <div className="flex flex-col gap-1 text-[11px] text-slate-500 font-semibold pt-1 border-t border-slate-100/50 mt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[8px]">{en ? 'Progress' : 'Kemajuan'}:</span>
                        <span className="text-indigo-600">{draftProgress} ({property?.completionPercentage || 0}%)</span>
                      </div>
                      {draftUpdatedAt && (
                        <div className="flex items-center gap-1.5 text-slate-400 font-medium mt-0.5">
                          <Clock className="w-3.5 h-3.5 shrink-0 text-slate-350" />
                          <span>
                            {en ? 'Last updated' : 'Terakhir diperbarui'}:{' '}
                            {new Date(draftUpdatedAt).toLocaleDateString(en ? 'en-US' : 'id-ID', {
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
                    propertyLocation && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold pt-1 border-t border-slate-100/50 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{propertyLocation}</span>
                      </div>
                    )
                  )}
                </div>

                {/* Auditing State / Dynamic Message */}
                {checkingReservations ? (
                  <div className="flex items-center gap-2 mt-4 text-xs text-slate-450 font-semibold">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-650" />
                    <span>{en ? 'Auditing reservations status...' : 'Memeriksa status reservasi...'}</span>
                  </div>
                ) : hasActiveReservations ? (
                  <p className="text-xs font-bold text-amber-600 mt-4 flex items-start gap-1.5 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>
                      {en 
                        ? 'This property has active reservations and cannot be deleted.' 
                        : 'Properti ini memiliki reservasi aktif dan tidak dapat dihapus.'}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs font-bold text-rose-600 mt-4 flex items-center gap-1.5 bg-rose-50/30 p-2.5 rounded-xl border border-rose-100/50">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span>
                      {isDraft 
                        ? (en ? 'This draft will be permanently deleted and cannot be recovered.' : 'Draf ini akan dihapus secara permanen dan tidak dapat dipulihkan.')
                        : (en ? 'This action permanently removes the property.' : 'Tindakan ini akan menghapus properti secara permanen.')}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-4 mt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 cursor-pointer transition-colors disabled:opacity-50 select-none"
              >
                {en ? 'Cancel' : 'Batal'}
              </button>

              {/* Only show delete button if no active reservations */}
              {!hasActiveReservations && !checkingReservations && (
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isDeleting}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50 select-none shadow-3xs"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{en ? 'Deleting...' : 'Menghapus...'}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isDraft ? (en ? 'Delete Draft' : 'Hapus Draf') : (en ? 'Delete Property' : 'Hapus Properti')}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
