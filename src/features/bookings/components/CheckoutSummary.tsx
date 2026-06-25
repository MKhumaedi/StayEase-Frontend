import React from 'react';

interface CheckoutSummaryProps {
  property: any;
  selectedRoom: any;
  startDate: string;
  endDate: string;
  guestCount: number;
  breakdown: any;
  language: string;
  t: any;
  formatCurrencyIDR: (v: number) => string;
}

export function CheckoutSummary({
  property, selectedRoom, startDate, endDate, guestCount, breakdown, language, t, formatCurrencyIDR
}: CheckoutSummaryProps) {
  const isPeak = breakdown?.peakMultiplier > 1;
  const subtotal = breakdown?.subtotal || 0;
  const cleanFee = breakdown?.cleaningFee || 0;
  const servFee = breakdown?.serviceFee || 0;
  const taxVal = breakdown?.taxes || breakdown?.tax || 0;
  const totalVal = breakdown?.total || 0;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 h-fit space-y-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.checkout.bookingSummary}</h3>
      <div className="aspect-video bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
        <img src={property.imageUrls?.[0]} alt={property.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      </div>
      <div>
        <h4 className="font-bold text-slate-800 text-base font-display">{property.name}</h4>
        <p className="text-xs text-slate-400">{property.location}</p>
      </div>

      <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 text-xs text-slate-600 font-semibold">
        <div className="flex justify-between"><span>{t.checkout.selectedRoom}</span><span className="text-indigo-900 font-bold">{selectedRoom.name}</span></div>
        <div className="flex justify-between"><span>Check-In</span><span>{startDate}</span></div>
        <div className="flex justify-between"><span>Check-Out</span><span>{endDate}</span></div>
        <div className="flex justify-between"><span>{language === 'en' ? 'Guests' : 'Tamu'}</span><span>{guestCount}</span></div>
      </div>

      {isPeak && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[#78350f] text-xs font-medium">
          ⚡ {language === 'en' ? 'Holiday Pricing Active' : 'Tarif Musim Liburan Aktif'} ({breakdown.peakMultiplier}x)
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 text-xs text-slate-600 font-semibold">
        <div className="flex justify-between"><span>{t.checkout.roomBasePrice}</span><span className="text-slate-800">{formatCurrencyIDR(subtotal)}</span></div>
        <div className="flex justify-between"><span>{language === 'en' ? 'Cleaning Fee' : 'Biaya Pembersihan'}</span><span className="text-slate-800">{formatCurrencyIDR(cleanFee)}</span></div>
        <div className="flex justify-between"><span>{language === 'en' ? 'StayEase Service' : 'Biaya Layanan'}</span><span className="text-slate-800">{formatCurrencyIDR(servFee)}</span></div>
        <div className="flex justify-between"><span>{language === 'en' ? 'Taxes' : 'Pajak'}</span><span className="text-slate-800">{formatCurrencyIDR(taxVal)}</span></div>
        <div className="flex justify-between text-base font-black text-indigo-950 border-t border-slate-100 pt-4 mt-2 font-display">
          <span>{t.checkout.totalAmountToPay}</span><span>{formatCurrencyIDR(totalVal)}</span>
        </div>
      </div>
    </div>
  );
}
