import React from 'react';
import { GitMerge, ArrowRight, ShieldCheck, CheckCircle2, Lock, Cpu, Eye, Scale } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const PipelineArchitectureView: React.FC = () => {
  const { t } = useLanguage();
  const stages = [
    {
      step: 1,
      name: 'INPUT (Text or Image)',
      desc: 'Dual input mode: Investigative Desk or authentic WhatsApp Web forward simulator.',
      tech: 'React 19 + shadcn Textarea / File Upload',
      role: 'Frontend Dev'
    },
    {
      step: 2,
      name: 'OCR & Image Preprocessing',
      desc: 'OpenCV grayscale, Otsu binarization, deskewing, and pytesseract. Gracefully flags noise/empty images.',
      tech: 'OpenCV (headless) + pytesseract',
      role: 'Backend/CV Engineer'
    },
    {
      step: 3,
      name: 'Claim & Entity Extraction',
      desc: 'Removes conversational noise, extracts canonical atomic claims and named entities (NER).',
      tech: 'Rule-based NER + Canonical Regex NLP',
      role: 'NLP Engineer'
    },
    {
      step: 4,
      name: 'Image Authenticity Check',
      desc: 'Computes perceptual hashes (pHash, dHash, aHash) and Hamming distance against verified/hoax registries.',
      tech: 'imagehash (DCT pHash)',
      role: 'Backend/CV Engineer'
    },
    {
      step: 5,
      name: 'Parallel Evidence Retrieval',
      desc: 'Parallel queries across Google Fact Check Tools API, Reddit discussions, and verified offline fallback dataset.',
      tech: 'asyncio.gather + Google Fact Check + Reddit API',
      role: 'Backend/API Engineer'
    },
    {
      step: 6,
      name: 'Relevance Gate (PRE-STANCE)',
      desc: 'MUST run before stance detection. Filters out irrelevant snippets using cosine similarity >= 0.40.',
      tech: 'sentence-transformers (all-MiniLM-L6-v2)',
      role: 'NLP Engineer'
    },
    {
      step: 7,
      name: 'Source Credibility Weighting',
      desc: 'Static, transparent domain-trust dictionary (Tier 1 Wires/FactCheckers=1.0 to Tier 4 Social=0.35).',
      tech: 'Domain Trust Dictionary & Justifications',
      role: 'Backend Engineer'
    },
    {
      step: 8,
      name: 'Stance Detection',
      desc: 'Natural Language Inference classifying relevance-gated evidence into Supports, Contradicts, or Neutral.',
      tech: 'roberta-large-mnli (HuggingFace)',
      role: 'ML Engineer'
    },
    {
      step: 9,
      name: 'Stylistic Credibility Classifier',
      desc: 'TF-IDF + Logistic Regression trained on LIAR benchmark dataset. Model & vectorizer persisted via joblib.',
      tech: 'scikit-learn + joblib persistence',
      role: 'ML Engineer'
    },
    {
      step: 10,
      name: 'Insufficient-Evidence Override',
      desc: 'Hard Rule: If < 2 valid corroborating sources pass relevance gate, overrides score to "Unverified".',
      tech: 'Institutional Fail-Safe Rule Engine',
      role: 'Backend Engineer'
    },
    {
      step: 11,
      name: 'Verdict Aggregation (Ensemble)',
      desc: '0.50*EvidenceStance + 0.30*StylisticScore + 0.20*ImageScore. Maps to PolitiFact 5-zone scale.',
      tech: 'Documented Weighted Ensemble Formula',
      role: 'ML Engineer / Team Lead'
    },
    {
      step: 12,
      name: 'RAG Editorial Explanation',
      desc: 'Generates evidence-based synthesis citing visible interactive tags [E1], [E2] linked to cards.',
      tech: 'RAG Explanation Engine (temp ~0.3)',
      role: 'NLP Engineer'
    },
    {
      step: 13,
      name: 'Bento Grid UI & SQLite Audit',
      desc: 'Modular 2026 Bento Grid results view, Truth-O-Meter gauge, and SQLite persistent history registry.',
      tech: 'React + Tailwind + SQLite3',
      role: 'Full-stack Dev'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#2D141E]/75 dark:backdrop-blur-2xl rounded-xl border border-stone-200 dark:border-[#E5C158]/30 p-6 shadow-editorial dark:shadow-[0_10px_30px_rgba(0,0,0,0.5),_inset_0_1px_1px_rgba(255,255,255,0.08)] transition-all animate-slideUp">
        <div className="flex items-center space-x-2 pb-3 border-b border-stone-100 dark:border-[#E5C158]/20">
          <GitMerge className="w-6 h-6 text-stone-900 dark:text-[#E5C158]" />
          <div>
            <h3 className="font-serif-editorial text-2xl font-bold text-stone-900 dark:text-[#FAF6F0]">
              {t('arch.title', '13-Stage Resilient Verification Architecture')}
            </h3>
            <p className="text-xs text-stone-500 dark:text-[#D4B29E] font-sans">
              {t('arch.subtitle', 'Strict pipeline execution sequence ensuring transparent degradation and robust multi-signal ensembling.')}
            </p>
          </div>
        </div>

        {/* Governing Principle Callout */}
        <div className="my-4 p-4 rounded-lg bg-stone-50 dark:bg-[#200C12]/80 border-l-4 border-stone-900 dark:border-[#E5C158] text-stone-800 dark:text-[#FAF6F0] text-xs sm:text-sm font-serif-editorial leading-relaxed">
          <span className="font-sans font-bold uppercase text-[11px] tracking-wider text-stone-500 dark:text-[#E5C158] block mb-1">
            {t('arch.principle', 'Governing Principle')}
          </span>
          {t(
            'arch.principleBody',
            '"Evidence retrieval + relevance gate + credibility weighting is the primary driver of every verdict. The classifier, image-authenticity check, and social-data sourcing are supporting signals that adjust confidence — they never override or replace the evidence-based verdict."'
          )}
        </div>

        {/* Pipeline Step-by-Step Flow */}
        <div className="space-y-3 mt-6">
          {stages.map((stage) => (
            <div
              key={stage.step}
              className="p-3.5 rounded-lg border border-stone-200 dark:border-[#E5C158]/20 bg-white dark:bg-[#200C12] hover:bg-stone-50/50 dark:hover:bg-[#4A1C2C]/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-full bg-stone-900 dark:bg-gradient-to-r dark:from-[#6D1B26] dark:to-[#990033] text-white dark:text-[#E5C158] font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 border dark:border-[#E5C158]/40 shadow-xs">
                  {stage.step}
                </div>
                <div>
                  <div className="font-bold text-stone-900 dark:text-[#FAF6F0] text-sm font-sans flex items-center space-x-2">
                    <span>{stage.name}</span>
                    {stage.step === 6 && (
                      <span className="px-1.5 py-0.2 text-[10px] font-mono bg-red-100 dark:bg-rose-950/60 text-red-800 dark:text-rose-300 rounded font-bold border dark:border-rose-500/30">
                        CRITICAL GATE
                      </span>
                    )}
                    {stage.step === 10 && (
                      <span className="px-1.5 py-0.2 text-[10px] font-mono bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded font-bold border dark:border-amber-500/30">
                        FAIL-SAFE OVERRIDE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 dark:text-[#FAF6F0]/80 mt-0.5">{stage.desc}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-right flex-shrink-0 self-start md:self-auto font-mono text-xs">
                <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-[#2D141E] text-stone-700 dark:text-[#E5C158] border border-stone-200 dark:border-[#E5C158]/25 text-[11px]">
                  {stage.tech}
                </span>
                <span className="text-[11px] text-stone-400 dark:text-[#D4B29E]/60 font-sans hidden lg:inline">
                  [{stage.role}]
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
