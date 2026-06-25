import React from 'react';

interface Step1FormProps {
  name: string;
  setName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  language: string;
  onNext: () => void;
  t: any;
}

export function Step1Form({
  name, setName, email, setEmail, phone, setPhone, onNext, language, t
}: Step1FormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
        {language === 'en' ? 'Guest Ledger Details' : 'Informasi Detail Buku'}
      </h3>
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1.5">{t.checkout.guestFullName}</label>
        <input 
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-sans" 
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{language === 'en' ? 'Email Address' : 'Alamat Email'}</label>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-sans" 
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{language === 'en' ? 'Phone Number' : 'Nomor Telepon'}</label>
        <input 
          type="text" 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)} 
          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-sans" 
        />
      </div>
      <button 
        type="button" 
        onClick={onNext} 
        className="w-full bg-indigo-900 hover:bg-indigo-850 text-white font-bold py-3 rounded-xl mt-2 text-sm cursor-pointer transition-all"
      >
        {t.propertyDetail.confirmSelection}
      </button>
    </div>
  );
}
