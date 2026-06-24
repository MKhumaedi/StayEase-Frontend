import React from 'react';
import { User, Phone, Mail } from 'lucide-react';

interface GuestProps {
  name: string;
  email: string;
  phone: string;
}

export default function GuestInfoSection({ name, email, phone }: GuestProps) {
  return (
    <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex flex-col gap-3">
      <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1">
        <User className="w-3.5 h-3.5 text-indigo-600" /> Guest Information
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-semibold">
        <div className="bg-white p-3 border rounded-lg shadow-2xs">
          <span className="text-[10px] text-slate-400 block mb-0.5">Full Name</span>
          <span className="text-slate-800 font-bold">{name}</span>
        </div>
        
        <div className="bg-white p-3 border rounded-lg shadow-2xs">
          <span className="text-[10px] text-slate-400 block mb-0.5">Email Address</span>
          <span className="text-slate-800 flex items-center gap-1 overflow-x-auto"><Mail className="w-3 h-3 text-slate-400 shrink-0" /> {email}</span>
        </div>

        <div className="bg-white p-3 border rounded-lg shadow-2xs">
          <span className="text-[10px] text-slate-400 block mb-0.5">Phone Number</span>
          <span className="text-slate-800 flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400 shrink-0" /> {phone || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}
