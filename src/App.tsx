import React, { useState, useEffect } from 'react';
import { Header, TabType } from './components/Header';
import { OverviewView } from './components/OverviewView';
import { AllMatchesView } from './components/AllMatchesView';
import { LiveSignalsCockpit } from './components/LiveSignalsCockpit';
import { Top5PredictionsView } from './components/Top5PredictionsView';
import { PredictionHistoryView } from './components/PredictionHistoryView';
import { ModelLabView } from './components/ModelLabView';
import { BacktestingView } from './components/BacktestingView';
import { DataQualityView } from './components/DataQualityView';
import { TelegramDiscordView } from './components/TelegramDiscordView';
import { SettingsView } from './components/SettingsView';
import { ProviderHealthMonitor } from './components/ProviderHealthMonitor';
import { WebSocketStreamConsole } from './components/WebSocketStreamConsole';
import { PYTHON_TEMPLATES } from './python_templates';
import JSZip from 'jszip';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [liveCount, setLiveCount] = useState<number>(0);
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);

  // Poll live count periodically
  useEffect(() => {
    const fetchLiveCount = async () => {
      try {
        const res = await fetch('/api/matches?sport=football&status=live');
        if (res.ok) {
          const data = await res.json();
          setLiveCount(data.total || data.matches?.length || 0);
        }
      } catch (err) {
        console.warn('Live count fetch error:', err);
      }
    };

    fetchLiveCount();
    const interval = setInterval(fetchLiveCount, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleDownloadAllZip = async () => {
    setIsDownloadingZip(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('flashscore-live-tracker-api');

      PYTHON_TEMPLATES.forEach((file) => {
        folder?.file(file.filename, file.code);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'flashscore-live-tracker-api.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating ZIP:', err);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        liveCount={liveCount}
        onDownloadAllZip={handleDownloadAllZip}
        isDownloadingZip={isDownloadingZip}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && <OverviewView onNavigate={(t) => setActiveTab(t as TabType)} />}

        {activeTab === 'allMatches' && <AllMatchesView />}

        {activeTab === 'liveCenter' && <LiveSignalsCockpit />}

        {activeTab === 'radar' && <LiveSignalsCockpit />}

        {activeTab === 'top5' && <Top5PredictionsView />}

        {activeTab === 'history' && <PredictionHistoryView />}

        {activeTab === 'modelLab' && <ModelLabView />}

        {activeTab === 'backtest' && <BacktestingView />}

        {activeTab === 'dataQuality' && <DataQualityView />}

        {activeTab === 'integrations' && <TelegramDiscordView />}

        {activeTab === 'health' && (
          <div className="space-y-6">
            <ProviderHealthMonitor />
            <WebSocketStreamConsole />
          </div>
        )}

        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Flashscore Football Intelligence PRO v4.0</span>
            <span className="text-slate-700">|</span>
            <span>Real-Time Clock • Star Matches • Bivariate Dixon-Coles • Daily Predictions</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('overview')}
              className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('allMatches')}
              className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              All Matches
            </button>
            <button
              onClick={() => setActiveTab('top5')}
              className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Daily Top 5
            </button>
            <button
              onClick={() => setActiveTab('modelLab')}
              className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Model Lab
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Settings
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
