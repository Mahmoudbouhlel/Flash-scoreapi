import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Activity,
  Shield,
  Clock,
  ExternalLink,
  Target,
  BarChart3,
  Users,
  Flame,
  Award,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { Match, MatchDetailedStats, MatchIncident, MatchLineups } from '../types';

interface MatchDeepStatsModalProps {
  match: Match | null;
  onClose: () => void;
}

export const MatchDeepStatsModal: React.FC<MatchDeepStatsModalProps> = ({ match, onClose }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'incidents' | 'lineups' | 'json' | 'python'>('stats');
  const [statsData, setStatsData] = useState<MatchDetailedStats | null>(null);
  const [incidents, setIncidents] = useState<MatchIncident[]>([]);
  const [lineups, setLineups] = useState<MatchLineups | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statFilter, setStatFilter] = useState<'all' | 'core' | 'shots' | 'passes' | 'defense'>('all');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!match) return;

    let isMounted = true;
    setLoading(true);

    // Fetch stats, incidents, and lineups concurrently
    Promise.all([
      fetch(`/api/matches/${match.id}/statistics`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/matches/${match.id}/incidents`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/matches/${match.id}/lineups`).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([statsRes, incRes, lineRes]) => {
        if (!isMounted) return;
        if (statsRes) setStatsData(statsRes);
        if (incRes?.incidents) setIncidents(incRes.incidents);
        if (lineRes) setLineups(lineRes);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Error fetching match deep details:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [match]);

  if (!match) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredStats = (statsData?.raw_items || []).filter((item) => {
    if (statFilter === 'all') return true;
    return item.category === statFilter;
  });

  const pythonSnippet = `# Fetch deep match statistics in Python (xG, possession, box shots, lineups)
from flashscore_stats_parser import FlashscoreStatsParser

parser = FlashscoreStatsParser()

# 1. Match Statistics
stats = parser.get_match_statistics("${match.id}")
print("Expected Goals (xG):", stats.get("stats", {}).get("expected_goals"))
print("Ball Possession:", stats.get("stats", {}).get("ball_possession"))
print("Shots on Target:", stats.get("stats", {}).get("shots_on_target"))

# 2. Match Incidents Timeline
incidents = parser.get_match_incidents("${match.id}")
print(f"Total Incidents: {len(incidents)}")

# 3. Lineups and Formations
lineups = parser.get_match_lineups("${match.id}")
print("Home Formation:", lineups.get("home_formation"))
print("Away Formation:", lineups.get("away_formation"))
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {match.country}: {match.league}
              </span>
              {(match.status === 'Live' || match.status === '1st Half' || match.status === '2nd Half' || match.status === 'Half Time' || ['2', '6', '13', '14', '15', '16', '17', '18', '38', '46'].includes(match.status_code)) && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                  {match.elapsed_minute ? (
                    match.elapsed_minute.includes('HT') || match.elapsed_minute.includes('FT') ? match.elapsed_minute : (parseInt(match.elapsed_minute, 10) <= 45 ? `1HT ${match.elapsed_minute}'` : `2HT ${match.elapsed_minute}'`)
                  ) : 'Live'}
                </span>
              )}
            </div>
            <h2 className="text-lg font-extrabold text-white mt-1">
              {match.home_team} vs {match.away_team}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scorecard Hero Banner */}
        <div className="px-6 py-4 bg-gradient-to-b from-slate-950/90 to-slate-900/60 border-b border-slate-800/80">
          <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-4">
            {/* Home */}
            <div className="text-right">
              <div className="text-base sm:text-lg font-bold text-white">{match.home_team}</div>
              <div className="text-xs text-slate-400 mt-0.5">Home Team</div>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center justify-center px-5 py-2 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner min-w-[120px]">
              <div className="text-3xl font-black tracking-wider text-emerald-400">
                {match.home_score} : {match.away_score}
              </div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {match.status}
              </div>
            </div>

            {/* Away */}
            <div className="text-left">
              <div className="text-base sm:text-lg font-bold text-white">{match.away_team}</div>
              <div className="text-xs text-slate-400 mt-0.5">Away Team</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-800 px-6 pt-2 bg-slate-950/40 text-xs font-semibold overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('stats')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'stats'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Match Statistics ({statsData?.raw_items?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('incidents')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'incidents'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Timeline Incidents ({incidents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('lineups')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'lineups'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Lineups & Formations</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'json'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Parsed JSON</span>
          </button>

          <button
            onClick={() => setActiveTab('python')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'python'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Python Code</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: DETAILED STATISTICS */}
          {activeTab === 'stats' && (
            <div className="space-y-5">
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs w-fit">
                {(['all', 'core', 'shots', 'passes', 'defense'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setStatFilter(cat)}
                    className={`px-3 py-1 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                      statFilter === cat
                        ? 'bg-slate-800 text-emerald-400 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="text-center py-16 text-slate-400 animate-pulse text-xs">
                  Extracting live match statistics from Flashscore CDN...
                </div>
              ) : filteredStats.length === 0 ? (
                <div className="text-center py-16 bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 text-xs space-y-2">
                  <AlertCircle className="w-7 h-7 text-slate-600 mx-auto" />
                  <p>Detailed statistics not yet supplied by Flashscore for this match.</p>
                  <p className="text-[11px] text-slate-500">
                    Flashscore supplies statistics for all major domestic leagues and cups once kickoff starts.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredStats.map((item, idx) => {
                    const homePct = item.home_percentage ?? 50;
                    const awayPct = 100 - homePct;

                    return (
                      <div
                        key={idx}
                        className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2"
                      >
                        {/* Top: Labels & Values */}
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="font-mono text-emerald-400 text-sm">{item.home}</span>
                          <span className="text-slate-300 font-bold tracking-wide">{item.name}</span>
                          <span className="font-mono text-cyan-400 text-sm">{item.away}</span>
                        </div>

                        {/* Visual Progress Comparison Bar */}
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                          <div
                            style={{ width: `${homePct}%` }}
                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                          />
                          <div
                            style={{ width: `${awayPct}%` }}
                            className="h-full bg-gradient-to-l from-cyan-600 to-cyan-400 transition-all duration-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INCIDENTS TIMELINE */}
          {activeTab === 'incidents' && (
            <div className="space-y-4">
              {incidents.length === 0 ? (
                <div className="text-center py-16 bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                  No incident timeline recorded yet for this fixture.
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-5">
                  {incidents.map((inc) => {
                    const isGoal = inc.type === 'goal';
                    const isCard = inc.type.includes('card');
                    const isSub = inc.type === 'substitution';

                    return (
                      <div key={inc.id} className="relative group">
                        {/* Timeline Node Badge */}
                        <div
                          className={`absolute -left-[35px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                            isGoal
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : isCard
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                          }`}
                        >
                          {inc.minute}
                        </div>

                        {/* Incident Card */}
                        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-bold capitalize ${
                                  isGoal ? 'text-emerald-400' : isCard ? 'text-amber-400' : 'text-cyan-400'
                                }`}
                              >
                                {inc.type.replace('_', ' ')}:
                              </span>
                              <span className="text-white font-semibold">{inc.player}</span>
                              {inc.sub_player && (
                                <span className="text-slate-400">({inc.sub_player})</span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500">
                              Team: {inc.team === 'home' ? match.home_team : match.away_team}
                            </span>
                          </div>

                          {inc.score_after && (
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono font-bold text-emerald-400 text-xs">
                              {inc.score_after}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LINEUPS & FORMATIONS */}
          {activeTab === 'lineups' && (
            <div className="space-y-6">
              {lineups ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Home Lineup */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <h4 className="font-bold text-slate-100 text-sm">{match.home_team}</h4>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs font-bold">
                        Formation: {lineups.home_formation}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Starting XI
                      </span>
                      {lineups.home_starting.map((p, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/60"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 text-center font-mono text-slate-400 font-bold">
                              {p.number || idx + 1}
                            </span>
                            <span className="text-slate-200 font-semibold">{p.name}</span>
                            <span className="text-[10px] text-slate-500">{p.position}</span>
                          </div>
                          {p.rating && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[11px]">
                              {p.rating}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Away Lineup */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <h4 className="font-bold text-slate-100 text-sm">{match.away_team}</h4>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono text-xs font-bold">
                        Formation: {lineups.away_formation}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Starting XI
                      </span>
                      {lineups.away_starting.map((p, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/60"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 text-center font-mono text-slate-400 font-bold">
                              {p.number || idx + 1}
                            </span>
                            <span className="text-slate-200 font-semibold">{p.name}</span>
                            <span className="text-[10px] text-slate-500">{p.position}</span>
                          </div>
                          {p.rating && (
                            <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono font-bold text-[11px]">
                              {p.rating}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-500 text-xs">
                  Lineups not announced yet for this match.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RAW PARSED JSON */}
          {activeTab === 'json' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Combined Match & Statistics Payload</span>
                <button
                  onClick={() =>
                    copyToClipboard(JSON.stringify({ match, stats: statsData, incidents, lineups }, null, 2))
                  }
                  className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-emerald-400 font-mono text-xs overflow-auto max-h-[380px] select-text">
                {JSON.stringify({ match, stats: statsData, incidents, lineups }, null, 2)}
              </pre>
            </div>
          )}

          {/* TAB 5: PYTHON CODE */}
          {activeTab === 'python' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Python Script to Extract This Match</span>
                <button
                  onClick={() => copyToClipboard(pythonSnippet)}
                  className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-cyan-300 font-mono text-xs overflow-auto max-h-[380px] select-text">
                {pythonSnippet}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Match ID: #{match.id} | Flashscore Feed Protocol</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
