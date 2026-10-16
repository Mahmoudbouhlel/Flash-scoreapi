import React, { useState, useEffect } from 'react';
import { X, Copy, Check, ExternalLink, Activity, Clock, Shield, Database, Code2 } from 'lucide-react';
import { Match, MatchDetail } from '../types';

interface MatchDetailModalProps {
  match: Match | null;
  onClose: () => void;
}

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({ match, onClose }) => {
  const [detail, setDetail] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'json' | 'python'>('overview');

  useEffect(() => {
    if (!match) return;

    let isMounted = true;
    setLoading(true);

    fetch(`/api/match/${match.id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch detail');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setDetail(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Could not load rich match detail, using match metadata:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [match]);

  if (!match) return null;

  const copyToClipboard = (text: string, type: 'json' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'json') {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const pythonSnippet = `# Python snippet to scrape this match (${match.home_team} vs ${match.away_team})
from flashscore_mobi import FlashscoreMobiScraper

scraper = FlashscoreMobiScraper()
detail = scraper.get_match_detail("${match.id}")
print(detail)
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {match.country}: {match.league}
              </span>
              {(match.status === 'Live' || match.status === '1st Half' || match.status === '2nd Half' || match.status === 'Half Time' || ['2', '6', '13', '14', '15', '16', '17', '18', '38', '46'].includes(match.status_code)) && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                  {match.elapsed_minute ? (
                    match.elapsed_minute.includes('HT') || match.elapsed_minute.includes('FT') ? match.elapsed_minute : (parseInt(match.elapsed_minute, 10) <= 45 ? `1HT ${match.elapsed_minute}'` : `2HT ${match.elapsed_minute}'`)
                  ) : 'Live'}
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-white mt-1">
              Match Inspector: <span className="text-emerald-400">{match.home_team}</span> vs <span className="text-emerald-400">{match.away_team}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800 px-6 pt-2 bg-slate-950/30 gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'overview'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Match Breakdown
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`pb-2.5 transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'json'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Raw Parsed JSON</span>
          </button>
          <button
            onClick={() => setActiveTab('python')}
            className={`pb-2.5 transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'python'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Python Scraper Code</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm flex-1">
          {activeTab === 'overview' && (
            <>
              {/* Scorecard Hero */}
              <div className="bg-slate-950/80 rounded-xl p-5 border border-slate-800 flex items-center justify-between">
                <div className="flex-1 text-center pr-3">
                  <div className="text-base font-bold text-slate-100">{match.home_team}</div>
                  <div className="text-xs text-slate-400 mt-0.5">Home Team</div>
                </div>

                <div className="flex flex-col items-center justify-center px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 min-w-[110px]">
                  <div className="text-2xl font-black tracking-wider text-emerald-400">
                    {match.home_score} - {match.away_score}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                    {match.status}
                  </div>
                </div>

                <div className="flex-1 text-center pl-3">
                  <div className="text-base font-bold text-slate-100">{match.away_team}</div>
                  <div className="text-xs text-slate-400 mt-0.5">Away Team</div>
                </div>
              </div>

              {/* Period / Half Breakdown */}
              {match.periods && match.periods.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Period Scores</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {match.periods.map((p, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between text-xs"
                      >
                        <span className="text-slate-400">{p.period}</span>
                        <span className="font-bold text-slate-200">
                          {p.home} - {p.away}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Match Metadata Table */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Scraped Attributes & Feed Tokens</span>
                </h4>
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl divide-y divide-slate-800/60 overflow-hidden text-xs">
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-400">Match ID (AA token)</span>
                    <span className="font-mono text-emerald-400 font-semibold">{match.id}</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-400">Status Code (AB token)</span>
                    <span className="font-mono text-slate-300">
                      {match.status_code} ({match.status})
                    </span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-400">Kickoff Timestamp (AD token)</span>
                    <span className="font-mono text-slate-300">
                      {match.timestamp ? new Date(match.timestamp * 1000).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-400">Flashscore URL</span>
                    <a
                      href={match.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono text-[11px]"
                    >
                      <span>flashscore.com/match/{match.id}/</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Extra details from mobile scraper if available */}
              {loading ? (
                <div className="text-center py-4 text-xs text-slate-500 animate-pulse">
                  Querying secondary match detail parser...
                </div>
              ) : detail ? (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Rich Detail Breakdown
                  </h4>
                  <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800/60 text-xs space-y-1.5">
                    {detail.kickoff_time && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Kickoff Time:</span>
                        <span className="text-slate-200">{detail.kickoff_time}</span>
                      </div>
                    )}
                    {detail.period_breakdown && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Set/Half Breakdown:</span>
                        <span className="text-slate-200 font-medium">({detail.period_breakdown})</span>
                      </div>
                    )}
                    {detail.raw_details && detail.raw_details.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/40">
                        <span className="text-slate-500 text-[11px]">Raw mobi labels:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {detail.raw_details.map((d: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300"
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </>
          )}

          {activeTab === 'json' && (
            <div className="relative">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400">Exact JSON object returned by the Python API</span>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(match, null, 2), 'json')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedJson ? 'Copied!' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto max-h-96">
                {JSON.stringify(match, null, 2)}
              </pre>
            </div>
          )}

          {activeTab === 'python' && (
            <div className="relative">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400">Python snippet to scrape this exact match ID</span>
                <button
                  onClick={() => copyToClipboard(pythonSnippet, 'code')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied Code!' : 'Copy Python'}</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-cyan-300 font-mono text-xs overflow-x-auto">
                {pythonSnippet}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Flashscore Match Identifier: #{match.id}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
