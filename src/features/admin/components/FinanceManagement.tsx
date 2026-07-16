import React, { useState } from 'react';
import { CreditCard, TrendingUp, DollarSign, Calendar, Percent, ShieldCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar } from 'recharts';
import PaymentManagement from './PaymentManagement';
import AdminWithdrawalPanel from './AdminWithdrawalPanel';

interface FinanceManagementProps {
  payments: any[];
  onConfirmPayment: (bookingId: string) => Promise<void>;
  onRejectPayment: (bookingId: string) => Promise<void>;
  stats: any;
  trends: any[];
}

export default function FinanceManagement({ 
  payments, 
  onConfirmPayment, 
  onRejectPayment,
  stats,
  trends
}: FinanceManagementProps) {
  const [activeSubTab, setActiveSubTab] = useState<'transactions' | 'revenue' | 'withdrawals'>('transactions');

  return (
    <div className="space-y-6" id="finance-management-root">
      {/* Module Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/50 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-indigo-600" />
            Finance & Ledger Hub
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Monitor incoming guest checkout payments, manual cash reconciliation, and long-term platform commission trends.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs Switcher */}
      <div className="flex border-b border-gray-200" id="finance-sub-tabs">
        <button
          onClick={() => setActiveSubTab('transactions')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 ${
            activeSubTab === 'transactions'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
          id="btn-finance-transactions"
        >
          Transactions
        </button>
        <button
          onClick={() => setActiveSubTab('revenue')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 ${
            activeSubTab === 'revenue'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
          id="btn-finance-revenue"
        >
          Revenue Reports
        </button>
        <button
          onClick={() => setActiveSubTab('withdrawals')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 ${
            activeSubTab === 'withdrawals'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
          id="btn-finance-withdrawals"
        >
          Withdrawal Requests
        </button>
      </div>

      {/* Subtab Content Viewports */}
      <div id="finance-viewport" className="mt-4">
        {activeSubTab === 'transactions' && (
          <PaymentManagement 
            payments={payments}
            onConfirmPayment={onConfirmPayment}
            onRejectPayment={onRejectPayment}
          />
        )}
        
        {activeSubTab === 'withdrawals' && (
          <AdminWithdrawalPanel />
        )}

        {activeSubTab === 'revenue' && (
          <div className="space-y-6" id="revenue-reports-pane">
            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Accumulated Revenue</p>
                    <p className="text-2xl font-extrabold text-gray-900 mt-1">
                      ${Math.round(stats?.totalRevenue || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg border border-emerald-100">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 mt-3 font-medium flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  All-time gross processing volume
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Month-To-Date Revenue</p>
                    <p className="text-2xl font-extrabold text-gray-900 mt-1">
                      ${Math.round(stats?.monthlyRevenue || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-indigo-50 text-indigo-650 p-2.5 rounded-lg border border-indigo-100 text-indigo-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 mt-3 font-medium flex items-center gap-1">
                  Active monthly checkout metrics
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Platform Cut commission MTD</p>
                    <p className="text-2xl font-extrabold text-gray-900 mt-1">
                      ${Math.round((stats?.monthlyRevenue || 0) * 0.12).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-amber-50 text-amber-600 p-2.5 rounded-lg border border-amber-100">
                    <Percent className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 mt-3 font-medium flex items-center gap-1">
                  Estimated 12% average commission rate
                </div>
              </div>
            </div>

            {/* Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="revenue-charts-grid">
              {/* Financial growth line */}
              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Financial Growth Over Time</h3>
                  <p className="text-[11px] text-gray-400">Review platform gross income curves tracked quarterly.</p>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends || []}>
                      <defs>
                        <linearGradient id="financialGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenue" stroke="#4f46e5" fillOpacity={1} fill="url(#financialGrad)" strokeWidth={2.5} name="Revenue ($)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Transactions analysis */}
              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Volume Analysis By Month</h3>
                  <p className="text-[11px] text-gray-400">Contrast gross bookings with absolute financial counts.</p>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trends || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="bookings" fill="#818cf8" radius={[4, 4, 0, 0]} name="Bookings Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Reconciliation guidelines info banner */}
            <div className="rounded-2xl bg-slate-900 text-slate-100 p-5 flex items-start gap-4">
              <ShieldCheck className="h-6 w-6 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm">Regulatory & Compliance Guarantee</h4>
                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                  Commission payouts, refund actions, and invoice configurations strictly adhere to StayEase financial policies. All transfers are registered on the secure platform journal auditing systems ledger.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
