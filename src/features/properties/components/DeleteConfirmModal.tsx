import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  propertyName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  propertyName,
  isDeleting,
  onConfirm,
  onClose
}: DeleteConfirmModalProps) {
  const { language } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-indigo-950/70 backdrop-blur-xs select-none">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl w-full max-w-sm p-6 border border-slate-100 shadow-2xl"
          >
            <div className="text-left space-y-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl w-fit">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-indigo-950 font-display text-base">
                  {language === 'en' ? 'Delete Property Listing?' : 'Hapus Stays Properti?'}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed mt-1.5">
                  {language === 'en'
                    ? `Are you sure you want to permanently remove "${propertyName}"? Stays will be soft-deleted and removed from the active marketplace.`
                    : `Apakah Anda yakin ingin menghapus "${propertyName}"? Stays akan dihapus dan ditarik dari pasar aktif.`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 mt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 cursor-pointer transition-colors disabled:opacity-50"
              >
                {language === 'en' ? 'Cancel' : 'Batal'}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{language === 'en' ? 'Deleting...' : 'Menghapus...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Delete Stay' : 'Hapus Stays'}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
