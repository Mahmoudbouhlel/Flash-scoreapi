import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Layers, Database } from 'lucide-react';

export const AllMatchesView: React.FC = () => {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [leagueFilter, setLeagueFilter] = useState<string>('all');

  const fetchGlobalAnalyses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v2/analyzer/global');
      if (res.ok) {
        const data = await res.json();
        setAnalyses(data.analyses || []);
      }
    } catch (err) {
      console.warn('Error fetching global analyses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalAnalyses();
  }, []);

  const handleRunGlobalAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      await fetch('/api/v2/analyzer/run', { method: 'POST' });
      await fetchGlobalAnalyses();
    } catch (err) {
      console.error('Error running global match analysis:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Get unique leagues for filter
  const leagues = Array.from(new Set(analyses.map((a) => a.league).filter(Boolean)));

  const filteredAnalyses = analyses.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.home_team?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.away_team?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.league?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLeague = leagueFilter === 'all' || item.league === leagueFilter;

    return matchesSearch && matchesLeague;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">All Matches &amp; Global Analysis</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Evaluates 1X2, Over 2.5 Goals, and BTTS Yes probabilities for all discovered fixtures across international leagues.
          </p>
        </div>

        <button
          onClick={handleRunGlobalAnalysis}
          disabled={isAnalyzing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-500/20"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>{isAnalyzing ? 'Analyzing Fixtures...' : 'GLOBAL ANALYZE ALL'}</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm ?? ''}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search teams, countries, or leagues..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <select
          value={leagueFilter ?? 'all'}
          onChange={(e) => setLeagueFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500/50 w-full sm:w-auto"
        >
          <option value="all">All Leagues ({leagues.length})</option>
          {leagues.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {/* Match Cards List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
          Loading global match database...
        </div>
      ) : filteredAnalyses.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-2xl">
          <Database className="w-6 h-6 mx-auto mb-2 text-slate-600" />
          No matches found. Click <strong>GLOBAL ANALYZE ALL</strong> to discover and analyze real fixtures.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAnalyses.map((match) => {
            const hWinPct = Math.round((match.home_win_probability || 0) * 100);
            const drawPct = Math.round((match.draw_probability || 0) * 100);
            const aWinPct = Math.round((match.away_win_probability || 0) * 100);
            const o25Pct = Math.round((match.over_2_5_probability || 0) * 100);
            const bttsPct = Math.round((match.btts_yes_probability || 0) * 100);

            return (
              <div
                key={match.match_id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl space-y-3 transition-all"
              >
                {/* Header info */}
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">{match.league}</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${match.status === 'Live' || match.status === '1st Half' || match.status === '2nd Half' || match.status === 'Half Time' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                    {match.status === 'Live' || match.status === '1st Half' || match.status === '2nd Half' || match.status === 'Half Time' ? (
                      match.elapsed_minute ? (match.elapsed_minute.includes('HT') || match.elapsed_minute.includes('FT') ? match.elapsed_minute : (parseInt(match.elapsed_minute, 10) <= 45 ? `1HT ${match.elapsed_minute}'` : `2HT ${match.elapsed_minute}'`)) : 'Live'
                    ) : match.status || 'Scheduled'}
                  </span>
                </div>

                {/* Team Names */}
                <div className="flex items-center justify-between py-1">
                  <div className="font-bold text-sm text-white">{match.home_team}</div>
                  <div className="text-xs font-bold text-slate-500 px-2">VS</div>
                  <div className="font-bold text-sm text-white text-right">{match.away_team}</div>
                </div>

                {/* 1X2 Probabilities Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Home Win {hWinPct}%</span>
                    <span>Draw {drawPct}%</span>
                    <span>Away Win {aWinPct}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: `${hWinPct}%` }} />
                    <div className="bg-slate-500 h-full" style={{ width: `${drawPct}%` }} />
                    <div className="bg-sky-500 h-full" style={{ width: `${aWinPct}%` }} />
                  </div>
                </div>

                {/* Key Markets Matrix */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-center text-xs">
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 uppercase">Home (1)</div>
                    <div className="font-bold text-emerald-400 mt-0.5">{match.home_win_odds || '-'}</div>
                    <div className="text-[10px] text-slate-400">{hWinPct}%</div>
                  </div>

                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 uppercase">Away (2)</div>
                    <div className="font-bold text-sky-400 mt-0.5">{match.away_win_odds || '-'}</div>
                    <div className="text-[10px] text-slate-400">{aWinPct}%</div>
                  </div>

                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 uppercase">Over 2.5</div>
                    <div className="font-bold text-amber-400 mt-0.5">{match.over_2_5_odds || '-'}</div>
                    <div className="text-[10px] text-slate-400">{o25Pct}%</div>
                  </div>

                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 uppercase">BTTS Yes</div>
                    <div className="font-bold text-violet-400 mt-0.5">{match.btts_yes_odds || '-'}</div>
                    <div className="text-[10px] text-slate-400">{bttsPct}%</div>
                  </div>
                </div>

                {/* Model Metadata footer */}
                <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                  <span>Model: {match.model_name || 'CalibratedEnsemble-v3.3'}</span>
                  <span>Evaluated {match.analyzed_at ? new Date(match.analyzed_at).toLocaleTimeString() : 'Recently'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
