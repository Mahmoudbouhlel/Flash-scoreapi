import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Layers, Database, Filter, Calendar, Activity } from 'lucide-react';
import { formatMatchClock } from '../utils/clock';
import { MatchDetailModal } from './MatchDetailModal';

export const AllMatchesView: React.FC = () => {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [leagueFilter, setLeagueFilter] = useState<string>('all');
  const [sportFilter, setSportFilter] = useState<string>('football');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dayOffset, setDayOffset] = useState<number>(0);

  // Selected match for modal
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);

  const fetchGlobalAnalyses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v2/analyzer/global?sport=${sportFilter}&day_offset=${dayOffset}`);
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
  }, [sportFilter, dayOffset]);

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

  // Get unique leagues for filter dropdown
  const leagues = Array.from(new Set(analyses.map((a) => a.league).filter(Boolean)));

  const filteredAnalyses = analyses.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.home_team?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.away_team?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.league?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.country?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLeague = leagueFilter === 'all' || item.league === leagueFilter;

    let matchesStatus = true;
    if (statusFilter === 'live') {
      matchesStatus =
        ['2', '6', '13', '14', '15', '16', '17', '18', '38', '46'].includes(String(item.status_code)) ||
        item.status === 'Live' ||
        item.status === '1st Half' ||
        item.status === '2nd Half' ||
        item.status === 'Half Time';
    } else if (statusFilter === 'scheduled') {
      matchesStatus = item.status === 'Scheduled' || item.status_code === '1';
    } else if (statusFilter === 'finished') {
      matchesStatus = ['3', '7', '8', '9'].includes(String(item.status_code)) || item.status === 'Finished' || item.status === 'FT';
    }

    return matchesSearch && matchesLeague && matchesStatus;
  });

  const sportsList = [
    { id: 'football', label: '⚽ Football', icon: '⚽' },
    { id: 'basketball', label: '🏀 Basketball', icon: '🏀' },
    { id: 'tennis', label: '🎾 Tennis', icon: '🎾' },
    { id: 'hockey', label: '🏒 Ice Hockey', icon: '🏒' },
  ];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Global Match Analyzer &amp; Multi-Sport Intelligence</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-sport feed parser evaluating 1X2, Over/Under Goals, and BTTS probabilities across international leagues.
          </p>
        </div>

        <button
          onClick={handleRunGlobalAnalysis}
          disabled={isAnalyzing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-500/20"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>{isAnalyzing ? 'Analyzing Fixtures...' : 'GLOBAL ANALYZE ALL'}</span>
        </button>
      </div>

      {/* Sport Selector & Day Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-500 font-semibold mr-1">Sport:</span>
          {sportsList.map((sp) => (
            <button
              key={sp.id}
              onClick={() => {
                setSportFilter(sp.id);
                setLeagueFilter('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                sportFilter === sp.id
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60'
              }`}
            >
              <span>{sp.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-semibold mr-1">Day:</span>
          {[
            { offset: -1, label: 'Yesterday' },
            { offset: 0, label: 'Today' },
            { offset: 1, label: 'Tomorrow' },
          ].map((d) => (
            <button
              key={d.offset}
              onClick={() => setDayOffset(d.offset)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dayOffset === d.offset
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search, Status & League Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search teams, countries, or leagues..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
          {[
            { id: 'all', label: 'All Status' },
            { id: 'live', label: '🔴 Live' },
            { id: 'scheduled', label: '📅 Scheduled' },
            { id: 'finished', label: '✅ Finished' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`flex-1 py-1 rounded-lg text-[11px] font-bold text-center transition-all cursor-pointer ${
                statusFilter === st.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <select
          value={leagueFilter}
          onChange={(e) => setLeagueFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500/50 w-full"
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
        <div className="p-12 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-2xl">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
          Fetching live Flashscore feed for {sportFilter.toUpperCase()}...
        </div>
      ) : filteredAnalyses.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <Database className="w-6 h-6 mx-auto text-slate-600" />
          <p className="text-slate-400 font-semibold">No matches found matching filter parameters.</p>
          <p className="text-[11px] text-slate-500">
            Try selecting a different sport or day, or click <strong>GLOBAL ANALYZE ALL</strong>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAnalyses.map((match) => {
            const hWinPct = Math.round((match.home_win_probability || 0) * 100);
            const drawPct = Math.round((match.draw_probability || 0) * 100);
            const aWinPct = Math.round((match.away_win_probability || 0) * 100);
            const o25Pct = Math.round((match.over_2_5_probability || 0) * 100);
            const bttsPct = Math.round((match.btts_yes_probability || 0) * 100);

            const isLive =
              ['2', '6', '13', '14', '15', '16', '17', '18', '38', '46'].includes(String(match.status_code)) ||
              match.status === 'Live' ||
              match.status === '1st Half' ||
              match.status === '2nd Half' ||
              match.status === 'Half Time';

            return (
              <div
                key={match.match_id || match.id}
                onClick={() => setSelectedMatch(match)}
                className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl space-y-3 transition-all cursor-pointer group shadow-lg"
              >
                {/* Header info */}
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <span className="text-slate-500">{match.country ? `${match.country}:` : ''}</span>
                    <span>{match.league}</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                      isLive
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold animate-pulse flex items-center gap-1'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isLive && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />}
                    {isLive ? formatMatchClock(match.elapsed_minute, match.status) : match.status || 'Scheduled'}
                  </span>
                </div>

                {/* Team Names & Live Score */}
                <div className="flex items-center justify-between py-1">
                  <div className="flex-1">
                    <div className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">
                      {match.home_team}
                    </div>
                  </div>

                  <div className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-sm font-black text-emerald-400 font-mono">
                    {match.home_score !== undefined && match.home_score !== '-' ? `${match.home_score} - ${match.away_score}` : 'VS'}
                  </div>

                  <div className="flex-1 text-right">
                    <div className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">
                      {match.away_team}
                    </div>
                  </div>
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
                    <div className="font-bold text-emerald-400 mt-0.5">{match.home_win_odds || '1.85'}</div>
                    <div className="text-[10px] text-slate-400">{hWinPct}%</div>
                  </div>

                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 uppercase">Away (2)</div>
                    <div className="font-bold text-sky-400 mt-0.5">{match.away_win_odds || '2.10'}</div>
                    <div className="text-[10px] text-slate-400">{aWinPct}%</div>
                  </div>

                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 uppercase">Over 2.5</div>
                    <div className="font-bold text-amber-400 mt-0.5">{match.over_2_5_odds || '1.75'}</div>
                    <div className="text-[10px] text-slate-400">{o25Pct}%</div>
                  </div>

                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 uppercase">BTTS Yes</div>
                    <div className="font-bold text-violet-400 mt-0.5">{match.btts_yes_odds || '1.68'}</div>
                    <div className="text-[10px] text-slate-400">{bttsPct}%</div>
                  </div>
                </div>

                {/* Model Metadata & Inspector Link */}
                <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    <span>Best Pick: <strong className="text-emerald-400">{match.best_pick || 'Home Win'}</strong></span>
                  </span>
                  <span className="text-emerald-400 font-semibold group-hover:underline">
                    Inspect Match &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Match Detail Inspector Modal */}
      {selectedMatch && (
        <MatchDetailModal
          match={{
            id: selectedMatch.match_id || selectedMatch.id,
            sport: selectedMatch.sport || sportFilter,
            league: selectedMatch.league,
            country: selectedMatch.country || 'Global',
            home_team: selectedMatch.home_team,
            away_team: selectedMatch.away_team,
            home_score: selectedMatch.home_score,
            away_score: selectedMatch.away_score,
            status: selectedMatch.status,
            status_code: selectedMatch.status_code || '1',
            detailed_state: selectedMatch.detailed_state || '',
            elapsed_minute: selectedMatch.elapsed_minute,
            timestamp: selectedMatch.timestamp,
            url: selectedMatch.url || `https://www.flashscore.com/match/${selectedMatch.match_id || selectedMatch.id}/`,
          }}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
};
