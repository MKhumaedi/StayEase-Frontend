import React from 'react';
import { 
  Instagram, 
  Facebook, 
  Linkedin, 
  Compass, 
  ArrowUpRight 
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Brand Column */}
        <div className="flex flex-col gap-4">
          <span className="text-2xl font-black text-white tracking-tight font-display flex items-center gap-2">
            <Compass className="w-6 h-6 text-indigo-400" />
            StayEase<span className="text-indigo-400 font-sans">.</span>
          </span>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
            Redefining dynamic residential living and elite, temporary booking environments with rigorous verification protocols.
          </p>
          <div className="flex gap-3 text-slate-500 mt-2">
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noreferrer" 
              className="p-2 bg-slate-800/60 rounded-xl hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noreferrer" 
              className="p-2 bg-slate-800/60 rounded-xl hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              aria-label="Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noreferrer" 
              className="p-2 bg-slate-800/60 rounded-xl hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Links Column */}
        <div>
          <h4 className="text-xs font-black text-white tracking-widest uppercase mb-4">Discover StayEase</h4>
          <ul className="space-y-3 text-xs font-semibold">
            <li>
              <a href="/" className="hover:text-amber-350 transition-colors cursor-pointer inline-flex items-center gap-1">
                <span>Discover</span> <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100" />
              </a>
            </li>
            <li>
              <a href="/search" className="hover:text-amber-350 transition-colors cursor-pointer inline-flex items-center gap-1">
                <span>Properties</span>
              </a>
            </li>
            <li>
              <a href="/dashboard" className="hover:text-amber-350 transition-colors cursor-pointer inline-flex items-center gap-1">
                <span>Tenant Workspace</span>
              </a>
            </li>
            <li>
              <button 
                onClick={() => alert('Contact StayEase at support@stayease.com')} 
                className="hover:text-amber-350 transition-colors cursor-pointer text-left focus:outline-hidden"
              >
                Contact Support
              </button>
            </li>
          </ul>
        </div>

        {/* Legal Column */}
        <div>
          <h4 className="text-xs font-black text-white tracking-widest uppercase mb-4">Legal</h4>
          <ul className="space-y-3 text-xs font-semibold">
            <li>
              <button 
                onClick={() => alert('StayEase terms & dynamic pricing clauses.')} 
                className="hover:text-amber-350 transition-colors cursor-pointer text-left focus:outline-hidden"
              >
                Terms of Use
              </button>
            </li>
            <li>
              <button 
                onClick={() => alert('Secure verification escrows privacy policies.')} 
                className="hover:text-amber-350 transition-colors cursor-pointer text-left focus:outline-hidden"
              >
                Privacy Policy
              </button>
            </li>
          </ul>
        </div>

        {/* Dynamic Trust Certification Tagline */}
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-black text-white tracking-widest uppercase mb-2">Social Networks</h4>
          <p className="text-xs leading-relaxed">
            Follow StayEase on Instagram, Facebook, and LinkedIn to discover upcoming seasonal promotional listings first.
          </p>
          <div className="p-4 bg-slate-850 rounded-2xl border border-slate-800 text-[11px] font-semibold text-slate-350 flex items-center justify-between">
            <span>Verified Escrows</span>
            <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-900/45 px-2 py-0.5 rounded-lg border border-emerald-800/40">Active</span>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-500">
        <span>© StayEase 2026. All rights reserved.</span>
        <div className="flex gap-6">
          <span className="cursor-pointer hover:text-slate-400">English (Americas)</span>
          <span className="cursor-pointer hover:text-slate-400">USD (Escrow Balance)</span>
        </div>
      </div>
    </footer>
  );
}
