import React from 'react';

interface PlatformStatsProps {
  language: 'en' | 'id';
}

export default function PlatformStats({ language }: PlatformStatsProps) {
  const list = getStats(language);

  return (
    <section className="bg-slate-900 border border-slate-800 text-white p-8 md:p-12 rounded-3xl mb-16 shadow-lg relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/40 via-transparent to-transparent pointer-events-none" />
      <div className="relative grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {list.map((item, idx) => (
          <div key={idx} className="flex flex-col gap-1.5 p-2">
            <span className="text-3xl md:text-4xl font-extrabold tracking-tight text-indigo-400 font-display">
              {item.value}
            </span>
            <span className="text-slate-400 font-mono text-[9.5px] uppercase tracking-widest font-black">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function getStats(language: 'en' | 'id') {
  return [
    { value: '1.5K+', label: language === 'en' ? 'Exclusive Stays' : 'Penginapan Eksklusif' },
    { value: '45+', label: language === 'en' ? 'Global Cities' : 'Kota Global' },
    { value: '98.7%', label: language === 'en' ? 'Satisfaction Rate' : 'Tingkat Kepuasan' },
    { value: '24/7', label: language === 'en' ? 'Concierge Guarantee' : 'Garansi Layanan' },
  ];
}
