import React from 'react';
import { Shield, Sparkles, Wifi, Hourglass } from 'lucide-react';

interface WhyChooseUsProps {
  language: 'en' | 'id';
}

export default function WhyChooseUs({ language }: WhyChooseUsProps) {
  const perks = getPerks(language);

  return (
    <section className="mb-16 px-4">
      <div className="text-center mb-10 max-w-xl mx-auto">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight font-display">
          {language === 'en' ? 'Why Executives Prefer StayEase' : 'Mengapa Eksekutif Memilih StayEase'}
        </h2>
        <div className="w-12 h-1 bg-indigo-600 mx-auto mt-3 rounded-full" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {perks.map((p, idx) => (
          <div key={idx} className="bg-white border border-slate-100 p-6 rounded-2xl flex flex-col gap-3.5 hover:shadow-md transition-all duration-300">
            <div className={`p-3 rounded-xl w-fit ${p.color}`}>{p.icon}</div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">{p.title}</h4>
            <p className="text-slate-550 text-xs leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function getPerks(language: 'en' | 'id') {
  return [
    {
      icon: <Shield className="w-5 h-5" />,
      title: language === 'en' ? 'Strict Audit Checks' : 'Pemeriksaan Audit Ketat',
      desc: language === 'en' ? '130+ vetting indices audited manually prior to list release.' : '130+ indeks penilaian diaudit secara manual sebelum diterbitkan.',
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: language === 'en' ? 'Premium Inventory' : 'Inventaris Premium',
      desc: language === 'en' ? 'Curated from highest luxury corporate assets and villas.' : 'Dikurasi dari aset korporat dan vila mewah tertinggi.',
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      icon: <Wifi className="w-5 h-5" />,
      title: language === 'en' ? 'Executive Ready' : 'Siap Kerja Pasif',
      desc: language === 'en' ? 'Guaranteed high-speed wifi, zero noise workplaces, dual screens.' : 'Garansi wifi kecepatan tinggi, ruang kerja tenang, layar ganda.',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      icon: <Hourglass className="w-5 h-5" />,
      title: language === 'en' ? '24/7 Support Desk' : 'Layanan 24/7',
      desc: language === 'en' ? 'Immediate concierge dispatch whenever requirements arise.' : 'Bantuan pramutamu instan kapan pun kebutuhan muncul.',
      color: 'bg-purple-50 text-purple-600',
    }
  ];
}
