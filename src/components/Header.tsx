import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Radio,
  Zap,
  Target,
  History,
  Brain,
  BarChart2,
  Database,
  Bot,
  Activity,
  Settings,
  Download,
} from 'lucide-react';

export type TabType =
  | 'overview'
  | 'allMatches'
  | 'liveCenter'
  | 'radar'
  | 'top5'
  | 'history'
  | 'modelLab'
  | 'backtest'
  | 'dataQuality'
  | 'integrations'
  | 'health'
  | 'settings';

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
  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'allMatches', label: 'All Matches', icon: <Layers className="w-3.5 h-3.5 text-emerald-400" /> },
    {
      id: 'liveCenter',
      label: 'Live Center',
      icon: <Radio className="w-3.5 h-3.5 text-emerald-400" />,
      badge: liveCount > 0 ? `${liveCount}` : undefined,
    },
    { id: 'radar', label: 'Signal Radar', icon: <Zap className="w-3.5 h-3.5 text-teal-400" /> },
    { id: 'top5', label: 'AI Daily Top 5', icon: <Target className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'history', label: 'Prediction History', icon: <History className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'modelLab', label: 'Model Lab', icon: <Brain className="w-3.5 h-3.5 text-violet-400" /> },
    { id: 'backtest', label: 'Backtesting', icon: <BarChart2 className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'dataQuality', label: 'Data Quality', icon: <Database className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'integrations', label: 'Telegram & Discord', icon: <Bot className="w-3.5 h-3.5 text-sky-400" /> },
    { id: 'health', label: 'System Health', icon: <Activity className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-3.5 h-3.5 text-slate-400" /> },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur-md sticky top-0 z-40">
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
                  Flashscore <span className="text-emerald-400">Football Intelligence PRO</span>
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  v3.3 PRO
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-Time Clock Sync • Calibrated Poisson/Elo Ensemble • Daily Top 5 • Global Match Analyzer
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

        {/* 12 Navigation Tabs */}
        <div className="flex items-center space-x-1 border-t border-slate-800/80 pt-2 pb-2.5 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-emerald-300 border border-emerald-500/30 shadow-sm font-bold ring-1 ring-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800/50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
