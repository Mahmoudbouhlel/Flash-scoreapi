import React, { useState } from 'react';
import {
  Code,
  FileCode,
  Download,
  Copy,
  Check,
  FileText,
  Boxes,
  Terminal,
  Cpu,
  Shield,
  Layers,
  FolderTree,
} from 'lucide-react';
import { PYTHON_TEMPLATES, PythonFile } from '../python_templates';
import JSZip from 'jszip';

interface PythonApiStudioProps {
  onOpenRunnerWithCode?: (code: string) => void;
}

export const PythonApiStudio: React.FC<PythonApiStudioProps> = ({ onOpenRunnerWithCode }) => {
  const [selectedFile, setSelectedFile] = useState<PythonFile>(PYTHON_TEMPLATES[0]);
  const [copied, setCopied] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = () => {
    const blob = new Blob([selectedFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('flashscore-python-api');

      PYTHON_TEMPLATES.forEach((file) => {
        folder?.file(file.filename, file.code);
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'flashscore-python-api.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'api':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">FastAPI Server</span>;
      case 'scraper':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Scraper Engine</span>;
      case 'config':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">Deployment</span>;
      case 'test':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Test Suite</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">Direct Feed Scraper</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Sub-100ms response time. Decodes Flashscore's raw ASCII delimiter streams (<code className="text-emerald-400">¬</code> and <code className="text-emerald-400">÷</code>).
            </p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-start gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">FastAPI REST Server</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Production async web API with automatic Swagger OpenAPI documentation at <code className="text-cyan-400">/docs</code>.
            </p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-start gap-3">
          <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">Docker & Client Ready</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Includes Dockerfile, docker-compose, requirements.txt, and standalone test client ready to deploy.
            </p>
          </div>
        </div>
      </div>

      {/* Main Studio Workspace */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row min-h-[620px]">
        {/* Left: File Explorer Sidebar */}
        <div className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/60 flex flex-col">
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <FolderTree className="w-4 h-4 text-emerald-400" />
              <span>Project Files</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">{PYTHON_TEMPLATES.length} files</span>
          </div>

          <div className="p-2 flex-1 overflow-y-auto space-y-1">
            {PYTHON_TEMPLATES.map((file) => {
              const isSelected = selectedFile.filename === file.filename;
              return (
                <button
                  key={file.filename}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 text-white font-medium border border-slate-700/80 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileCode
                      className={`w-4 h-4 shrink-0 ${
                        file.filename.endsWith('.py')
                          ? 'text-emerald-400'
                          : file.filename.endsWith('.txt')
                          ? 'text-cyan-400'
                          : 'text-violet-400'
                      }`}
                    />
                    <span className="text-xs font-mono truncate">{file.filename}</span>
                  </div>
                  {getCategoryBadge(file.category)}
                </button>
              );
            })}
          </div>

          {/* Quick ZIP Download Action */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/80">
            <button
              onClick={handleDownloadAllZip}
              disabled={isZipping}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isZipping ? 'Packing ZIP...' : 'Download Full Package (.zip)'}</span>
            </button>
          </div>
        </div>

        {/* Right: Code Viewer & Actions */}
        <div className="flex-1 flex flex-col bg-slate-950">
          {/* Top Bar for Code Viewer */}
          <div className="px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-slate-100">{selectedFile.filename}</span>
                {getCategoryBadge(selectedFile.category)}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{selectedFile.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy Code'}</span>
              </button>

              <button
                onClick={handleDownloadSingle}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                title={`Download ${selectedFile.filename}`}
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Save File</span>
              </button>

              {selectedFile.language === 'python' && onOpenRunnerWithCode && (
                <button
                  onClick={() => onOpenRunnerWithCode(selectedFile.code)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/40 transition-colors cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Run in Sandbox</span>
                </button>
              )}
            </div>
          </div>

          {/* Code Window with Line Numbers */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-300 leading-relaxed bg-slate-950/90 select-text">
            <pre className="overflow-x-auto whitespace-pre">
              <code>{selectedFile.code}</code>
            </pre>
          </div>

          {/* Code Window Status Bar */}
          <div className="px-5 py-2 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Language: {selectedFile.language.toUpperCase()}</span>
            <span>Lines: {selectedFile.code.split('\n').length} | UTF-8</span>
          </div>
        </div>
      </div>
    </div>
  );
};
