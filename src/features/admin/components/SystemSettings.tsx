import React, { useState } from 'react';
import { Save, Settings, ToggleLeft, ToggleRight, Sparkles, Building, Percent, ShieldAlert } from 'lucide-react';

interface SystemSettings {
  platformName: string;
  logo: string;
  contactEmail: string;
  currency: string;
  taxPercentage: number;
  commissionPercentage: number;
  maintenanceMode: boolean;
}

interface SystemSettingsProps {
  settings: SystemSettings;
  onUpdateSettings: (settings: Partial<SystemSettings>) => Promise<void>;
}

export default function SystemSettings({ settings, onUpdateSettings }: SystemSettingsProps) {
  const [name, setName] = useState(settings.platformName);
  const [logo, setLogo] = useState(settings.logo);
  const [email, setEmail] = useState(settings.contactEmail);
  const [currency, setCurrency] = useState(settings.currency);
  const [tax, setTax] = useState(settings.taxPercentage);
  const [comm, setComm] = useState(settings.commissionPercentage);
  const [maint, setMaint] = useState(settings.maintenanceMode);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      await onUpdateSettings({
        platformName: name,
        logo,
        contactEmail: email,
        currency,
        taxPercentage: Number(tax),
        commissionPercentage: Number(comm),
        maintenanceMode: maint
      });
      setSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Settings failure');
    } finally {
      setSaving(false);
    }
  };

  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'security' | 'branding' | 'maintenance' | 'notifications'>('general');

  // Security variables
  const [minPasswordLength, setMinPasswordLength] = useState(10);
  const [requireSpecialChar, setRequireSpecialChar] = useState(true);
  const [ipWhitelist, setIpWhitelist] = useState('0.0.0.0/0');

  // Notifications variables
  const [notifyOnBooking, setNotifyOnBooking] = useState(true);
  const [notifyOnPayout, setNotifyOnPayout] = useState(true);

  // Branding variables
  const [accentColor, setAccentColor] = useState('#4f46e5');

  // Maintenance variable
  const [maintenanceText, setMaintenanceText] = useState('StayEase system upgrades are in progress. Service will resume shortly.');

  return (
    <div className="max-w-2xl mx-auto space-y-6" id="system-settings-container">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900" id="settings-heading">Platform System Settings</h2>
        <p className="mt-1 text-sm text-gray-500" id="settings-subheading">Manage global financial rules, security overrides, branding templates, or trigger maintenance modes.</p>
      </div>

      {/* Horizontal Tabs Selection bar */}
      <div className="flex border-b border-gray-200" id="settings-tabs">
        <button
          type="button"
          onClick={() => setActiveSettingsTab('general')}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 ${
            activeSettingsTab === 'general'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
          id="btn-settings-general"
        >
          General
        </button>
        <button
          type="button"
          onClick={() => setActiveSettingsTab('security')}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 ${
            activeSettingsTab === 'security'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
          id="btn-settings-security"
        >
          Security
        </button>
        <button
          type="button"
          onClick={() => setActiveSettingsTab('branding')}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 ${
            activeSettingsTab === 'branding'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
          id="btn-settings-branding"
        >
          Branding
        </button>
        <button
          type="button"
          onClick={() => setActiveSettingsTab('maintenance')}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 ${
            activeSettingsTab === 'maintenance'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
          id="btn-settings-maintenance"
        >
          Maintenance
        </button>
        <button
          type="button"
          onClick={() => setActiveSettingsTab('notifications')}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 ${
            activeSettingsTab === 'notifications'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
          id="btn-settings-notifications"
        >
          Notifications
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden" id="settings-card">
        {/* Banner header */}
        <div className="bg-indigo-600 px-6 py-5 flex items-center gap-3 text-white">
          <div className="bg-white/10 rounded-lg p-2">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold uppercase text-xs tracking-wider">
              {activeSettingsTab} Settings Segment
            </h3>
            <p className="text-xs text-indigo-100">
              {activeSettingsTab === 'general' && 'Adjust currency, tax splits, platform commissions, and core support configs.'}
              {activeSettingsTab === 'security' && 'Define password security rules, IP address overrides, and account compliance levels.'}
              {activeSettingsTab === 'branding' && 'Customize brand assets, product logos, layout parameters, and styles.'}
              {activeSettingsTab === 'maintenance' && 'Switch server access rules or issue scheduling broadcasts.'}
              {activeSettingsTab === 'notifications' && 'Update email trigger presets, Slack alerts, or manual notifications.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="p-6 space-y-5" id="settings-form">
          {success && (
            <div className="bg-emerald-50 border border-emerald-150 text-emerald-850 rounded-xl p-4 flex items-center gap-3 text-sm" id="success-settings-alert">
              <Sparkles className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>Platform variables updated successfully. Changes applied in real-time.</span>
            </div>
          )}

          {/* TAB 1: General Settings */}
          {activeSettingsTab === 'general' && (
            <div className="space-y-4" id="pane-settings-general">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Support Contact Email</label>
                  <input 
                    id="setting-contact-email"
                    type="email" 
                    value={email} 
                    onChange={(e) => { setEmail(e.target.value); setSuccess(false); }}
                    required
                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-gray-800"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Building className="h-3.5 w-3.5 text-gray-450" /> Currency Symbol
                  </label>
                  <select 
                    id="setting-currency"
                    value={currency}
                    onChange={(e) => { setCurrency(e.target.value); setSuccess(false); }}
                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 bg-gray-50 text-gray-800"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="IDR">IDR (Rp)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-150 border-gray-100">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5 text-gray-450" /> Vat / Tax (%)
                  </label>
                  <input 
                    id="setting-tax"
                    type="number" 
                    min={0}
                    max={100}
                    value={tax} 
                    onChange={(e) => { setTax(Number(e.target.value)); setSuccess(false); }}
                    required
                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-gray-800"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5 text-gray-455" /> Commission Fee (%)
                  </label>
                  <input 
                    id="setting-commission"
                    type="number" 
                    min={0}
                    max={100}
                    value={comm} 
                    onChange={(e) => { setComm(Number(e.target.value)); setSuccess(false); }}
                    required
                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-gray-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Security Settings */}
          {activeSettingsTab === 'security' && (
            <div className="space-y-4" id="pane-settings-security">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Min Password Length</label>
                  <input 
                    id="setting-min-password"
                    type="number" 
                    min={6}
                    max={32}
                    value={minPasswordLength} 
                    onChange={(e) => { setMinPasswordLength(Number(e.target.value)); setSuccess(false); }}
                    required
                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-gray-800"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Required Characters</label>
                  <select 
                    id="setting-password-strength"
                    value={requireSpecialChar ? 'special' : 'alpha'}
                    onChange={(e) => { setRequireSpecialChar(e.target.value === 'special'); setSuccess(false); }}
                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 bg-gray-50 text-gray-800"
                  >
                    <option value="alpha">Alphanumeric Only</option>
                    <option value="special">Requires Numbers & Specials</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin IP Address restriction / whitelist</label>
                <input 
                  id="setting-ip-whiltelist"
                  type="text" 
                  value={ipWhitelist} 
                  onChange={(e) => { setIpWhitelist(e.target.value); setSuccess(false); }}
                  placeholder="e.g. 192.168.1.1/24"
                  className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-gray-800"
                />
              </div>
            </div>
          )}

          {/* TAB 3: Branding */}
          {activeSettingsTab === 'branding' && (
            <div className="space-y-4" id="pane-settings-branding">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Platform Brand Name</label>
                <input 
                  id="setting-platform-name"
                  type="text" 
                  value={name} 
                  onChange={(e) => { setName(e.target.value); setSuccess(false); }}
                  required
                  className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-gray-800 font-semibold"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">System Brand Logo Link (URL)</label>
                <input 
                  id="setting-logo-url"
                  type="url" 
                  value={logo} 
                  onChange={(e) => { setLogo(e.target.value); setSuccess(false); }}
                  required
                  className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-gray-700 font-mono"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Accent Theme Color</label>
                <input 
                  id="setting-accent-theme"
                  type="color" 
                  value={accentColor} 
                  onChange={(e) => { setAccentColor(e.target.value); setSuccess(false); }}
                  className="h-10 w-24 border border-gray-200 rounded-lg bg-gray-50"
                />
              </div>
            </div>
          )}

          {/* TAB 4: Maintenance */}
          {activeSettingsTab === 'maintenance' && (
            <div className="space-y-4" id="pane-settings-maintenance">
              <div className="flex items-center justify-between" id="maintenance-panel">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <ShieldAlert className="h-4.5 w-4.5 text-rose-500" /> Platform Maintenance Mode
                  </div>
                  <p className="text-xs text-gray-450">Toggling stops checkout transactions, reserving rooms, and registration requests.</p>
                </div>

                <button 
                  id="btn-setting-maintenance"
                  type="button"
                  onClick={() => { setMaint(!maint); setSuccess(false); }}
                  className="text-gray-400 focus:outline-hidden cursor-pointer"
                >
                  {maint ? (
                    <ToggleRight className="h-10 w-10 text-rose-500" />
                  ) : (
                    <ToggleLeft className="h-10 w-10 text-gray-300" />
                  )}
                </button>
              </div>

              {maint && (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Outage Announcement Message</label>
                  <textarea 
                    id="setting-maintenance-text"
                    rows={3}
                    value={maintenanceText}
                    onChange={(e) => { setMaintenanceText(e.target.value); setSuccess(false); }}
                    className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-gray-800"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Notifications */}
          {activeSettingsTab === 'notifications' && (
            <div className="space-y-4" id="pane-settings-notifications">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-gray-800">Email Alerts on New Bookings</div>
                  <p className="text-xs text-gray-400">Trigger real-time transactional alert mailers on guest reservations.</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setNotifyOnBooking(!notifyOnBooking); setSuccess(false); }}
                  className="text-gray-400 focus:outline-hidden cursor-pointer"
                >
                  {notifyOnBooking ? (
                    <ToggleRight className="h-10 w-10 text-indigo-600" />
                  ) : (
                    <ToggleLeft className="h-10 w-10 text-gray-300" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-gray-800">Payout Settlement Notifications</div>
                  <p className="text-xs text-gray-400">Alert administrators on verified payment ledger transfers and payouts.</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setNotifyOnPayout(!notifyOnPayout); setSuccess(false); }}
                  className="text-gray-400 focus:outline-hidden cursor-pointer"
                >
                  {notifyOnPayout ? (
                    <ToggleRight className="h-10 w-10 text-indigo-600" />
                  ) : (
                    <ToggleLeft className="h-10 w-10 text-gray-300" />
                  )}
                </button>
              </div>
            </div>
          )}

          <button 
            id="btn-settings-save"
            type="submit" 
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4 cursor-pointer"
          >
            <Save className="h-4.5 w-4.5" />
            {saving ? 'Updating Settings...' : 'Save Configuration Options'}
          </button>
        </form>
      </div>
    </div>
  );
}
