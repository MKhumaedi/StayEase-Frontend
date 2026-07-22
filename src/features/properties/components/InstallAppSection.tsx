import React, { useEffect, useState } from 'react';
import { Smartphone, Download, Tag, RefreshCw, BellRing, CheckCircle2, X, Share2, PlusSquare, MonitorCheck } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';

export function InstallAppSection() {
  const { language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    // Tangkap event install PWA dari browser
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Cek jika aplikasi sudah terpasang di perangkat
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Buka Modal Dialog Kustom
      setShowGuideModal(true);
    }
  };

  const isEnglish = language === 'en';

  return (
    <>
      <section className="relative my-12 rounded-3xl overflow-hidden shadow-2xl border border-indigo-900/50 bg-slate-950 font-sans text-white">
        
        {/* Background Gambar Pemandangan Resort/Villa + Overlay Gradient */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="https://awsimages.detik.net.id/community/media/visual/2020/10/06/soneva-fushi-2_169.jpeg?w=1200"
            alt="Luxury Resort Background"
            className="w-full h-full object-cover opacity-35 select-none pointer-events-none scale-105"
            referrerPolicy="no-referrer"
          />
          {/* Dark Overlay Gradient agar Teks Tetap Sangat Jelas (Legible) */}
          <div className="absolute inset-0 bg-linear-to-r from-slate-950 via-slate-85/85 to-indigo-40/40" />
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-12 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
          
          {/* Sisi Kiri: Headline & Tombol Pasang */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-4 max-w-lg">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-300">
              <Smartphone className="w-3.5 h-3.5 text-indigo-300" />
              <span>{isEnglish ? 'Smart Mobile Web App' : 'Aplikasi Web Pintar'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white leading-tight drop-shadow-md">
              {isEnglish ? 'Why use StayEase on Mobile?' : 'Kenapa pasang StayEase di HP?'}
            </h2>

            <p className="text-xs sm:text-sm text-indigo-200/80 leading-relaxed font-normal">
              {isEnglish 
                ? 'Access 1-click reservations, instant booking updates, and exclusive promos directly from your mobile home screen.'
                : 'Akses reservasi 1-klik, pembaruan booking instan, serta promo khusus langsung dari layar utama HP Anda.'}
            </p>

            <div className="pt-2">
              {isInstalled ? (
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-5 py-3 rounded-2xl font-bold text-xs backdrop-blur-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{isEnglish ? 'App Installed on Device' : 'Aplikasi Terpasang di HP'}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 flex items-center gap-2.5 hover:scale-105 active:scale-95 cursor-pointer border border-indigo-400/30"
                >
                  <Download className="w-4 h-4 animate-bounce" />
                  <span>{isEnglish ? 'Install StayEase Shortcut (1-Click)' : 'Pasang Aplikasi StayEase (1-Klik)'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Sisi Kanan: 3 Fitur Unggulan Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full lg:w-auto">
            
            {/* Card 1 */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col items-center text-center gap-2.5 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">
                  {isEnglish ? 'App Exclusive Promos' : 'Promo Khusus Aplikasi'}
                </h4>
                <p className="text-[10.5px] text-indigo-200/70 mt-1 leading-relaxed">
                  {isEnglish ? 'Get special nightly rates & instant discounts.' : 'Dapatkan harga khusus & diskon instan.'}
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col items-center text-center gap-2.5 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">
                  {isEnglish ? 'Easy Reschedule' : 'Easy Refund & Schedule'}
                </h4>
                <p className="text-[10.5px] text-indigo-200/70 mt-1 leading-relaxed">
                  {isEnglish ? 'Manage stay dates flexibly anytime.' : 'Atur jadwal menginap fleksibel kapan saja.'}
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col items-center text-center gap-2.5 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">
                  {isEnglish ? 'Instant Check-In Pass' : 'Pass Check-In Instan'}
                </h4>
                <p className="text-[10.5px] text-indigo-200/70 mt-1 leading-relaxed">
                  {isEnglish ? 'Show QR code pass in 1 tap upon arrival.' : 'Tunjukkan QR Pass dalam 1 ketukan.'}
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* MODAL DIALOG PETUNJUK INSTALLASI */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in font-sans">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative overflow-hidden flex flex-col gap-5">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 font-display">
                    {isEnglish ? 'Install StayEase App' : 'Pasang Aplikasi StayEase'}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-400 leading-none mt-0.5">
                    {isEnglish ? 'Add to Home Screen for 1-Click Access' : 'Tambahkan ke Layar Utama untuk Akses 1-Klik'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Langkah-langkah Visual */}
            <div className="flex flex-col gap-3 text-xs text-slate-600 font-medium">
              <p className="text-slate-500 leading-relaxed text-[11.5px]">
                {isEnglish
                  ? 'Follow these quick steps on your browser to place StayEase directly on your phone home screen:'
                  : 'Ikuti langkah mudah ini di browser Anda untuk menempatkan StayEase langsung di layar utama HP:'}
              </p>

              {/* Step 1 */}
              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-[12px] flex items-center gap-1.5">
                    <span>{isEnglish ? 'Tap Menu / Share Icon' : 'Ketuk Menu / Ikon Bagikan'}</span>
                    <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {isEnglish
                      ? 'Click the 3-dots icon (Chrome/Android) or Share button (Safari/iOS).'
                      : 'Klik ikon titik tiga di pojok browser (Android) atau tombol Bagikan (Safari iOS).'}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-[12px] flex items-center gap-1.5">
                    <span>{isEnglish ? 'Select "Add to Home Screen"' : 'Pilih "Tambahkan ke Layar Utama"'}</span>
                    <PlusSquare className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {isEnglish
                      ? 'Scroll options and tap "Add to Home Screen" or "Install App".'
                      : 'Pilih opsi "Tambahkan ke Layar Utama" atau "Install Aplikasi".'}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-[12px] flex items-center gap-1.5">
                    <span>{isEnglish ? 'Ready in 1-Click!' : 'Siap Dipakai 1-Klik!'}</span>
                    <MonitorCheck className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {isEnglish
                      ? 'An icon will appear on your screen for instant access.'
                      : 'Ikon StayEase akan muncul di layar HP Anda dan siap dibuka kapan saja.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-full bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-md text-center"
              >
                {isEnglish ? 'Got It, Thanks!' : 'Saya Mengerti'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}