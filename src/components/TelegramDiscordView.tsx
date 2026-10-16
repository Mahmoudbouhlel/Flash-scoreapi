import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, AlertCircle, Bot, Sliders, MessageSquare } from 'lucide-react';

export const TelegramDiscordView: React.FC = () => {
  const [settings, setSettings] = useState<any>({
    telegram_enabled: false,
    telegram_bot_token: '',
    telegram_chat_id: '',
    discord_enabled: false,
    discord_webhook_url: '',
    min_confidence_threshold: 0.70,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/v2/live/automation/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSettings((prev: any) => ({
              ...prev,
              ...data.settings,
              telegram_bot_token: data.settings.telegram_bot_token ?? data.settings.telegram_token ?? prev.telegram_bot_token ?? '',
              telegram_chat_id: data.settings.telegram_chat_id ?? prev.telegram_chat_id ?? '',
              discord_webhook_url: data.settings.discord_webhook_url ?? prev.discord_webhook_url ?? '',
              min_confidence_threshold: data.settings.min_confidence_threshold ?? data.settings.min_prob ?? prev.min_confidence_threshold ?? 0.70,
            }));
          }
        }
      } catch (err) {
        console.warn('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setSaveStatus('Saving...');
    try {
      const res = await fetch('/api/v2/live/automation/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaveStatus('Settings Saved Successfully!');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('Save Failed');
      }
    } catch (err) {
      setSaveStatus('Error saving settings');
    }
  };

  const handleTestAlert = async (destination: 'telegram' | 'discord') => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/v2/live/automation/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, config: settings }),
      });

      if (res.ok) {
        const data = await res.json();
        setTestResult(data);
      }
    } catch (err) {
      setTestResult({ error: 'Test execution error' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Telegram &amp; Discord Automation Hub</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure automated instant dispatchers for qualified pre-match picks and live prediction signals.
          </p>
        </div>

        {saveStatus && (
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
            {saveStatus}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Telegram Configuration */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Send className="w-4 h-4 text-sky-400" /> Telegram Bot Dispatcher
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!!settings.telegram_enabled}
                onChange={(e) => setSettings({ ...settings, telegram_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Telegram Bot Token</label>
              <input
                type="text"
                value={settings.telegram_bot_token ?? ''}
                onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })}
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyZ"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/50"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Telegram Chat / Channel ID</label>
              <input
                type="text"
                value={settings.telegram_chat_id ?? ''}
                onChange={(e) => setSettings({ ...settings, telegram_chat_id: e.target.value })}
                placeholder="-1001234567890"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/50"
              />
            </div>

            <button
              onClick={() => handleTestAlert('telegram')}
              disabled={isTesting}
              className="w-full py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isTesting ? 'Sending Test Telegram Alert...' : 'Send Test Telegram Alert'}
            </button>
          </div>
        </div>

        {/* Discord Configuration */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <MessageSquare className="w-4 h-4 text-indigo-400" /> Discord Webhook Dispatcher
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!!settings.discord_enabled}
                onChange={(e) => setSettings({ ...settings, discord_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Discord Webhook URL</label>
              <input
                type="text"
                value={settings.discord_webhook_url ?? ''}
                onChange={(e) => setSettings({ ...settings, discord_webhook_url: e.target.value })}
                placeholder="https://discord.com/api/webhooks/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Min Alert Confidence: {((settings.min_confidence_threshold ?? 0.70) * 100).toFixed(0)}%</label>
              <input
                type="range"
                min="0.50"
                max="0.90"
                step="0.05"
                value={settings.min_confidence_threshold ?? 0.70}
                onChange={(e) => setSettings({ ...settings, min_confidence_threshold: parseFloat(e.target.value) || 0.70 })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <button
              onClick={() => handleTestAlert('discord')}
              disabled={isTesting}
              className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isTesting ? 'Sending Test Discord Alert...' : 'Send Test Discord Alert'}
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
        >
          SAVE ALL AUTOMATION SETTINGS
        </button>
      </div>

      {/* Test Results Banner */}
      {testResult && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs space-y-1">
          <div className="font-bold text-white flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Alert Dispatch Log
          </div>
          <pre className="bg-slate-950 p-3 rounded-lg text-emerald-300 font-mono text-[11px] overflow-x-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
