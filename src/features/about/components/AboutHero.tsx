import React from 'react';
import { Compass } from 'lucide-react';

interface AboutHeroProps {
  language: 'en' | 'id';
}

export default function AboutHero({ language }: AboutHeroProps) {
  const title = language === 'en' ? 'Redefining Premium Stays' : 'Mendefinisikan Ulang Penginapan Premium';
  const subtitle = language === 'en' 
    ? 'Discover StayEase Premium, where curating high-fidelity intermediate lodging for global executives meets luxury real estate.'
    : 'Temukan StayEase Premium, di mana kurasi akomodasi sementara berdaya tinggi untuk eksekutif global bertemu properti mewah.';

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 py-24 px-6 md:px-12 text-center text-white rounded-3xl mb-12 shadow-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-800/20 via-transparent to-transparent opacity-60" />
      <div className="relative max-w-3xl mx-auto flex flex-col items-center gap-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 font-mono text-[10px] tracking-widest uppercase">
          <Compass className="w-3.5 h-3.5 animate-spin-slow" />
          <span>Established 2024</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black font-display tracking-tight text-white leading-tight">
          {title}
        </h1>
        <p className="text-slate-350 text-sm md:text-base leading-relaxed max-w-2xl font-medium">
          {subtitle}
        </p>
      </div>
    </section>
  );
}
