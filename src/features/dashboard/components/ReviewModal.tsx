import React from 'react';
import { Star, X, Loader2 } from 'lucide-react';

interface Props {
  booking: any;
  rating: number;
  setRating: (r: number) => void;
  comment: string;
  setComment: (c: string) => void;
  error: string | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  language: string;
}

export function ReviewModal({
  booking,
  rating,
  setRating,
  comment,
  setComment,
  error,
  onClose,
  onSubmit,
  submitting,
  language
}: Props) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-fade-in font-sans text-xs">
        <ModalHeader code={booking.bookingCode} name={booking.property?.name} onClose={onClose} label={language === 'en' ? 'Leave a Review' : 'Tulis Ulasan StayEase'} />
        <form onSubmit={onSubmit} className="p-5 flex flex-col gap-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-650 p-2.5 rounded-lg font-bold text-[11px]">{error}</div>}
          <RatingSelector rating={rating} setRating={setRating} language={language} />
          <CommentInput comment={comment} setComment={setComment} language={language} />
          <FormActions submitting={submitting} onClose={onClose} language={language} />
        </form>
      </div>
    </div>
  );
}

function ModalHeader({ code, name, onClose, label }: any) {
  return (
    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
      <div>
        <h3 className="text-base font-bold text-indigo-950 font-display">{label}</h3>
        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{code} • {name}</span>
      </div>
      <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
    </div>
  );
}

function RatingSelector({ rating, setRating, language }: any) {
  const lbl = rating === 5 ? (language === 'en' ? 'Exceptional 5/5' : 'Sangat Sempurna!')
              : rating === 4 ? (language === 'en' ? 'Very Good 4/5' : 'Sangat Baik')
              : rating === 3 ? (language === 'en' ? 'Satisfactory 3/5' : 'Cukup Memuaskan')
              : rating === 2 ? (language === 'en' ? 'Mediocre 2/5' : 'Kurang Memuaskan')
              : (language === 'en' ? 'Disappointing 1/5' : 'Sangat Mengecewakan');
  return (
    <div className="flex flex-col gap-1 items-center justify-center py-2 bg-slate-50/50 border border-slate-100 rounded-xl">
      <span className="text-slate-400 uppercase tracking-wider font-bold text-[10px] mb-1">{language === 'en' ? 'How was your stay?' : 'Bagaimana pengalaman Anda?'}</span>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(s => (
          <button type="button" key={s} onClick={() => setRating(s)} className="text-amber-400 hover:scale-110 active:scale-95 transition-transform cursor-pointer">
            <Star className={`w-8 h-8 ${s <= rating ? 'fill-current' : 'text-slate-200'}`} />
          </button>
        ))}
      </div>
      <span className="mt-1 font-black text-slate-800 capitalize text-[11px]">{lbl}</span>
    </div>
  );
}

function CommentInput({ comment, setComment, language }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-bold text-slate-600">{language === 'en' ? 'Review Comments' : 'Tulis Tanggapan & Komentar'}</label>
      <textarea
        rows={4}
        placeholder={language === 'en' ? 'Share details of your stay...' : 'Tuliskan pengalaman menginap Anda secara jujur...'}
        value={comment}
        onChange={e => setComment(e.target.value)}
        className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none text-xs text-slate-800"
      />
    </div>
  );
}

function FormActions({ submitting, onClose, language }: any) {
  return (
    <div className="flex gap-3 mt-2">
      <button type="button" onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl hover:bg-slate-50 cursor-pointer">{language === 'en' ? 'Cancel' : 'Batal'}</button>
      <button type="submit" disabled={submitting} className="flex-1 bg-indigo-900 hover:bg-indigo-850 text-white font-bold py-2.5 rounded-xl disabled:opacity-50 cursor-pointer flex items-center justify-center">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'en' ? 'Submit' : 'Kirim Ulasan')}
      </button>
    </div>
  );
}
