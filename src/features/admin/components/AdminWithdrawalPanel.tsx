import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  Eye, 
  AlertCircle, 
  Loader2, 
  Search, 
  CreditCard, 
  Clock, 
  ArrowUpRight, 
  CheckCircle, 
  CornerDownRight,
  User,
  Inbox,
  XCircle,
  FileText
} from 'lucide-react';

interface WithdrawalRequest {
  id: string;
  tenantId: string;
  tenant: {
    id: string;
    name: string;
    email: string;
    credits: number;
  };
  amount: number;
  fee: number;
  netAmount: number;
  status: 'PENDING' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'REJECTED' | 'FAILED';
  bankName: string;
  accountName: string;
  accountNumber: string;
  referenceNumber?: string;
  notes?: string;
  requestedAt: string;
  approvedAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminWithdrawalPanel() {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected for detail modal
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);

  // Operations dialogs
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null); // withdrawalId

  const [refNumber, setRefNumber] = useState('');
  const [showPayModal, setShowPayModal] = useState<string | null>(null); // withdrawalId

  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('stayease_token');
      const res = await fetch('/api/withdrawals/admin/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch withdrawals');
      }
      const data = await res.json();
      setRequests(data.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (endpoint: string, method = 'POST', body?: any) => {
    try {
      setError(null);
      const token = localStorage.getItem('stayease_token');
      const res = await fetch(`/api/withdrawals/admin/${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: body ? JSON.stringify(body) : undefined
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }
      
      // Refresh list
      await fetchRequests();
      
      // Sync selected modal details
      if (selectedRequest && selectedRequest.id === endpoint.split('/')[0]) {
        const updatedReq = data.withdrawal || data.item;
        if (updatedReq) {
          setSelectedRequest(updatedReq);
        } else {
          setSelectedRequest(null);
        }
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    await handleAction(`${id}/approve`);
    setProcessingId(null);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRejectModal) return;
    setProcessingId(showRejectModal);
    await handleAction(`${showRejectModal}/reject`, 'POST', { notes: rejectReason });
    setShowRejectModal(null);
    setRejectReason('');
    setProcessingId(null);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayModal || !refNumber.trim()) return;
    setProcessingId(showPayModal);
    await handleAction(`${showPayModal}/pay`, 'POST', { referenceNumber: refNumber.trim() });
    setShowPayModal(null);
    setRefNumber('');
    setProcessingId(null);
  };

  // Filter requests
  const filteredRequests = requests.filter(req => {
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesSearch = 
      req.tenant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.tenant?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.bankName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.accountNumber?.includes(searchQuery) ||
      req.id.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  const getStatusColor = (status: WithdrawalRequest['status']) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'APPROVED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PAID':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6" id="admin-withdrawal-panel">
      
      {/* Top filter belt */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Requests' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'PAID', label: 'Paid' },
            { id: 'REJECTED', label: 'Rejected' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setStatusFilter(opt.id)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === opt.id 
                  ? 'bg-white text-indigo-950 shadow-sm' 
                  : 'text-slate-500 hover:text-indigo-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-450">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tenant, bank, number..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-rose-700 font-bold text-xs">
          <AlertCircle className="w-4.5 h-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-450 font-bold tracking-widest uppercase">Fetching ledger items...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-slate-200 rounded-2xl bg-white flex flex-col items-center justify-center gap-3">
          <Inbox className="w-10 h-10 text-slate-300" />
          <div>
            <h4 className="font-bold text-slate-700 text-sm">No Withdrawal Requests Found</h4>
            <p className="text-xs text-slate-400 mt-1">There are no withdrawal records matching the current filters.</p>
          </div>
          <button onClick={fetchRequests} className="text-xs bg-indigo-50 text-indigo-700 font-bold px-4 py-2 rounded-xl hover:bg-indigo-100 transition">
            Refresh List
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                  <th className="p-4">Requested At</th>
                  <th className="p-4">Tenant Partner</th>
                  <th className="p-4">Destination Bank</th>
                  <th className="p-4">Withdrawal Volume</th>
                  <th className="p-4">Admin Fee</th>
                  <th className="p-4">Net Payout</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-650">
                {filteredRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-slate-500 font-normal">
                      <div>{new Date(req.requestedAt).toLocaleDateString()}</div>
                      <span className="text-[9px] font-mono">{new Date(req.requestedAt).toLocaleTimeString()}</span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{req.tenant?.name || 'Partner ID: ' + req.tenantId}</div>
                      <div className="text-[10px] text-slate-450 font-normal">{req.tenant?.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-700 font-bold">{req.bankName}</div>
                      <div className="text-[10px] text-slate-450 font-mono font-normal">No: {req.accountNumber}</div>
                      <span className="text-[9px] text-slate-400 font-normal">An: {req.accountName}</span>
                    </td>
                    <td className="p-4 text-slate-800 font-extrabold">{formatCurrency(req.amount)}</td>
                    <td className="p-4 text-slate-450">{formatCurrency(req.fee)}</td>
                    <td className="p-4 text-indigo-700 font-black">{formatCurrency(req.netAmount)}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-extrabold tracking-wide border uppercase ${getStatusColor(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="inline-flex items-center justify-center p-1.5 border border-slate-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {req.status === 'PENDING' && (
                        <>
                          <button
                            disabled={processingId === req.id}
                            onClick={() => handleApprove(req.id)}
                            className="inline-flex items-center justify-center p-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-650 hover:bg-indigo-600 hover:text-white transition cursor-pointer disabled:opacity-50"
                            title="Approve & Send to Transfer Queue"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={processingId === req.id}
                            onClick={() => setShowRejectModal(req.id)}
                            className="inline-flex items-center justify-center p-1.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition cursor-pointer disabled:opacity-50"
                            title="Reject Request"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {req.status === 'APPROVED' && (
                        <button
                          onClick={() => setShowPayModal(req.id)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] uppercase shadow-xs transition cursor-pointer flex items-center gap-1 inline-flex"
                        >
                          <CreditCard className="w-3 h-3" /> Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details & Actions Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Withdrawal Request Details</span>
                <h3 className="font-bold text-base text-slate-800 font-display mt-0.5">ID: {selectedRequest.id.slice(0, 13)}...</h3>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-50 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2.5">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Tenant Identity</span>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-700">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-800">{selectedRequest.tenant?.name}</h5>
                    <p className="text-[10px] text-slate-450 font-normal">{selectedRequest.tenant?.email}</p>
                  </div>
                </div>
                <div className="border-t border-slate-200/50 pt-2 flex justify-between items-center text-[10px]">
                  <span className="text-slate-450 font-normal">Current User Credits Balance:</span>
                  <strong className="text-indigo-950 font-extrabold">{formatCurrency(selectedRequest.tenant?.credits || 0)}</strong>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 block uppercase font-bold">Requested At</span>
                <p className="font-bold text-slate-800">{new Date(selectedRequest.requestedAt).toLocaleString()}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 block uppercase font-bold">Status Code</span>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold border uppercase ${getStatusColor(selectedRequest.status)}`}>
                  {selectedRequest.status}
                </span>
              </div>

              <div className="col-span-2 bg-indigo-50/35 p-4 rounded-2xl border border-indigo-100/30 grid grid-cols-2 gap-3.5">
                <div className="col-span-2">
                  <span className="text-[10px] font-bold text-indigo-950 uppercase tracking-widest block">Destination Payee Bank Profile</span>
                </div>
                <div>
                  <span className="text-[9px] text-indigo-900 block font-normal">Bank Institution</span>
                  <strong className="text-slate-800 font-extrabold">{selectedRequest.bankName}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-indigo-900 block font-normal">Account Number</span>
                  <strong className="text-slate-800 font-mono tracking-wider font-extrabold">{selectedRequest.accountNumber}</strong>
                </div>
                <div className="col-span-2 border-t border-indigo-150/45 pt-2">
                  <span className="text-[9px] text-indigo-900 block font-normal">Account Holder Name</span>
                  <strong className="text-slate-800 block uppercase font-extrabold">{selectedRequest.accountName}</strong>
                </div>
              </div>

              <div className="col-span-2 space-y-1 border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-normal">Requested Amount:</span>
                  <strong className="text-slate-800 text-sm">{formatCurrency(selectedRequest.amount)}</strong>
                </div>
                <div className="flex justify-between items-center text-slate-450">
                  <span className="font-normal">System Admin Fee (Fixed BCA Interbank):</span>
                  <span>{formatCurrency(selectedRequest.fee)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-dashed pt-2 text-sm mt-1.5">
                  <span className="font-bold text-indigo-950">Net Transfer Amount:</span>
                  <strong className="font-black text-emerald-650 font-display text-base">{formatCurrency(selectedRequest.netAmount)}</strong>
                </div>
              </div>

              {selectedRequest.referenceNumber && (
                <div className="col-span-2 bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-emerald-800 flex gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] block font-bold uppercase tracking-wider">Payment Sent (PAID)</span>
                    <p className="font-mono text-xs font-bold leading-none">Receipt Ref: {selectedRequest.referenceNumber}</p>
                    {selectedRequest.paidAt && (
                      <span className="text-[9px] font-normal text-emerald-600 block">At: {new Date(selectedRequest.paidAt).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              )}

              {selectedRequest.notes && (
                <div className="col-span-2 bg-slate-50 p-3 rounded-xl border flex gap-1.5">
                  <FileText className="w-4 h-4 text-slate-550 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] block font-bold text-slate-400 uppercase tracking-widest">Internal Admin Notes / Reasons</span>
                    <p className="text-slate-650 leading-relaxed font-semibold">{selectedRequest.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Details controls actions */}
            <div className="flex gap-2 justify-end border-t border-slate-100 pt-4">
              <button 
                type="button" 
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2.5 hover:bg-slate-100 rounded-xl font-bold text-xs text-slate-500 cursor-pointer"
              >
                Close View
              </button>

              {selectedRequest.status === 'PENDING' && (
                <>
                  <button 
                    disabled={processingId === selectedRequest.id}
                    onClick={() => {
                      handleApprove(selectedRequest.id);
                    }}
                    className="px-4 py-2.5 bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
                  >
                    Approve
                  </button>
                  <button 
                    disabled={processingId === selectedRequest.id}
                    onClick={() => {
                      setShowRejectModal(selectedRequest.id);
                    }}
                    className="px-4 py-2.5 border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Reject
                  </button>
                </>
              )}

              {selectedRequest.status === 'APPROVED' && (
                <button 
                  onClick={() => {
                    setShowPayModal(selectedRequest.id);
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <CreditCard className="w-4.5 h-4.5" /> Mark as Paid (Deduct Balance)
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Reject notes modal dialog */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <form onSubmit={handleRejectSubmit} className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-100 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-rose-700 flex items-center gap-1.5">
              <XCircle className="w-5 h-5 animate-pulse" /> Decline Withdrawal Request
            </h3>
            <p className="text-[11px] text-slate-450 font-normal leading-relaxed">
              Please enter the decline reason. The tenant will receive a system notification explaining this outcome.
            </p>
            <textarea
              required
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g., Bank details incorrect, or insufficient actual processed booking transactions to match balance request."
              className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-slate-50 min-h-[90px] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-700"
            />
            <div className="flex gap-2 justify-end">
              <button 
                type="button" 
                onClick={() => { setShowRejectModal(null); setRejectReason(''); }}
                className="px-4 py-2 hover:bg-slate-100 rounded-xl font-bold text-xs text-slate-500 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={processingId === showRejectModal}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-750 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
              >
                Submit Decline
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pay modal dialog */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <form onSubmit={handlePaySubmit} className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-100 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-emerald-700 flex items-center gap-1.5">
              <CheckCircle className="w-5 h-5" /> Reconcile Payout (Mark Paid)
            </h3>
            <p className="text-[11px] text-slate-450 font-normal leading-relaxed">
              Please input the bank transfer reference or transaction ID. Confirming this action will **permanently deduct** Rp {formatCurrency(requests.find(r => r.id === showPayModal)?.amount || 0)} from the partner's credits.
            </p>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Transfer Ref Number</label>
              <input
                required
                type="text"
                value={refNumber}
                onChange={e => setRefNumber(e.target.value)}
                placeholder="e.g., BCA-TRF-931084132"
                className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono tracking-wider text-slate-800 font-extrabold"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button 
                type="button" 
                onClick={() => { setShowPayModal(null); setRefNumber(''); }}
                className="px-4 py-2 hover:bg-slate-100 rounded-xl font-bold text-xs text-slate-500 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={processingId === showPayModal || !refNumber.trim()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
              >
                Confirm Payout
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
