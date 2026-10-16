import React, { useState } from 'react';
import { Settings, Sliders, Shield, Save, RotateCcw, Check } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [minOdds, setMinOdds] = useState<number>(1.3);
  const [maxOdds, setMaxOdds] = useState<number>(5.0);
  const [minEV, setMinEV] = useState<number>(3.0);
  const [minProb, setMinProb] = useState<number>(65);
  const [autoSettle, setAutoSettle] = useState<boolean>(true);
  const [saved, setSaved] = useState<boolean>(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setMinOdds(1.3);
    setMaxOdds(5.0);
    setMinEV(3.0);
    setMinProb(65);
    setAutoSettle(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">System Configuration &amp; Risk Parameters</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Global threshold controls for Daily Top 5 pick qualification, odds boundaries, and model expected value gating.
          </p>
        </div>

        {saved && (
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Saved!
          </span>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-2">
            <label className="text-slate-300 font-bold block">
              Minimum Odds Threshold: <span className="text-emerald-400 font-mono">{(minOdds ?? 1.3).toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="1.20"
              max="1.80"
              step="0.05"
              value={minOdds ?? 1.3}
              onChange={(e) => setMinOdds(parseFloat(e.target.value) || 1.3)}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Strictly enforced lower limit for decimal bookmaker odds. Odds below this threshold are rejected.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-slate-300 font-bold block">
              Maximum Odds Ceiling: <span className="text-emerald-400 font-mono">{(maxOdds ?? 5.0).toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="3.00"
              max="8.00"
              step="0.50"
              value={maxOdds ?? 5.0}
              onChange={(e) => setMaxOdds(parseFloat(e.target.value) || 5.0)}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Upper bound for selection odds to cap portfolio volatility.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-slate-300 font-bold block">
              Minimum Expected Value Edge (EV %): <span className="text-emerald-400 font-mono">+{(minEV ?? 3.0).toFixed(1)}%</span>
            </label>
            <input
              type="range"
              min="1.0"
              max="8.0"
              step="0.5"
              value={minEV ?? 3.0}
              onChange={(e) => setMinEV(parseFloat(e.target.value) || 3.0)}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Required positive statistical edge vs verified bookmaker implied probability.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-slate-300 font-bold block">
              Minimum Model Probability: <span className="text-emerald-400 font-mono">{minProb ?? 65}%</span>
            </label>
            <input
              type="range"
              min="50"
              max="80"
              step="5"
              value={minProb ?? 65}
              onChange={(e) => setMinProb(parseInt(e.target.value, 10) || 65)}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Calibrated multi-model ensemble probability required to qualify.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!!autoSettle}
                onChange={(e) => setAutoSettle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
            <span className="font-bold text-white">Enable Automated Match Result Settlement Worker</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
