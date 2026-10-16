import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { formatMatchClock } from '../utils/clock';
import {
  Search,
  RefreshCw,
  Activity,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Layers,
  Zap,
  Flame,
  Radio,
  BarChart3,
} from 'lucide-react';
import { Match, Sport } from '../types';
import { MatchDeepStatsModal } from './MatchDeepStatsModal';

interface LiveScraperSandboxProps {
  onSelectMatchForInspection?: (match: Match) => void;
  onOpenPythonStudioWithSnippet?: (code: string) => void;
}

const SPORTS: Sport[] = [
  { id: 1, slug: 'football', name: 'Football', icon: '⚽' },
  { id: 2, slug: 'tennis', name: 'Tennis', icon: '🎾' },
  { id: 3, slug: 'basketball', name: 'Basketball', icon: '🏀' },
  { id: 4, slug: 'hockey', name: 'Ice Hockey', icon: '🏒' },
  { id: 6, slug: 'baseball', name: 'Baseball', icon: '⚾' },
  { id: 7, slug: 'handball', name: 'Handball', icon: '🤾' },
  { id: 12, slug: 'volleyball', name: 'Volleyball', icon: '🏐' },
  { id: 13, slug: 'cricket', name: 'Cricket', icon: '🏏' },
];

export const LiveScraperSandbox: React.FC<LiveScraperSandboxProps> = () => {
  const [selectedSport, setSelectedSport] = useState<string>('football');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'live' | 'finished' | 'scheduled'>('all');
  const [dayOffset, setDayOffset] = useState<number>(0);
  const [engine, setEngine] = useState<'feed' | 'mobi'>('feed');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [counts, setCounts] = useState<{ live: number; finished: number; scheduled: number }>({
    live: 0,
    finished: 0,
    scheduled: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [inspectingMatch, setInspectingMatch] = useState<Match | null>(null);

  const fetchMatches = useCallback(
    async (isManual: boolean = false) => {
      setLoading(true);
      setError(null);
      const start = performance.now();

      try {
        const queryParams = new URLSearchParams({
          sport: selectedSport,
          day_offset: dayOffset.toString(),
          status: selectedStatus,
          engine,
        });

        if (searchTerm.trim()) {
          queryParams.set('search', searchTerm.trim());
        }

        const res = await fetch(`/api/matches?${queryParams.toString()}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: Failed to scrape matches`);
        }

        const data = await res.json();
        setMatches(data.matches || []);
        if (data.counts) {
          setCounts(data.counts);
        }
        setLastUpdated(new Date());
        setLatencyMs(Math.round(performance.now() - start));
      } catch (err: any) {
        console.error('Error in scraper:', err);
        setError(err.message || 'Scraper error');
      } finally {
        setLoading(false);
      }
    },
    [selectedSport, dayOffset, selectedStatus, engine, searchTerm]
  );

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Auto-refresh interval (every 15 seconds for live scores)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchMatches();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchMatches]);

  // Group matches by League / Country
  const groupedMatches = useMemo(() => {
    const map = new Map<string, Match[]>();
    for (const match of matches) {
      const key = match.league || `${match.country}: Unknown League`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(match);
    }
    return Array.from(map.entries());
  }, [matches]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Scraper Status Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Live Match Scraper & Delimiter Feed Sandbox
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {engine === 'feed' ? 'Flashscore Ninja CDN (Direct Feed)' : 'Flashscore Mobi (HTML)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Demonstrates real-time scraping of Flashscore matches. Test queries, inspect parsed JSON payloads, and
              verify live scores.
            </p>
          </div>

          {/* Controls: Engine, Auto-refresh & Manual trigger */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setEngine('feed')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  engine === 'feed'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Sub-100ms internal Flashscore delimiter feed"
              >
                Direct Feed
              </button>
              <button
                onClick={() => setEngine('mobi')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  engine === 'mobi'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Lightweight HTML parsing fallback"
              >
                Mobi HTML
              </button>
            </div>

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                autoRefresh
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-pulse text-emerald-400' : ''}`} />
              <span>{autoRefresh ? 'Auto-Poll (15s)' : 'Polling Off'}</span>
            </button>

            <button
              onClick={() => fetchMatches(true)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Refresh</span>
            </button>

            {latencyMs !== null && (
              <span className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-400">
                ⚡ {latencyMs}ms
              </span>
            )}
          </div>
        </div>

        {/* Sport Selectors */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {SPORTS.map((sport) => {
            const isSelected = selectedSport === sport.slug;
            return (
              <button
                key={sport.slug}
                onClick={() => setSelectedSport(sport.slug)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm'
                    : 'bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{sport.icon}</span>
                <span>{sport.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              selectedStatus === 'all'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Matches ({matches.length})
          </button>

          <button
            onClick={() => setSelectedStatus('live')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              selectedStatus === 'live'
                ? 'bg-red-500/20 text-red-300 border border-red-500/30 font-semibold'
                : 'text-slate-400 hover:text-red-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
            <span>Live Now ({counts.live})</span>
          </button>

          <button
            onClick={() => setSelectedStatus('finished')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              selectedStatus === 'finished'
                ? 'bg-slate-800 text-emerald-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Finished ({counts.finished})
          </button>

          <button
            onClick={() => setSelectedStatus('scheduled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              selectedStatus === 'scheduled'
                ? 'bg-slate-800 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Upcoming ({counts.scheduled})
          </button>
        </div>

        {/* Date Selector & Search */}
        <div className="flex items-center gap-2">
          {/* Day Offset */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setDayOffset(-1)}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                dayOffset === -1 ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => setDayOffset(0)}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                dayOffset === 0 ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDayOffset(1)}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                dayOffset === 1 ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tomorrow
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search team or league..."
              value={searchTerm ?? ''}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
          <span>Failed to scrape matches: {error}</span>
          <button
            onClick={() => fetchMatches(true)}
            className="px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-500/30 font-medium text-red-300 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Match Cards Content */}
      {loading && matches.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-300">Scraping Flashscore feed in real time...</p>
          <p className="text-xs text-slate-500">Connecting to Flashscore CDN and decoding delimiter streams</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
          <Layers className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No matches found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try switching the sport, day offset, or clearing the search filter.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedMatches.map(([leagueName, leagueMatches]) => (
            <div key={leagueName} className="bg-slate-900/80 border border-slate-800/90 rounded-2xl overflow-hidden shadow-sm">
              {/* League Header */}
              <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 text-xs font-semibold">🏆</span>
                  <h3 className="text-xs font-bold text-slate-200 tracking-wide">{leagueName}</h3>
                </div>
                <span className="text-[11px] text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  {leagueMatches.length} {leagueMatches.length === 1 ? 'match' : 'matches'}
                </span>
              </div>

              {/* Match Rows */}
              <div className="divide-y divide-slate-800/60">
                {leagueMatches.map((match) => {
                  const isLive = match.status === 'Live' || match.status_code === '2';
                  const isFinished = match.status === 'Finished' || match.status_code === '3';
                  const isScheduled = match.status === 'Scheduled' || match.status_code === '1';

                  return (
                    <div
                      key={match.id}
                      className="p-3.5 sm:px-5 hover:bg-slate-850/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      {/* Left: Time / Status Indicator */}
                      <div className="flex items-center gap-3 min-w-[90px]">
                        {isLive ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                            {formatMatchClock(match.elapsed_minute, match.status)}
                          </span>
                        ) : isFinished ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700/60">
                            FT
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {match.detailed_state ||
                              (match.timestamp
                                ? new Date(match.timestamp * 1000).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Upcoming')}
                          </span>
                        )}
                      </div>

                      {/* Center: Teams and Score */}
                      <div className="flex-1 grid grid-cols-[1fr,auto,1fr] items-center gap-3">
                        {/* Home Team */}
                        <div className="text-right">
                          <span
                            className={`text-xs sm:text-sm font-semibold ${
                              match.winner === 'home' ? 'text-emerald-300 font-bold' : 'text-slate-200'
                            }`}
                          >
                            {match.home_team}
                          </span>
                        </div>

                        {/* Score Display */}
                        <div className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 min-w-[70px] text-center">
                          <span
                            className={`text-sm sm:text-base font-extrabold tracking-wider ${
                              isLive ? 'text-red-400' : 'text-emerald-400'
                            }`}
                          >
                            {match.home_score} : {match.away_score}
                          </span>
                          {match.periods && match.periods.length > 0 && (
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {match.periods.map((p) => `${p.home}-${p.away}`).join(', ')}
                            </div>
                          )}
                        </div>

                        {/* Away Team */}
                        <div className="text-left">
                          <span
                            className={`text-xs sm:text-sm font-semibold ${
                              match.winner === 'away' ? 'text-emerald-300 font-bold' : 'text-slate-200'
                            }`}
                          >
                            {match.away_team}
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                        <button
                          onClick={() => setInspectingMatch(match)}
                          className="px-3 py-1.5 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-all flex items-center gap-1.5 cursor-pointer font-semibold shadow-sm"
                          title="View possession, xG, box shots, incidents, and lineups"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Deep Stats & xG</span>
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Deep Match Statistics & Incidents */}
      <MatchDeepStatsModal match={inspectingMatch} onClose={() => setInspectingMatch(null)} />
    </div>
  );
};
