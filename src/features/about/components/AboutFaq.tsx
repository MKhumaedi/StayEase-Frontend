import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface AboutFaqProps {
  language: 'en' | 'id';
}

export default function AboutFaq({ language }: AboutFaqProps) {
  const faqs = getFaqItems(language);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggleIdx = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="mb-16 max-w-2xl mx-auto px-4">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight font-display flex items-center justify-center gap-2.5">
          <HelpCircle className="w-6 h-6 text-indigo-600 shrink-0" />
          <span>{language === 'en' ? 'Frequently Asked Questions' : 'Pertanyaan Umum'}</span>
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        {faqs.map((f, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={idx} className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:border-indigo-105 transition-colors">
              <button 
                onClick={() => toggleIdx(idx)}
                className="w-full flex items-center justify-between p-4 text-left font-bold text-xs md:text-sm text-slate-800 hover:bg-slate-50/50 cursor-pointer focus:outline-hidden"
              >
                <span>{f.question}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-1 text-slate-600 text-xs leading-relaxed font-normal bg-slate-50/20">
                  {f.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function getFaqItems(language: 'en' | 'id') {
  if (language === 'en') {
    return [
      {
        question: 'Who conducts property validation sweeper audits?',
        answer: 'All audits are manually managed directly by certified senior engineers dispatched before hotel suites or premium intermediate apartments enter active status.',
      },
      {
        question: 'Is multi-currency payment supported?',
        answer: 'Yes, our platform works seamlessly with credit cards, local payments, and dedicated corporate escrows, ensuring zero conversion friction.',
      },
      {
        question: 'Can I cancel my corporate booking?',
        answer: 'Each premier suite has visible transparent terms. Travelers can cancel and claim complete refund allocations according to selected flexibilities.',
      }
    ];
  }
  return [
    {
      question: 'Siapa yang melakukan audit validasi properti?',
      answer: 'Setiap suite terkemuka memiliki audit mendalam di 130 faktor validasi dengan insinyur senior yang dikirim langsung ke lokasi untuk verifikasi fisik.',
    },
    {
      question: 'Apakah pembayaran multi-mata uang didukung?',
      answer: 'Ya, platform kami mendukung kartu kredit internasional, transfer bank lokal, dan sistem jaminan multi-mata uang untuk kemudahan transaksi korporat.',
    },
    {
      question: 'Dapatkah saya membatalkan pemesanan korporat saya?',
      answer: 'Setiap akomodasi memiliki kebijakan penyesuaian yang transparan. Pengembalian dana penuh tersedia sesuai batas fleksibilitas yang tertera pada pemesanan.',
    }
  ];
}
