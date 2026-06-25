import React from 'react';
import { XCircle, CheckCircle, Sparkles } from 'lucide-react';

interface Props {
  booking: any;
  isHost: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  updateStatus: (status: string) => void;
}

export default function OperationalControls({ booking, isHost, isGuest, isAdmin, updateStatus }: Props) {
  return (
    <div className="bg-slate-50 border border-slate-100 p-5 rounded-xl flex flex-wrap gap-3 justify-between items-center font-semibold">
      <div>
        <span className="text-[10px] uppercase font-bold text-slate-400 block">Actions desk</span>
        <span className="text-xs text-slate-600">Available operations based on permissions</span>
      </div>
      <div className="flex gap-2">
        {((isHost || isAdmin) && booking.status === 'WAITING_CONFIRMATION') && (
          <>
            <button onClick={() => updateStatus('CANCELLED')} className="px-4 py-2 border rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer flex items-center gap-1"><XCircle className="w-4 h-4" /> Reject & Cancel</button>
            <button onClick={() => updateStatus('CONFIRMED')} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 cursor-pointer flex items-center gap-1 shadow-sm"><CheckCircle className="w-4 h-4" /> Approve & Confirm</button>
          </>
        )}
        {(isGuest && booking.status === 'CONFIRMED') && (
          <button onClick={() => updateStatus('COMPLETED')} className="px-4 py-2 bg-indigo-900 text-white rounded-xl text-xs font-black hover:bg-indigo-850 cursor-pointer flex items-center gap-1 shadow-sm"><Sparkles className="w-4 h-4" /> Complete Stay & Checkout</button>
        )}
        {(isAdmin && booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED') && (
          <>
            <button onClick={() => updateStatus('CANCELLED')} className="px-3 py-1.5 border border-rose-200 rounded text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer">Admin Cancel</button>
            <button onClick={() => updateStatus('CONFIRMED')} className="px-3 py-1.5 border border-indigo-200 rounded text-xs font-bold text-indigo-700 hover:bg-indigo-50 cursor-pointer">Admin Confirm</button>
            <button onClick={() => updateStatus('COMPLETED')} className="px-3 py-1.5 border border-emerald-200 rounded text-xs font-bold text-emerald-700 hover:bg-emerald-50 cursor-pointer">Admin Complete</button>
          </>
        )}
      </div>
    </div>
  );
}
