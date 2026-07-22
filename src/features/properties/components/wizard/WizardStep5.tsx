import React, { useEffect, useState } from 'react';
import { CreditCard, ShieldCheck, Sparkles, Receipt, Calculator, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../../../shared/i18n';
import { PricingService } from '../../services/PricingService';

interface WizardStep5Props {
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
}

// Helper untuk mengambil tanggal hari ini dan besok (YYYY-MM-DD) secara presisi
const getTodayAndTomorrowDates = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    todayStr: formatDate(today),
    tomorrowStr: formatDate(tomorrow)
  };
};

export function WizardStep5({ form, setForm }: WizardStep5Props) {
  const { language, formatCurrencyIDR } = useLanguage();
  const { todayStr, tomorrowStr } = getTodayAndTomorrowDates();

  // Helper function to format numeric value to rupiah format without Rp prefix for the input text
  const formatInputText = (num: number): string => {
    if (num === 0) return '';
    return new Intl.NumberFormat('id-ID').format(num);
  };

  // Keep local text states for inputs to guarantee perfect typing cursor and editing flow while syncing in realtime
  const [basePriceText, setBasePriceText] = useState(() => formatInputText(form.basePrice || 0));
  const [cleaningFeeText, setCleaningFeeText] = useState(() => formatInputText(form.cleaningFee || 0));
  const [serviceFeeText, setServiceFeeText] = useState(() => formatInputText(form.serviceFee || 0));
  const [securityDepositText, setSecurityDepositText] = useState(() => formatInputText(form.securityDeposit || 0));

  // Keep state updated in case basePrice text etc. is mutated out of bounds
  useEffect(() => {
    setBasePriceText(formatInputText(form.basePrice || 0));
    setCleaningFeeText(formatInputText(form.cleaningFee || 0));
    setServiceFeeText(formatInputText(form.serviceFee || 0));
    setSecurityDepositText(formatInputText(form.securityDeposit || 0));
  }, [form.basePrice, form.cleaningFee, form.serviceFee, form.securityDeposit]);

  // Sync internal numeric values with wizard parent form state in realtime
  const handleTextChange = (field: string, textValue: string, setTextState: (text: string) => void) => {
    const digitsOnly = textValue.replace(/\D/g, '');
    
    if (digitsOnly === '') {
      setTextState('');
      setForm((prev: any) => ({ ...prev, [field]: 0 }));
      return;
    }

    const numericValue = parseInt(digitsOnly, 10);
    setTextState(new Intl.NumberFormat('id-ID').format(numericValue));
    
    setForm((prev: any) => ({
      ...prev,
      [field]: numericValue
    }));
  };

  // Compute live metrics dynamically using Centralized PricingService for 1 night
  const pricingInput = {
    basePrice: form.basePrice || 0,
    cleaningFee: form.cleaningFee || 0,
    serviceFee: form.serviceFee || 0,
    peakSeasonRates: []
  };
  
  // Tanggal kalkulasi dibuat dinamis (hari ini -> besok)
  const quote = PricingService.calculateQuote(pricingInput, null, todayStr, tomorrowStr);

  const basePrice = quote.nightlyRate;
  const cleaningFee = quote.cleaningFee;
  const serviceFee = quote.serviceFee;
  const securityDeposit = form.securityDeposit || 0;
  const estimatedTax = quote.tax;

  const displayPrice = quote.total;
  const hostRevenue = quote.subtotal + cleaningFee;

  return (
    <div className="space-y-6" id="saas-style-pricing-container">
      {/* Header Panel */}
      <div className="border-l-4 border-indigo-950 pl-3.5 py-1">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step 6 of 8</h4>
        <h3 className="text-base font-bold text-slate-900 tracking-tight font-display">
          {language === 'en' ? 'Pricing & Channel Fees' : 'Harga & Biaya Penyaluran'}
        </h3>
        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
          {language === 'en'
            ? 'Set up standard rates, maintenance surcharges, and guest guarantees for your properties.'
            : 'Tentukan tarif harian, biaya tambahan pemeliharaan, serta jaminan perlindungan aset Anda.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Area: Pricing Grid Form */}
        <div className="lg:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Base Price */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between min-h-[160px]">
              <div>
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  {language === 'en' ? 'Base Nightly Rate' : 'Tarif Dasar per Malam'} <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-slate-400 mt-1 mb-3 leading-relaxed">
                  {language === 'en' 
                    ? 'The standard night rate charged on reservation schedules.' 
                    : 'Tarif dasar sewa per malam yang akan ditagihkan kepada tamu.'}
                </p>
              </div>

              <div className="space-y-1">
                <div className="relative flex items-center bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white rounded-xl px-3 py-2.5 transition-all">
                  <span className="text-xs font-extrabold text-slate-400 mr-1.5 select-none">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    id="pricing-base-price-input"
                    placeholder="0"
                    value={basePriceText}
                    onChange={(e) => handleTextChange('basePrice', e.target.value, setBasePriceText)}
                    className="w-full bg-transparent border-0 p-0 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-0"
                  />
                </div>
                {basePrice > 0 && basePrice < 50000 && (
                  <p className="text-[10px] font-semibold text-rose-600 flex items-center gap-1 pt-0.5">
                    <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                    {language === 'en' ? 'Minimum rate is Rp 50.000' : 'Tarif minimal Rp 50.000'}
                  </p>
                )}
              </div>
            </div>

            {/* 2. Cleaning Fee */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between min-h-[160px]">
              <div>
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  {language === 'en' ? 'Cleaning Fee' : 'Biaya Kebersihan'}
                </label>
                <p className="text-[11px] text-slate-400 mt-1 mb-3 leading-relaxed">
                  {language === 'en' 
                    ? 'One-time fee to cover post-stay deep cleans and setups.' 
                    : 'Biaya sekali bayar untuk pembersihan kamar menjelang check-in.'}
                </p>
              </div>

              <div className="space-y-1">
                <div className="relative flex items-center bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white rounded-xl px-3 py-2.5 transition-all">
                  <span className="text-xs font-extrabold text-slate-400 mr-1.5 select-none">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    id="pricing-cleaning-fee-input"
                    placeholder="0"
                    value={cleaningFeeText}
                    onChange={(e) => handleTextChange('cleaningFee', e.target.value, setCleaningFeeText)}
                    className="w-full bg-transparent border-0 p-0 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-0"
                  />
                </div>
              </div>
            </div>

            {/* 3. Service Fee */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between min-h-[160px]">
              <div>
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <Receipt className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  {language === 'en' ? 'Service Fee' : 'Biaya Layanan'}
                </label>
                <p className="text-[11px] text-slate-400 mt-1 mb-3 leading-relaxed">
                  {language === 'en' 
                    ? 'Extra system and administrative surcharge parameters.' 
                    : 'Parameter beban administrasi atau kontribusi sistem manajemen.'}
                </p>
              </div>

              <div className="space-y-1">
                <div className="relative flex items-center bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white rounded-xl px-3 py-2.5 transition-all">
                  <span className="text-xs font-extrabold text-slate-400 mr-1.5 select-none">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    id="pricing-service-fee-input"
                    placeholder="0"
                    value={serviceFeeText}
                    onChange={(e) => handleTextChange('serviceFee', e.target.value, setServiceFeeText)}
                    className="w-full bg-transparent border-0 p-0 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-0"
                  />
                </div>
              </div>
            </div>

            {/* 4. Security Deposit */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between min-h-[160px]">
              <div>
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  {language === 'en' ? 'Security Deposit' : 'Deposit Jaminan'}
                </label>
                <p className="text-[11px] text-slate-400 mt-1 mb-3 leading-relaxed">
                  {language === 'en' 
                    ? 'A fully refundable hold during guest stays.' 
                    : 'Deposit penjamin kerusakan kamar, dikembalikan setelah checkout.'}
                </p>
              </div>

              <div className="space-y-1">
                <div className="relative flex items-center bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white rounded-xl px-3 py-2.5 transition-all">
                  <span className="text-xs font-extrabold text-slate-400 mr-1.5 select-none">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    id="pricing-deposit-input"
                    placeholder="0"
                    value={securityDepositText}
                    onChange={(e) => handleTextChange('securityDeposit', e.target.value, setSecurityDepositText)}
                    className="w-full bg-transparent border-0 p-0 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-0"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Area: Compact Pricing Summary Card */}
        <div className="lg:col-span-4 lg:sticky lg:top-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 select-none pb-2 border-b border-slate-100 font-display">
                <Calculator className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                {language === 'en' ? 'Pricing Summary Ledger' : 'Ledger Estimasi Harga'}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                {language === 'en'
                  ? 'Real-time billing distribution based on input parameters.'
                  : 'Rincian distribusi tagihan serta nominal perolehan bersih hos.'}
              </p>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span>{language === 'en' ? 'Base Rate /night' : 'Tarif Dasar /malam'}</span>
                <span className="font-bold text-slate-800 font-mono">{formatCurrencyIDR(basePrice)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>{language === 'en' ? 'Cleaning Fee' : 'Biaya Kebersihan'}</span>
                <span className="font-bold text-slate-800 font-mono">{formatCurrencyIDR(cleaningFee)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>{language === 'en' ? 'Service Surcharge' : 'Biaya Tambahan Jasa'}</span>
                <span className="font-bold text-slate-800 font-mono">{formatCurrencyIDR(serviceFee)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>{language === 'en' ? 'Security Escrow' : 'Deposit Jaminan'}</span>
                <span className="font-bold text-slate-800 font-mono">{formatCurrencyIDR(securityDeposit)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>{language === 'en' ? 'Estimated Stays Tax (10%)' : 'PPN / Pajak Daerah (10%)'}</span>
                <span className="font-bold text-slate-800 font-mono">{formatCurrencyIDR(estimatedTax)}</span>
              </div>

              {/* Estimated Guest Invoice Rate */}
              <div className="border-t border-slate-100 pt-3 flex flex-col gap-1">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-slate-800 text-xs">
                    {language === 'en' ? 'Estimated Guest Price' : 'Estimasi Harga Tamu'}
                  </span>
                  <span className="text-sm font-extrabold text-indigo-600 font-mono">
                    {formatCurrencyIDR(displayPrice)}
                    <span className="text-[10px] font-medium text-slate-400 font-sans"> /malam</span>
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {language === 'en' ? '*Calculation: Base + Cleaning + Service + Tax' : '*Perhitungan: Dasar + Kebersihan + Jasa + Pajak'}
                </span>
              </div>

              {/* Net Host Takehome Revenue */}
              <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5 space-y-1 mt-1 transition-colors hover:bg-slate-50">
                <span className="text-[9px] font-extrabold text-indigo-950 uppercase tracking-wider block">
                  {language === 'en' ? 'Estimated Host Earnings' : 'Estimasi Perolehan Bersih Hos'}
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">{language === 'en' ? 'Net Takehome' : 'Pendapatan Bersih'}</span>
                  <span className="text-base font-black text-emerald-600 font-mono">
                    {formatCurrencyIDR(hostRevenue)}
                  </span>
                </div>
                <p className="text-[9.5px] text-slate-400 leading-normal pt-0.5">
                  {language === 'en' ? 'Returns security hold directly without commissions.' : 'Mengabaikan potongan komisi terhadap deposit penjamin.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}