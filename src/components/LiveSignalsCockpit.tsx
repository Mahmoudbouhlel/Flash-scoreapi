import React, { useState, useEffect, useCallback } from 'react';
import { formatMatchClock } from '../utils/clock';
import {
  Radio,
  Zap,
  Flame,
  Clock,
  Timer,
  Crown,
  Waves,
  Target,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Sliders,
  Bell,
  Play,
  TrendingUp,
  Percent,
  Award,
  Layers,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
  MessageSquare,
  Bot,
  Copy,
  Check,
  Sparkles,
  BarChart3,
  Calendar,
  Activity,
} from 'lucide-react';
import {
  LiveSignal,
  LiveMatch,
  MatchSnapshot,
  LiveSignalsPerformance,
  AutomationSettings,
  LiveEngineCode,
} from '../types';

const ENGINE_META: Record<
  LiveEngineCode,
  { label: string; icon: any; color: string; bg: string; border: string; desc: string }
> = {
  '1H_GOALS': {
    label: '1H Goals',
    icon: Zap,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    desc: 'First half goal intensity model (Min 15-42)',
  },
  '2H_GOALS': {
    label: '2H Goals',
    icon: Flame,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    desc: 'Second half goals & transition open play (Min 46-85)',
  },
  'LATE_1H': {
    label: 'Late 1H Pressure',
    icon: Clock,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    desc: 'Sustained late first-half attacking siege (Min 35-45+)',
  },
  'LATE_2H': {
    label: 'Late 2H Crunch',
    icon: Timer,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    desc: 'Late match trailing urgency & defensive fatigue (Min 75-90+)',
  },
  COMEBACK: {
    label: 'Dominance & Comeback',
    icon: Crown,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    desc: 'Dominant side trailing or tied against xG statistical flow',
  },
  MOMENTUM_SHIFT: {
    label: 'Momentum Shift',
    icon: Waves,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    desc: 'Heavy surge in shots and box entries past 15 mins',
  },
  NEXT_GOAL: {
    label: 'Next Goal',
    icon: Target,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    desc: 'Time-decay hazard model predicting next scoring team',
  },
};

const DEFAULT_AUTOMATION_SETTINGS: AutomationSettings = {
  telegram_enabled: false,
  telegram_token: '',
  telegram_chat_id: '',
  telegram_thread_id: '',
  discord_enabled: false,
  discord_webhook_url: '',
  min_odds: 1.30,
  max_odds: 5.0,
  min_ev: 0.03,
  min_prob: 0.55,
  auto_dispatch: false,
  quiet_hours_enabled: false,
  quiet_hours_start: 0,
  quiet_hours_end: 8,
  enabled_engines: ['1H_GOALS', '2H_GOALS', 'LATE_1H', 'LATE_2H', 'COMEBACK', 'MOMENTUM_SHIFT', 'NEXT_GOAL'],
};

export const LiveSignalsCockpit: React.FC = () => {
  const [subTab, setSubTab] = useState<'radar' | 'matches' | 'ledger' | 'automation' | 'simulator'>('radar');
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [signals, setSignals] = useState<LiveSignal[]>([]);
  const [performance, setPerformance] = useState<LiveSignalsPerformance | null>(null);
  const [settings, setSettings] = useState<AutomationSettings>(DEFAULT_AUTOMATION_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [settling, setSettling] = useState(false);
  const [syncingFlashscore, setSyncingFlashscore] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedMatchSnapshots, setSelectedMatchSnapshots] = useState<{ matchId: string; list: MatchSnapshot[] } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Match Filter in Live Matches View
  const [matchSearch, setMatchSearch] = useState('');
  const [matchFilter, setMatchFilter] = useState<'ALL' | 'STATS' | 'SIGNALS'>('ALL');

  // Ledger Filter
  const [ledgerFilter, setLedgerFilter] = useState<'ALL' | 'PENDING' | 'WIN' | 'LOST' | 'VOID'>('ALL');
  const [ledgerSearch, setLedgerSearch] = useState('');

  // Simulator Form State
  const [simForm, setSimForm] = useState({
    home_team: 'Arsenal',
    away_team: 'Chelsea',
    league: 'Premier League',
    minute: 34,
    home_score: 0,
    away_score: 0,
    home_xg: 1.25,
    away_xg: 0.25,
    home_shots_on_target: 4,
    home_total_shots: 8,
    away_shots_on_target: 1,
    away_total_shots: 2,
    home_possession: 64,
    away_possession: 36,
  });
  const [simResults, setSimResults] = useState<any[] | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  // Test Alert Feedback
  const [testResult, setTestResult] = useState<{ dest: string; success: boolean; msg: string } | null>(null);

  const fetchCoreData = useCallback(async () => {
    try {
      setLoading(true);
      const [matchesRes, signalsRes, perfRes, setRes] = await Promise.all([
        fetch('/api/v2/live/matches').then((r) => r.json()),
        fetch('/api/v2/live/signals?limit=60').then((r) => r.json()),
        fetch('/api/v2/live/signals/performance').then((r) => r.json()),
        fetch('/api/v2/live/automation/settings').then((r) => r.json()),
      ]);

      if (matchesRes.success) setLiveMatches(matchesRes.matches || []);
      if (signalsRes.success) setSignals(signalsRes.signals || []);
      if (perfRes.success) setPerformance(perfRes.performance || null);
      if (setRes.success && setRes.settings) setSettings((prev) => ({ ...DEFAULT_AUTOMATION_SETTINGS, ...prev, ...setRes.settings }));
    } catch (e: any) {
      console.error('Failed to load core live data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoreData();
    const interval = setInterval(fetchCoreData, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, [fetchCoreData]);

  // Sync Real Flashscore Live CDN Directly
  const handleSyncFlashscore = async () => {
    try {
      setSyncingFlashscore(true);
      setStatusMessage('Connecting directly to Flashscore Live CDN (46.flashscore.ninja)...');
      const res = await fetch('/api/v2/live/sync-flashscore', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`⚡ Real Flashscore Live sync complete! Ingested ${data.scanned_matches} live matches with 20+ stats, detected ${data.detected_signals} signals.`);
        fetchCoreData();
      } else {
        setStatusMessage(`Sync error: ${data.error || 'Check connectivity'}`);
      }
    } catch (e: any) {
      setStatusMessage(`Sync error: ${e.message}`);
    } finally {
      setSyncingFlashscore(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  // Scan live matches
  const handleScan = async () => {
    try {
      setScanning(true);
      const res = await fetch('/api/v2/live/signals/scan', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Radar scan complete: ${data.detected_signals} signals detected across ${data.scanned_matches} real live matches!`);
        fetchCoreData();
      }
    } catch (e: any) {
      setStatusMessage(`Scan error: ${e.message}`);
    } finally {
      setScanning(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Settle signals
  const handleSettle = async () => {
    try {
      setSettling(true);
      const res = await fetch('/api/v2/live/signals/settle', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Auto-settlement complete against real Flashscore results: ${data.settled_count} signals settled!`);
        fetchCoreData();
      }
    } catch (e: any) {
      setStatusMessage(`Settlement error: ${e.message}`);
    } finally {
      setSettling(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      const res = await fetch('/api/v2/live/automation/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setStatusMessage('Automation and notification settings saved successfully!');
      }
    } catch (e: any) {
      setStatusMessage(`Save failed: ${e.message}`);
    } finally {
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Test Alert
  const handleTestAlert = async (dest: 'telegram' | 'discord') => {
    if (!settings) return;
    try {
      setTestResult(null);
      const res = await fetch('/api/v2/live/automation/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: dest,
          config: settings,
        }),
      });
      const data = await res.json();
      const ok = data.result?.success || false;
      setTestResult({
        dest,
        success: ok,
        msg: ok
          ? `Test alert dispatched successfully to ${dest.toUpperCase()}!`
          : `Failed to deliver to ${dest.toUpperCase()}: ${data.result?.error || 'Check credentials'}`,
      });
    } catch (e: any) {
      setTestResult({
        dest,
        success: false,
        msg: `Error: ${e.message}`,
      });
    }
  };

  // Run Simulator
  const handleRunSimulator = async () => {
    try {
      setSimLoading(true);
      const res = await fetch('/api/v2/live/signals/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simForm),
      });
      const data = await res.json();
      if (data.success) {
        setSimResults(data.signals_detected || []);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setSimLoading(false);
    }
  };

  // View match snapshots
  const handleViewSnapshots = async (matchId: string) => {
    try {
      const res = await fetch(`/api/v2/live/matches/${matchId}/snapshots`);
      const data = await res.json();
      if (data.success) {
        setSelectedMatchSnapshots({ matchId, list: data.snapshots || [] });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeSignalsList = signals.filter((s) => s.status === 'ACTIVE' || s.settlement_result === 'PENDING');
  const filteredLedger = signals.filter((s) => {
    if (ledgerFilter !== 'ALL' && s.settlement_result !== ledgerFilter) return false;
    if (ledgerSearch) {
      const q = ledgerSearch.toLowerCase();
      return (
        s.home_team.toLowerCase().includes(q) ||
        s.away_team.toLowerCase().includes(q) ||
        s.league.toLowerCase().includes(q) ||
        s.market.toLowerCase().includes(q) ||
        s.selection.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Pulse Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-white tracking-tight">LIVE SIGNALS & AUTOMATION</h1>
                  <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    v2.2 Core
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    Flashscore CDN (46.flashscore.ninja)
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Real-time quantitative football intelligence • 7 live signal engines • Strictly verified odds &gt; 1.30 • Telegram & Discord webhooks
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSyncFlashscore}
              disabled={syncingFlashscore}
              className="px-4 py-2 text-xs font-black rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              title="Fetch real ongoing live matches and 20+ statistics directly from Flashscore CDN"
            >
              <Zap className={`w-3.5 h-3.5 fill-current ${syncingFlashscore ? 'animate-bounce text-amber-300' : 'text-slate-950'}`} />
              <span>{syncingFlashscore ? 'Connecting Flashscore...' : '⚡ Sync Flashscore Live'}</span>
            </button>

            <button
              onClick={handleScan}
              disabled={scanning}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin text-emerald-400' : ''}`} />
              {scanning ? 'Scanning...' : 'Scan Radar'}
            </button>

            <button
              onClick={handleSettle}
              disabled={settling}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className={`w-3.5 h-3.5 text-emerald-400 ${settling ? 'animate-spin' : ''}`} />
              Auto-Settle
            </button>

            <button
              onClick={() => setSubTab('automation')}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-2"
            >
              <Bell className="w-3.5 h-3.5 text-indigo-400" />
              Webhooks & Bot
            </button>
          </div>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div className="mt-4 px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Real-time KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
              <span>Live Matches</span>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-white mt-1">{liveMatches.length}</div>
            <div className="text-[10px] text-emerald-400/80 font-medium">Tracking 20+ Stats</div>
          </div>

          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
              <span>Active Signals</span>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-400 mt-1">{activeSignalsList.length}</div>
            <div className="text-[10px] text-slate-400 font-medium">Verified Odds &gt; 1.30</div>
          </div>

          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
              <span>Win Rate %</span>
              <Percent className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-400 mt-1">
              {performance?.win_rate_pct != null ? `${performance.win_rate_pct}%` : '--'}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              {performance?.won_signals ?? 0}W - {performance?.lost_signals ?? 0}L
            </div>
          </div>

          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
              <span>Net Profit</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-white mt-1">
              {performance?.net_profit_units != null ? `+${performance.net_profit_units}u` : '--'}
            </div>
            <div className="text-[10px] text-emerald-400 font-medium">
              ROI: {performance?.roi_pct != null ? `+${performance.roi_pct}%` : '--'}
            </div>
          </div>

          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
              <span>Avg Odds</span>
              <Award className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xl font-black text-indigo-300 mt-1">
              {performance?.avg_odds ? performance.avg_odds.toFixed(2) : '1.82'}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Consensus Live Line</div>
          </div>

          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
              <span>Dispatchers</span>
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                  settings?.telegram_enabled
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                TG
              </span>
              <span
                className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                  settings?.discord_enabled
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                DISCORD
              </span>
            </div>
            <div className="text-[9px] text-slate-400 mt-1">
              {settings?.auto_dispatch ? 'Auto-Dispatch ON' : 'Manual Trigger'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto scrollbar-none gap-2">
        <button
          onClick={() => setSubTab('radar')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            subTab === 'radar'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-4 h-4" />
          Live Signal Radar ({activeSignalsList.length})
        </button>

        <button
          onClick={() => setSubTab('matches')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            subTab === 'matches'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          Live Matches ({liveMatches.length})
        </button>

        <button
          onClick={() => setSubTab('ledger')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            subTab === 'ledger'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Settlement Ledger & History ({signals.length})
        </button>

        <button
          onClick={() => setSubTab('automation')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            subTab === 'automation'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          Telegram & Discord Hub
        </button>

        <button
          onClick={() => setSubTab('simulator')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            subTab === 'simulator'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Live Engine Simulator
        </button>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 1. RADAR & ACTIVE SIGNALS VIEW */}
      {/* ---------------------------------------------------------------------- */}
      {subTab === 'radar' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Active Quantitative Live Signals
              </h2>
            </div>
            <div className="text-xs text-slate-400">
              Auto-calibrated on time hazard, live xG &amp; shots on target
            </div>
          </div>

          {activeSignalsList.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 sm:p-12 text-center backdrop-blur-md relative overflow-hidden">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 mb-4 shadow-lg shadow-emerald-500/10">
                <Radio className="w-8 h-8 animate-pulse" />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold mb-3">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                Flashscore Real-Time Feed Active • {liveMatches.length} Matches Monitored
              </div>
              <h3 className="text-base font-bold text-slate-100">7-Engine Quantitative Radar Active</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-xl mx-auto leading-relaxed">
                The engine evaluates active matches connected to Flashscore CDN. Signals trigger dynamically when quantitative conditions align with verified odds strictly &gt; 1.30: 1H Goals (min 15–42), 2H Goals (min 46–85), Late 1H/2H pressure, Comeback dominance, and Next Goal hazard intensity.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                <button
                  onClick={handleSyncFlashscore}
                  disabled={syncingFlashscore}
                  className="px-4 py-2.5 text-xs font-black rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Zap className={`w-3.5 h-3.5 ${syncingFlashscore ? 'animate-bounce' : ''}`} />
                  <span>{syncingFlashscore ? 'Connecting...' : '⚡ Ingest & Scan Flashscore Live'}</span>
                </button>
                <button
                  onClick={handleScan}
                  disabled={scanning}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>Scan Radar</span>
                </button>
                <button
                  onClick={() => setSubTab('matches')}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>View All {liveMatches.length} Live Fixtures</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeSignalsList.map((sig) => {
                const meta = ENGINE_META[sig.engine_code] || {
                  label: sig.engine_code,
                  icon: Zap,
                  color: 'text-emerald-400',
                  bg: 'bg-emerald-500/10',
                  border: 'border-emerald-500/30',
                  desc: 'Live model',
                };
                const IconComponent = meta.icon;
                const evPct = Math.round(sig.expected_value * 1000) / 10;
                const probPct = Math.round(sig.model_probability * 100);
                const impliedPct = Math.round(sig.implied_probability * 100);

                return (
                  <div
                    key={sig.signal_id}
                    className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 shadow-xl overflow-hidden transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header: Engine Badge & Match Minute */}
                      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
                        <div className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${meta.bg} ${meta.color} border ${meta.border}`}>
                          <IconComponent className="w-3.5 h-3.5" />
                          <span>{meta.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            {formatMatchClock(sig.minute)}
                          </span>
                          <span className="text-xs font-black text-white bg-slate-800 px-2 py-0.5 rounded">
                            {sig.score_at_signal}
                          </span>
                        </div>
                      </div>

                      {/* Match & Teams */}
                      <div className="p-4 space-y-3">
                        <div>
                          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            {sig.league}
                          </div>
                          <div className="text-base font-bold text-white mt-0.5">
                            {sig.home_team} <span className="text-slate-500 font-normal">vs</span> {sig.away_team}
                          </div>
                        </div>

                        {/* Market & Recommended Selection */}
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Target Selection</div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-emerald-400">{sig.selection}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs font-black border border-emerald-500/30">
                                @ {sig.decimal_odds.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center justify-between">
                            <span>{sig.market}</span>
                            <span className="text-[10px] text-slate-500">Odds &gt; 1.30 Verified</span>
                          </div>
                        </div>

                        {/* Edge & Probability Breakdown */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-800/60">
                            <div className="text-[10px] text-slate-400 font-medium">Model Prob</div>
                            <div className="font-bold text-white text-sm">
                              {probPct}% <span className="text-[10px] text-slate-400 font-normal">({impliedPct}% imp)</span>
                            </div>
                          </div>
                          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <div className="text-[10px] text-emerald-400 font-medium">Expected Value</div>
                            <div className="font-black text-emerald-400 text-sm">+{evPct}% EV</div>
                          </div>
                        </div>

                        {/* Live Match Pulse Meters */}
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                            <span>Live Match Pulse</span>
                            <span className="text-slate-400">
                              xG: {sig.home_xg.toFixed(2)} - {sig.away_xg.toFixed(2)}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-1 text-[11px] text-center font-mono text-slate-300">
                            <div className="bg-slate-800/50 p-1 rounded">
                              <span className="text-[9px] text-slate-500 block">SOT</span>
                              {sig.home_shots_on_target} - {sig.away_shots_on_target}
                            </div>
                            <div className="bg-slate-800/50 p-1 rounded">
                              <span className="text-[9px] text-slate-500 block">TOTAL SHOTS</span>
                              {sig.home_total_shots} - {sig.away_total_shots}
                            </div>
                            <div className="bg-slate-800/50 p-1 rounded">
                              <span className="text-[9px] text-slate-500 block">POSSESSION</span>
                              {sig.home_possession.toFixed(0)}% - {sig.away_possession.toFixed(0)}%
                            </div>
                          </div>
                        </div>

                        {/* Trigger Evidence */}
                        {sig.triggering_evidence && sig.triggering_evidence.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <div className="text-[10px] uppercase font-bold text-slate-400">Trigger Evidence</div>
                            <ul className="text-[11px] text-slate-300 space-y-1">
                              {sig.triggering_evidence.slice(0, 3).map((item, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-emerald-400 mt-0.5">•</span>
                                  <span className="line-clamp-2">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                      <div className="text-[10px] text-slate-400 font-mono">
                        {sig.bookmaker || 'Bet365 / Pinnacle'}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            const snippet = `🚨 LIVE SIGNAL: ${sig.home_team} vs ${sig.away_team} (${sig.minute}')\n🎯 ${sig.selection} @ ${sig.decimal_odds.toFixed(2)}\n💎 EV: +${evPct}% | Model: ${probPct}%\n🏆 ${sig.league}`;
                            copyToClipboard(snippet, sig.signal_id);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 text-[11px]"
                          title="Copy message snippet"
                        >
                          {copiedId === sig.signal_id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === sig.signal_id ? 'Copied' : 'Share'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 2. LIVE MATCHES MONITORING VIEW */}
      {/* ---------------------------------------------------------------------- */}
      {subTab === 'matches' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Flashscore Live Matches ({liveMatches.length})
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-black rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  REAL CDN STREAM
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time scores, minutes, xG, possession, shot dominance, and 20+ live metrics
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Search team or league..."
                value={matchSearch ?? ''}
                onChange={(e) => setMatchSearch(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-48"
              />
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-xs">
                <button
                  onClick={() => setMatchFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    matchFilter === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({liveMatches.length})
                </button>
                <button
                  onClick={() => setMatchFilter('STATS')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    matchFilter === 'STATS' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Deep Stats ({liveMatches.filter((m) => m.stats && ((m.stats.home_total_shots || 0) > 0 || (m.stats.home_shots_on_target || 0) > 0)).length})
                </button>
                <button
                  onClick={() => setMatchFilter('SIGNALS')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    matchFilter === 'SIGNALS' ? 'bg-slate-800 text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  With Signals ({liveMatches.filter((m) => m.active_signals && m.active_signals.length > 0).length})
                </button>
              </div>

              <button
                onClick={handleSyncFlashscore}
                disabled={syncingFlashscore}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                title="Refresh directly from Flashscore CDN"
              >
                <Zap className={`w-3 h-3 ${syncingFlashscore ? 'animate-bounce' : ''}`} />
                <span>{syncingFlashscore ? 'Syncing...' : 'Sync CDN'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveMatches
              .filter((m) => {
                if (matchSearch) {
                  const q = matchSearch.toLowerCase();
                  const matchTxt = `${m.home_team} ${m.away_team} ${m.league} ${m.country || ''}`.toLowerCase();
                  if (!matchTxt.includes(q)) return false;
                }
                if (matchFilter === 'STATS') {
                  const s = m.stats || {};
                  return (s.home_total_shots || 0) > 0 || (s.home_shots_on_target || 0) > 0 || (s.home_xg || 0) > 0;
                }
                if (matchFilter === 'SIGNALS') {
                  return m.active_signals && m.active_signals.length > 0;
                }
                return true;
              })
              .map((m) => {
              const stats = m.stats || {};
              const hPoss = stats.home_possession ?? 50;
              const aPoss = stats.away_possession ?? 50;
              const pressure = m.pressure_score ?? 50;

              return (
                <div key={m.id} className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
                  {/* Match Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{m.league}</span>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="px-2 py-0.5 text-xs font-black rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        {formatMatchClock(m.elapsed_minute, m.status)}
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        LIVE
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Sync: {m.last_sync ? new Date(m.last_sync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : new Date().toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {/* Teams & Current Score */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <div className="text-base font-bold text-white">{m.home_team}</div>
                      <div className="text-xs text-slate-400 mt-0.5">xG: {stats.home_xg?.toFixed(2) ?? '0.00'}</div>
                    </div>
                    <div className="px-4 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xl font-black text-white">
                      {m.home_score} - {m.away_score}
                    </div>
                    <div className="flex-1 text-right">
                      <div className="text-base font-bold text-white">{m.away_team}</div>
                      <div className="text-xs text-slate-400 mt-0.5">xG: {stats.away_xg?.toFixed(2) ?? '0.00'}</div>
                    </div>
                  </div>

                  {/* Possession Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                      <span>Possession: {hPoss}%</span>
                      <span>{aPoss}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                      <div style={{ width: `${hPoss}%` }} className="h-full bg-emerald-500" />
                      <div style={{ width: `${aPoss}%` }} className="h-full bg-indigo-500" />
                    </div>
                  </div>

                  {/* Attacking Pressure Meter */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                      <span>Attacking Pressure Index</span>
                      <span className={pressure > 65 ? 'text-emerald-400 font-mono font-bold' : 'text-slate-400 font-mono'}>
                        {pressure} / 100
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${pressure}%` }}
                        className={`h-full transition-all duration-500 ${
                          pressure > 70 ? 'bg-rose-500' : pressure > 55 ? 'bg-amber-400' : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Detailed 4-Box Stats */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-500 font-sans">SOT</div>
                      <div className="text-white font-bold mt-0.5">
                        {stats.home_shots_on_target ?? 0} - {stats.away_shots_on_target ?? 0}
                      </div>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-500 font-sans">TOTAL SHOTS</div>
                      <div className="text-white font-bold mt-0.5">
                        {stats.home_total_shots ?? 0} - {stats.away_total_shots ?? 0}
                      </div>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-500 font-sans">CORNERS</div>
                      <div className="text-white font-bold mt-0.5">
                        {stats.home_corner_kicks ?? 0} - {stats.away_corner_kicks ?? 0}
                      </div>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-500 font-sans">DANG. ATK</div>
                      <div className="text-white font-bold mt-0.5">
                        {stats.home_dangerous_attacks ?? 0} - {stats.away_dangerous_attacks ?? 0}
                      </div>
                    </div>
                  </div>

                  {/* Attached Signals & Snapshot Action */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Signals:</span>
                      {m.active_signals && m.active_signals.length > 0 ? (
                        m.active_signals.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          >
                            {s.selection} ({s.decimal_odds.toFixed(2)})
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 text-[11px]">Monitoring...</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleViewSnapshots(m.id)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-all flex items-center gap-1"
                    >
                      <BarChart3 className="w-3 h-3" />
                      Snapshots
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Snapshots Modal / Drawer */}
          {selectedMatchSnapshots && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Time-Series Statistical Snapshots
                  </h3>
                  <button
                    onClick={() => setSelectedMatchSnapshots(null)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {selectedMatchSnapshots.list.map((snap, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-slate-800 text-slate-200">
                          {snap.minute}'
                        </span>
                        <span className="text-white font-bold">
                          Score: {snap.home_score} - {snap.away_score}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
                        <span>xG: {snap.home_xg.toFixed(2)} - {snap.away_xg.toFixed(2)}</span>
                        <span>SOT: {snap.home_shots_on_target} - {snap.away_shots_on_target}</span>
                        <span className="text-emerald-400">Pressure: {snap.pressure_score}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setSelectedMatchSnapshots(null)}
                  className="w-full py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 3. SETTLEMENT LEDGER & AUDIT HISTORY VIEW */}
      {/* ---------------------------------------------------------------------- */}
      {subTab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Settlement &amp; Quantitative Performance Ledger
              </h2>
              <p className="text-xs text-slate-400">
                Audited signal history • Strictly calculated Win Rate excluding void/pending • Transparent tracking
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              {(['ALL', 'WIN', 'LOST', 'PENDING'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setLedgerFilter(st)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    ledgerFilter === st
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Search box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by team, league, selection, or market..."
              value={ledgerSearch ?? ''}
              onChange={(e) => setLedgerSearch(e.target.value)}
              className="w-full px-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Match &amp; League</th>
                    <th className="py-3 px-4">Engine / Strategy</th>
                    <th className="py-3 px-4">Selection &amp; Market</th>
                    <th className="py-3 px-4">Odds &amp; EV</th>
                    <th className="py-3 px-4">Trigger Score</th>
                    <th className="py-3 px-4">Outcome</th>
                    <th className="py-3 px-4 text-right">Profit Units</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No signals matching selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map((s) => {
                      const isWin = s.settlement_result === 'WIN';
                      const isLost = s.settlement_result === 'LOST';
                      const isPending = s.settlement_result === 'PENDING';

                      return (
                        <tr key={s.signal_id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-white">
                              {s.home_team} vs {s.away_team}
                            </div>
                            <div className="text-[10px] text-slate-400">{s.league}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                              {s.engine_code}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-emerald-400">{s.selection}</div>
                            <div className="text-[10px] text-slate-400">{s.market}</div>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <div className="text-white font-bold">{s.decimal_odds.toFixed(2)}</div>
                            <div className="text-[10px] text-emerald-400">
                              +{Math.round(s.expected_value * 100)}% EV
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">
                            <div>{s.score_at_signal} ({s.minute}')</div>
                            {s.final_score && (
                              <div className="text-[10px] text-slate-500">
                                Landed: {s.final_score} ({s.settled_at_minute}')
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {isWin && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                WIN
                              </span>
                            )}
                            {isLost && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                LOST
                              </span>
                            )}
                            {isPending && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                                PENDING
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            {isWin && <span className="text-emerald-400">+{s.profit_units.toFixed(2)}u</span>}
                            {isLost && <span className="text-rose-400">-1.00u</span>}
                            {isPending && <span className="text-slate-500">0.00u</span>}
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
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 4. TELEGRAM & DISCORD AUTOMATION HUB VIEW */}
      {/* ---------------------------------------------------------------------- */}
      {subTab === 'automation' && settings && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Telegram &amp; Discord Automation Dispatcher
              </h2>
              <p className="text-xs text-slate-400">
                Configure direct webhook triggers, quiet hours, minimum probability &amp; EV filters
              </p>
            </div>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
              }`}
            >
              {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{testResult.msg}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Telegram Card */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Telegram Bot Dispatcher</h3>
                      <div className="text-[10px] text-slate-400">Markdown formatted alerts with live odds &gt; 1.30</div>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!settings.telegram_enabled}
                      onChange={(e) => setSettings({ ...settings, telegram_enabled: e.target.checked })}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <span className="text-xs font-semibold text-slate-300">Enabled</span>
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Telegram Bot Token</label>
                    <input
                      type="password"
                      placeholder="e.g. 123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                      value={settings.telegram_token ?? ''}
                      onChange={(e) => setSettings({ ...settings, telegram_token: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Telegram Chat ID / Channel</label>
                    <input
                      type="text"
                      placeholder="e.g. -1001234567890 or @channelusername"
                      value={settings.telegram_chat_id ?? ''}
                      onChange={(e) => setSettings({ ...settings, telegram_chat_id: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Topic / Thread ID (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 42 (for forum topics)"
                      value={settings.telegram_thread_id ?? ''}
                      onChange={(e) => setSettings({ ...settings, telegram_thread_id: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleTestAlert('telegram')}
                      className="w-full py-2 text-xs font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/20"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send Test Telegram Alert
                    </button>
                  </div>
                </div>
              </div>

              {/* Discord Card */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Discord Webhook Dispatcher</h3>
                      <div className="text-[10px] text-slate-400">Rich color-coded embeds with live stats &amp; odds</div>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!settings.discord_enabled}
                      onChange={(e) => setSettings({ ...settings, discord_enabled: e.target.checked })}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <span className="text-xs font-semibold text-slate-300">Enabled</span>
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Discord Webhook URL</label>
                    <input
                      type="password"
                      placeholder="https://discord.com/api/webhooks/123456789/token..."
                      value={settings.discord_webhook_url ?? ''}
                      onChange={(e) => setSettings({ ...settings, discord_webhook_url: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 text-slate-400">
                    <div className="font-semibold text-slate-300">Rich Embed Features:</div>
                    <ul className="space-y-1 text-[11px]">
                      <li>• Color-coded per strategy (Emerald for goals, Amber for late goals, Blue for comeback)</li>
                      <li>• Live match pulse: xG, SOT, Possession, and attacking pressure index</li>
                      <li>• Verified decimal odds &gt; 1.30 with bookmaker consensus</li>
                      <li>• Instant settlement embed update when bet lands or concludes</li>
                    </ul>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleTestAlert('discord')}
                      className="w-full py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Send Test Discord Embed Alert
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Threshold & Engine Filtering Card */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
                Quantitative Filter Rules &amp; Quiet Hours
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Minimum Verified Odds</label>
                  <input
                    type="number"
                    step="0.05"
                    min="1.30"
                    value={settings.min_odds ?? 1.30}
                    onChange={(e) => setSettings({ ...settings, min_odds: parseFloat(e.target.value) || 1.30 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500">Strictly &gt; 1.30</span>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Minimum Expected Value (EV)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.min_ev ?? 0.03}
                    onChange={(e) => setSettings({ ...settings, min_ev: parseFloat(e.target.value) || 0.03 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500">e.g. 0.03 = +3% edge</span>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Minimum Model Probability</label>
                  <input
                    type="number"
                    step="0.05"
                    value={settings.min_prob ?? 0.55}
                    onChange={(e) => setSettings({ ...settings, min_prob: parseFloat(e.target.value) || 0.55 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500">e.g. 0.55 = 55%</span>
                </div>

                <div className="flex flex-col justify-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!settings.auto_dispatch}
                      onChange={(e) => setSettings({ ...settings, auto_dispatch: e.target.checked })}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <span className="text-xs font-bold text-emerald-400">Enable Automated Dispatch</span>
                  </label>
                  <span className="text-[10px] text-slate-500 mt-1">
                    Auto-sends signals when new opportunities qualify
                  </span>
                </div>
              </div>

              {/* Engine Toggles */}
              <div className="pt-2">
                <label className="text-xs font-semibold text-slate-300 block mb-2">Enabled Detection Engines</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {Object.entries(ENGINE_META).map(([code, meta]) => {
                    const isChecked = !!settings.enabled_engines?.includes(code);
                    return (
                      <label
                        key={code}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-slate-950 border-emerald-500/40 text-white'
                            : 'bg-slate-950/40 border-slate-800 text-slate-500'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const cur = settings.enabled_engines || [];
                            const updated = e.target.checked ? [...cur, code] : cur.filter((c) => c !== code);
                            setSettings({ ...settings, enabled_engines: updated });
                          }}
                          className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                        />
                        <span className="font-semibold">{meta.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Save Automation Configuration
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 5. LIVE SCENARIO SIMULATOR VIEW */}
      {/* ---------------------------------------------------------------------- */}
      {subTab === 'simulator' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Interactive Match Scenario Simulator
              </h2>
              <p className="text-xs text-slate-400">
                Test any custom live match state across the 7 quantitative engines and inspect model probability &amp; EV outputs
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Form */}
            <div className="lg:col-span-1 rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">Match Parameters</h3>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Home Team</label>
                    <input
                      type="text"
                      value={simForm.home_team ?? ''}
                      onChange={(e) => setSimForm({ ...simForm, home_team: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Away Team</label>
                    <input
                      type="text"
                      value={simForm.away_team ?? ''}
                      onChange={(e) => setSimForm({ ...simForm, away_team: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Minute</label>
                    <input
                      type="number"
                      value={simForm.minute ?? 0}
                      onChange={(e) => setSimForm({ ...simForm, minute: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Home Score</label>
                    <input
                      type="number"
                      value={simForm.home_score ?? 0}
                      onChange={(e) => setSimForm({ ...simForm, home_score: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Away Score</label>
                    <input
                      type="number"
                      value={simForm.away_score ?? 0}
                      onChange={(e) => setSimForm({ ...simForm, away_score: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Home xG</label>
                    <input
                      type="number"
                      step="0.05"
                      value={simForm.home_xg ?? 0}
                      onChange={(e) => setSimForm({ ...simForm, home_xg: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Away xG</label>
                    <input
                      type="number"
                      step="0.05"
                      value={simForm.away_xg ?? 0}
                      onChange={(e) => setSimForm({ ...simForm, away_xg: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Home SOT</label>
                    <input
                      type="number"
                      value={simForm.home_shots_on_target ?? 0}
                      onChange={(e) => setSimForm({ ...simForm, home_shots_on_target: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Away SOT</label>
                    <input
                      type="number"
                      value={simForm.away_shots_on_target ?? 0}
                      onChange={(e) => setSimForm({ ...simForm, away_shots_on_target: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleRunSimulator}
                    disabled={simLoading}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    <Play className={`w-3.5 h-3.5 ${simLoading ? 'animate-spin' : ''}`} />
                    {simLoading ? 'Evaluating Engines...' : 'Simulate Signals'}
                  </button>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-white">Detection Output ({simResults ? simResults.length : 0} Signals)</h3>

              {!simResults ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-500 text-xs">
                  Configure live match parameters and click "Simulate Signals" to see which of the 7 quantitative engines trigger.
                </div>
              ) : simResults.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400 text-xs">
                  No signals triggered under this specific scenario. (Requirements: positive EV edge, probability &gt; min threshold, odds &gt; 1.30).
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {simResults.map((sig, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                          {sig.engine_code}
                        </span>
                        <span className="font-mono text-emerald-400 font-bold text-xs">
                          +{Math.round(sig.expected_value * 100)}% EV
                        </span>
                      </div>
                      <div className="font-bold text-white text-sm">{sig.selection}</div>
                      <div className="text-xs text-slate-400">{sig.market}</div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                        <span className="font-mono text-white font-bold">Odds: {sig.decimal_odds.toFixed(2)}</span>
                        <span className="text-slate-400">Prob: {Math.round(sig.model_probability * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
