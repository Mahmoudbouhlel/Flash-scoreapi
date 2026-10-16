import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  ShieldCheck,
  Percent,
  Award,
  RefreshCw,
  Sliders,
  Calendar,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Brain,
  Layers,
  Play,
  RotateCcw,
  Target,
  BarChart3,
  Archive,
} from 'lucide-react';
import { PredictionSelection, PerformanceMetrics, BacktestReport } from '../types';

export const Top5PredictionsView: React.FC = () => {
  const [subTab, setSubTab] = useState<'selections' | 'performance' | 'history' | 'models'>('selections');
  const [selections, setSelections] = useState<PredictionSelection[]>([]);
  const [history, setHistory] = useState<PredictionSelection[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [backtestReport, setBacktestReport] = useState<BacktestReport | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSettling, setIsSettling] = useState<boolean>(false);
  const [isBacktesting, setIsBacktesting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Settings
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [minOdds, setMinOdds] = useState<number>(1.30);
  const [maxOdds, setMaxOdds] = useState<number>(5.00);
  const [minProb, setMinProb] = useState<number>(0.65);
  const [maxPicks, setMaxPicks] = useState<number>(5);

  // Date selection
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'WIN' | 'LOST' | 'PENDING'>('ALL');

  // Expanded cards tracker
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchTop5Selections = useCallback(async (date: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v2/predictions/top5?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setSelections(data.selections || []);
      }
    } catch (err) {
      console.error('Failed to fetch Top 5 selections:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPerformance = useCallback(async () => {
    try {
      const res = await fetch('/api/v2/predictions/performance');
      if (res.ok) {
        const data = await res.json();
        setPerformance(data);
      }
    } catch (err) {
      console.error('Failed to fetch performance:', err);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/v2/predictions/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  }, []);

  useEffect(() => {
    fetchTop5Selections(selectedDate);
    fetchPerformance();
    fetchHistory();
  }, [fetchTop5Selections, fetchPerformance, fetchHistory, selectedDate]);

  const handleGenerateTop5 = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(
        `/api/v2/predictions/generate-top5?min_odds=${minOdds}&max_odds=${maxOdds}&min_prob=${minProb}&max_picks=${maxPicks}`,
        { method: 'POST' }
      );
      if (res.ok) {
        const data = await res.json();
        setSelections(data.selections || []);
        showToast(`Successfully analyzed schedule and published ${data.selections_published_count} Top 5 selections!`);
        fetchPerformance();
        fetchHistory();
      } else {
        showToast('Engine failed to generate selections. Check feed connectivity.');
      }
    } catch (err) {
      console.error('Generate top 5 error:', err);
      showToast('Error connecting to Prediction Engine.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSettleNow = async () => {
    setIsSettling(true);
    try {
      const res = await fetch('/api/v2/predictions/settle', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        showToast(`Settled ${data.settled_count} pending predictions against official match results!`);
        fetchTop5Selections(selectedDate);
        fetchPerformance();
        fetchHistory();
      }
    } catch (err) {
      console.error('Settle error:', err);
      showToast('Settlement check encountered an error.');
    } finally {
      setIsSettling(false);
    }
  };

  const handleRunBacktest = async () => {
    setIsBacktesting(true);
    try {
      const res = await fetch('/api/v2/models/backtest', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setBacktestReport(data);
        showToast('Walk-forward backtest completed with out-of-sample validation!');
      }
    } catch (err) {
      console.error('Backtest error:', err);
      showToast('Failed to run model backtest simulation.');
    } finally {
      setIsBacktesting(false);
    }
  };

  const filteredHistory = history.filter((p) => {
    if (historyFilter === 'ALL') return true;
    return p.status === historyFilter;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-500 text-slate-950 font-semibold rounded-xl shadow-xl shadow-emerald-500/20 border border-emerald-400 text-sm animate-fade-in">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 shadow-2xl">
        <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-8 -top-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                AI Daily Top 5
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                Calibrated Ensemble v2.1
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                Flashscore Feed (400+ Matches Daily)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                Odds &gt; 1.30 Enforced
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                Max 1 Pick / Match
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Automated Daily Football Prediction Engine
            </h1>
            <p className="text-sm text-slate-400 max-w-3xl">
              Analyzes the daily fixtures using a multi-model architecture: Poisson Dixon-Coles goal expectation,
              statistical machine learning on form &amp; xG, and time-aware Elo ratings. Ranks opportunities by
              uncertainty-adjusted expected value with strictly verified odds &gt; 1.30 and automated settlement.
            </p>
          </div>

          {/* Quick Stats Pill */}
          {performance && (
            <div className="flex items-center gap-3 bg-slate-950/70 border border-slate-800/80 p-3 rounded-xl backdrop-blur-sm self-start lg:self-center">
              <div className="text-center px-3 border-r border-slate-800">
                <div className="text-[11px] uppercase font-semibold text-slate-400">Win Rate</div>
                <div className="text-lg font-black text-emerald-400">{performance.win_rate_pct}%</div>
              </div>
              <div className="text-center px-3 border-r border-slate-800">
                <div className="text-[11px] uppercase font-semibold text-slate-400">ROI</div>
                <div className="text-lg font-black text-teal-300">
                  {performance.roi_pct >= 0 ? `+${performance.roi_pct}%` : `${performance.roi_pct}%`}
                </div>
              </div>
              <div className="text-center px-3">
                <div className="text-[11px] uppercase font-semibold text-slate-400">Net Profit</div>
                <div className="text-lg font-black text-white">
                  {performance.net_profit_units >= 0 ? `+${performance.net_profit_units}u` : `${performance.net_profit_units}u`}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sub Navigation & Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 backdrop-blur-sm">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSubTab('selections')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'selections'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Today&apos;s Selections ({selections.length})</span>
          </button>

          <button
            onClick={() => setSubTab('performance')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'performance'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Performance &amp; Audit</span>
          </button>

          <button
            onClick={() => setSubTab('history')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'history'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Historical Ledger ({history.length})</span>
          </button>

          <button
            onClick={() => setSubTab('models')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'models'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Models &amp; Backtest</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Date Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs cursor-pointer"
            />
          </div>

          {/* Engine Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
              showSettings
                ? 'bg-slate-800 border-slate-700 text-emerald-400'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Configure Prediction Engine Parameters"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Auto Settle Results */}
          <button
            onClick={handleSettleNow}
            disabled={isSettling}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            title="Match finished scores against published predictions and settle WIN/LOST/VOID"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-amber-400 ${isSettling ? 'animate-spin' : ''}`} />
            <span>{isSettling ? 'Settling...' : 'Auto-Settle'}</span>
          </button>

          {/* Run Engine Button */}
          <button
            onClick={handleGenerateTop5}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Analyzing...' : 'Run Engine'}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Settings Panel */}
      {showSettings && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Prediction Engine Parameters</h3>
            </div>
            <span className="text-xs text-slate-400">Strict mathematical gates &amp; thresholds</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Min Odds */}
            <div className="space-y-1.5 bg-slate-950 p-3 rounded-lg border border-slate-800/80">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-300">Minimum Decimal Odds</span>
                <span className="font-mono font-bold text-emerald-400">{minOdds.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="1.30"
                max="2.50"
                step="0.05"
                value={minOdds}
                onChange={(e) => setMinOdds(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">Strictly enforces decimal_odds &gt; 1.30</p>
            </div>

            {/* Max Odds */}
            <div className="space-y-1.5 bg-slate-950 p-3 rounded-lg border border-slate-800/80">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-300">Maximum Decimal Odds</span>
                <span className="font-mono font-bold text-slate-300">{maxOdds.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="2.00"
                max="8.00"
                step="0.25"
                value={maxOdds}
                onChange={(e) => setMaxOdds(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">Upper bound prevents high-variance longshots</p>
            </div>

            {/* Min Calibrated Probability */}
            <div className="space-y-1.5 bg-slate-950 p-3 rounded-lg border border-slate-800/80">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-300">Min Calibrated Prob</span>
                <span className="font-mono font-bold text-teal-400">{(minProb * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.55"
                max="0.85"
                step="0.05"
                value={minProb}
                onChange={(e) => setMinProb(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">Requires high probability of winning</p>
            </div>

            {/* Max Daily Picks */}
            <div className="space-y-1.5 bg-slate-950 p-3 rounded-lg border border-slate-800/80">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-300">Max Daily Selections</span>
                <span className="font-mono font-bold text-white">{maxPicks}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={maxPicks}
                onChange={(e) => setMaxPicks(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">Quality-filtered: published list cap is 5</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 1: TODAY'S SELECTIONS                                             */}
      {/* ========================================================================= */}
      {subTab === 'selections' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
              <p className="text-sm font-medium">Loading AI Daily Top 5 selections...</p>
            </div>
          ) : selections.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 max-w-2xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">No Eligible Top 5 Selections for {selectedDate}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The prediction engine enforces strict eligibility criteria: verified decimal odds strictly greater than 1.30,
                  calibrated probability &gt;= {(minProb * 100).toFixed(0)}%, and positive expected value edge.
                  Matches that do not satisfy these safety gates are filtered out to preserve capital.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={handleGenerateTop5}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>Run Analysis on Today&apos;s Schedule</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 px-4 py-2.5 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="font-bold text-emerald-400">{selections.length} of 5</span>
                  <span>Qualified Selections Published</span>
                  <span className="text-slate-600">•</span>
                  <span>Date: {selectedDate}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-400">
                  <span>
                    Avg Odds:{' '}
                    <strong className="text-slate-200">
                      {(selections.reduce((acc, s) => acc + s.decimal_odds, 0) / selections.length).toFixed(2)}
                    </strong>
                  </span>
                  <span>
                    Avg Prob:{' '}
                    <strong className="text-emerald-400">
                      {((selections.reduce((acc, s) => acc + s.model_probability, 0) / selections.length) * 100).toFixed(1)}%
                    </strong>
                  </span>
                  <span>
                    Avg EV:{' '}
                    <strong className="text-teal-300">
                      +{(
                        (selections.reduce((acc, s) => acc + s.estimated_ev, 0) / selections.length) *
                        100
                      ).toFixed(1)}%
                    </strong>
                  </span>
                </div>
              </div>

              {/* Selections Cards */}
              <div className="grid grid-cols-1 gap-4">
                {selections.map((sel) => {
                  const isExpanded = expandedCards[sel.prediction_id] ?? true;
                  const probPct = Math.round(sel.model_probability * 100);
                  const impliedPct = Math.round(sel.implied_probability * 100);
                  const edgePct = Math.round(sel.estimated_ev * 100);

                  const statusConfig = {
                    PENDING: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', icon: Clock, label: 'PENDING' },
                    WIN: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: CheckCircle2, label: 'WIN' },
                    LOST: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', icon: XCircle, label: 'LOST' },
                    VOID: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30', icon: AlertCircle, label: 'VOID' },
                    UNRESOLVED: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30', icon: Clock, label: 'UNRESOLVED' },
                  }[sel.status] || { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30', icon: Clock, label: sel.status };

                  const StatusIcon = statusConfig.icon;

                  return (
                    <div
                      key={sel.prediction_id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all shadow-lg"
                    >
                      {/* Top Bar: Rank, Match, Market, Odds, Status */}
                      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80">
                        <div className="flex items-start sm:items-center gap-3">
                          {/* Rank Badge & Fixed Allocation Slot Label */}
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 font-black text-sm flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                              #{sel.rank_position}
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span className="px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
                                  {sel.rank_position === 1 ? 'BEST HOME WIN (1)' : sel.rank_position === 2 ? 'SECOND HOME WIN (1)' : sel.rank_position === 3 ? 'BEST AWAY WIN (2)' : sel.rank_position === 4 ? 'BEST OVER 2.5 (O2.5)' : 'BEST GG / BTTS (GG)'}
                                </span>
                                <span>•</span>
                                <span className="font-semibold text-slate-300">{sel.league}</span>
                              </div>
                              <div className="text-base sm:text-lg font-bold text-white">
                                {sel.home_team} <span className="text-slate-500 font-normal">vs</span> {sel.away_team}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Market & Odds Chip */}
                        <div className="flex items-center gap-3 self-end md:self-center flex-wrap sm:flex-nowrap">
                          {/* Market + Pick */}
                          <div className="text-right">
                            <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                              {sel.market}
                            </div>
                            <div className="text-sm font-extrabold text-emerald-400">{sel.selection}</div>
                          </div>

                          {/* Verified Odds Chip */}
                          <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-center min-w-[70px]">
                            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-0.5">
                              <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                              Odds
                            </div>
                            <div className="text-base font-black text-white font-mono">{sel.decimal_odds.toFixed(2)}</div>
                          </div>

                          {/* Status Pill */}
                          <div
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />
                            <span>{statusConfig.label}</span>
                            {sel.home_final_score !== null && sel.away_final_score !== null && (
                              <span className="ml-1 px-1.5 py-0.2 rounded bg-slate-950 font-mono text-[11px]">
                                {sel.home_final_score}:{sel.away_final_score}
                              </span>
                            )}
                          </div>

                          {/* Expand details toggle */}
                          <button
                            onClick={() => toggleExpand(sel.prediction_id)}
                            className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                            title="Toggle technical intelligence breakdown"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Technical Breakdown Section */}
                      {isExpanded && (
                        <div className="p-4 sm:p-5 bg-slate-950/40 space-y-4 text-xs">
                          {/* Metrics Grid: Probability vs Implied, EV, Uncertainty, Agreement */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {/* Model Probability */}
                            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                              <div className="text-slate-400 text-[11px] mb-1 flex items-center justify-between">
                                <span>Model Prob</span>
                                <span className="font-bold text-emerald-400">{probPct}%</span>
                              </div>
                              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full rounded-full transition-all"
                                  style={{ width: `${probPct}%` }}
                                ></div>
                              </div>
                              <div className="mt-1 text-[10px] text-slate-500">Bookmaker Implied: {impliedPct}%</div>
                            </div>

                            {/* Expected Value Edge */}
                            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                              <div className="text-slate-400 text-[11px] mb-1 flex items-center justify-between">
                                <span>Expected Value</span>
                                <span className="font-bold text-teal-300">+{edgePct}%</span>
                              </div>
                              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-teal-400 h-full rounded-full transition-all"
                                  style={{ width: `${Math.min(100, edgePct * 5)}%` }}
                                ></div>
                              </div>
                              <div className="mt-1 text-[10px] text-slate-500">Mathematical Edge / ROI</div>
                            </div>

                            {/* Model Uncertainty */}
                            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                              <div className="text-slate-400 text-[11px] mb-1 flex items-center justify-between">
                                <span>Uncertainty</span>
                                <span className="font-bold text-slate-300">±{sel.model_uncertainty.toFixed(2)}</span>
                              </div>
                              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-amber-400 h-full rounded-full transition-all"
                                  style={{ width: `${Math.min(100, sel.model_uncertainty * 500)}%` }}
                                ></div>
                              </div>
                              <div className="mt-1 text-[10px] text-slate-500">Variance Index (Lower is safer)</div>
                            </div>

                            {/* Multi-Model Agreement */}
                            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                              <div className="text-slate-400 text-[11px] mb-1 flex items-center justify-between">
                                <span>Model Agreement</span>
                                <span className="font-bold text-violet-400">{sel.model_agreement_pct}%</span>
                              </div>
                              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-violet-400 h-full rounded-full transition-all"
                                  style={{ width: `${sel.model_agreement_pct}%` }}
                                ></div>
                              </div>
                              <div className="mt-1 text-[10px] text-slate-500">Poisson, ML, &amp; Elo Consensus</div>
                            </div>
                          </div>

                          {/* Supporting Rationale */}
                          {sel.supporting_reasons && sel.supporting_reasons.length > 0 && (
                            <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
                              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Key Supporting Analytical Drivers</span>
                              </div>
                              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                                {sel.supporting_reasons.map((reason, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5 text-slate-300">
                                    <span className="text-emerald-400 mt-0.5">•</span>
                                    <span>{reason}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Metadata Footer */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500 border-t border-slate-800/60">
                            <div>
                              Odds Source: <span className="text-slate-400 font-medium">{sel.odds_provider}</span>
                            </div>
                            <div>
                              Engine: <span className="text-slate-400 font-medium">{sel.model_name}</span>
                            </div>
                            <div>
                              Published:{' '}
                              <span className="text-slate-400 font-mono">
                                {new Date(sel.published_at_utc).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: PERFORMANCE & AUDIT                                            */}
      {/* ========================================================================= */}
      {subTab === 'performance' && (
        <div className="space-y-6">
          {performance ? (
            <>
              {/* Primary Metric KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Win Rate</span>
                    <Percent className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-emerald-400">{performance.win_rate_pct}%</div>
                  <p className="text-[11px] text-slate-500">
                    {performance.wins} W - {performance.losses} L ({performance.voids} V, {performance.pending} P)
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Return on Investment</span>
                    <TrendingUp className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="text-2xl font-black text-teal-300">
                    {performance.roi_pct >= 0 ? `+${performance.roi_pct}%` : `${performance.roi_pct}%`}
                  </div>
                  <p className="text-[11px] text-slate-500">Flat 1.0 unit stake sizing</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Net Profit</span>
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-2xl font-black text-white">
                    {performance.net_profit_units >= 0
                      ? `+${performance.net_profit_units}u`
                      : `${performance.net_profit_units}u`}
                  </div>
                  <p className="text-[11px] text-slate-500">Total Staked: {performance.total_staked_units} units</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Average Odds</span>
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-black text-cyan-400">{performance.average_odds.toFixed(2)}</div>
                  <p className="text-[11px] text-slate-500">Strictly &gt; 1.30 floor</p>
                </div>
              </div>

              {/* Secondary Metric KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
                  <div className="text-xs text-slate-400">Longest Win Streak</div>
                  <div className="text-xl font-black text-emerald-400">{performance.longest_win_streak} wins</div>
                  <p className="text-[11px] text-slate-500">Consecutive verified wins</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
                  <div className="text-xs text-slate-400">Max Drawdown</div>
                  <div className="text-xl font-black text-rose-400">-{performance.max_drawdown_units}u</div>
                  <p className="text-[11px] text-slate-500">Peak-to-trough equity drop</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
                  <div className="text-xs text-slate-400">Brier Calibration Score</div>
                  <div className="text-xl font-black text-amber-400">{performance.brier_score.toFixed(3)}</div>
                  <p className="text-[11px] text-slate-500">Lower is better (&lt; 0.20 is elite)</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
                  <div className="text-xs text-slate-400">Total Published</div>
                  <div className="text-xl font-black text-slate-200">{performance.total_published}</div>
                  <p className="text-[11px] text-slate-500">Archived predictions tracked</p>
                </div>
              </div>

              {/* Audit Explanation Card */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Audit Trail &amp; Verification Rules</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="font-semibold text-slate-200">Strict Win-Rate Denominator</span>
                    <p className="text-[11px]">
                      Win rate is mathematically computed as <code>Wins / (Wins + Losses)</code>. Void and pending bets
                      are strictly omitted from the denominator to avoid distorting actual betting edge.
                    </p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="font-semibold text-slate-200">Point-in-Time Odds Snapshot</span>
                    <p className="text-[11px]">
                      Odds are permanently captured at publication prior to kickoff. Closing odds or post-event lines
                      are never substituted, guaranteeing true un-skewed auditability.
                    </p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="font-semibold text-slate-200">Automated Resolution Engine</span>
                    <p className="text-[11px]">
                      Predictions are automatically evaluated against the official Flashscore results feed for full-time
                      scores, goal totals, and match outcomes upon whistle.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500">Loading performance metrics...</div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: HISTORICAL LEDGER                                              */}
      {/* ========================================================================= */}
      {subTab === 'history' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Filter Status:</span>
              {(['ALL', 'WIN', 'LOST', 'PENDING'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setHistoryFilter(st)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    historyFilter === st
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <span className="text-slate-400 font-mono">Showing {filteredHistory.length} records</span>
          </div>

          {/* Historical Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Match</th>
                    <th className="py-3 px-4">Market &amp; Selection</th>
                    <th className="py-3 px-4">Odds</th>
                    <th className="py-3 px-4">Model Prob</th>
                    <th className="py-3 px-4">Final Score</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredHistory.map((item) => {
                    const statusClass = {
                      WIN: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
                      LOST: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
                      VOID: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
                      PENDING: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
                      UNRESOLVED: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
                    }[item.status] || 'text-slate-400 bg-slate-500/10 border-slate-500/30';

                    return (
                      <tr key={item.prediction_id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-400">{item.prediction_date}</td>
                        <td className="py-3 px-4 font-medium text-white">
                          <div>
                            {item.home_team} vs {item.away_team}
                          </div>
                          <span className="text-[10px] text-slate-500">{item.league}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-200">{item.selection}</span>
                          <span className="block text-[10px] text-slate-400">{item.market}</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-white">{item.decimal_odds.toFixed(2)}</td>
                        <td className="py-3 px-4 font-mono text-teal-400">
                          {(item.model_probability * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-300">
                          {item.home_final_score !== null && item.away_final_score !== null
                            ? `${item.home_final_score} - ${item.away_final_score}`
                            : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusClass}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          {item.status === 'WIN' ? (
                            <span className="text-emerald-400">+{item.profit_units.toFixed(2)}u</span>
                          ) : item.status === 'LOST' ? (
                            <span className="text-rose-400">-1.00u</span>
                          ) : (
                            <span className="text-slate-500">0.00u</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: PREDICTION MODELS & BACKTEST                                   */}
      {/* ========================================================================= */}
      {subTab === 'models' && (
        <div className="space-y-6">
          {/* Architecture Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase">
                  Model A
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">Weight: 45%</span>
              </div>
              <h4 className="text-base font-bold text-white">Bivariate Poisson &amp; Dixon-Coles</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Computes joint goal probability matrices up to 8x8 scores with empirical low-score tau correlation
                adjustment (rho = -0.11) for 0-0, 1-0, 0-1, and 1-1.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[10px] font-bold uppercase">
                  Model B
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">Weight: 35%</span>
              </div>
              <h4 className="text-base font-bold text-white">Statistical Machine Learning</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Supervised logistic classifier utilizing 16 features: rolling 5-match form, home/away xG differential,
                possession, shot conversion efficiency, and clean sheet rates.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase">
                  Model C
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">Weight: 20%</span>
              </div>
              <h4 className="text-base font-bold text-white">Time-Aware Elo Strength Rating</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dynamic team strength ratings updated incrementally per match with schedule strength and home-field
                advantage adjustment (+65 Elo points).
              </p>
            </div>
          </div>

          {/* Calibrated Ensemble & Validation Gates */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Calibrated Ensemble Engine &amp; Walk-Forward Backtester</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Combines model outputs with Sigmoid-Temperature calibration (T=0.92) to prevent probability over-confidence.
                </p>
              </div>

              <button
                onClick={handleRunBacktest}
                disabled={isBacktesting}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer self-start sm:self-center disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 ${isBacktesting ? 'animate-spin' : ''}`} />
                <span>{isBacktesting ? 'Simulating Historical Data...' : 'Run Walk-Forward Backtest'}</span>
              </button>
            </div>

            {/* Backtest Report */}
            {backtestReport && (
              <div className="space-y-4 animate-fade-in pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-400">Sample Size</span>
                    <div className="text-lg font-black text-white">{backtestReport.sample_size} matches</div>
                    <span className="text-[10px] text-slate-500">Historical evaluation</span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-400">Backtest Win Rate</span>
                    <div className="text-lg font-black text-emerald-400">{backtestReport.win_rate_pct}%</div>
                    <span className="text-[10px] text-slate-500">
                      {backtestReport.wins} W - {backtestReport.losses} L
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-400">Simulated ROI</span>
                    <div className="text-lg font-black text-teal-300">+{backtestReport.roi_pct}%</div>
                    <span className="text-[10px] text-slate-500">+{backtestReport.net_profit_units}u profit</span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-400">Validation Gate</span>
                    <div
                      className={`text-lg font-black ${
                        backtestReport.validation_gate_passed ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {backtestReport.validation_gate_passed ? 'PASSED' : 'FAILED'}
                    </div>
                    <span className="text-[10px] text-slate-500">Requires &gt;= 58% Win Rate</span>
                  </div>
                </div>

                {/* Sample backtested matches */}
                {backtestReport.sample_simulations && backtestReport.sample_simulations.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Out-Of-Sample Simulation Snapshot
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {backtestReport.sample_simulations.map((sim, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-white">{sim.match}</div>
                            <div className="text-[11px] text-slate-400">
                              {sim.market}: <span className="text-emerald-400 font-semibold">{sim.selection}</span> @{' '}
                              <span className="font-mono">{sim.odds.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                sim.status === 'WIN'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {sim.status} ({sim.score})
                            </span>
                            <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                              {sim.profit >= 0 ? `+${sim.profit.toFixed(2)}u` : `${sim.profit.toFixed(2)}u`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
