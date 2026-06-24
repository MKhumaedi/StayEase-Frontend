import React from 'react';
import { Building2, Globe2 } from 'lucide-react';

interface CompanyOverviewProps {
  language: 'en' | 'id';
}

export default function CompanyOverview({ language }: CompanyOverviewProps) {
  const title = language === 'en' ? 'Who We Are' : 'Tentang Kami';
  const text1 = language === 'en'
    ? 'StayEase represents the pinnacle of intermediate accommodation services. Founded to revolutionize intermediate and long-term accommodation for discerning travelers, we coordinate fine real-estate inventories across the globe\'s premier travel corridors.'
    : 'StayEase mewakili puncak layanan akomodasi menengah. Didirikan untuk merevolusi akomodasi jangka menengah dan panjang bagi pelancong yang cerdas, kami mengoordinasikan inventaris real-estat terbaik di koridor perjalanan utama dunia.';
  const text2 = language === 'en'
    ? 'Every property undergoes deep audit sweeps across 130 validation factors prior to listing activation, confirming that internet capacity, workspace noise buffers, temperature zoning, and physical safety barriers exceed executive expectations.'
    : 'Setiap properti menjalani audit mendalam di 130 faktor validasi sebelum aktivasi daftar, memastikan kapasitas internet, peredam kebisingan ruang kerja, zonasi suhu, dan penghalang keselamatan fisik melebihi harapan eksekutif.';

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-16 px-4">
      <div className="flex flex-col gap-5">
        <h2 className="text-2xl font-black tracking-tight text-slate-900 border-l-4 border-indigo-600 pl-4">
          {title}
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed font-normal">
          {text1}
        </p>
        <p className="text-slate-600 text-sm leading-relaxed font-normal">
          {text2}
        </p>
      </div>
      <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm flex flex-col gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-16 bg-indigo-50/30 rounded-full translate-x-12 -translate-y-12 shrink-0 pointer-events-none" />
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Curated Portfolio</h3>
            <p className="text-xs text-slate-500 mt-1">Direct verification of high-end corporate suites and boutique villas.</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 shrink-0">
            <Globe2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Global Scale</h3>
            <p className="text-xs text-slate-500 mt-1">Cross-border accommodation alignment supporting multi-currency and corporate escrows.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
