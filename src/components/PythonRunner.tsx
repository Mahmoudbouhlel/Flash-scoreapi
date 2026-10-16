import React, { useState } from 'react';
import {
  Play,
  Terminal,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';
import { RunPythonResult } from '../types';

const PRESETS = [
  {
    title: '1. Scrape Live Football Matches (Feed Scraper)',
    desc: 'Uses FlashscoreFeedScraper to decode live in-play games and current minutes',
    code: `from flashscore_feed import FlashscoreFeedScraper

# Initialize feed scraper
scraper = FlashscoreFeedScraper()

print("--> Fetching live football matches...")
matches = scraper.get_matches(sport="football", day_offset=0, status="live")

print(f"Total Live Games Found: {len(matches)}")
print("-" * 65)

for m in matches[:8]:
    score_display = f"{m['home_score']} : {m['away_score']}"
    minute = m.get('elapsed_minute') or 'Live'
    print(f"[{minute:>5}] {m['home_team']:<24} {score_display:^7} {m['away_team']:<24} | {m['league']}")
`,
  },
  {
    title: '2. Scrape Today Basketball / NBA Games',
    desc: 'Queries Sport ID 3 (Basketball) for today with period score breakdowns',
    code: `from flashscore_feed import FlashscoreFeedScraper

scraper = FlashscoreFeedScraper()

print("--> Fetching Basketball games...")
matches = scraper.get_matches(sport="basketball", day_offset=0, status="all")

print(f"Found {len(matches)} basketball matches today!")
print("-" * 65)

for m in matches[:6]:
    periods_str = ", ".join([f"{p['home']}-{p['away']}" for p in m.get('periods', [])])
    print(f"[{m['status']:<9}] {m['home_team']} {m['home_score']}:{m['away_score']} {m['away_team']}")
    if periods_str:
        print(f"            Quarters: ({periods_str})")
`,
  },
  {
    title: '3. Inspect Raw Delimiter Feed (¬ and ÷ Protocol)',
    desc: 'Shows how Flashscore transmits raw data packets and how our decoder extracts keys',
    code: `import urllib.request

# Fetch raw stream directly from Flashscore CDN
url = "https://46.flashscore.ninja/37/x/feed/f_1_0_3_en_1"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "x-fsign": "SW9D1eZo",
    "Referer": "https://www.flashscore.com/"
}

req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req, timeout=5) as resp:
    raw_text = resp.read().decode('utf-8', errors='ignore')

print(f"Raw feed received: {len(raw_text)} bytes")
blocks = raw_text.split("~")
print(f"Total delimiter blocks: {len(blocks)}")
print("\\nFirst 2 parsed match blocks:")
print("=" * 60)

for b in blocks[1:3]:
    fields = {}
    for item in b.split("¬"):
        if "÷" in item:
            k, v = item.split("÷", 1)
            fields[k] = v
    print(f"Match ID: {fields.get('AA')}")
    print(f"Teams:    {fields.get('AE')} vs {fields.get('AF')}")
    print(f"Score:    {fields.get('AG', '-')} : {fields.get('AH', '-')}")
    print(f"Status:   Code {fields.get('AB')}")
    print("-" * 60)
`,
  },
  {
    title: '4. Mobile HTML Scraper (flashscore.mobi)',
    desc: 'Uses FlashscoreMobiScraper to parse mobile HTML without headless browser',
    code: `from flashscore_mobi import FlashscoreMobiScraper

mobi = FlashscoreMobiScraper()

print("--> Querying flashscore.mobi for tennis matches...")
tennis_matches = mobi.get_matches(sport="tennis", status="all")

print(f"Total Tennis Matches Scraped: {len(tennis_matches)}")
for m in tennis_matches[:5]:
    print(f"[{m['status']}] {m['home_team']} vs {m['away_team']} ({m['league']})")
`,
  },
];

interface PythonRunnerProps {
  initialCode?: string;
}

export const PythonRunner: React.FC<PythonRunnerProps> = ({ initialCode }) => {
  const [code, setCode] = useState<string>(initialCode || PRESETS[0].code);
  const [running, setRunning] = useState<boolean>(false);
  const [result, setResult] = useState<RunPythonResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleRun = async () => {
    setRunning(true);
    setResult(null);

    try {
      const res = await fetch('/api/python/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({
        success: false,
        exitCode: 1,
        durationMs: 0,
        stdout: '',
        stderr: err.message || 'Execution failed',
      });
    } finally {
      setRunning(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Terminal className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-white">Live Python Execution Sandbox</h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Python 3.10 Runtime
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Test Python code directly against live Flashscore feeds in real time. Modify the script, execute it, and
              inspect the console output.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRun}
              disabled={running}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {running ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Running Python...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Script (Ctrl+Enter)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Preset Code Snippets:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => setCode(preset.code)}
                className="text-left p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/70 border border-slate-800 text-xs transition-colors cursor-pointer"
              >
                <div className="font-semibold text-slate-200">{preset.title}</div>
                <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{preset.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor & Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 min-h-[480px]">
        {/* Left: Code Editor */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-xl">
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span>Python Script Editor</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={() => setCode(PRESETS[0].code)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                title="Reset to default script"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          <div className="flex-1 p-3 bg-slate-950">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleRun();
                }
              }}
              spellCheck={false}
              className="w-full h-full min-h-[380px] bg-transparent text-emerald-300 font-mono text-xs focus:outline-none resize-none leading-relaxed p-1"
            />
          </div>

          <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-[11px] text-slate-500">
            <span>Tip: Press Ctrl+Enter to execute</span>
            <span>UTF-8</span>
          </div>
        </div>

        {/* Right: Terminal Console */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-xl">
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Execution Output & Logs</span>
            </div>

            {result && (
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {result.durationMs}ms
                </span>
                {result.success ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Exit: 0
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                    <AlertTriangle className="w-3 h-3" /> Exit: {result.exitCode}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 p-4 bg-slate-950 font-mono text-xs overflow-auto min-h-[380px]">
            {running ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2 py-16">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                <span>Executing Python process...</span>
              </div>
            ) : !result ? (
              <div className="text-slate-600 text-xs italic py-8 text-center">
                Click "Run Script" to execute this code in the live Python 3 environment.
              </div>
            ) : (
              <div className="space-y-3">
                {result.stdout && (
                  <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed select-text">
                    {result.stdout}
                  </pre>
                )}
                {result.stderr && (
                  <pre className="text-red-400 bg-red-950/20 p-3 rounded-lg border border-red-900/40 whitespace-pre-wrap select-text">
                    {result.stderr}
                  </pre>
                )}
              </div>
            )}
          </div>

          <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-900/40 text-[11px] text-slate-500 flex justify-between">
            <span>Process: /usr/bin/python3</span>
            <span>Sandbox Timeout: 12s</span>
          </div>
        </div>
      </div>
    </div>
  );
};
