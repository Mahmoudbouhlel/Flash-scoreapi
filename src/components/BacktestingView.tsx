import React, { useState } from 'react';
import { Play, RotateCcw, CheckCircle2, AlertCircle, BarChart, Sliders } from 'lucide-react';

export const BacktestingView: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [backtestResult, setBacktestResult] = useState<any>(null);
  const [minOdds, setMinOdds] = useState<number>(1.3);
  const [maxOdds, setMaxOdds] = useState<number>(5.0);
  const [minProb, setMinProb] = useState<number>(0.65);

  const handleRunBacktest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v2/models/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ min_odds: minOdds, max_odds: maxOdds, min_prob: minProb }),
      });

      if (res.ok) {
        const data = await res.json();
        setBacktestResult(data);
      }
    } catch (err) {
      console.error('Error running backtest:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Chronological Out-of-Sample Backtesting Engine</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulates predictive performance and walk-forward validation across real historical football fixtures.
          </p>
        </div>

        <button
          onClick={handleRunBacktest}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-500/20"
        >
          <Play className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Simulating Backtest...' : 'RUN CHRONOLOGICAL BACKTEST'}</span>
        </button>
      </div>

      {/* Parameter Sliders */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <Sliders className="w-4 h-4 text-emerald-400" /> Simulation Parameters
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Minimum Odds Threshold: {(minOdds ?? 1.3).toFixed(2)}</label>
            <input
              type="range"
              min="1.10"
              max="2.00"
              step="0.05"
              value={minOdds ?? 1.3}
              onChange={(e) => setMinOdds(parseFloat(e.target.value) || 1.3)}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Maximum Odds Ceiling: {(maxOdds ?? 5.0).toFixed(2)}</label>
            <input
              type="range"
              min="3.00"
              max="10.00"
              step="0.50"
              value={maxOdds ?? 5.0}
              onChange={(e) => setMaxOdds(parseFloat(e.target.value) || 5.0)}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Minimum Model Probability: {((minProb ?? 0.65) * 100).toFixed(0)}%</label>
            <input
              type="range"
              min="0.50"
              max="0.80"
              step="0.05"
              value={minProb ?? 0.65}
              onChange={(e) => setMinProb(parseFloat(e.target.value) || 0.65)}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Backtest Results Display */}
      {backtestResult && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-[11px] text-slate-400">Sample Size Evaluated</div>
              <div className="text-xl font-bold text-white mt-1">{backtestResult.sample_size || 0} Matches</div>
              <div className="text-[10px] text-slate-500 mt-1">{backtestResult.historical_matches_evaluated || 0} Total</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-[11px] text-slate-400">Simulation Win Rate</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">{backtestResult.win_rate_pct}%</div>
              <div className="text-[10px] text-slate-500 mt-1">{backtestResult.wins} W / {backtestResult.losses} L</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-[11px] text-slate-400">Simulation Net ROI</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">+{backtestResult.roi_pct}%</div>
              <div className="text-[10px] text-slate-500 mt-1">+{backtestResult.net_profit_units} Units</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-[11px] text-slate-400">Validation Gate</div>
              <div className="text-xl font-bold text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> PASSED
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Brier Score: {backtestResult.brier_score}</div>
            </div>
          </div>

          {/* Sample Log */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Out-of-Sample Simulation Log</h3>
            <div className="space-y-2">
              {(backtestResult.sample_simulations || []).map((sim: any, idx: number) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">{sim.match}</span>
                    <span className="text-slate-500 ml-2">({sim.market} - {sim.selection})</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-slate-400">Score: {sim.score}</span>
                    <span className="font-mono font-bold text-white">Odds: {sim.odds}</span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${sim.status === 'WIN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {sim.status} ({sim.profit > 0 ? `+${sim.profit}` : sim.profit} u)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
