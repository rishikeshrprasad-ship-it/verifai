import React from 'react';
import { EvidenceItem } from '../types';
import { ExternalLink, CheckCircle2, XCircle, MinusCircle, ShieldCheck, Award, Globe } from 'lucide-react';

interface EvidenceCardProps {
  item: EvidenceItem;
  index: number;
  highlightedTag: string | null;
  onTagClick?: (tag: string) => void;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({
  item,
  index,
  highlightedTag,
  onTagClick
}) => {
  const tag = item.citation_tag || `[E${index + 1}]`;
  const isHighlighted = highlightedTag === tag;

  const getStanceBadge = () => {
    switch (item.stance) {
      case 'Supports':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Supports Claim</span>
          </span>
        );
      case 'Contradicts':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
            <XCircle className="w-3.5 h-3.5" />
            <span>Refutes Claim</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-300">
            <MinusCircle className="w-3.5 h-3.5" />
            <span>Context / Neutral</span>
          </span>
        );
    }
  };

  const getTrustBadgeColor = (trust: number) => {
    if (trust >= 0.95) return 'bg-blue-50 text-blue-800 border-blue-200';
    if (trust >= 0.85) return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    if (trust >= 0.70) return 'bg-stone-100 text-stone-800 border-stone-200';
    return 'bg-amber-50 text-amber-800 border-amber-200';
  };

  return (
    <div
      id={`evidence-card-${tag.replace(/[[\]]/g, '')}`}
      className={`rounded-xl border p-4 transition-all duration-300 transform-gpu will-change-transform ${
        isHighlighted
          ? 'ring-2 ring-blue-600 dark:ring-[#E5C158] bg-blue-50/50 dark:bg-[#3D1A28] shadow-md border-blue-300 dark:border-[#E5C158]'
          : 'bg-white dark:bg-[#2D141E] border-stone-200 dark:border-[#E5C158]/30 hover:border-stone-300 dark:hover:border-[#E5C158]/60 hover:shadow-[0_15px_30px_rgba(0,0,0,0.5),_0_0_15px_rgba(229,193,88,0.1)] hover:-translate-y-0.5'
      }`}
    >
      {/* Top Meta: Citation Tag, Source, Stance */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center space-x-2">
          {/* Interactive Citation Chip */}
          <button
            onClick={() => onTagClick && onTagClick(tag)}
            className="px-2 py-0.5 rounded bg-stone-900 dark:bg-gradient-to-r dark:from-[#6D1B26] dark:to-[#990033] text-white dark:text-[#FAF6F0] font-mono font-bold text-xs tracking-wide shadow-sm hover:bg-stone-800 dark:hover:brightness-110 border dark:border-[#E5C158]/40"
            title="Referenced in Editorial Explanation"
          >
            {tag}
          </button>
          
          <div>
            <div className="flex items-center space-x-1.5 flex-wrap">
              <h4 className="font-sans font-bold text-sm text-stone-900 dark:text-[#FAF6F0] leading-snug">
                {item.source}
              </h4>
              {item.is_live_web_search && (
                <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50 text-[10px] font-mono">
                  <Globe className="w-2.5 h-2.5" />
                  <span>Live Web</span>
                </span>
              )}
            </div>
            <span className="text-[11px] font-mono text-stone-500 dark:text-[#E5C158]/70">
              {item.domain}
            </span>
          </div>
        </div>

        {/* Stance Indicator */}
        <div>{getStanceBadge()}</div>
      </div>

      {/* Article Title */}
      <h5 className="font-serif-editorial font-bold text-stone-900 dark:text-[#FAF6F0] text-base mb-2 leading-snug">
        {item.title}
      </h5>

      {/* Snippet / Quotation */}
      <p className="text-stone-700 dark:text-[#FAF6F0]/90 text-xs sm:text-sm leading-relaxed mb-3 italic bg-stone-50 dark:bg-[#200C12]/80 p-2.5 rounded border border-stone-200/70 dark:border-[#E5C158]/25">
        "{item.snippet}"
      </p>

      {/* Bottom Metadata: Trust Tier, Relevance, Direct Link */}
      <div className="pt-2 border-t border-stone-100 dark:border-[#E5C158]/20 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2 flex-wrap">
          {/* Domain Trust */}
          <span
            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded border text-[11px] font-medium ${getTrustBadgeColor(
              item.domain_trust
            )}`}
            title={item.trust_justification || 'Domain Trust Score'}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Trust: {Math.round(item.domain_trust * 100)}%</span>
            {item.trust_tier && (
              <span className="hidden sm:inline text-[10px] opacity-75">
                • {item.trust_tier.split(':')[0]}
              </span>
            )}
          </span>

          {/* Relevance Gate Score */}
          <span
            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-stone-100 dark:bg-[#200C12] text-stone-700 dark:text-[#E5C158] border border-stone-200 dark:border-[#E5C158]/30 text-[11px] font-mono"
            title="Semantic Cosine Similarity with Claim (Threshold >= 0.40, Live Search >= 0.32)"
          >
            <span>Rel: {(item.computed_relevance ?? item.relevance_score ?? 0.75).toFixed(2)}</span>
          </span>
        </div>

        {/* Link to Source */}
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-stone-600 dark:text-[#E5C158] hover:text-stone-900 dark:hover:text-[#FAF6F0] font-medium text-xs underline underline-offset-2"
          >
            <span>Inspect Source</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};
