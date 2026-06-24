import React from 'react';
import { Circle, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

interface TimelineProps {
  status: string;
  createdAt: string;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
}

interface TimelineStep {
  label: string;
  desc: string;
  achieved: boolean;
  isErrorState?: boolean;
}

function getSteps(status: string, checkedInAt?: string | null, checkedOutAt?: string | null): TimelineStep[] {
  const steps: TimelineStep[] = [
    { label: 'Booking Created', desc: 'Guest initiated the reservation request', achieved: true }
  ];

  if (status === 'CANCELLED' || status === 'CANCELED') {
    steps.push({ label: 'Booking Cancelled', desc: 'This stay reservation has been cancelled', achieved: true, isErrorState: true });
    return steps;
  }
  if (status === 'AUTO_EXPIRED') {
    steps.push({ label: 'System Expired', desc: 'Reservation expired automatically', achieved: true, isErrorState: true });
    return steps;
  }

  // Active pathways
  const isP = status === 'WAITING_PAYMENT';
  const isWC = status === 'WAITING_CONFIRMATION';
  const isC = status === 'CONFIRMED';
  const isCI = status === 'CHECKED_IN';
  const isCO = status === 'CHECKED_OUT';
  const isComp = status === 'COMPLETED';

  steps.push({
    label: 'Waiting for Bank Transfer',
    desc: 'Processing guest transaction payment voucher',
    achieved: !isP
  });
  steps.push({
    label: 'Payment Verified',
    desc: 'Verify the accuracy of transfer receipt',
    achieved: !isP && !isWC
  });
  steps.push({
    label: 'Checked-In',
    desc: checkedInAt 
      ? `Checked in on ${new Date(checkedInAt).toLocaleString()}` 
      : 'Guest checked in and room keys issued',
    achieved: isCI || isCO || isComp
  });
  steps.push({
    label: 'Checked-Out',
    desc: checkedOutAt 
      ? `Checked out on ${new Date(checkedOutAt).toLocaleString()}` 
      : 'Guest successfully checked out and departed',
    achieved: isCO || isComp
  });
  steps.push({
    label: 'Stay Completed',
    desc: 'Successfully hosted the travel visit',
    achieved: isComp
  });

  return steps;
}

export default function TimelineSection({ status, createdAt, checkedInAt, checkedOutAt }: TimelineProps) {
  const steps = getSteps(status, checkedInAt, checkedOutAt);
  const dateStr = new Date(createdAt).toLocaleDateString();

  return (
    <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex flex-col gap-4 font-sans">
      <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider">
        Booking Timeline & Lifecycle Logs
      </h3>

      <div className="relative pl-6 border-l-2 border-slate-200 flex flex-col gap-6 text-xs text-slate-500 font-semibold direct-timeline">
        {steps.map((s, i) => {
          const Icon = s.achieved ? (s.isErrorState ? AlertTriangle : CheckCircle2) : Circle;
          const iconColor = s.achieved ? (s.isErrorState ? 'text-rose-600' : 'text-indigo-650 fill-indigo-50') : 'text-slate-350 bg-white';

          return (
            <div key={i} className="relative timeline-node-step">
              {/* Abs Circle */}
              <span className={`absolute -left-[31px] top-0.5 bg-white rounded-full ${iconColor}`}>
                <Icon className="w-5 h-5 font-black" />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className={`font-black ${s.achieved ? 'text-indigo-950' : 'text-slate-400'}`}>
                  {s.label}
                </span>
                <span className="text-[10px] text-slate-450 mt-0.5">{s.desc}</span>
                {i === 0 && <span className="text-[9px] text-indigo-650 italic font-bold">Logged: {dateStr}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export type { TimelineProps };
