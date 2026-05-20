import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { Config } from '../../types';
import { toast } from 'sonner';
import { Phone, Save, Loader2 } from 'lucide-react';

export function SettingsAdmin() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await apiService.getConfig();
      setConfig(data);
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    
    try {
      await apiService.updateConfig(config);
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;
  }

  return (
    <div className="max-w-xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900 leading-tight">Store Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Manage global configuration for your store.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            WhatsApp Number
          </label>
          <p className="text-xs text-gray-500 mb-3">Include the country code without any + or spaces (e.g., 919876543210 for India).</p>
          <div className="relative">
            <input
              type="text"
              required
              value={config?.ownerWhatsAppNumber || ''}
              onChange={(e) => setConfig(prev => prev ? { ...prev, ownerWhatsAppNumber: e.target.value } : null)}
              className="block w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium transition-colors"
            />
            <Phone className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-shop-gray text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-colors flex items-center gap-2 disabled:opacity-50 w-full sm:w-auto justify-center uppercase tracking-wide text-sm"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Settings
        </button>
      </form>
    </div>
  );
}
