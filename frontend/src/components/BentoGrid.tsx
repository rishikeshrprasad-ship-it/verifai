import React, { useState } from 'react';
import { VerificationResponse } from '../types';
import { TruthOMeter } from './TruthOMeter';
import { ExplanationPanel } from './ExplanationPanel';
import { EvidenceCard } from './EvidenceCard';
import { ImageForensicsCard } from './ImageForensicsCard';
import {
  Quote,
  Tag,
  Globe,
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Share2,
  Download,
  Flame,
  MessageSquare
} from 'lucide-react';

interface BentoGridProps {
  data: VerificationResponse;
  imagePreviewUrl?: string | null;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ data, imagePreviewUrl }) => {
  const [evidenceFilter, setEvidenceFilter] = useState<'ALL' | 'SUPPORTS' | 'CONTRADICTS' | 'NEUTRAL'>('ALL');
  const [highlightedTag, setHighlightedTag] = useState<string | null>(null);

  const { claim, verdict, explanation, evidence, stylistic_signals, image_forensics, ocr_details } = data;

  const filteredEvidence = evidence.items.filter((item) => {
    if (evidenceFilter === 'SUPPORTS') return item.stance === 'Supports';
    if (evidenceFilter === 'CONTRADICTS') return item.stance === 'Contradicts';
    if (evidenceFilter === 'NEUTRAL') return item.stance === 'Neutral';
    return true;
  });

  const handleCitationClick = (tag: string) => {
    setHighlightedTag(tag);
    // Smooth scroll to card if on page
    const el = document.getElementById(`evidence-card-${tag.replace(/[[\]]/g, '')}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ----------------- BENTO BLOCK 1: CANONICAL CLAIM & ENTITY CARD ----------------- */}
      <div className="bg-white dark:bg-[#2D141E]/75 dark:backdrop-blur-2xl rounded-xl border border-stone-200 dark:border-[#E5C158]/30 p-5 shadow-editorial dark:shadow-[0_10px_30px_rgba(0,0,0,0.5),_inset_0_1px_1px_rgba(255,255,255,0.08)]">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-4xl">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-stone-100 dark:bg-[#200C12] text-stone-700 dark:text-[#E5C158] border border-stone-300 dark:border-[#E5C158]/30">
                Verified Investigation
              </span>
              <span className="text-xs font-mono text-stone-500 dark:text-[#E5C158]/70">ID: {data.check_id}</span>
              {(verdict.insufficient_evidence_override?.live_web_search_context || evidence.items?.some(e => e.is_live_web_search)) && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50 flex items-center space-x-1 font-semibold">
                  <Globe className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span>[Live Internet Search (Zero-Key Mode)]</span>
                </span>
              )}
              {claim.translation?.is_translated && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50">
                  Detected: {claim.translation.detected_language} (Translated to EN)
                </span>
              )}
            </div>

            <h2 className="font-serif-editorial text-xl sm:text-2xl font-bold text-stone-900 dark:text-[#FAF6F0] leading-snug">
              "{claim.canonical_claim}"
            </h2>

            {claim.raw_input !== claim.canonical_claim && (
              <p className="text-xs text-stone-500 dark:text-[#D4B29E] font-mono italic">
                Original Input: "{claim.raw_input.substring(0, 140)}..."
              </p>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-2 flex-shrink-0 self-start">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                alert('Investigation report link copied to clipboard.');
              }}
              className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-[#E5C158]/30 text-xs font-medium text-stone-700 dark:text-[#FAF6F0] bg-white dark:bg-[#200C12] hover:bg-stone-50 dark:hover:bg-[#3D1A28] flex items-center space-x-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Named Entities & Search Keywords Chip Bar */}
        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-[#E5C158]/20 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-stone-400 dark:text-[#E5C158]/70 font-mono text-[11px] uppercase tracking-wider flex items-center space-x-1">
            <Tag className="w-3 h-3" />
            <span>Entities:</span>
          </span>

          {claim.entities?.organizations?.map((org, i) => (
            <span key={i} className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-[#200C12] text-stone-800 dark:text-[#E5C158] border border-stone-200 dark:border-[#E5C158]/25 font-medium">
              {org}
            </span>
          ))}

          {claim.entities?.locations?.map((loc, i) => (
            <span key={i} className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-[#200C12] text-stone-800 dark:text-[#E5C158] border border-stone-200 dark:border-[#E5C158]/25 font-medium">
              {loc}
            </span>
          ))}

          {claim.entities?.dates_or_numbers?.map((num, i) => (
            <span key={i} className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-[#200C12] text-stone-800 dark:text-[#E5C158] border border-stone-200 dark:border-[#E5C158]/25 font-mono text-[11px]">
              {num}
            </span>
          ))}

          {claim.search_keywords?.map((kw, i) => (
            <span key={i} className="px-2 py-0.5 rounded-md bg-stone-50 dark:bg-[#200C12]/70 text-stone-600 dark:text-[#E5C158]/80 border border-stone-200 dark:border-[#E5C158]/20 font-mono text-[11px]">
              #{kw}
            </span>
          ))}
        </div>
      </div>

      {/* ----------------- BENTO ROW 2: TRUTH-O-METER & EDITORIAL SYNTHESIS ----------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Module 2: Truth-O-Meter (5 Cols on large screens) */}
        <div className="lg:col-span-5 space-y-6">
          <TruthOMeter verdict={verdict} />

          {/* Module: Stylistic Credibility Signal (Feature 9) */}
          <div className="bg-white dark:bg-[#2D141E]/75 dark:backdrop-blur-2xl rounded-xl border border-stone-200 dark:border-[#E5C158]/30 p-4 shadow-editorial dark:shadow-[0_10px_30px_rgba(0,0,0,0.5),_inset_0_1px_1px_rgba(255,255,255,0.08)]">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-[#E5C158]/20 mb-3">
              <span className="font-serif-editorial text-sm font-bold text-stone-900 dark:text-[#FAF6F0] flex items-center space-x-1.5">
                <Flame className="w-4 h-4 text-stone-700 dark:text-[#E5C158]" />
                <span>LIAR Benchmark Stylistic Classifier</span>
              </span>
              <span className="text-[10px] font-mono uppercase text-stone-400 dark:text-[#E5C158]/70">
                TF-IDF + LogReg
              </span>
            </div>

            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-stone-600 dark:text-[#E5C158]/80">Linguistic Credibility Index:</span>
              <span className="font-mono font-bold text-stone-900 dark:text-[#FAF6F0] bg-stone-100 dark:bg-[#200C12] px-2 py-0.5 rounded border dark:border-[#E5C158]/30">
                {(stylistic_signals.stylistic_credibility_score * 100).toFixed(1)}%
              </span>
            </div>

            <div className="w-full bg-stone-200 dark:bg-black/50 h-2 rounded-full overflow-hidden mb-3 border dark:border-[#E5C158]/20">
              <div
                className="h-full bg-stone-800 dark:bg-gradient-to-r dark:from-[#6D1B26] dark:to-[#E5C158] rounded-full"
                style={{ width: `${stylistic_signals.stylistic_credibility_score * 100}%` }}
              />
            </div>

            {stylistic_signals.active_stylistic_tokens?.length > 0 && (
              <div className="text-[11px] text-stone-500 dark:text-[#D4B29E] font-mono">
                <span>Active n-grams: </span>
                <span className="text-stone-700 dark:text-[#FAF6F0] font-medium">
                  {stylistic_signals.active_stylistic_tokens.join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Module 3: Editorial Synthesis & Citations (7 Cols on large screens) */}
        <div className="lg:col-span-7">
          <ExplanationPanel
            explanation={explanation}
            highlightedTag={highlightedTag}
            setHighlightedTag={setHighlightedTag}
            onCitationClick={handleCitationClick}
          />
        </div>
      </div>

      {/* ----------------- BENTO ROW 3: IMAGE FORENSICS (IF APPLICABLE) ----------------- */}
      {(image_forensics || ocr_details) && (
        <ImageForensicsCard
          forensics={image_forensics}
          ocr={ocr_details}
          imagePreviewUrl={imagePreviewUrl}
        />
      )}

      {/* ----------------- BENTO ROW 4: EVIDENCE DECK (SPLIT TABS & CARDS) ----------------- */}
      <div className="bg-white dark:bg-[#2D141E]/75 dark:backdrop-blur-2xl rounded-xl border border-stone-200 dark:border-[#E5C158]/30 p-5 shadow-editorial dark:shadow-[0_10px_30px_rgba(0,0,0,0.5),_inset_0_1px_1px_rgba(255,255,255,0.08)]">
        {/* Evidence Deck Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 dark:border-[#E5C158]/20 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Quote className="w-5 h-5 text-stone-700 dark:text-[#E5C158]" />
              <h3 className="font-serif-editorial text-lg font-bold text-stone-900 dark:text-[#FAF6F0]">
                Corroborating Evidence Deck
              </h3>
            </div>
            <p className="text-xs text-stone-500 dark:text-[#D4B29E] mt-0.5">
              Multi-channel retrieval from wire services, official registries, and community discussions.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 bg-stone-100 dark:bg-[#200C12] p-1 rounded-lg text-xs font-medium self-start sm:self-auto border dark:border-[#E5C158]/30">
            <button
              onClick={() => setEvidenceFilter('ALL')}
              className={`px-3 py-1 rounded-md transition-all ${
                evidenceFilter === 'ALL'
                  ? 'bg-white dark:bg-gradient-to-r dark:from-[#6D1B26] dark:to-[#990033] text-stone-900 dark:text-[#E5C158] shadow-xs font-bold border dark:border-[#E5C158]/50 dark:shadow-[0_0_15px_rgba(229,193,88,0.2)]'
                  : 'text-stone-600 dark:text-[#E5C158]/80 hover:text-stone-900 dark:hover:text-[#FAF6F0]'
              }`}
            >
              All ({evidence.items.length})
            </button>
            <button
              onClick={() => setEvidenceFilter('SUPPORTS')}
              className={`px-3 py-1 rounded-md flex items-center space-x-1 transition-all ${
                evidenceFilter === 'SUPPORTS'
                  ? 'bg-emerald-700 text-white shadow-xs font-bold'
                  : 'text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Supports ({verdict.evidence_breakdown.supports})</span>
            </button>
            <button
              onClick={() => setEvidenceFilter('CONTRADICTS')}
              className={`px-3 py-1 rounded-md flex items-center space-x-1 transition-all ${
                evidenceFilter === 'CONTRADICTS'
                  ? 'bg-red-700 text-white shadow-xs font-bold'
                  : 'text-red-800 dark:text-rose-300 hover:bg-red-50 dark:hover:bg-rose-950/40'
              }`}
            >
              <XCircle className="w-3 h-3" />
              <span>Refutes ({verdict.evidence_breakdown.contradicts})</span>
            </button>
          </div>
        </div>

        {/* Evidence Cards Grid */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvidence.map((item, idx) => (
            <EvidenceCard
              key={item.id || idx}
              item={item}
              index={idx}
              highlightedTag={highlightedTag}
              onTagClick={handleCitationClick}
            />
          ))}
        </div>

        {filteredEvidence.length === 0 && (
          <div className="text-center py-8 text-stone-400 dark:text-[#E5C158]/60 text-sm">
            No evidence pieces in this filter category.
          </div>
        )}

        {/* Relevance Gate Metric Summary */}
        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-[#E5C158]/20 flex flex-wrap items-center justify-between text-xs text-stone-500 dark:text-[#E5C158]/70 font-mono">
          <div>
            Total Retrieved: {evidence.total_retrieved} | Passed Relevance Gate (MiniLM &ge; 0.40):{' '}
            <span className="text-stone-900 dark:text-[#FAF6F0] font-bold">{evidence.passed_relevance_gate}</span>
            {evidence.rejected_by_relevance_gate > 0 && (
              <span className="text-stone-400 dark:text-[#E5C158]/50">
                {' '}
                ({evidence.rejected_by_relevance_gate} discarded before stance detection)
              </span>
            )}
          </div>
          <div>{evidence.used_offline_fallback ? 'Offline Pre-Pulled Verified Dataset' : 'Live Multi-Source API'}</div>
        </div>
      </div>
    </div>
  );
};
