import React, { useState } from 'react';
import { Bot, Loader2, HelpCircle, AlertTriangle, Send, Sparkles } from 'lucide-react';
import { TypingAttempt } from '../types';
import ReactMarkdown from 'react-markdown';

interface Props {
  userToken: string;
  recentAttempts: TypingAttempt[];
}

export default function AICoachPanel({ userToken, recentAttempts }: Props) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [testMode, setTestMode] = useState<string>('Standard Speed Run');
  const [manualErrors, setManualErrors] = useState<string>('q, z, p, b');

  const deriveErrorMap = (): Record<string, number> => {
    const errors: Record<string, number> = {};

    if (recentAttempts?.length > 0) {
      recentAttempts.forEach((attempt) => {
        if (attempt.errorHeatmap) {
          Object.entries(attempt.errorHeatmap).forEach(([char, count]) => {
            errors[char] = (errors[char] || 0) + count;
          });
        }
      });
    } else {
      manualErrors.split(',').forEach((char) => {
        const trimmed = char.trim();
        if (trimmed) {
          errors[trimmed] = (errors[trimmed] || 0) + 1;
        }
      });
    }

    return errors;
  };

  const buildLocalReport = () => {
    setLoading(true);
    const errors = deriveErrorMap();
    const attemptCount = recentAttempts?.length || 0;
    const averageWpm = attemptCount > 0
      ? Math.round(recentAttempts.reduce((acc, attempt) => acc + (attempt.wpm || 0), 0) / attemptCount)
      : 42;
    const averageAccuracy = attemptCount > 0
      ? Number((recentAttempts.reduce((acc, attempt) => acc + (attempt.accuracy || 0), 0) / attemptCount).toFixed(1))
      : 88.5;

    const sortedErrorKeys = Object.entries(errors)
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => key.toUpperCase());

    const keyFocus = sortedErrorKeys.length > 0 ? sortedErrorKeys.slice(0, 4).join(', ') : 'home row rhythm';
    const practiceLines = [
      `Maintain a smooth cadence on ${testMode.toLowerCase()}.`,
      `Focus deliberately on ${keyFocus}.`,
      `Keep your wrists relaxed and your shoulders level.`
    ];
    const postureTips = [
      'Keep your wrists neutral and your fingertips light.',
      'Breathe evenly and avoid shoulder tension during fast bursts.'
    ];
    const focusMantra = 'Small consistent gains produce the strongest typing foundation.';

    setReport(
      `### FigTyp Local Coach Report\n\n` +
      `**Mode:** ${testMode}  \\n` +
      `**Average WPM:** ${averageWpm}  \\n` +
      `**Average Accuracy:** ${averageAccuracy}%  \\n` +
      `**Key Focus:** ${keyFocus}  \\n\n` +
      `#### Suggested Practice Lines  \\n` +
      `- ${practiceLines[0]}  \\n` +
      `- ${practiceLines[1]}  \\n` +
      `- ${practiceLines[2]}  \\n\n` +
      `#### Technique Tips  \\n` +
      `- ${postureTips[0]}  \\n` +
      `- ${postureTips[1]}  \\n\n` +
      `#### Focus Mantra  \\n` +
      `${focusMantra}`
    );
    setLoading(false);
  };

  const hasHistoricalAttempts = recentAttempts && recentAttempts.length > 0;

  return (
    <div id="coach-window" className="space-y-6 max-w-5xl mx-auto px-4 pt-1 pb-6 text-slate-100">
      <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-[#131b2e] to-slate-950 border border-slate-800/80 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#8B5CF6]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-3 md:w-2/3">
          <span className="text-[10px] font-mono tracking-widest text-[#8B5CF6] uppercase px-2.5 py-1 bg-[#8B5CF6]/10 rounded-full">
            FigTyp Local Coach
          </span>
          <h2 className="text-2xl font-display font-medium text-white flex items-center gap-2">
            Practical typing guidance from your recent results
          </h2>
          <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
            Generate coach reports from local metrics and error patterns without external AI or cloud services.
          </p>
        </div>
        <button
          onClick={buildLocalReport}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-400 disabled:opacity-50 text-white font-mono text-xs font-semibold rounded-xl cursor-pointer transition flex items-center justify-center gap-2 shadow-lg"
        >
          {loading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Sparkles className="w-4.5 h-4.5" />}
          Generate Coach Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        <div className="rounded-2xl bg-slate-950/40 border border-slate-800/80 p-6 space-y-6">
          <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#8B5CF6]" /> Input summary
          </h3>

          <div className="space-y-4 text-xs font-sans">
            {hasHistoricalAttempts ? (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl space-y-1">
                <span className="text-[#00FF95] font-mono text-[10px] uppercase font-bold block">? History available</span>
                <p className="text-slate-400 text-[11px]">
                  Found {recentAttempts.length} typing records. The coach will incorporate your existing performance metrics.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-[#ffb020]">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span className="font-mono text-[10px] uppercase font-bold text-[#ffb020]">Manual entry mode</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  No historical tests detected for this session. Use manual keys to generate a focused practice report.
                </p>
              </div>
            )}

            <div className="space-y-1 bg-slate-900/30 p-3 rounded-xl border border-slate-800/60">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Current coaching mode</label>
              <select
                value={testMode}
                onChange={(e) => setTestMode(e.target.value)}
                title="Current coaching mode"
                className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-xs text-white cursor-pointer hover:border-slate-800 transition"
              >
                <option value="Home Row Basics">Home Row Basics</option>
                <option value="Advanced Symbol Rush">Advanced Symbol Rush</option>
                <option value="Standard Speed Run">Standard Speed Run</option>
                <option value="JavaScript Syntax">JavaScript Syntax</option>
                <option value="Stenographic Chording">Stenographic Chording</option>
              </select>
            </div>

            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-850 text-slate-500 space-y-2 text-[11px]">
              <div className="flex items-center gap-1 text-[#8B5CF6]">
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="font-mono text-[10px] uppercase font-bold text-[#8B5CF6]">How it works:</span>
              </div>
              <p className="leading-relaxed">
                This coach processes your error pattern and recent typing attempts to deliver realistic practice guidance and performance suggestions.
              </p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 rounded-2xl bg-slate-950/20 border border-slate-800 p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8B5CF6]" /> Coach output
            </h3>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs font-mono gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#8B5CF6]" />
                <span className="animate-pulse">Building your practice report...</span>
              </div>
            ) : report ? (
              <div className="prose prose-invert max-w-none text-xs md:text-sm text-slate-300 leading-relaxed space-y-4">
                <ReactMarkdown>{report}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-center space-y-2">
                <Bot className="w-12 h-12 text-slate-700 animate-bounce" />
                <p className="text-xs max-w-sm">
                  Coach report is empty. Use the button above to generate a local practice summary from your session data.
                </p>
              </div>
            )}
          </div>

          {report && !loading && (
            <div className="mt-6 pt-4 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Report generated locally</span>
              <span>Source: FigTyp Coach</span>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-slate-950/40 border border-slate-800/80 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Manual coaching input</h3>
            <p className="text-slate-400 text-[11px]">Enter mistyped keys and generate coaching notes from local session data.</p>
          </div>
          <button
            onClick={buildLocalReport}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-slate-800 text-white rounded-xl font-semibold text-xs uppercase tracking-[0.08em] hover:brightness-110 transition"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Refresh Report
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-950/50 border border-slate-800 p-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Manual mistake keys</p>
            <input
              value={manualErrors}
              onChange={(e) => setManualErrors(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white outline-none"
              placeholder="q, z, p, b"
            />
          </div>
          <div className="rounded-2xl bg-slate-950/50 border border-slate-800 p-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Selected mode</p>
            <p className="text-sm text-slate-200">{testMode}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
