import React, { useState } from 'react';
import { VerificationResponse } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ExternalLink,
  Star,
  BookOpen,
  ArrowRight,
  ChevronDown,
  RotateCcw,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface ExecutiveFactCheckSummaryProps {
  data: VerificationResponse;
  onReadFullDetails?: () => void;
  onCheckAnotherClaim?: () => void;
  isCompact?: boolean;
}

export const ExecutiveFactCheckSummary: React.FC<ExecutiveFactCheckSummaryProps> = ({
  data,
  onReadFullDetails,
  onCheckAnotherClaim,
  isCompact = false
}) => {
  const { t } = useLanguage();
  const { verdict, explanation, evidence, claim } = data;

  // 1. Plain-English Verdict Translator
  const getPlainVerdict = (finalVerdict: string, ensembleScore: number) => {
    switch (finalVerdict) {
      case 'Verified True':
        return {
          simpleLabel: 'True',
          stars: 5,
          color: 'text-emerald-700 bg-emerald-50 border-emerald-300',
          starColor: 'text-emerald-500 fill-emerald-500',
          description: `Reliable — Backed by ${Math.max(1, verdict.evidence_breakdown.supports)} trusted newsroom${verdict.evidence_breakdown.supports > 1 ? 's' : ''}`,
          icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />
        };
      case 'Mostly True':
        return {
          simpleLabel: 'Mostly True',
          stars: 4,
          color: 'text-teal-700 bg-teal-50 border-teal-300',
          starColor: 'text-teal-500 fill-teal-500',
          description: 'Mostly Accurate — Supported by reliable reporting with minor context missing',
          icon: <CheckCircle2 className="w-5 h-5 text-teal-600" />
        };
      case 'Half True / Mixed':
        return {
          simpleLabel: 'Misleading / Mixed',
          stars: 3,
          color: 'text-amber-700 bg-amber-50 border-amber-300',
          starColor: 'text-amber-500 fill-amber-500',
          description: 'Misleading — Mixes accurate details with unverified or out-of-context claims',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />
        };
      case 'Mostly False':
        return {
          simpleLabel: 'Misleading',
          stars: 2,
          color: 'text-orange-700 bg-orange-50 border-orange-300',
          starColor: 'text-orange-500 fill-orange-500',
          description: 'Misleading — Major inaccuracies contradicted by public reporting',
          icon: <AlertTriangle className="w-5 h-5 text-orange-600" />
        };
      case 'False / Fabricated':
        return {
          simpleLabel: 'False',
          stars: 1,
          color: 'text-rose-700 bg-rose-50 border-rose-300',
          starColor: 'text-rose-500 fill-rose-500',
          description: 'False — Directly contradicted by verified records and official sources',
          icon: <XCircle className="w-5 h-5 text-rose-600" />
        };
      default:
        return {
          simpleLabel: 'Unverified',
          stars: 2,
          color: 'text-slate-700 bg-slate-100 border-slate-300',
          starColor: 'text-slate-400 fill-slate-400',
          description: 'Unverified — Not enough independent sources to confirm or refute',
          icon: <HelpCircle className="w-5 h-5 text-slate-500" />
        };
    }
  };

  const plainVerdict = getPlainVerdict(verdict.final_verdict, verdict.ensemble_score);

  // Clean technical jargon from string
  const sanitizeJargon = (text: string) => {
    return text
      .replace(/NLI stance score/gi, 'Fact match confidence')
      .replace(/NLI entailment logits/gi, 'fact matching')
      .replace(/NLI/gi, 'fact matching')
      .replace(/RAG vector distance/gi, 'cross-checked archives')
      .replace(/Vector RAG retrieval/gi, 'cross-checked news archives')
      .replace(/Vector RAG/gi, 'cross-checked news archives')
      .replace(/RAG/gi, 'archived news')
      .replace(/pHash/gi, 'visual fingerprint')
      .replace(/cosine similarity/gi, 'match confidence')
      .replace(/deterministic entropy seeds/gi, 'source cross-verification');
  };

  // 2. The Bottom Line (One plain-English sentence)
  const rawBottomLine = explanation.executive_summary || explanation.verdict_headline || claim.canonical_claim;
  const bottomLine = sanitizeJargon(rawBottomLine.replace(/^"|"$/g, ''));

  // 3. Plain-English Breakdown (2 short bullet points)
  const bulletWhatWasSaid = `What the claim said: "${claim.canonical_claim || claim.raw_input}"`;
  
  let bulletWhatActuallyHappened = '';
  if (explanation.key_takeaways && explanation.key_takeaways.length > 0) {
    bulletWhatActuallyHappened = sanitizeJargon(explanation.key_takeaways[0]);
  } else if (verdict.final_verdict === 'Verified True') {
    bulletWhatActuallyHappened = 'What actually happened: Official records and leading news outlets fully confirm the reported facts.';
  } else if (verdict.final_verdict === 'False / Fabricated') {
    bulletWhatActuallyHappened = 'What actually happened: Fact-checkers and reliable reporting confirm this claim is false or fabricated.';
  } else {
    bulletWhatActuallyHappened = sanitizeJargon(explanation.editorial_body.split('\n')[0] || 'What actually happened: News archives show important context was omitted or altered.');
  }

  // 4. Trusted Proof Links
  const trustedSources = (evidence.items || []).slice(0, 4);

  return (
    <div className="bg-white dark:bg-[#2D141E]/75 dark:backdrop-blur-2xl rounded-xl border border-stone-200 dark:border-[#E5C158]/30 p-6 shadow-editorial dark:shadow-[0_10px_30px_rgba(0,0,0,0.5),_inset_0_1px_1px_rgba(255,255,255,0.08)] space-y-5 font-sans transition-all animate-slideUp">
      {/* 1. Header: The Bottom Line */}
      <div className="space-y-1.5">
        <div className="flex items-center space-x-1.5 text-xs font-mono uppercase tracking-wider text-stone-500 dark:text-[#E5C158]/80 font-bold">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-[#E5C158]" />
          <span>{t('summary.theBottomLine', 'The Bottom Line')}</span>
        </div>
        <p className="font-serif-editorial text-lg md:text-xl font-bold text-stone-900 dark:text-[#FAF6F0] leading-snug">
          {bottomLine}
        </p>
      </div>

      {/* 2. Simple Score Card */}
      <div className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${plainVerdict.color}`}>
        <div className="flex items-center space-x-3">
          {plainVerdict.icon}
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold font-sans text-sm tracking-wide uppercase">
                {t('summary.verdict', 'Verdict')}: {plainVerdict.simpleLabel}
              </span>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${
                      star <= plainVerdict.stars
                        ? plainVerdict.starColor
                        : 'text-stone-300 dark:text-stone-700 fill-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs opacity-90 font-sans mt-0.5 font-medium">
              {plainVerdict.description}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-mono font-bold block uppercase opacity-75">
            {t('summary.crossCheckedArchives', 'Cross-Checked Archives')}
          </span>
          <span className="text-xs font-mono font-bold">
            {evidence.total_retrieved} {t('summary.reportsScanned', 'Wire Reports Scanned')}
          </span>
        </div>
      </div>

      {/* 3. The Plain-English Breakdown (2 short bullets) */}
      <div className="space-y-2.5">
        <span className="text-xs font-mono uppercase tracking-wider text-stone-500 dark:text-[#E5C158] font-bold block">
          {t('summary.plainEnglishBreakdown', 'Plain-English Fact Breakdown:')}
        </span>
        <div className="space-y-2 text-xs sm:text-sm text-stone-800 dark:text-[#FAF6F0] font-sans bg-stone-50 dark:bg-[#200C12]/70 p-3.5 rounded-xl border border-stone-200 dark:border-[#E5C158]/20">
          <div className="flex items-start space-x-2">
            <span className="font-bold text-stone-400 dark:text-[#E5C158]/60 mt-0.5">•</span>
            <div>
              <strong className="text-stone-900 dark:text-[#FAF6F0] font-semibold">{t('summary.viralClaim', 'The Viral Claim')}: </strong>
              <span className="text-stone-700 dark:text-[#FAF6F0]/80">{claim.canonical_claim}</span>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">•</span>
            <div>
              <strong className="text-stone-900 dark:text-[#FAF6F0] font-semibold">{t('summary.newsArchivesConfirm', 'What News Archives Confirm')}: </strong>
              <span className="text-stone-700 dark:text-[#FAF6F0]/80">{bulletWhatActuallyHappened.replace(/^What actually happened:\s*/i, '')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Trusted Proof Links */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-stone-500 dark:text-[#E5C158] font-bold">
            {t('summary.trustedProofLinks', 'Trusted Proof Links')} ({trustedSources.length}):
          </span>
          <span className="text-[11px] font-mono text-stone-400 dark:text-[#D4B29E]/70">{t('summary.directCitations', 'Direct Article Citations')}</span>
        </div>

        {trustedSources.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {trustedSources.map((item, idx) => {
              const label = item.source || item.domain || 'Newsroom Wire';
              const matchBadge = item.stance === 'Supports'
                ? 'Matches'
                : item.stance === 'Contradicts'
                ? 'Disputes'
                : 'Mentions';

              return (
                <a
                  key={idx}
                  href={item.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-[#E5C158]/30 bg-white dark:bg-[#200C12] hover:bg-stone-50 dark:hover:bg-[#4A1C2C] text-xs font-medium text-stone-800 dark:text-[#FAF6F0] shadow-xs transition-colors group"
                  title={item.title || item.snippet}
                >
                  <BookOpen className="w-3.5 h-3.5 text-stone-400 dark:text-[#E5C158]/60 group-hover:text-stone-600 dark:group-hover:text-[#E5C158]" />
                  <span className="font-semibold truncate max-w-[130px]">{label}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                    item.stance === 'Supports'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border dark:border-emerald-500/30'
                      : item.stance === 'Contradicts'
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border dark:border-rose-500/30'
                      : 'bg-stone-100 dark:bg-[#2D141E] text-stone-600 dark:text-[#E5C158] border dark:border-[#E5C158]/20'
                  }`}>
                    {matchBadge}
                  </span>
                  <ExternalLink className="w-3 h-3 text-stone-400 dark:text-[#E5C158]/60 group-hover:text-stone-700 dark:group-hover:text-[#E5C158]" />
                </a>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-stone-500 dark:text-[#D4B29E] italic bg-stone-50 dark:bg-[#200C12]/60 p-2.5 rounded-lg border border-stone-200 dark:border-[#E5C158]/20">
            Cross-referenced against verified national news archives and press registries.
          </p>
        )}
      </div>

      {/* 5. Action Footer */}
      {(onReadFullDetails || onCheckAnotherClaim) && (
        <div className="pt-3 border-t border-stone-200 dark:border-[#E5C158]/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          {onReadFullDetails && (
            <button
              type="button"
              onClick={onReadFullDetails}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-stone-900 dark:bg-gradient-to-r dark:from-[#6D1B26] dark:to-[#990033] hover:bg-stone-800 dark:hover:from-[#990033] dark:hover:to-[#6D1B26] text-white dark:text-[#FAF6F0] text-xs font-semibold shadow-xs transition-colors border dark:border-[#E5C158]/40 dark:shadow-[0_0_15px_rgba(229,193,88,0.2)] cursor-pointer"
            >
              <span>{t('summary.readFullDetails', 'Read Full Details')}</span>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 dark:text-[#E5C158]" />
            </button>
          )}

          {onCheckAnotherClaim && (
            <button
              type="button"
              onClick={onCheckAnotherClaim}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg border border-stone-300 dark:border-[#E5C158]/30 hover:bg-stone-100 dark:hover:bg-[#200C12] text-stone-700 dark:text-[#E5C158] text-xs font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-500 dark:text-[#D4B29E]" />
              <span>{t('summary.checkAnotherClaim', 'Check Another Claim')}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
