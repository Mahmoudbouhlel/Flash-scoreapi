import React, { useState, useEffect } from 'react';
import { Trophy, Flame, ChevronRight, TrendingUp } from 'lucide-react';
import { LeagueStanding } from '../types';

export const StandingsView: React.FC = () => {
  const [standings, setStandings] = useState<LeagueStanding[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/standings')
      .then((r) => r.json())
      .then((data) => {
        setStandings(data.standings || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching standings:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">League Standings & Recent Form Tracker</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracks team rankings, points, goal difference, and last 5-match form trajectories.
          </p>
        </div>
        <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-emerald-400 font-mono">
          Premier League 2025/2026
        </span>
      </div>

      {/* Standings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 text-center">#</th>
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-3 text-center">P</th>
                <th className="py-3 px-3 text-center">W</th>
                <th className="py-3 px-3 text-center">D</th>
                <th className="py-3 px-3 text-center">L</th>
                <th className="py-3 px-3 text-center">GD</th>
                <th className="py-3 px-3 text-center font-bold text-emerald-400">PTS</th>
                <th className="py-3 px-4 text-center">Recent Form</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
              {standings.map((team) => (
                <tr key={team.rank} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-4 text-center font-bold text-slate-400">
                    <span
                      className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs ${
                        team.rank <= 4
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : team.rank <= 6
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          : 'text-slate-400'
                      }`}
                    >
                      {team.rank}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-sans font-bold text-white text-sm">{team.team}</td>
                  <td className="py-2.5 px-3 text-center text-slate-400">{team.played}</td>
                  <td className="py-2.5 px-3 text-center text-slate-300">{team.won}</td>
                  <td className="py-2.5 px-3 text-center text-slate-300">{team.drawn}</td>
                  <td className="py-2.5 px-3 text-center text-slate-300">{team.lost}</td>
                  <td className="py-2.5 px-3 text-center text-slate-300 font-bold">
                    {team.goal_diff > 0 ? `+${team.goal_diff}` : team.goal_diff}
                  </td>
                  <td className="py-2.5 px-3 text-center font-extrabold text-emerald-400 text-sm">
                    {team.points}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {team.form.map((res, i) => (
                        <span
                          key={i}
                          className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                            res === 'W'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : res === 'D'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {res}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
