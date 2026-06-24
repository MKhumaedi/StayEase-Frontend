import React from 'react';
import { DollarSign, Percent, ShieldCheck, ShoppingCart } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';

interface PricingProps {
  basePrice?: number;
  nights: number;
  cleaningFee?: number;
  serviceFee?: number;
  securityDeposit?: number;
  totalAmount: number | string;
}

export default function PricingBreakdownSection({
  basePrice = 0,
  nights,
  cleaningFee = 0,
  serviceFee = 0,
  securityDeposit = 0,
  totalAmount
}: PricingProps) {
  const { language, formatCurrencyIDR } = useLanguage();
  const isEn = language === 'en';

  // Back-calculate raw rent or fallback
  const calculatedBase = basePrice > 0 ? basePrice : Math.round((Number(totalAmount) - cleaningFee - serviceFee) / nights);
  const rawRoomTotal = Math.max(0, calculatedBase * nights);

  return (
    <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex flex-col gap-3 font-sans">
      <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1">
        <ShoppingCart className="w-3.5 h-3.5 text-indigo-600" /> Pricing & Ledger Breakdown
      </h3>

      <div className="bg-white border rounded-xl divide-y divide-slate-100 overflow-hidden text-xs font-semibold text-slate-700">
        <div className="p-3 flex justify-between items-center hover:bg-slate-50/20">
          <div className="flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
            <span>Room Stay Rent ({nights} nights × {formatCurrencyIDR(calculatedBase)})</span>
          </div>
          <span className="font-bold text-slate-800">{formatCurrencyIDR(rawRoomTotal)}</span>
        </div>

        {cleaningFee > 0 && (
          <div className="p-3 flex justify-between items-center hover:bg-slate-50/20">
            <div className="flex items-center gap-2">
              <Percent className="w-3.5 h-3.5 text-slate-400" />
              <span>Standard Cleaning Fee</span>
            </div>
            <span className="font-bold text-slate-800">{formatCurrencyIDR(cleaningFee)}</span>
          </div>
        )}

        {serviceFee > 0 && (
          <div className="p-3 flex justify-between items-center hover:bg-slate-50/20">
            <div className="flex items-center gap-2">
              <Percent className="w-3.5 h-3.5 text-slate-400" />
              <span>StayEase Platform Service Fee</span>
            </div>
            <span className="font-bold text-slate-800">{formatCurrencyIDR(serviceFee)}</span>
          </div>
        )}

        {securityDeposit > 0 && (
          <div className="p-3 flex justify-between items-center hover:bg-slate-50/20">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Refundable Security Deposit</span>
            </div>
            <span className="font-bold text-slate-800">{formatCurrencyIDR(securityDeposit)}</span>
          </div>
        )}

        <div className="p-4 bg-indigo-50/30 flex justify-between items-center">
          <span className="font-black text-xs text-indigo-950 uppercase tracking-wider">Gross Aggregate Total:</span>
          <span className="font-black text-indigo-950 text-base">{formatCurrencyIDR(Number(totalAmount))}</span>
        </div>
      </div>
    </div>
  );
}
