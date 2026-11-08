import React from 'react';
import { ExplanationData } from '../types';
import { FileText, CheckCircle2, Bookmark, Lightbulb } from 'lucide-react';

interface ExplanationPanelProps {
  explanation: ExplanationData;
  highlightedTag: string | null;
  setHighlightedTag: (tag: string | null) => void;
  onCitationClick: (tag: string) => void;
}

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({
  explanation,
  highlightedTag,
  setHighlightedTag,
  onCitationClick
}) => {
  const { verdict_headline, executive_summary, editorial_body, citations, key_takeaways } =
    explanation;

  // Render text with interactive citation pills [E1], [E2] and markdown source links [Domain](url)
  const renderInteractiveText = (text: string) => {
    // Match citation tags [E1] or markdown links [Title](https://...) or bold text **text**
    const parts = text.split(/(\[E\d+\]|\[[^\]]+\]\(https?:\/\/[^\s\)]+\)|\*\*[^*]+\*\*)/g);

    return parts.map((part, index) => {
      // 1. Match Citation Tag [E1]
      const citationMatch = part.match(/^\[(E\d+)\]$/);
      if (citationMatch) {
        const tag = `[${citationMatch[1]}]`;
        const isHovered = highlightedTag === tag;

        return (
          <button
            key={index}
            onClick={() => onCitationClick(tag)}
            onMouseEnter={() => setHighlightedTag(tag)}
            onMouseLeave={() => setHighlightedTag(null)}
            className={`inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-xs font-mono font-bold transition-all duration-150 cursor-pointer shadow-xs ${
              isHovered
                ? 'bg-blue-600 text-white ring-2 ring-blue-400 scale-105'
                : 'bg-stone-200 text-stone-900 hover:bg-stone-300'
            }`}
            title={`Click to focus evidence source ${tag}`}
          >
            {tag}
          </button>
        );
      }

      // 2. Match Markdown Link [Source Domain](url)
      const linkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)$/);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        return (
          <a
            key={index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline font-semibold transition-colors inline-flex items-center mx-0.5"
            title={`Open primary source: ${href}`}
          >
            {label}
          </a>
        );
      }

      // 3. Match Bold Text **text**
      const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
      if (boldMatch) {
        return (
          <strong key={index} className="font-bold text-stone-900">
            {boldMatch[1]}
          </strong>
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="bg-white dark:bg-[#2D141E]/75 dark:backdrop-blur-2xl rounded-xl border border-stone-200 dark:border-[#E5C158]/30 p-5 shadow-editorial dark:shadow-[0_10px_30px_rgba(0,0,0,0.5),_inset_0_1px_1px_rgba(255,255,255,0.08)] flex flex-col justify-between">
      <div>
        {/* Editorial Section Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-[#E5C158]/20 mb-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-stone-700 dark:text-[#E5C158]" />
            <h3 className="font-serif-editorial text-lg font-bold text-stone-900 dark:text-[#FAF6F0]">
              Editorial Synthesis & Analysis
            </h3>
          </div>
          <span className="text-xs font-mono uppercase tracking-wider text-stone-400 dark:text-[#E5C158]/70">
            Cross-Checked News Archives Narrative
          </span>
        </div>

        {/* Headline */}
        <h4 className="font-serif-editorial text-xl font-bold text-stone-900 dark:text-[#FAF6F0] leading-snug mb-3">
          {verdict_headline}
        </h4>

        {/* Executive Summary Blockquote */}
        <div className="p-3.5 rounded-lg bg-stone-50 dark:bg-[#200C12]/80 border-l-4 border-stone-800 dark:border-[#E5C158] mb-4 text-stone-800 dark:text-[#FAF6F0] text-sm font-serif-editorial leading-relaxed italic">
          {executive_summary}
        </div>

        {/* Full Editorial Body Copy with Interactive Citations */}
        <div className="font-serif-editorial text-stone-800 dark:text-[#FAF6F0]/90 text-sm sm:text-base leading-relaxed space-y-3">
          {editorial_body.split('\n\n').map((paragraph, idx) => (
            <p key={idx} className="text-justify">
              {renderInteractiveText(paragraph)}
            </p>
          ))}
        </div>
      </div>

      {/* Key Takeaways & Interactive Citations Index */}
      <div className="mt-6 pt-4 border-t border-stone-100 dark:border-[#E5C158]/20 space-y-3">
        {key_takeaways && key_takeaways.length > 0 && (
          <div>
            <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-[#E5C158] mb-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-[#E5C158]" />
              <span>Key Editorial Findings</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-stone-700 dark:text-[#FAF6F0]/80">
              {key_takeaways.map((item, i) => (
                <li key={i} className="flex items-start space-x-1.5">
                  <span className="text-stone-400 dark:text-[#E5C158]/60 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Citation Index Chips Bar */}
        {citations && citations.length > 0 && (
          <div className="pt-2 flex items-center space-x-2 flex-wrap">
            <span className="text-[11px] font-mono text-stone-500 dark:text-[#E5C158]/70 uppercase tracking-tight">
              Evidence Trail:
            </span>
            {citations.map((c) => (
              <button
                key={c.tag}
                onClick={() => onCitationClick(c.tag)}
                onMouseEnter={() => setHighlightedTag(c.tag)}
                onMouseLeave={() => setHighlightedTag(null)}
                className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors ${
                  highlightedTag === c.tag
                    ? 'bg-blue-600 dark:bg-gradient-to-r dark:from-[#6D1B26] dark:to-[#990033] text-white dark:text-[#E5C158] border-blue-600 dark:border-[#E5C158] shadow-[0_0_10px_rgba(229,193,88,0.25)]'
                    : 'bg-stone-100 dark:bg-[#200C12] text-stone-700 dark:text-[#E5C158] border-stone-200 dark:border-[#E5C158]/30 hover:bg-stone-200 dark:hover:bg-[#3D1A28]'
                }`}
              >
                {c.tag} {c.source}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
