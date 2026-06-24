import React, { useState } from 'react';
import { Search, DollarSign, FileText, CheckCircle, XCircle, Eye, Image, Link } from 'lucide-react';

interface Payment {
  id: string; // Booking ID
  bookingCode: string;
  guestName: string;
  guestEmail: string;
  propertyName: string;
  totalAmount: string | number;
  status: string;
  createdAt: string;
  paymentProof: { id: string; proofUrl: string; createdAt: string } | null;
}

interface PaymentManagementProps {
  payments: Payment[];
  onConfirmPayment: (bookingId: string) => Promise<void>;
  onRejectPayment: (bookingId: string) => Promise<void>;
}

export default function PaymentManagement({ payments, onConfirmPayment, onRejectPayment }: PaymentManagementProps) {
  const [search, setSearch] = useState('');
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  const filteredPayments = payments.filter(p => 
    p.bookingCode.toLowerCase().includes(search.toLowerCase()) ||
    p.guestName.toLowerCase().includes(search.toLowerCase()) ||
    p.propertyName.toLowerCase().includes(search.toLowerCase())
  );

  const handleAction = async (bookingId: string, action: 'CONFIRM' | 'REJECT') => {
    const confirmMsg = action === 'CONFIRM' 
      ? `Are you sure you want to verify and APPROVE this manual transfer attachment?` 
      : `Are you sure you want to REJECT this receipt upload?`;

    if (window.confirm(confirmMsg)) {
      try {
        if (action === 'CONFIRM') {
          await onConfirmPayment(bookingId);
        } else {
          await onRejectPayment(bookingId);
        }
      } catch (err: any) {
        alert(err.message || 'Action execution failed');
      }
    }
  };

  return (
    <div className="space-y-6" id="payment-management-container">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900" id="payment-heading">Reconciliation & Payments</h2>
        <p className="mt-1 text-sm text-gray-500" id="payment-subheading">Verify manual bank transfer uploads, view automatic invoice amounts, and monitor refunds.</p>
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-xs flex flex-col gap-4 sm:flex-row sm:items-center" id="payment-filters-bar">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input 
            id="payment-search"
            type="text" 
            placeholder="Search booking code, guest, property..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-gray-50"
          />
        </div>
      </div>

      {/* Payment Table List */}
      <div className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-xs" id="payments-table-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left" id="payments-table">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-6 py-4">Invoice / Booking</th>
                <th className="px-6 py-4">Guest Details</th>
                <th className="px-6 py-4">Property</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4">Payment Receipt</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Verification Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm" id="payments-table-body">
              {filteredPayments.length === 0 ? (
                <tr id="empty-payment-row">
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No transactions matching selected filters.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const hasProof = !!p.paymentProof;
                  const isAwaitingVerification = p.status === 'WAITING_PAYMENT' && hasProof;
                  const isPaid = p.status === 'CONFIRMED' || p.status === 'COMPLETED';

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/40 transition-colors" id={`payment-row-${p.id}`}>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                          <div>
                            <p className="font-mono text-xs font-semibold text-indigo-600">#{p.bookingCode}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{new Date(p.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-800">{p.guestName}</p>
                        <p className="text-xs text-gray-400">{p.guestEmail}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-medium">
                        <p className="line-clamp-1">{p.propertyName}</p>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        ${Math.round(Number(p.totalAmount))}
                      </td>
                      <td className="px-6 py-4">
                        {hasProof ? (
                          <div className="flex items-center gap-1.5" id={`proof-container-${p.id}`}>
                            <button 
                              onClick={() => setSelectedProofUrl(p.paymentProof!.proofUrl)}
                              className="text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                            >
                              <Eye className="h-3.5 w-3.5" /> View Receipt
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-450 text-xs italic">Auto Gateway (Card/Online)</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isPaid ? 'bg-emerald-100 text-emerald-800' :
                          isAwaitingVerification ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-850 bg-red-105 text-red-800'
                        }`}>
                          {isAwaitingVerification ? 'PENDING_CONFIRMATION' : p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isAwaitingVerification ? (
                          <div className="flex justify-end gap-1.5">
                            <button 
                              onClick={() => handleAction(p.id, 'CONFIRM')}
                              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded-lg shadow-xs flex items-center gap-1"
                            >
                              <CheckCircle className="h-3.5 w-3.5" /> Approve Receipt
                            </button>
                            <button 
                              onClick={() => handleAction(p.id, 'REJECT')}
                              className="text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Verified System Ledger</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Image Preview Overlay Modal */}
      {selectedProofUrl && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => setSelectedProofUrl(null)}>
          <div className="relative bg-white rounded-2xl shadow-2xl p-3 max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="border-b border-gray-100 pb-3 mb-3 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">Uploaded Receipt Proof</span>
              <button 
                onClick={() => setSelectedProofUrl(null)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
            
            <img 
              src={selectedProofUrl} 
              alt="Uploaded Transfer Slip" 
              className="max-h-[60vh] w-full object-contain rounded-xl border border-gray-100"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=600&q=80';
              }}
            />

            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs text-gray-500 mt-3 flex items-center gap-1">
              <Image className="h-4 w-4 shrink-0 text-gray-400" />
              <span>Validate metadata, transfer amount matches checkout total before accepting.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
