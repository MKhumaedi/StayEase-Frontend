import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface ContactCtaProps {
  onNavigate: (path: string) => void;
  language: 'en' | 'id';
}

export default function ContactCta({ onNavigate, language }: ContactCtaProps) {
  const title = language === 'en' ? 'Immersive Spaces Await' : 'Ruang Imersif Menanti Anda';
  const desc = language === 'en' 
    ? 'Step into a workspace designed for creative focus and executive peace. Discover refined collections.'
    : 'Masuki ruang kerja yang dirancang untuk fokus kreatif dan kenyamanan eksekutif. Temukan koleksi pilihan.';

  return (
    <section className="bg-gradient-to-tr from-slate-900 to-indigo-950 p-8 md:p-12 rounded-3xl text-center text-white shadow-xl relative overflow-hidden mb-6">
      <div className="absolute top-0 left-0 p-32 bg-indigo-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="relative max-w-xl mx-auto flex flex-col items-center gap-5">
        <div className="p-3 bg-indigo-500/10 text-indigo-300 rounded-full border border-indigo-400/20">
          <Sparkles className="w-5 h-5 animate-pulse-slow" />
        </div>
        <h3 className="text-xl md:text-2xl font-black font-display tracking-tight text-white leading-snug">
          {title}
        </h3>
        <p className="text-slate-350 text-xs md:text-sm leading-relaxed">
          {desc}
        </p>
        <button 
          onClick={() => onNavigate('/search')}
          className="mt-2 inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-50 px-6 py-3 rounded-xl font-bold text-xs transition-transform transform active:scale-95 cursor-pointer shadow-md"
        >
          <span>{language === 'en' ? 'Explore Collections' : 'Jelajahi Koleksi'}</span>
          <ArrowRight className="w-4 h-4 text-indigo-600" />
        </button>
      </div>
    </section>
  );
}
