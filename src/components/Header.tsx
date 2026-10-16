import React from 'react';
import {
  Activity,
  Code,
  Terminal,
  Play,
  ShieldCheck,
  Download,
  BrainCircuit,
  Trophy,
  Server,
  Target,
  Sparkles,
  Radio,
} from 'lucide-react';

export type TabType =
  | 'live'
  | 'top5'
  | 'sandbox'
  | 'ml'
  | 'standings'
  | 'health'
  | 'studio'
  | 'runner'
  | 'explorer'
  | 'guide';

interface HeaderProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  liveCount: number;
  onDownloadAllZip: () => void;
  isDownloadingZip: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  liveCount,
  onDownloadAllZip,
  isDownloadingZip,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-600 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <span className="text-xl">⚡</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  Flashscore <span className="text-emerald-400">Deep Live Tracker</span>
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  v2.2 Live Radar &amp; Automation
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-Time Live Signals • Telegram &amp; Discord Automation • Odds &gt; 1.30 • AI Daily Top 5 • ML Exporter
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onDownloadAllZip}
              disabled={isDownloadingZip}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
              title="Download entire Python project (.zip) ready to run with uvicorn"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloadingZip ? 'Packing ZIP...' : 'Download Python Package (.zip)'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 border-t border-slate-800/80 pt-2 pb-2.5 overflow-x-auto scrollbar-none">
          {/* Live Signals & Automation Primary Tab (v2.2) */}
          <button
            onClick={() => onSelectTab('live')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'live'
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm font-bold ring-1 ring-emerald-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>LIVE RADAR &amp; SIGNALS</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
              v2.2
            </span>
          </button>

          {/* AI Daily Top 5 Primary Tab */}
          <button
            onClick={() => onSelectTab('top5')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'top5'
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm font-bold ring-1 ring-emerald-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI DAILY TOP 5</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
              AI ENGINE
            </span>
          </button>

          <button
            onClick={() => onSelectTab('sandbox')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'sandbox'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live Matches &amp; Deep Stats</span>
            {liveCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold animate-pulse">
                {liveCount} Live
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('ml')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'ml'
                ? 'bg-slate-800 text-violet-400 border border-slate-700 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5 text-violet-400" />
            <span>ML Dataset Exporter</span>
          </button>

          <button
            onClick={() => onSelectTab('standings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'standings'
                ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Standings & Form</span>
          </button>

          <button
            onClick={() => onSelectTab('health')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'health'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span>Health & WebSocket</span>
          </button>

          <button
            onClick={() => onSelectTab('studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'studio'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-emerald-400" />
            <span>Python Code Studio</span>
          </button>

          <button
            onClick={() => onSelectTab('runner')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'runner'
                ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>Live Python Runner</span>
          </button>

          <button
            onClick={() => onSelectTab('explorer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'explorer'
                ? 'bg-slate-800 text-violet-400 border border-slate-700 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-violet-400" />
            <span>Swagger API</span>
          </button>

          <button
            onClick={() => onSelectTab('guide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-slate-800 text-blue-400 border border-slate-700 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Protocol Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
};
