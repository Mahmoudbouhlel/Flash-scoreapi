import React, { useState } from 'react';
import {
  ShieldCheck,
  Cpu,
  Lock,
  Globe,
  Layers,
  Server,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';

const TOKEN_DICTIONARY = [
  { token: 'SA', name: 'Sport ID', example: '1 (Football), 2 (Tennis), 3 (Basketball)', desc: 'Identifies the sport category' },
  { token: 'ZA', name: 'Tournament Header', example: 'ENGLAND: Premier League', desc: 'Category and competition name' },
  { token: 'ZY', name: 'Country / Region', example: 'England', desc: 'Country or confederation of the tournament' },
  { token: 'ZEE', name: 'Tournament ID', example: 'M5p3t8vD', desc: 'Unique tournament slug/hash' },
  { token: 'AA', name: 'Match ID', example: 'pjtbZnNH', desc: 'Primary key identifying the match in Flashscore' },
  { token: 'AE', name: 'Home Team', example: 'Arsenal', desc: 'Official home team name' },
  { token: 'AF', name: 'Away Team', example: 'Chelsea', desc: 'Official away team name' },
  { token: 'AG', name: 'Home Score', example: '2', desc: 'Current or full-time score for the home team' },
  { token: 'AH', name: 'Away Score', example: '1', desc: 'Current or full-time score for the away team' },
  { token: 'BA', name: 'Home 1st Half / Set', example: '1', desc: 'First half / set score for home' },
  { token: 'BC', name: 'Away 1st Half / Set', example: '0', desc: 'First half / set score for away' },
  { token: 'BB', name: 'Home 2nd Half / Set', example: '1', desc: 'Second half / set score for home' },
  { token: 'BD', name: 'Away 2nd Half / Set', example: '1', desc: 'Second half / set score for away' },
  { token: 'AB', name: 'Status Code', example: '1 (Sched), 2 (Live), 3 (Fin)', desc: 'Numeric match lifecycle indicator' },
  { token: 'AC', name: 'Detailed State / Min', example: "67', HT, FT, Postp.", desc: 'Live elapsed minute or period state' },
  { token: 'AD', name: 'Kickoff Timestamp', example: '1729087200', desc: 'UNIX epoch timestamp in seconds' },
  { token: 'AS', name: 'Winner Indicator', example: '1 (Home won), 2 (Away won)', desc: 'Result outcome flag' },
];

export const ProtocolGuide: React.FC = () => {
  const [copiedHeader, setCopiedHeader] = useState(false);

  const sampleHeaders = `headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "x-fsign": "SW9D1eZo",
    "Referer": "https://www.flashscore.com/",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
}`;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Flashscore Reverse-Engineering & Anti-Ban Guide</h2>
            <p className="text-xs text-slate-400 mt-1">
              Complete technical specification of Flashscore's internal feed protocol, CDN topology, delimiter stream
              decoding, and production scaling practices.
            </p>
          </div>
        </div>
      </div>

      {/* Protocol Architecture Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">How Flashscore Transmits Match Feeds</h3>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Instead of conventional JSON or GraphQL APIs, Flashscore uses a proprietary, ultra-compact delimited ASCII
          stream protocol deployed over their worldwide edge CDN network (e.g.,{' '}
          <code className="text-emerald-400 font-mono">46.flashscore.ninja</code>). This reduces payload size by up to
          75% compared to JSON.
        </p>

        {/* Visual Diagram */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
          <div className="text-emerald-400 font-bold">// Feed URL Structure:</div>
          <div className="text-cyan-300">
            https://46.flashscore.ninja/37/x/feed/f_&#123;sport_id&#125;_&#123;day_offset&#125;_3_en_1
          </div>
          <div className="text-slate-500 text-[11px] pt-1">
            Example: <span className="text-slate-300">f_1_0_3_en_1</span> = Sport 1 (Soccer), Day 0 (Today), Locale English
          </div>

          <div className="border-t border-slate-800/80 pt-3 mt-3 text-emerald-400 font-bold">// Delimiter Rules:</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <span className="text-amber-400 font-bold text-sm">~</span>
              <div className="text-slate-300 font-semibold mt-1">Block Separator</div>
              <div className="text-[11px] text-slate-400">Separates tournaments and match records</div>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <span className="text-emerald-400 font-bold text-sm">¬</span>
              <div className="text-slate-300 font-semibold mt-1">Field Prefix</div>
              <div className="text-[11px] text-slate-400">Begins an attribute key-value pair</div>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <span className="text-cyan-400 font-bold text-sm">÷</span>
              <div className="text-slate-300 font-semibold mt-1">Key-Value Splitter</div>
              <div className="text-[11px] text-slate-400">Partitions key (e.g. AE) and value (e.g. Arsenal)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Delimiter Token Dictionary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Reverse-Engineered Field Dictionary</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Token</th>
                <th className="py-2.5 px-3">Attribute Name</th>
                <th className="py-2.5 px-3">Example Value</th>
                <th className="py-2.5 px-3">Protocol Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
              {TOKEN_DICTIONARY.map((row) => (
                <tr key={row.token} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-2 px-3 font-bold text-emerald-400">{row.token}</td>
                  <td className="py-2 px-3 font-sans font-semibold text-slate-200">{row.name}</td>
                  <td className="py-2 px-3 text-cyan-300">{row.example}</td>
                  <td className="py-2 px-3 font-sans text-slate-400">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Production Anti-Ban & Header Best Practices */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-violet-400" />
          <h3 className="text-sm font-bold text-white">Avoiding IP Blocks & 403 Forbidden Errors</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Item 1 */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Mandatory x-fsign Header</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Flashscore's CDN requires the header <code className="text-emerald-400 font-mono">x-fsign: SW9D1eZo</code>{' '}
              along with a valid <code className="text-slate-200 font-mono">Referer: https://www.flashscore.com/</code>.
              Requests without this header return 403 Forbidden.
            </p>
          </div>

          {/* Item 2 */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Realistic User-Agent Strings</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Never send default Python headers like <code className="text-red-400 font-mono">Python-urllib/3.10</code> or{' '}
              <code className="text-red-400 font-mono">python-requests/2.x</code>. Always specify a standard browser User-Agent.
            </p>
          </div>

          {/* Item 3 */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Intelligent Polling & Caching</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Do not hammer the server every 500ms. Live score feeds update approximately every 10–15 seconds. Cache finished
              matches with a TTL of 1 hour to reduce bandwidth and eliminate rate-limiting.
            </p>
          </div>

          {/* Item 4 */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Dual-Engine Fallback Strategy</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Our provided Python suite implements an automatic fallback: if Flashscore rotates CDN tokens on{' '}
              <code className="text-cyan-400 font-mono">.ninja</code>, the scraper automatically falls back to{' '}
              <code className="text-emerald-400 font-mono">flashscore.mobi</code> HTML parser without downtime.
            </p>
          </div>
        </div>

        {/* Copyable Python Headers */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Production Python Request Headers:</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(sampleHeaders);
                setCopiedHeader(true);
                setTimeout(() => setCopiedHeader(false), 2000);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
            >
              {copiedHeader ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedHeader ? 'Copied' : 'Copy Headers'}</span>
            </button>
          </div>
          <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-xs overflow-x-auto select-text">
            {sampleHeaders}
          </pre>
        </div>
      </div>
    </div>
  );
};
