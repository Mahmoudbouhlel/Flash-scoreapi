import React, { useState, useEffect, useRef } from 'react';
import { Radio, Terminal, Trash2, Zap, Play, CheckCircle2 } from 'lucide-react';
import { LiveEventMessage } from '../types';

export const WebSocketStreamConsole: React.FC = () => {
  const [events, setEvents] = useState<LiveEventMessage[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setEvents((prev) => [
        {
          id: `init_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          match_id: 'SYSTEM',
          match_title: 'WebSocket Feed',
          event_type: 'STATUS_CHANGE',
          minute: '00',
          message: 'Connected to live event broadcast stream (/ws/live)',
          score: '-',
        },
        ...prev,
      ]);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'CONNECTED') return;

        setEvents((prev) => [
          {
            id: data.id || `evt_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            match_id: data.match_id || 'MATCH',
            match_title: data.match_title || 'Match Event',
            event_type: data.event_type || 'GOAL',
            minute: data.minute || 'Live',
            message: data.message || 'Match event triggered',
            score: data.score || '-',
          },
          ...prev.slice(0, 49),
        ]);
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  const simulateLiveGoal = () => {
    const simEvent: LiveEventMessage = {
      id: `sim_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      match_id: 'pjtbZnNH',
      match_title: 'Arsenal vs Chelsea',
      event_type: 'GOAL',
      minute: "74'",
      message: 'GOAL! Arsenal scores via Saka! (xG: 0.82)',
      score: '2 - 1',
    };
    setEvents((prev) => [simEvent, ...prev.slice(0, 49)]);
  };

  return (
    <div className="space-y-4">
      {/* Console Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Radio className={`w-4 h-4 ${connected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Live WebSocket Stream (/ws/live)
            </h3>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              connected
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {connected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={simulateLiveGoal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Simulate Goal Event</span>
          </button>
          <button
            onClick={() => setEvents([])}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
            title="Clear Event Log"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Event Stream Terminal */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs max-h-[320px] overflow-y-auto space-y-2">
        {events.length === 0 ? (
          <div className="text-slate-600 text-xs italic text-center py-8">
            Listening for live goal incidents and score updates...
          </div>
        ) : (
          events.map((evt) => (
            <div
              key={evt.id}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 animate-in fade-in"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] text-slate-500 font-mono">[{evt.timestamp}]</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    evt.event_type === 'GOAL'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-cyan-500/20 text-cyan-400'
                  }`}
                >
                  {evt.event_type}
                </span>
                <span className="text-slate-200">{evt.message}</span>
              </div>
              <span className="text-emerald-400 font-bold">{evt.score}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
