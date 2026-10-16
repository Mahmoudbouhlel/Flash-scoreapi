import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Download,
  Copy,
  Check,
  RefreshCw,
  Table,
  Cpu,
  Layers,
  Sparkles,
  BarChart2,
  FileSpreadsheet,
} from 'lucide-react';

export const MLExportStudio: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [limit, setLimit] = useState<number>(30);
  const [activeCodeTab, setActiveCodeTab] = useState<'sklearn' | 'xgboost'>('sklearn');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const fetchDataset = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/export/ml-dataset?format=json&limit=${limit}`);
      const data = await res.json();
      setDataset(data.dataset || []);
    } catch (err) {
      console.error('Error fetching ML dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataset();
  }, [limit]);

  const handleDownloadCSV = () => {
    window.location.href = `/api/export/ml-dataset?format=csv&limit=${limit}`;
  };

  const sklearnCode = `import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score

# 1. Load Flashscore feature-engineered dataset
df = pd.read_csv("flashscore_ml_dataset.csv")

# 2. Select predictive features
feature_cols = [
    "home_xg", "away_xg", "xg_difference",
    "home_possession", "away_possession", "possession_differential",
    "home_total_shots", "away_total_shots",
    "home_shots_on_target", "away_shots_on_target", "shots_on_target_diff",
    "home_corners", "away_corners",
    "home_dangerous_attacks", "away_dangerous_attacks"
]

X = df[feature_cols]
y = df["target_outcome"]  # HOME_WIN, DRAW, AWAY_WIN

# 3. Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 4. Train Random Forest Classifier
model = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
model.fit(X_train, y_train)

# 5. Evaluate
y_pred = model.predict(X_test)
print(f"Model Accuracy: {accuracy_score(y_test, y_pred):.2%}")
print(classification_report(y_test, y_pred))
`;

  const xgboostCode = `import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

# 1. Load dataset
df = pd.read_csv("flashscore_ml_dataset.csv")

feature_cols = [
    "home_xg", "away_xg", "xg_difference",
    "home_possession", "possession_differential",
    "home_shots_on_target", "away_shots_on_target", "shots_on_target_diff"
]

X = df[feature_cols]
le = LabelEncoder()
y = le.fit_transform(df["target_outcome"])  # Encodes HOME_WIN, DRAW, AWAY_WIN to 0, 1, 2

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 2. Train XGBoost Model
clf = xgb.XGBClassifier(n_estimators=150, learning_rate=0.05, max_depth=4)
clf.fit(X_train, y_train)

# Feature Importances
for feature, imp in zip(feature_cols, clf.feature_importances_):
    print(f"{feature:<26}: {imp:.4f}")
`;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white">Machine Learning Feature Pipeline & Dataset Exporter</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Extracts high-dimensional predictive features (xG differential, possession dominance, dangerous attacks
              ratio, shot accuracy) directly from Flashscore match feeds for training AI prediction models.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Dataset (.CSV)</span>
            </button>
          </div>
        </div>

        {/* Feature Highlights Pills */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap gap-2 text-[11px]">
          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            🎯 Target: Match Outcome (Home / Draw / Away)
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            📊 Feature: Expected Goals Differential (xG Diff)
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            ⚡ Feature: Possession Dominance Ratio
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            🥅 Feature: Shots on Target & Box Shots
          </span>
        </div>
      </div>

      {/* Dataset Preview Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Engineered Dataset Preview ({dataset.length} Matches)
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Rows:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
            >
              <option value={20}>20 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
            </select>
            <button
              onClick={fetchDataset}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[380px]">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Match</th>
                <th className="py-2.5 px-3">Outcome</th>
                <th className="py-2.5 px-3">Score</th>
                <th className="py-2.5 px-3">Home xG</th>
                <th className="py-2.5 px-3">Away xG</th>
                <th className="py-2.5 px-3">xG Diff</th>
                <th className="py-2.5 px-3">Possession</th>
                <th className="py-2.5 px-3">Shots (Target)</th>
                <th className="py-2.5 px-3">Dang. Attacks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
              {dataset.map((row) => (
                <tr key={row.match_id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2 px-3 font-sans font-semibold text-slate-200 truncate max-w-[180px]">
                    {row.home_team} vs {row.away_team}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.target_outcome === 'HOME_WIN'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : row.target_outcome === 'AWAY_WIN'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {row.target_outcome}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-300 font-bold">
                    {row.home_score} : {row.away_score}
                  </td>
                  <td className="py-2 px-3 text-emerald-400">{row.home_xg}</td>
                  <td className="py-2 px-3 text-cyan-400">{row.away_xg}</td>
                  <td className="py-2 px-3 font-bold text-slate-300">{row.xg_difference}</td>
                  <td className="py-2 px-3 text-slate-400">
                    {row.home_possession}% : {row.away_possession}%
                  </td>
                  <td className="py-2 px-3 text-slate-300">
                    {row.home_shots_on_target} : {row.away_shots_on_target}
                  </td>
                  <td className="py-2 px-3 text-slate-400">
                    {row.home_dangerous_attacks} : {row.away_dangerous_attacks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Training Scripts */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-violet-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Python Machine Learning Training Boilerplate
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setActiveCodeTab('sklearn')}
                className={`px-2.5 py-1 rounded cursor-pointer ${
                  activeCodeTab === 'sklearn' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400'
                }`}
              >
                Scikit-Learn (Random Forest)
              </button>
              <button
                onClick={() => setActiveCodeTab('xgboost')}
                className={`px-2.5 py-1 rounded cursor-pointer ${
                  activeCodeTab === 'xgboost' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400'
                }`}
              >
                XGBoost Classifier
              </button>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(activeCodeTab === 'sklearn' ? sklearnCode : xgboostCode);
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Training Code'}</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-950">
          <pre className="font-mono text-xs text-cyan-300 overflow-x-auto leading-relaxed select-text">
            {activeCodeTab === 'sklearn' ? sklearnCode : xgboostCode}
          </pre>
        </div>
      </div>
    </div>
  );
};
