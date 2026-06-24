import React, { useState } from 'react';
import { Search, ShieldCheck, Ban, CheckCircle, Store, Building, DollarSign } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  status: 'ACTIVE' | 'SUSPENDED';
  propertyCount: number;
  revenueGenerated: number;
  companyName: string;
}

interface TenantManagementProps {
  tenants: Tenant[];
  onUpdateTenantStatus: (tenantId: string, isVerified: boolean) => Promise<void>;
  onSuspendTenant: (tenantId: string, suspend: boolean) => Promise<void>;
}

export default function TenantManagement({ tenants, onUpdateTenantStatus, onSuspendTenant }: TenantManagementProps) {
  const [search, setSearch] = useState('');

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.email.toLowerCase().includes(search.toLowerCase()) ||
    t.companyName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6" id="tenant-management-container">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900" id="tenant-heading">Tenant & Host Accounts</h2>
        <p className="mt-1 text-sm text-gray-500" id="tenant-subheading">Oversee legal hosts, verify business profiles, and monitor revenue payouts.</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-xs" id="tenant-filters-bar">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input 
            id="tenant-search-input"
            type="text" 
            placeholder="Search host, company name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-gray-50"
          />
        </div>
      </div>

      {/* Hosts Table */}
      <div className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-xs" id="tenants-table-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left" id="tenants-table">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-6 py-4">Host Company Details</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Verification</th>
                <th className="px-6 py-4 text-center">Properties Owned</th>
                <th className="px-6 py-4 text-right">Revenue Generated</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm" id="tenants-table-body">
              {filteredTenants.length === 0 ? (
                <tr id="empty-tenant-row">
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No hosts matches selected filters.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => {
                  const isSuspended = t.status === 'SUSPENDED';
                  return (
                    <tr key={t.id} className="hover:bg-gray-50/40 transition-colors" id={`tenant-row-${t.id}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600 shrink-0">
                            <Store className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{t.name}</p>
                            <p className="text-xs text-indigo-600 font-medium">{t.companyName}</p>
                            <p className="text-xs text-gray-400">{t.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isSuspended ? 'bg-red-100 text-red-00 text-red-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${isSuspended ? 'bg-red-500' : 'bg-emerald-500'}`} />
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {t.isVerified ? (
                          <span className="text-emerald-600 flex items-center gap-1 text-xs font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg">
                            <ShieldCheck className="h-4 w-4" /> Approved Agent
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs">Pending Agent Profile</span>
                            <button 
                              onClick={() => onUpdateTenantStatus(t.id, true)}
                              className="text-xs text-indigo-600 hover:underline font-bold"
                            >
                              Approve
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-gray-750 text-gray-700">
                        <span className="flex items-center justify-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded-md w-fit mx-auto">
                          <Building className="h-3 w.5 h-3 w-3 text-gray-400" />
                          {t.propertyCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-gray-900 flex items-center justify-end text-sm gap-0.5">
                          <DollarSign className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          {Math.round(t.revenueGenerated).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {!t.isVerified && (
                            <button 
                              onClick={() => onUpdateTenantStatus(t.id, true)}
                              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-xs"
                            >
                              Approve Host
                            </button>
                          )}
                          <button 
                            onClick={() => onSuspendTenant(t.id, !isSuspended)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1 transition ${
                              isSuspended ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-110' : 'bg-red-50 text-red-700 hover:bg-red-110'
                            }`}
                          >
                            <Ban className="h-3.5 w-3.5" />
                            {isSuspended ? 'Reactivate Host' : 'Suspend Host'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
