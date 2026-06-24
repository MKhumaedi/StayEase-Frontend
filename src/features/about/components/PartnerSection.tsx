import React from 'react';
import { Award, Star, Compass, ShieldCheck } from 'lucide-react';

interface PartnerSectionProps {
  language: 'en' | 'id';
}

export default function PartnerSection({ language }: PartnerSectionProps) {
  const brands = getPartnerBrands();

  return (
    <section className="mb-16 text-center px-4">
      <p className="text-slate-400 uppercase font-mono text-[9px] tracking-widest font-bold mb-6">
        {language === 'en' ? 'Trusted by Leading Accommodation Partners' : 'Dipercaya oleh Mitra Akomodasi Terkemuka'}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-75">
        {brands.map((b, idx) => (
          <div key={idx} className="flex items-center gap-2 text-slate-500 font-display font-black tracking-tight text-sm uppercase">
            {b.icon}
            <span>{b.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function getPartnerBrands() {
  return [
    { name: 'Marriott Elite', icon: <Star className="w-4 h-4 text-slate-405" /> },
    { name: 'Grand Hyatt suites', icon: <Award className="w-4 h-4 text-slate-405" /> },
    { name: 'Corporate Escrow', icon: <ShieldCheck className="w-4 h-4 text-slate-405" /> },
    { name: 'Bali Residences', icon: <Compass className="w-4 h-4 text-slate-405" /> }
  ];
}
