import React from 'react';
import { ProviderHealthMonitor } from './ProviderHealthMonitor';
import { WebSocketStreamConsole } from './WebSocketStreamConsole';
import { Database, ShieldCheck, Activity, Cpu } from 'lucide-react';

export const DataQualityView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Data Quality &amp; Feed Health Observability</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time monitoring of Flashscore edge CDN feeds, WebSocket event streams, feature completeness, and model data readiness.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Data Pipeline HEALTHY
          </span>
        </div>
      </div>

      {/* Feature Coverage Matrix */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Feature Ingestion Completeness</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400">Expected Goals (xG)</div>
            <div className="text-lg font-bold text-emerald-400 mt-1">94.2% Coverage</div>
            <div className="text-[10px] text-slate-500">Major European Leagues</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400">Shot &amp; SOT Metrics</div>
            <div className="text-lg font-bold text-emerald-400 mt-1">98.5% Coverage</div>
            <div className="text-[10px] text-slate-500">Full Global Ingestion</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400">Cards &amp; Fouls Tracking</div>
            <div className="text-lg font-bold text-emerald-400 mt-1">99.1% Coverage</div>
            <div className="text-[10px] text-slate-500">Live Match Timeline</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400">Starting XI &amp; Lineups</div>
            <div className="text-lg font-bold text-emerald-400 mt-1">92.0% Coverage</div>
            <div className="text-[10px] text-slate-500">Confirmed Formations</div>
          </div>
        </div>
      </div>

      {/* Embedded Live Monitors */}
      <div className="space-y-6">
        <ProviderHealthMonitor />
        <WebSocketStreamConsole />
      </div>
    </div>
  );
};
