import React, { useState, useRef, useEffect } from 'react';
import { Mail, CheckCircle2, QrCode, Smartphone, Send } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';

export function NewsletterBanner() {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Ref untuk mengontrol pemutaran video secara otomatis dan konsisten
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Autoplay prevented:", error);
        });
      }
    }
  }, []);

  const isEnglish = language === 'en';

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg(isEnglish ? 'Please enter a valid email address.' : 'Masukkan alamat email yang valid.');
      return;
    }

    setErrorMsg('');
    setStatus('loading');

    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 1200);
  };

  return (
    <section className="relative w-full p-0 rounded-none overflow-hidden border-t border-slate-800 bg-slate-950 font-sans text-white -mb-16 sm:-mb-24">
      
      {/* Background Video Layer dengan Visibilitas Jelas & Transparan */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          ref={videoRef}
          src="https://cdn.pixabay.com/video/2026/07/01/361729_large.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-130 select-none scale-105 pointer-events-none"
        />
        {/* Soft Dark Overlay Agar Teks Tetap Tajam & Video Tetap Terlihat Bergerak */}
        <div className="absolute inset-0 bg-linear-to-r from-slate-950/90 via-slate-950/75 to-indigo-950/70" />
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-10 lg:py-12 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Sisi Kiri: Mockup Frame Smartphone StayEase */}
        <div className="hidden lg:flex lg:col-span-4 justify-center items-center relative">
          <div className="relative w-64 bg-slate-900/90 border-4 border-slate-700/80 rounded-[40px] p-2.5 shadow-2xl backdrop-blur-md transform -rotate-2 hover:rotate-0 transition-transform duration-500">
            {/* Camera Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-3 bg-slate-800 rounded-full z-20" />
            
            {/* Screen View */}
            <div className="bg-slate-950 rounded-[30px] overflow-hidden pt-6 pb-4 px-3 flex flex-col gap-3 border border-slate-800">
              <div className="flex items-center justify-between text-[10px] font-black text-indigo-400 border-b border-slate-800 pb-2">
                <span>StayEase App</span>
                <span className="text-[9px] text-slate-500 font-mono">v2.4.0</span>
              </div>

              {/* Mini Cards Preview */}
              <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-2xl border border-white/10 flex flex-col gap-1.5">
                <div className="h-16 rounded-xl bg-slate-800 overflow-hidden relative">
                  <img 
                    src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=400&q=80" 
                    alt="Mini Preview" 
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1 left-1 bg-indigo-600 text-[8px] font-black px-1.5 py-0.5 rounded text-white">PROMO 20%</span>
                </div>
                <div className="text-[10px] font-bold text-white truncate">Azure Horizon Villa</div>
                <div className="text-[9px] text-slate-400">Jakarta • Rp 850.000 /malam</div>
              </div>

              <div className="bg-indigo-600/40 border border-indigo-500/50 p-2 rounded-xl text-center">
                <span className="text-[9.5px] font-bold text-indigo-200 block">⚡ Instant Mobile Check-In Pass</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sisi Kanan: Form Newsletter & App Badges */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Section 1: Form Langganan Newsletter */}
          <div className="flex flex-col gap-3">
            <h3 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white leading-tight drop-shadow-md">
              {isEnglish
                ? 'Get the latest travel tips, recommendations, & exclusive deals.'
                : 'Dapatkan info terbaru seputar tips perjalanan, rekomendasi, serta promo.'}
            </h3>

            {status === 'success' ? (
              <div className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 p-4 rounded-2xl flex items-center gap-3 animate-fade-in my-2 backdrop-blur-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xs sm:text-sm font-bold">
                  {isEnglish
                    ? 'Thank you for subscribing! Check your inbox for exclusive promo codes.'
                    : 'Terima kasih telah berlangganan! Cek kotak masuk email Anda untuk kode promo khusus.'}
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 pt-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder={isEnglish ? 'Enter your email address' : 'Alamat emailmu'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-bold pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-md"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-orange-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 border border-orange-400/30"
                >
                  {status === 'loading' ? (
                    <span className="animate-pulse">{isEnglish ? 'Subscribing...' : 'Memproses...'}</span>
                  ) : (
                    <>
                      <span>{isEnglish ? 'Subscribe Newsletter' : 'Berlangganan Newsletter'}</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {errorMsg && (
              <p className="text-xs font-semibold text-rose-400">{errorMsg}</p>
            )}
          </div>

          <hr className="border-slate-800/80 my-1" />

          {/* Section 2: Text Informasi App & QR Code + Store Badges */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <h4 className="text-sm font-bold text-slate-200">
                {isEnglish
                  ? 'All bookings in one place, ready for your next getaway.'
                  : 'Semua pesanan dalam genggaman, selalu siap jalan-jalan.'}
              </h4>
              <p className="text-xs font-black text-indigo-400 mt-0.5">
                {isEnglish ? 'Use StayEase Web App.' : 'Pakai StayEase App.'}
              </p>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {/* QR Code Container */}
              <div className="bg-white p-2 rounded-2xl shadow-md flex items-center justify-center shrink-0 border border-slate-100" title="Scan QR Code to Open">
                <QrCode className="w-10 h-10 text-slate-900" />
              </div>

              {/* Store Badges */}
              <div className="flex items-center gap-2">
                <div className="bg-slate-900/90 hover:bg-slate-850 border border-slate-700/80 rounded-xl px-3.5 py-2 flex items-center gap-2 cursor-pointer transition-colors shadow-sm backdrop-blur-xs">
                  <Smartphone className="w-5 h-5 text-indigo-400" />
                  <div className="flex flex-col text-left">
                    <span className="text-[8px] uppercase tracking-widest text-slate-400 font-bold">GET IT ON</span>
                    <span className="text-xs font-black text-white leading-none">Google Play</span>
                  </div>
                </div>

                <div className="bg-slate-900/90 hover:bg-slate-850 border border-slate-700/80 rounded-xl px-3.5 py-2 flex items-center gap-2 cursor-pointer transition-colors shadow-sm backdrop-blur-xs">
                  <Smartphone className="w-5 h-5 text-indigo-400" />
                  <div className="flex flex-col text-left">
                    <span className="text-[8px] uppercase tracking-widest text-slate-400 font-bold">Download on the</span>
                    <span className="text-xs font-black text-white leading-none">App Store</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}