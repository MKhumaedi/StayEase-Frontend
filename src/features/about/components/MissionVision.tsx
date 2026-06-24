import React from 'react';
import { Target, Eye } from 'lucide-react';

interface MissionVisionProps {
  language: 'en' | 'id';
}

export default function MissionVision({ language }: MissionVisionProps) {
  const enMission = 'Our mission is to establish trusted spatial frameworks linking real estate operators with high-end mobile executives to secure effortless, ultra-reliable living environments.';
  const idMission = 'Misi kami adalah membangun kerangka kerja spasial tepercaya yang menghubungkan operator real estat dengan eksekutif seluler kelas atas untuk mengamankan lingkungan hidup yang andal tanpa hambatan.';
  
  const enVision = 'We envision a world where physical relocation no longer limits executive output, delivering seamless cross-border accommodation setups in every major creative and financial center.';
  const idVision = 'Kami memvisualisasikan dunia di mana relokasi fisik tidak lagi membatasi hasil eksekutif, memberikan pengaturan akomodasi lintas batas yang mulus di setiap pusat kreatif dan keuangan utama.';

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 px-4">
      <div className="bg-gradient-to-br from-indigo-50/50 to-white border border-indigo-100/40 p-8 rounded-3xl flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-indigo-100/80 rounded-2xl text-indigo-600">
            <Target className="w-5 h-5" />
          </span>
          <h3 className="text-sm font-black text-slate-900 font-display uppercase tracking-wide">{language === 'en' ? 'Our Mission' : 'Misi Kami'}</h3>
        </div>
        <p className="text-slate-650 text-sm leading-relaxed font-medium">
          {language === 'en' ? enMission : idMission}
        </p>
      </div>

      <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200/50 p-8 rounded-3xl flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-slate-100 rounded-2xl text-slate-700">
            <Eye className="w-5 h-5" />
          </span>
          <h3 className="text-sm font-black text-slate-900 font-display uppercase tracking-wide">{language === 'en' ? 'Our Vision' : 'Visi Kami'}</h3>
        </div>
        <p className="text-slate-650 text-sm leading-relaxed font-medium">
          {language === 'en' ? enVision : idVision}
        </p>
      </div>
    </section>
  );
}
