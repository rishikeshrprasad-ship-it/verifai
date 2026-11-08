import React from 'react';
import { VerdictData } from '../types';
import { AlertCircle, CheckCircle2, XCircle, Info, Scale, ShieldAlert, Globe } from 'lucide-react';

interface TruthOMeterProps {
  verdict: VerdictData;
}

export const TruthOMeter: React.FC<TruthOMeterProps> = ({ verdict }) => {
  const {
    final_verdict,
    ensemble_score,
    confidence_percentage,
    meter_zone,
    insufficient_evidence_override,
    formula_weights,
    component_scores
  } = verdict;

  const isUnverified = insufficient_evidence_override?.triggered || final_verdict === 'Unverified';
  const hasLiveWebSearch = insufficient_evidence_override?.live_web_search_context || insufficient_evidence_override?.soft_override;

  // Needle position percentage (0% to 100%)
  const needlePercent = isUnverified ? 0 : Math.min(100, Math.max(0, ensemble_score * 100));

  const zones = [
    { id: 1, label: 'False', sublabel: 'Fabricated', color: '#b91c1c', bg: 'bg-red-700', text: 'text-red-700' },
    { id: 2, label: 'Mostly False', sublabel: 'Distorted', color: '#ea580c', bg: 'bg-orange-600', text: 'text-orange-600' },
    { id: 3, label: 'Half True', sublabel: 'Mixed Context', color: '#d97706', bg: 'bg-amber-600', text: 'text-amber-600' },
    { id: 4, label: 'Mostly True', sublabel: 'Substantial', color: '#65a30d', bg: 'bg-lime-600', text: 'text-lime-600' },
    { id: 5, label: 'True', sublabel: 'Verified', color: '#15803d', bg: 'bg-emerald-700', text: 'text-emerald-700' },
  ];

  return (
    <div className="bg-white dark:bg-[#2D141E]/75 dark:backdrop-blur-2xl rounded-xl border border-stone-200 dark:border-[#E5C158]/30 p-5 shadow-editorial dark:shadow-[0_10px_30px_rgba(0,0,0,0.5),_inset_0_1px_1px_rgba(255,255,255,0.08)]">
      {/* Header with Title & Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 dark:border-[#E5C158]/20 gap-2">
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <Scale className="w-5 h-5 text-stone-700 dark:text-[#E5C158]" />
          <h3 className="font-serif-editorial text-lg font-bold text-stone-900 dark:text-[#FAF6F0]">
            Credibility Meter & Verdict
          </h3>
          {hasLiveWebSearch && (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50 text-[11px] font-mono font-medium">
              <Globe className="w-3 h-3" />
              <span>Live Web Search Context</span>
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs uppercase font-mono tracking-wider text-stone-400 dark:text-[#E5C158]/70">
            Ensemble Confidence
          </span>
          <span className="font-mono text-sm font-bold text-stone-900 dark:text-[#FAF6F0] bg-stone-100 dark:bg-[#200C12] px-2.5 py-0.5 rounded border border-stone-200 dark:border-[#E5C158]/30">
            {isUnverified ? 'N/A' : `${confidence_percentage}%`}
          </span>
        </div>
      </div>

      {/* Main Verdict Display Banner */}
      <div className="my-5 p-4 rounded-lg flex items-center justify-between transition-all"
        style={{
          backgroundColor: isUnverified ? 'rgba(32, 12, 18, 0.6)' : `${verdict.color_code}18`,
          borderLeft: `6px solid ${isUnverified ? '#64748b' : verdict.color_code}`
        }}
      >
        <div className="flex items-center space-x-3">
          {isUnverified ? (
            <AlertCircle className="w-8 h-8 text-slate-500 dark:text-slate-400 flex-shrink-0" />
          ) : meter_zone >= 4 ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          ) : meter_zone <= 2 ? (
            <XCircle className="w-8 h-8 text-red-600 dark:text-rose-400 flex-shrink-0" />
          ) : (
            <Info className="w-8 h-8 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          )}
          <div>
            <span className="text-xs uppercase tracking-wider font-mono font-semibold text-stone-500 dark:text-[#E5C158]/80">
              Institutional Verdict
            </span>
            <div className="text-2xl font-serif-editorial font-bold text-stone-900 dark:text-[#FAF6F0]">
              {final_verdict}
            </div>
          </div>
        </div>

        <div className="text-right hidden sm:block font-mono text-xs text-stone-500 dark:text-[#E5C158]/80">
          <div>Zone: {isUnverified ? 'Override (0)' : `${meter_zone} / 5`}</div>
          <div>Scale: PolitiFact Truth-O-Meter</div>
        </div>
      </div>

      {/* Insufficient Evidence Rule Override Notification (Feature 8) & Breaking News Grace */}
      {insufficient_evidence_override?.soft_override ? (
        <div className="mb-5 p-3.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-700/50 text-blue-900 dark:text-blue-200 text-xs leading-relaxed flex items-start space-x-2">
          <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-bold inline-flex items-center space-x-1 mr-1">
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-mono uppercase tracking-tight">Live Web Search Context</span>
            </span>
            {insufficient_evidence_override.reason || 'Real-time web search expansion corroborated active news reporting.'}
          </div>
        </div>
      ) : isUnverified && (
        <div className="mb-5 p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/50 text-amber-900 dark:text-amber-200 text-xs leading-relaxed flex items-start space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-bold">Insufficient-Evidence Override Rule Active: </span>
            {insufficient_evidence_override.reason || 'Fewer than 2 valid corroborating evidence items passed relevance screening. Verdict forced to Unverified to avoid arbitrary guesses.'}
          </div>
        </div>
      )}

      {/* Horizontal Multi-Zone Graduated Meter Track */}
      <div className="mt-6 mb-2">
        {/* Needle Marker Indicator */}
        <div className="relative h-6 mb-1">
          <div
            className="absolute -top-1 transition-all duration-700 ease-out flex flex-col items-center"
            style={{
              left: `${isUnverified ? 0 : needlePercent}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="bg-stone-900 dark:bg-[#E5C158] text-white dark:text-stone-950 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm">
              {isUnverified ? 'OVERRIDE' : `${Math.round(needlePercent)}%`}
            </div>
            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-stone-900 dark:border-t-[#E5C158]"></div>
          </div>
        </div>

        {/* 5 Distinct Colored Zone Segments */}
        <div className="grid grid-cols-5 h-3.5 rounded-full overflow-hidden border border-stone-300 dark:border-[#E5C158]/30 shadow-inner bg-stone-100 dark:bg-black/50">
          <div className="bg-gradient-to-r from-red-800 to-red-600" title="False / Fabricated" />
          <div className="bg-gradient-to-r from-red-600 to-orange-500" title="Mostly False" />
          <div className="bg-gradient-to-r from-orange-500 to-amber-500" title="Half True / Mixed" />
          <div className="bg-gradient-to-r from-amber-500 to-lime-600" title="Mostly True" />
          <div className="bg-gradient-to-r from-lime-600 to-emerald-700" title="Verified True" />
        </div>

        {/* Zone Labels Underneath */}
        <div className="grid grid-cols-5 text-center mt-2 text-[11px] font-medium text-stone-600 dark:text-stone-300">
          {zones.map((z) => (
            <div key={z.id} className="flex flex-col items-center">
              <span className={`font-semibold ${meter_zone === z.id && !isUnverified ? z.text + ' font-bold underline underline-offset-4' : 'text-stone-700 dark:text-[#FAF6F0]'}`}>
                {z.label}
              </span>
              <span className="text-[9px] text-stone-400 dark:text-[#E5C158]/70 uppercase tracking-tight">
                {z.sublabel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Explainable Ensemble Mathematical Weights Breakdown */}
      <div className="mt-6 pt-4 border-t border-stone-100 dark:border-[#E5C158]/20 bg-stone-50 dark:bg-[#200C12]/80 rounded-lg p-3">
        <div className="flex items-center justify-between text-xs text-stone-600 dark:text-[#E5C158]/85 mb-2">
          <span className="font-semibold text-stone-800 dark:text-[#FAF6F0]">Ensemble Weighting Formula (Documented):</span>
          <span className="font-mono text-[11px] text-stone-500 dark:text-[#E5C158]/70">
            {formula_weights.image > 0
              ? '0.50*Evidence + 0.30*Style + 0.20*Image'
              : '0.65*Evidence + 0.35*Style'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
          <div className="bg-white dark:bg-[#2D141E] p-2 rounded border border-stone-200 dark:border-[#E5C158]/20">
            <span className="text-stone-500 dark:text-[#E5C158]/70 block text-[10px] uppercase">Evidence Stance</span>
            <span className="font-bold text-stone-900 dark:text-[#FAF6F0]">
              {component_scores.evidence_stance_score !== undefined
                ? component_scores.evidence_stance_score.toFixed(2)
                : 'N/A'}
            </span>
            <span className="text-[10px] text-stone-400 dark:text-[#E5C158]/50 ml-1">
              (wt: {formula_weights.evidence})
            </span>
          </div>

          <div className="bg-white dark:bg-[#2D141E] p-2 rounded border border-stone-200 dark:border-[#E5C158]/20">
            <span className="text-stone-500 dark:text-[#E5C158]/70 block text-[10px] uppercase">LIAR Stylistic Model</span>
            <span className="font-bold text-stone-900 dark:text-[#FAF6F0]">
              {component_scores.stylistic_classifier_score !== undefined
                ? component_scores.stylistic_classifier_score.toFixed(2)
                : 'N/A'}
            </span>
            <span className="text-[10px] text-stone-400 dark:text-[#E5C158]/50 ml-1">
              (wt: {formula_weights.style})
            </span>
          </div>

          <div className="bg-white dark:bg-[#2D141E] p-2 rounded border border-stone-200 dark:border-[#E5C158]/20">
            <span className="text-stone-500 dark:text-[#E5C158]/70 block text-[10px] uppercase">Image Visual Hash</span>
            <span className="font-bold text-stone-900 dark:text-[#FAF6F0]">
              {component_scores.image_authenticity_score !== null && component_scores.image_authenticity_score !== undefined
                ? component_scores.image_authenticity_score.toFixed(2)
                : 'Text Only'}
            </span>
            <span className="text-[10px] text-stone-400 dark:text-[#E5C158]/50 ml-1">
              (wt: {formula_weights.image})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
