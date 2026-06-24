import React, { useState } from 'react';
import { Send, Bell, User, Users, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';

interface NotificationCenterProps {
  onBroadcast: (title: string, message: string, target: string) => Promise<void>;
  registeredUsers: { id: string; name: string; email: string; role: string }[];
}

export default function NotificationCenter({ onBroadcast, registeredUsers }: NotificationCenterProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState('ALL'); // ALL, TENANTS, SPECIFIC
  const [selectedUser, setSelectedUser] = useState('');
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    
    setSending(true);
    setSentSuccess(false);

    try {
      const finalTarget = targetType === 'SPECIFIC' ? selectedUser : targetType;
      if (targetType === 'SPECIFIC' && !selectedUser) {
        alert('Please specify a recipient user.');
        setSending(false);
        return;
      }
      
      await onBroadcast(title, message, finalTarget);
      setTitle('');
      setMessage('');
      setSentSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch broadcast');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6" id="notification-center-container">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900" id="notification-heading">Broadcast Hub</h2>
        <p className="mt-1 text-sm text-gray-500" id="notification-subheading">Compose and dispatch custom system-wide push messages and email reports.</p>
      </div>

      {/* Forms box */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden" id="notification-card">
        <div className="bg-indigo-600 px-6 py-5 flex items-center gap-3 text-white">
          <div className="bg-white/10 rounded-lg p-2">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold">New Notification Announcement</h3>
            <p className="text-xs text-indigo-100 mt-0.5">Draft a message which will instantly display inside recipient inbox trays.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5" id="broadcast-form">
          {sentSuccess && (
            <div className="bg-emerald-50 border border-emerald-150 text-emerald-850 rounded-xl p-4 flex items-center gap-3 text-sm" id="success-alert">
              <Sparkles className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>Broadcast has been pushed to target audiences successfully.</span>
            </div>
          )}

          {/* Target Group */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Dissemination Target</label>
            <div className="grid grid-cols-3 gap-3">
              <button 
                type="button"
                id="btn-target-all"
                onClick={() => { setTargetType('ALL'); setSentSuccess(false); }}
                className={`py-3 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                  targetType === 'ALL' 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-800' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-650 text-gray-600'
                }`}
              >
                <Users className="h-5 w-5" /> All Users
              </button>

              <button 
                type="button"
                id="btn-target-tenants"
                onClick={() => { setTargetType('TENANTS'); setSentSuccess(false); }}
                className={`py-3 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                  targetType === 'TENANTS' 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-800' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-650 text-gray-650 text-gray-600'
                }`}
              >
                <ShieldAlert className="h-5 w-5" /> Hosts / Tenants
              </button>

              <button 
                type="button"
                id="btn-target-specific"
                onClick={() => { setTargetType('SPECIFIC'); setSentSuccess(false); }}
                className={`py-3 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                  targetType === 'SPECIFIC' 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-800' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-650 text-gray-600'
                }`}
              >
                <User className="h-5 w-5" /> Specific User
              </button>
            </div>
          </div>

          {/* Specific user selection dropdown */}
          {targetType === 'SPECIFIC' && (
            <div className="space-y-2 select-container animate-in slide-in-from-top-2 duration-100">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Recipient User</label>
              <select 
                id="specific-user-select"
                value={selectedUser}
                onChange={(e) => { setSelectedUser(e.target.value); setSentSuccess(false); }}
                required
                className="w-full text-sm border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Choose registered account --</option>
                {registeredUsers.map(ru => (
                  <option key={ru.id} value={ru.id}>
                    {ru.name} ({ru.email}) - {ru.role}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Message Header</label>
            <input 
              id="broadcast-title"
              type="text" 
              placeholder="E.g. System upgrade complete or New promo code inside!"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setSentSuccess(false); }}
              required
              className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 bg-gray-50"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Announcement Content</label>
            <textarea 
              id="broadcast-message"
              placeholder="Enter detailed broadcast messages..."
              rows={4}
              value={message}
              onChange={(e) => { setMessage(e.target.value); setSentSuccess(false); }}
              required
              className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-gray-700"
            />
          </div>

          <button 
            id="btn-broadcast-submit"
            type="submit" 
            disabled={sending}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="h-4.5 w-4.5" />
            {sending ? 'Dispatching Broadcast...' : 'Publish Announcement'}
          </button>
        </form>
      </div>
    </div>
  );
}
