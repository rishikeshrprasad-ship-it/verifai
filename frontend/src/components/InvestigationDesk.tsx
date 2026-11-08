import React, { useState } from 'react';
import { VerificationResponse } from '../types';
import { safeFetchJson } from '../api/client';
import { BentoGrid } from './BentoGrid';
import { EditorialAuditModal } from './EditorialAuditModal';
import { ExecutiveFactCheckSummary } from './ExecutiveFactCheckSummary';
import { useLanguage } from '../context/LanguageContext';
import {
  Search,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  X,
  Loader2,
  CheckCircle2,
  Globe
} from 'lucide-react';

interface InvestigationDeskProps {
  onVerify: (text: string, file: File | null) => Promise<void>;
  onReset?: () => void;
  data: VerificationResponse | null;
  loading: boolean;
  error: string | null;
  imagePreviewUrl: string | null;
  setImagePreviewUrl: (url: string | null) => void;
  claimTextProp?: string;
}

export const InvestigationDesk: React.FC<InvestigationDeskProps> = ({
  onVerify,
  onReset,
  data,
  loading,
  error,
  imagePreviewUrl,
  setImagePreviewUrl,
  claimTextProp
}) => {
  const { t } = useLanguage();
  const [claimText, setClaimText] = useState(
    claimTextProp || 'The James Webb Space Telescope has discovered the oldest known galaxy in the universe, dating back to 290 million years after the Big Bang.'
  );

  React.useEffect(() => {
    if (claimTextProp) {
      setClaimText(claimTextProp);
    }
  }, [claimTextProp]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [showFullBreakdown, setShowFullBreakdown] = useState<boolean>(false);
  const [isAnalyzingVisual, setIsAnalyzingVisual] = useState<boolean>(false);
  const [visualPhase, setVisualPhase] = useState<1 | 2 | 3>(1);
  const [ocrStatus, setOcrStatus] = useState<{
    success: boolean;
    confidence?: number;
    message?: string;
    text?: string;
    canonical_claim?: string;
    detected_brand_or_domain?: string | null;
    fallback_triggered?: boolean;
    psm_used?: number;
  } | null>(null);

  const sampleQueries = [
    {
      label: 'James Webb Oldest Galaxy',
      type: 'Verified True',
      color: 'border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100',
      text: 'The James Webb Space Telescope has discovered the oldest known galaxy in the universe, dating back to 290 million years after the Big Bang.'
    },
    {
      label: 'Boiled Garlic COVID Cure',
      type: 'False / Fabricated',
      color: 'border-red-300 text-red-800 bg-red-50 hover:bg-red-100',
      text: 'Drinking a bowl of freshly boiled garlic water cures coronavirus infection within 24 hours.'
    },
    {
      label: 'EU Petrol Car Ban 2025',
      type: 'Mostly False',
      color: 'border-orange-300 text-orange-800 bg-orange-50 hover:bg-orange-100',
      text: 'The European Union has announced an immediate, total ban on all petrol and diesel cars starting in 2025.'
    },
    {
      label: 'Google Quantum Supremacy',
      type: 'Half True / Mixed',
      color: 'border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100',
      text: 'Google\'s Sycamore quantum processor performed in 200 seconds a computation that would take the world\'s fastest classical supercomputer 10,000 years.'
    },
    {
      label: 'Patagonia Radio Signal 1942',
      type: 'Test Insufficient Evidence',
      color: 'border-slate-300 text-slate-800 bg-slate-100 hover:bg-slate-200',
      text: 'An obscure private radio station in Patagonia received continuous alien radio transmissions every Thursday during 1942.'
    }
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      e.target.value = ''; // Reset input value so identical file re-selections fire change events
      setSelectedFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      
      // State Clear: Clear previous verdict, claim text, & error
      onReset?.();
      setClaimText('');
      setIsAnalyzingVisual(true);
      setVisualPhase(1);
      setOcrStatus(null);

      // OCR-to-Claim Binding: Trigger background OCR/multimodal parse on upload
      const formData = new FormData();
      formData.append('file', file);

      try {
        const json = await safeFetchJson<any>('/api/pipeline/upload-image', {
          method: 'POST',
          body: formData
        });

        if (json && json.success) {
          setOcrStatus(json);
          // Auto-fill extracted canonical claim directly into the investigation input
          if (json.canonical_claim && json.canonical_claim.trim().length > 0) {
            setClaimText(json.canonical_claim);
          } else if (json.text && json.text.trim().length > 0) {
            setClaimText(json.text);
          }
        } else {
          setOcrStatus({
            success: false,
            message: json?.detail || json?.message || 'Failed to extract text from visual media.'
          });
        }
      } catch (err: any) {
        setOcrStatus({
          success: false,
          message: err.message || 'Image upload error occurred.'
        });
      } finally {
        setIsAnalyzingVisual(false);
      }
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setOcrStatus(null);
    setIsAnalyzingVisual(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimText.trim() && !selectedFile) return;

    // Reset view expansion
    setShowFullBreakdown(false);
    
    // Trigger verification pipeline
    await onVerify(claimText, selectedFile);
    
    // Exclusively open popover modal after verify button submission
    setIsModalOpen(true);
  };

  const selectSample = (sample: typeof sampleQueries[0]) => {
    setClaimText(sample.text);
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setOcrStatus(null);
    setIsAnalyzingVisual(false);
    onReset?.();
  };

  const handleShowFullBreakdown = () => {
    setIsModalOpen(false);
    setShowFullBreakdown(true);
    setTimeout(() => {
      const el = document.getElementById('results-bento-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="space-y-6">
      {/* Search & Verification Input Card */}
      <div className="bg-white dark:bg-[#2D141E]/75 dark:backdrop-blur-2xl rounded-xl border border-stone-200 dark:border-[#E5C158]/30 p-6 shadow-editorial dark:shadow-[0_10px_30px_rgba(0,0,0,0.5),_inset_0_1px_1px_rgba(255,255,255,0.08)] transition-all animate-slideUp">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-[#E5C158]/15 mb-4">
          <div>
            <h2 className="font-serif-editorial text-2xl font-bold text-stone-900 dark:text-[#FAF6F0]">
              {t('editorial.title', 'Investigative Verification Desk')}
            </h2>
            <p className="text-xs text-stone-500 dark:text-[#D4B29E] font-sans mt-0.5">
              {t('editorial.subtitle', 'Submit any text assertion, social forward, or viral screenshot for automated 13-stage assessment.')}
            </p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-stone-100 dark:bg-[#200C12] text-stone-600 dark:text-[#E5C158] border border-stone-200 dark:border-[#E5C158]/30 hidden sm:inline font-bold">
            Multi-Signal Ensemble
          </span>
        </div>

        {/* Curated Sample Claims Bar */}
        <div className="mb-4">
          <span className="text-[11px] font-mono text-stone-500 dark:text-[#E5C158] uppercase tracking-wider block mb-2 font-semibold">
            {t('editorial.sampleQueries', 'One-Click Benchmark Claims:')}
          </span>
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
            {sampleQueries.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectSample(s)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer dark:bg-[#200C12] dark:border-[#E5C158]/25 dark:text-[#E5C158] dark:hover:bg-[#4A1C2C] ${s.color}`}
              >
                <span className="font-bold">{s.label}</span>
                <span className="opacity-75 text-[10px] ml-1">({s.type})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              rows={3}
              value={claimText}
              onChange={(e) => setClaimText(e.target.value)}
              placeholder={t('editorial.inputPlaceholder', "Enter text claim to fact-check (e.g. 'NASA discovers oldest galaxy', health advice, political quotes)...")}
              className="w-full p-4 rounded-xl border border-stone-300 dark:border-[#E5C158]/30 bg-white dark:bg-black/40 font-serif-editorial text-stone-900 dark:text-[#FAF6F0] text-base placeholder:text-stone-400 dark:placeholder-[#E5C158]/45 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-stone-800 dark:focus:ring-[#E5C158]/50 resize-none shadow-xs transition-colors"
            />
          </div>

          {/* Visual Multimodal Parsing Loading State Banner */}
          {isAnalyzingVisual && (
            <div className="p-3.5 bg-indigo-50 dark:bg-[#200C12] border border-indigo-200 dark:border-[#E5C158]/30 rounded-lg text-indigo-900 dark:text-[#FAF6F0] text-xs space-y-2 animate-pulse">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-[#E5C158] flex-shrink-0" />
                <div className="flex-1 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-indigo-950 dark:text-[#E5C158] font-mono">Multimodal Visual Pipeline Active</span>
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-blue-100 dark:bg-[#4A1C2C] text-blue-900 dark:text-[#E5C158] font-mono text-[10px] font-bold border border-blue-200 dark:border-[#E5C158]/30">
                      <Globe className="w-2.5 h-2.5 text-blue-700 dark:text-[#E5C158]" />
                      <span>[Live Internet Search (Zero-Key Mode)]</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Step Badge Sequence */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all ${
                  visualPhase === 1 
                    ? 'bg-indigo-600 dark:bg-[#6D1B26] text-white dark:text-[#E5C158] border-indigo-700 dark:border-[#E5C158]/50 shadow-xs' 
                    : 'bg-indigo-100 dark:bg-[#200C12] text-indigo-800 dark:text-[#D4B29E] border-indigo-200 dark:border-[#E5C158]/20 opacity-70'
                }`}>
                  [1/3 OCR & Visual Metadata]
                </span>
                <span className="text-stone-400 text-xs">→</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all ${
                  visualPhase === 2 
                    ? 'bg-blue-600 dark:bg-[#6D1B26] text-white dark:text-[#E5C158] border-blue-700 dark:border-[#E5C158]/50 shadow-xs' 
                    : 'bg-blue-100 dark:bg-[#200C12] text-blue-800 dark:text-[#D4B29E] border-blue-200 dark:border-[#E5C158]/20 opacity-70'
                }`}>
                  [2/3 Live Web Search (DuckDuckGo Free)]
                </span>
                <span className="text-stone-400 text-xs">→</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all ${
                  visualPhase === 3 
                    ? 'bg-emerald-600 dark:bg-[#6D1B26] text-white dark:text-[#E5C158] border-emerald-700 dark:border-[#E5C158]/50 shadow-xs' 
                    : 'bg-emerald-100 dark:bg-[#200C12] text-emerald-800 dark:text-[#D4B29E] border-emerald-200 dark:border-[#E5C158]/20 opacity-70'
                }`}>
                  [3/3 Synthesizing Dossier]
                </span>
              </div>
            </div>
          )}

          {/* OCR Result / Status & Brand Mismatch Banner */}
          {ocrStatus && !isAnalyzingVisual && (
            ocrStatus.success ? (
              <div className="space-y-2">
                <div className={`flex items-start justify-between p-3 rounded-lg text-xs border ${
                  ocrStatus.fallback_triggered 
                    ? 'bg-blue-50/90 dark:bg-[#200C12] border-blue-200 dark:border-[#E5C158]/30 text-blue-950 dark:text-[#FAF6F0]' 
                    : 'bg-emerald-50 dark:bg-[#200C12] border-emerald-200 dark:border-emerald-500/40 text-emerald-900 dark:text-[#FAF6F0]'
                }`}>
                  <div className="flex items-start space-x-2">
                    {ocrStatus.fallback_triggered ? (
                      <Sparkles className="w-4 h-4 text-blue-600 dark:text-[#E5C158] mt-0.5 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold font-mono text-stone-900 dark:text-[#E5C158]">
                          {ocrStatus.fallback_triggered ? '[Visual OCR Fallback Active]' : 'Multimodal Claim Distilled & Bound'}
                        </span>
                        {ocrStatus.confidence !== undefined && (
                          <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-bold border ${
                            ocrStatus.fallback_triggered
                              ? 'bg-blue-100 dark:bg-[#4A1C2C] text-blue-800 dark:text-[#E5C158] border-blue-300 dark:border-[#E5C158]/30'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
                          }`}>
                            {ocrStatus.confidence}% Confidence
                          </span>
                        )}
                        {ocrStatus.psm_used && !ocrStatus.fallback_triggered && (
                          <span className="px-1.5 py-0.2 rounded bg-stone-100 dark:bg-[#4A1C2C] text-stone-600 dark:text-[#D4B29E] font-mono text-[10px]">
                            PSM-{ocrStatus.psm_used}
                          </span>
                        )}
                      </div>
                      {ocrStatus.fallback_triggered ? (
                        <p className="text-[11px] text-blue-800 dark:text-[#FAF6F0]/80 mt-0.5 font-sans">
                          Visual media attached. Multimodal fallback extracted visual descriptor for downstream fact-checking.
                        </p>
                      ) : (
                        ocrStatus.text && ocrStatus.canonical_claim && ocrStatus.text !== ocrStatus.canonical_claim && (
                          <p className="text-[11px] text-stone-600 dark:text-[#D4B29E] mt-1 italic line-clamp-1 font-serif-editorial">
                            Raw OCR: "{ocrStatus.text}"
                          </p>
                        )
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOcrStatus(null)}
                    className="text-stone-400 hover:text-stone-600 dark:text-[#E5C158]/70 dark:hover:text-[#E5C158] p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Brand vs Domain Mismatch Pill if detected */}
                {ocrStatus.detected_brand_or_domain && (
                  <div className="flex items-center space-x-2 p-2.5 bg-amber-50 dark:bg-[#200C12] border border-amber-300 dark:border-[#E5C158]/40 rounded-lg text-amber-950 dark:text-[#FAF6F0] text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-[#E5C158] flex-shrink-0" />
                    <span className="font-mono font-bold text-[11px] bg-amber-200/80 dark:bg-[#4A1C2C] px-1.5 py-0.5 rounded text-amber-900 dark:text-[#E5C158]">
                      FLAG:
                    </span>
                    <span className="font-sans font-medium">
                      {ocrStatus.detected_brand_or_domain}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-[#200C12] border border-amber-200 dark:border-[#E5C158]/30 rounded-lg text-amber-900 dark:text-[#FAF6F0] text-xs">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-[#E5C158] flex-shrink-0" />
                  <span>{ocrStatus.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOcrStatus(null)}
                  className="text-amber-500 hover:text-amber-700 dark:text-[#E5C158]/70 dark:hover:text-[#E5C158]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          )}

          {/* Image Upload & Thumbnail Preview Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center space-x-3">
              <label className="cursor-pointer inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg border border-stone-300 dark:border-[#E5C158]/30 bg-stone-50 dark:bg-[#200C12] hover:bg-stone-100 dark:hover:bg-[#4A1C2C] text-stone-700 dark:text-[#E5C158] text-xs font-medium transition-colors shadow-xs">
                <UploadCloud className="w-4 h-4 text-stone-500 dark:text-[#E5C158]" />
                <span>{selectedFile ? (t('editorial.removeImage', 'Change Image')) : (t('editorial.uploadImage', 'Attach Screenshot / Meme'))}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {imagePreviewUrl && (
                <div className="flex items-center space-x-2 bg-stone-100 dark:bg-[#200C12] px-2.5 py-1 rounded-lg border border-stone-200 dark:border-[#E5C158]/30">
                  <img
                    src={imagePreviewUrl}
                    alt="Thumbnail preview"
                    className="w-5 h-5 rounded object-cover border border-stone-300 dark:border-[#E5C158]/40"
                  />
                  <span className="text-xs font-mono text-stone-600 dark:text-[#FAF6F0]/80 truncate max-w-[140px]">
                    {selectedFile?.name || 'Attached Media'}
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-stone-400 hover:text-stone-600 dark:hover:text-[#E5C158] cursor-pointer"
                    title="Remove attached image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || isAnalyzingVisual || (!claimText.trim() && !selectedFile)}
              className="px-6 py-2.5 rounded-lg bg-stone-900 dark:bg-gradient-to-r dark:from-[#6D1B26] dark:to-[#990033] text-white dark:text-[#FAF6F0] font-sans text-sm font-semibold hover:bg-stone-800 dark:hover:from-[#990033] dark:hover:to-[#6D1B26] dark:border dark:border-[#E5C158]/50 dark:shadow-[0_0_15px_rgba(229,193,88,0.2)] disabled:opacity-50 transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-stone-300 dark:text-[#E5C158]" />
                  <span>{t('editorial.verifying', 'Executing 13-Stage Pipeline...')}</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-emerald-400 dark:text-[#E5C158]" />
                  <span>{t('editorial.verifyClaim', 'Verify Claim & Retrieve Evidence')}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error Alert if any */}
        {error && (
          <div className="mt-4 p-3.5 rounded-lg bg-red-50 dark:bg-[#200C12] border border-red-200 dark:border-rose-500/40 text-red-800 dark:text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results Section */}
      {data && (
        <div className="space-y-6">
          {/* Quick Action Re-Open Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-900 dark:bg-[#200C12]/90 text-stone-100 px-5 py-3 rounded-xl border border-stone-800 dark:border-[#E5C158]/30 shadow-md dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 dark:text-[#E5C158] flex-shrink-0" />
              <div>
                <span className="text-xs font-mono font-bold tracking-wide text-white dark:text-[#FAF6F0]">
                  Audit Dossier Resolved • {data.verdict.final_verdict}
                </span>
                <span className="text-xs text-stone-400 dark:text-[#D4B29E] font-sans hidden md:inline ml-2">
                  (Fact Match: {Math.round(data.verdict.ensemble_score * 100)}% Confidence)
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-3.5 py-1.5 bg-stone-800 dark:bg-[#4A1C2C] hover:bg-stone-700 dark:hover:bg-[#6D1B26] text-amber-300 dark:text-[#E5C158] rounded-lg text-xs font-mono font-medium border border-stone-700 dark:border-[#E5C158]/40 transition-colors flex items-center space-x-1.5 shadow-xs"
              >
                <span>🔍 View Compact Popover</span>
              </button>

              <button
                type="button"
                onClick={() => setShowFullBreakdown(!showFullBreakdown)}
                className="px-3 py-1.5 bg-stone-800/80 dark:bg-[#2D141E] hover:bg-stone-800 dark:hover:bg-[#4A1C2C] text-stone-300 dark:text-[#FAF6F0] rounded-lg text-xs font-sans font-medium border border-stone-700 dark:border-[#E5C158]/30 transition-colors flex items-center space-x-1"
              >
                <span>{showFullBreakdown ? 'Hide Full Diagnostics' : 'Show Full 13-Stage Diagnostics ↓'}</span>
              </button>
            </div>
          </div>

          {/* Executive Fact-Check Summary (Plain-English Human-First Card) */}
          <ExecutiveFactCheckSummary
            data={data}
            onReadFullDetails={handleShowFullBreakdown}
            onCheckAnotherClaim={() => {
              setClaimText('');
              setSelectedFile(null);
              setImagePreviewUrl(null);
              setOcrStatus(null);
              setIsAnalyzingVisual(false);
              setShowFullBreakdown(false);
              setIsModalOpen(false);
              onReset?.();
            }}
          />

          {/* Full 13-Stage BentoGrid View */}
          {showFullBreakdown && (
            <div id="results-bento-section" className="animate-in fade-in slide-in-from-top-4 duration-300">
              <BentoGrid data={data} imagePreviewUrl={imagePreviewUrl} />
            </div>
          )}
        </div>
      )}

      {/* Editorial Audit Popover / Modal Card */}
      <EditorialAuditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={data}
        loading={loading}
        onShowFullBreakdown={handleShowFullBreakdown}
        imagePreviewUrl={imagePreviewUrl}
      />
    </div>
  );
};
