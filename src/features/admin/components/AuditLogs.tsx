import React, { useState } from 'react';
import { Terminal, Shield, Clock, Search, RotateCcw } from 'lucide-react';

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
}

interface AuditLogsProps {
  logs: AuditLog[];
  onRefresh: () => void;
}

export default function AuditLogs({ logs, onRefresh }: AuditLogsProps) {
  const [search, setSearch] = useState('');
  const [activeLogTab, setActiveLogTab] = useState<'audit' | 'user' | 'system'>('audit');

  const filteredLogs = logs.filter(l => {
    const matchesSearch = 
      l.userName.toLowerCase().includes(search.toLowerCase()) || 
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.module.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    const mod = l.module.toUpperCase();
    if (activeLogTab === 'audit') {
      return mod === 'SETTINGS' || mod === 'SYSTEM' || mod === 'COMPLIANCE' || mod === '';
    }
    if (activeLogTab === 'user') {
      return mod === 'USER' || mod === 'TENANT' || mod === 'AUTH';
    }
    if (activeLogTab === 'system') {
      return mod !== 'USER' && mod !== 'TENANT' && mod !== 'SETTINGS' && mod !== 'SYSTEM' && mod !== 'AUTH';
    }
    return true;
  });

  return (
    <div className="space-y-6" id="audit-logs-container">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900" id="audit-heading">Audit & Activity Trail</h2>
          <p className="mt-1 text-sm text-gray-500" id="audit-subheading">Chronological records of administrative modifications, user transactions, and key background processes.</p>
        </div>
        <button 
          id="btn-audit-refresh"
          onClick={onRefresh}
          className="bg-gray-100 hover:bg-gray-200 text-gray-750 text-gray-700 px-3.5 py-2 font-semibold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition"
        >
          <RotateCcw className="h-4 w-4" /> Refresh Trail
        </button>
      </div>

      {/* Navigation Tabs Switcher */}
      <div className="flex border-b border-gray-200" id="activity-log-tabs">
        <button
          onClick={() => setActiveLogTab('audit')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 ${
            activeLogTab === 'audit'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
          id="btn-tab-audit-logs"
        >
          Audit Logs
        </button>
        <button
          onClick={() => setActiveLogTab('user')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 ${
            activeLogTab === 'user'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
          id="btn-tab-user-activity"
        >
          User Activity
        </button>
        <button
          onClick={() => setActiveLogTab('system')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 ${
            activeLogTab === 'system'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
          id="btn-tab-system-activity"
        >
          System Activity
        </button>
      </div>

      {/* Searching */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-xs" id="audit-filters-bar">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input 
            id="audit-search-input"
            type="text" 
            placeholder="Search action, administrator, modules..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-gray-50"
          />
        </div>
      </div>

      {/* Terminal Board style trail */}
      <div className="bg-gray-900 text-gray-100 rounded-2xl p-6 shadow-xl font-mono text-xs overflow-hidden border border-gray-800" id="audit-trail-terminal">
        <div className="border-b border-gray-800 pb-4 mb-4 flex items-center justify-between text-gray-400">
          <span className="flex items-center gap-2 font-bold text-gray-300">
            <Terminal className="h-4 w-4 text-emerald-500" /> STA_COMPLIANCE_ENGINE_v2.0
          </span>
          <span id="logs-count">{filteredLogs.length} LOGS RETRIEVED</span>
        </div>

        <div className="space-y-4 max-h-[55vh] overflow-y-auto divide-y divide-gray-800/60 scrollbar-thin scrollbar-thumb-gray-800" id="terminal-logs-scroller">
          {filteredLogs.length === 0 ? (
            <div className="text-gray-500 text-center py-12" id="empty-audit-logs">
              --- NO LOGGED MODIFICATIONS FOUND IN CENTRAL SYSTEM ---
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="pt-3 first:pt-0 hover:bg-white/2 transition-colors pr-2 space-y-1" id={`audit-log-item-${log.id}`}>
                <div className="flex flex-wrap items-center justify-between gap-1 text-gray-400">
                  <span className="text-gray-500 font-medium">[{new Date(log.timestamp).toLocaleString()}]</span>
                  <span className="text-emerald-400 font-bold uppercase">{log.action}</span>
                  <span className="text-indigo-400 font-bold">[{log.module}]</span>
                  <span className="text-gray-300 font-medium ml-auto flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-sm">
                    <Shield className="h-3 w-3 text-indigo-400" />
                    {log.userName}
                  </span>
                </div>
                <p className="text-gray-300 leading-relaxed pl-4 border-l border-gray-800 mt-1">{log.details}</p>
                <p className="text-[10px] text-gray-600 pl-4">{log.userId}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
