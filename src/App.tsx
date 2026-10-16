import React, { useState, useEffect } from 'react';
import { Header, TabType } from './components/Header';
import { LiveSignalsCockpit } from './components/LiveSignalsCockpit';
import { Top5PredictionsView } from './components/Top5PredictionsView';
import { LiveScraperSandbox } from './components/LiveScraperSandbox';
import { PythonApiStudio } from './components/PythonApiStudio';
import { PythonRunner } from './components/PythonRunner';
import { ApiExplorer } from './components/ApiExplorer';
import { ProtocolGuide } from './components/ProtocolGuide';
import { MLExportStudio } from './components/MLExportStudio';
import { StandingsView } from './components/StandingsView';
import { ProviderHealthMonitor } from './components/ProviderHealthMonitor';
import { WebSocketStreamConsole } from './components/WebSocketStreamConsole';
import { PYTHON_TEMPLATES } from './python_templates';
import JSZip from 'jszip';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('live');
  const [liveCount, setLiveCount] = useState<number>(0);
  const [runnerInitialCode, setRunnerInitialCode] = useState<string>('');
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

  const handleOpenRunnerWithCode = (code: string) => {
    setRunnerInitialCode(code);
    setActiveTab('runner');
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
        {activeTab === 'live' && <LiveSignalsCockpit />}

        {activeTab === 'top5' && <Top5PredictionsView />}

        {activeTab === 'sandbox' && <LiveScraperSandbox />}

        {activeTab === 'ml' && <MLExportStudio />}

        {activeTab === 'standings' && <StandingsView />}

        {activeTab === 'health' && (
          <div className="space-y-6">
            <ProviderHealthMonitor />
            <WebSocketStreamConsole />
          </div>
        )}

        {activeTab === 'studio' && (
          <PythonApiStudio onOpenRunnerWithCode={handleOpenRunnerWithCode} />
        )}

        {activeTab === 'runner' && (
          <PythonRunner initialCode={runnerInitialCode} key={runnerInitialCode} />
        )}

        {activeTab === 'explorer' && <ApiExplorer />}

        {activeTab === 'guide' && <ProtocolGuide />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Flashscore Deep Live Tracker &amp; Real-Time Intelligence v2.2</span>
            <span className="text-slate-700">|</span>
            <span>Live Radar • Telegram &amp; Discord Automation • Odds &gt; 1.30 • AI Daily Top 5</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('live')}
              className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Live Radar
            </button>
            <button
              onClick={() => setActiveTab('top5')}
              className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              AI Top 5
            </button>
            <button
              onClick={() => setActiveTab('sandbox')}
              className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Live Matches
            </button>
            <button
              onClick={() => setActiveTab('ml')}
              className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              ML Dataset
            </button>
            <button
              onClick={() => setActiveTab('standings')}
              className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Standings
            </button>
            <button
              onClick={() => setActiveTab('health')}
              className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Health &amp; WS
            </button>
            <button
              onClick={() => setActiveTab('studio')}
              className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Export Code
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
