import React, { useState } from 'react';
import { Send, Copy, Check, Play, Clock, Code2, Database, Layers } from 'lucide-react';

interface EndpointConfig {
  name: string;
  method: 'GET' | 'POST';
  path: string;
  description: string;
  defaultParams: Record<string, string>;
}

const ENDPOINTS: EndpointConfig[] = [
  {
    name: "Get Today's Matches",
    method: 'GET',
    path: '/api/matches',
    description: "Scrapes today's matches for soccer or any sport, with status and league filtering",
    defaultParams: {
      sport: 'football',
      status: 'all',
      day_offset: '0',
    },
  },
  {
    name: 'Get Live Matches (In-Play)',
    method: 'GET',
    path: '/api/matches',
    description: 'Real-time query for all active live games with current minute and scores',
    defaultParams: {
      sport: 'football',
      status: 'live',
    },
  },
  {
    name: 'Get Single Match Detail',
    method: 'GET',
    path: '/api/match/:id',
    description: 'Fetch detailed period scores, kickoff time, and status for a specific match',
    defaultParams: {
      id: 'KSryyLc3',
    },
  },
  {
    name: "Get Supported Sports",
    method: 'GET',
    path: '/api/sports',
    description: 'Returns all sports supported by the Flashscore feed decoder',
    defaultParams: {},
  },
  {
    name: 'Global Match Analysis (All Discovered Fixtures)',
    method: 'GET',
    path: '/api/v2/analyzer/global',
    description: 'Returns probabilities for Home Win, Away Win, Over 2.5, and BTTS Yes for all discovered matches stored in DB',
    defaultParams: {},
  },
  {
    name: 'Run Global Match Analysis Service',
    method: 'POST',
    path: '/api/v2/analyzer/run',
    description: 'Triggers GlobalMatchAnalyzer background service to calculate probabilities across all discovered matches',
    defaultParams: {},
  },
];

export const ApiExplorer: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointConfig>(ENDPOINTS[0]);
  const [params, setParams] = useState<Record<string, string>>(ENDPOINTS[0].defaultParams);
  const [loading, setLoading] = useState<boolean>(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseLatency, setResponseLatency] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any | null>(null);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'python-requests' | 'python-httpx' | 'curl' | 'javascript'>(
    'python-requests'
  );
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);

  const handleSelectEndpoint = (ep: EndpointConfig) => {
    setSelectedEndpoint(ep);
    setParams({ ...ep.defaultParams });
    setResponseData(null);
    setResponseStatus(null);
  };

  const handleParamChange = (key: string, value: string) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const executeRequest = async () => {
    setLoading(true);
    const start = performance.now();

    try {
      let url = selectedEndpoint.path;

      if (url.includes(':id')) {
        const idVal = params['id'] || 'KSryyLc3';
        url = url.replace(':id', encodeURIComponent(idVal));
      } else {
        const qp = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v && k !== 'id') qp.append(k, v);
        });
        const qs = qp.toString();
        if (qs) url += `?${qs}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setResponseStatus(res.status);
      setResponseData(data);
      setResponseLatency(Math.round(performance.now() - start));
    } catch (err: any) {
      setResponseStatus(500);
      setResponseData({ error: err.message || 'Request failed' });
      setResponseLatency(Math.round(performance.now() - start));
    } finally {
      setLoading(false);
    }
  };

  const getComputedUrl = () => {
    let url = selectedEndpoint.path;
    if (url.includes(':id')) {
      url = url.replace(':id', params['id'] || 'KSryyLc3');
    } else {
      const qp = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v && k !== 'id') qp.append(k, v);
      });
      const qs = qp.toString();
      if (qs) url += `?${qs}`;
    }
    return `http://localhost:8000${url.replace('/api', '/api/v1')}`;
  };

  const generateSnippet = () => {
    const fullUrl = getComputedUrl();

    switch (activeCodeTab) {
      case 'python-requests':
        return `import requests

url = "${fullUrl}"
response = requests.get(url, timeout=10)
data = response.json()

print(f"Status Code: {response.status_code}")
print(f"Count: {data.get('count', len(data.get('matches', [])))}")
for item in data.get("matches", [])[:3]:
    print(item)
`;
      case 'python-httpx':
        return `import asyncio
import httpx

async def main():
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get("${fullUrl}")
        data = response.json()
        print(data)

asyncio.run(main())
`;
      case 'curl':
        return `curl -X GET "${fullUrl}" \\
  -H "Accept: application/json"
`;
      case 'javascript':
        return `const response = await fetch("${fullUrl}");
const data = await response.json();
console.log(data);
`;
      default:
        return '';
    }
  };

  const copyToClipboard = (text: string, type: 'json' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'json') {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } else {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Play className="w-4 h-4" />
          </span>
          <h2 className="text-base font-bold text-white">Interactive Swagger / OpenAPI Explorer</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Test the REST endpoints generated by our FastAPI Python server. Execute calls, inspect headers and latency,
          and export client code snippets in Python, cURL, or JavaScript.
        </p>
      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Endpoint Picker & Parameters (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Endpoint Picker */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Available Endpoints
            </span>
            <div className="space-y-1.5">
              {ENDPOINTS.map((ep, idx) => {
                const isSelected = selectedEndpoint.name === ep.name;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectEndpoint(ep)}
                    className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-slate-800/90 border-emerald-500/40 text-white shadow-sm'
                        : 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 font-mono">
                        {ep.method}
                      </span>
                      <span className="text-xs font-semibold text-slate-200">{ep.name}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 mt-1 truncate">{ep.path}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parameters Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Query Parameters & Path
            </span>

            {Object.keys(params).length === 0 ? (
              <p className="text-xs text-slate-500 italic">No parameters required for this endpoint.</p>
            ) : (
              <div className="space-y-2.5">
                {Object.entries(params).map(([key, val]) => (
                  <div key={key}>
                    <label className="text-xs font-mono text-slate-300 block mb-1">
                      {key} {key === 'id' && <span className="text-red-400">*</span>}
                    </label>
                    {key === 'sport' ? (
                      <select
                        value={val}
                        onChange={(e) => handleParamChange(key, e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="football">football (Soccer)</option>
                        <option value="basketball">basketball</option>
                        <option value="tennis">tennis</option>
                        <option value="hockey">hockey (Ice Hockey)</option>
                        <option value="baseball">baseball</option>
                        <option value="volleyball">volleyball</option>
                        <option value="cricket">cricket</option>
                      </select>
                    ) : key === 'status' ? (
                      <select
                        value={val}
                        onChange={(e) => handleParamChange(key, e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="all">all</option>
                        <option value="live">live</option>
                        <option value="finished">finished</option>
                        <option value="scheduled">scheduled</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => handleParamChange(key, e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={executeRequest}
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Sending Request...' : 'Send Request'}</span>
            </button>
          </div>
        </div>

        {/* Right: Response Output & Code Snippets (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Response Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col min-h-[320px]">
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">Response Payload</span>
              </div>

              {responseStatus !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {responseLatency}ms
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                      responseStatus === 200
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {responseStatus} OK
                  </span>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(responseData, null, 2), 'json')}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    title="Copy response JSON"
                  >
                    {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 p-4 overflow-auto max-h-[360px] font-mono text-xs">
              {loading ? (
                <div className="flex items-center justify-center h-full py-16 text-slate-500 animate-pulse">
                  Sending request and parsing Flashscore live feed...
                </div>
              ) : !responseData ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-slate-600 text-xs italic">
                  Select parameters and click "Send Request" to test live API response.
                </div>
              ) : (
                <pre className="text-emerald-400 whitespace-pre-wrap select-text">
                  {JSON.stringify(responseData, null, 2)}
                </pre>
              )}
            </div>
          </div>

          {/* Client Code Snippet Generator */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200">Generated Client Snippet</span>
              </div>

              {/* Language Pills */}
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={() => setActiveCodeTab('python-requests')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    activeCodeTab === 'python-requests'
                      ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  requests
                </button>
                <button
                  onClick={() => setActiveCodeTab('python-httpx')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    activeCodeTab === 'python-httpx'
                      ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  httpx
                </button>
                <button
                  onClick={() => setActiveCodeTab('curl')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    activeCodeTab === 'curl'
                      ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setActiveCodeTab('javascript')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    activeCodeTab === 'javascript'
                      ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  fetch
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-950 relative">
              <button
                onClick={() => copyToClipboard(generateSnippet(), 'code')}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
              >
                {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSnippet ? 'Copied' : 'Copy'}</span>
              </button>
              <pre className="font-mono text-xs text-cyan-300 overflow-x-auto pr-20 select-text">
                {generateSnippet()}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
