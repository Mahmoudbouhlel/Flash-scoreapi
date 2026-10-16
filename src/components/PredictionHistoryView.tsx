import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, Filter, TrendingUp, TrendingDown } from 'lucide-react';

export const PredictionHistoryView: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [engineFilter, setEngineFilter] = useState<string>('all');

  const fetchHistoryAndPerformance = async () => {
    setLoading(true);
    try {
      const [histRes, perfRes] = await Promise.all([
        fetch('/api/v2/predictions/history'),
        fetch('/api/v2/predictions/performance'),
      ]);

      if (histRes.ok) {
        const hData = await histRes.json();
        // Filter out empty slots
        const validPicks = (hData.history || []).filter(
          (p: any) => !p.is_empty_slot && p.selection !== 'EMPTY SLOT' && p.selection !== 'NO QUALIFIED PICK'
        );
        setHistory(validPicks);
      }

      if (perfRes.ok) {
        const pData = await perfRes.json();
        setPerformance(pData);
      }
    } catch (err) {
      console.warn('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryAndPerformance();
  }, []);

  const filteredHistory = history.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Verified Prediction Ledger &amp; ROI Analytics</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Audited performance tracking with flat 1-unit staking rules. Empty slots and unverified picks are strictly excluded from published metrics.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400">Total Published Picks</div>
          <div className="text-2xl font-black text-white mt-1">{performance.total_published || 0}</div>
          <div className="text-[10px] text-slate-500 mt-1">{performance.pending || 0} Pending</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400">Verified Win Rate</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{performance.win_rate_pct ? `${performance.win_rate_pct}%` : '0.0%'}</div>
          <div className="text-[10px] text-slate-500 mt-1">{performance.wins || 0}W / {performance.losses || 0}L</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400">Verified ROI</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{performance.roi_pct ? `+${performance.roi_pct}%` : '0.0%'}</div>
          <div className="text-[10px] text-slate-500 mt-1">Flat 1-Unit Stake</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400">Net Profit Units</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{performance.net_profit_units ? `+${performance.net_profit_units} u` : '0.0 u'}</div>
          <div className="text-[10px] text-slate-500 mt-1">Staked: {performance.total_staked_units || 0} u</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400">Avg Odds &amp; Max Drawdown</div>
          <div className="text-2xl font-black text-white mt-1">{performance.average_odds || '0.00'}</div>
          <div className="text-[10px] text-rose-400 mt-1">Max DD: -{performance.max_drawdown_units || 0} u</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs text-slate-500 flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5" /> Filter Status:
        </span>
        {['ALL', 'WIN', 'LOST', 'PENDING', 'VOID', 'UNVERIFIED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === st
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800 sticky top-0">
              <tr>
                <th className="py-3 px-4">Date / ID</th>
                <th className="py-3 px-4">Match</th>
                <th className="py-3 px-4">Market / Selection</th>
                <th className="py-3 px-4">Odds</th>
                <th className="py-3 px-4">Model Prob</th>
                <th className="py-3 px-4">Final Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Profit (u)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Loading prediction ledger...
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No predictions found matching status filter "{statusFilter}".
                  </td>
                </tr>
              ) : (
                filteredHistory.map((p) => {
                  const isWin = p.status === 'WIN';
                  const isLost = p.status === 'LOST';

                  return (
                    <tr key={p.prediction_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        <div>{p.prediction_date}</div>
                        <div className="text-[10px] text-slate-600">{p.prediction_id}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{p.home_team} vs {p.away_team}</div>
                        <div className="text-[10px] text-slate-500">{p.league}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-emerald-400">{p.selection}</div>
                        <div className="text-[10px] text-slate-500">{p.market}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {p.decimal_odds ? p.decimal_odds.toFixed(2) : '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {p.model_probability ? `${(p.model_probability * 100).toFixed(1)}%` : '-'}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-300">
                        {p.home_final_score !== null && p.away_final_score !== null
                          ? `${p.home_final_score} - ${p.away_final_score}`
                          : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isWin
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isLost
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-bold ${
                          p.profit_units > 0
                            ? 'text-emerald-400'
                            : p.profit_units < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {p.profit_units > 0 ? `+${p.profit_units}` : p.profit_units}
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
};
