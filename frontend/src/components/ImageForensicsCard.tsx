import React from 'react';
import { ImageForensics, OCRDetails } from '../types';
import { Camera, Fingerprint, ShieldCheck, AlertTriangle, Search, FileText } from 'lucide-react';

interface ImageForensicsCardProps {
  forensics: ImageForensics | null;
  ocr: OCRDetails | null;
  imagePreviewUrl?: string | null;
}

export const ImageForensicsCard: React.FC<ImageForensicsCardProps> = ({
  forensics,
  ocr,
  imagePreviewUrl
}) => {
  if (!forensics && !ocr) return null;

  const isHoax = forensics?.status_label?.includes('Hoax') || forensics?.status_label?.includes('Manipulated');
  const isAuthentic = forensics?.status_label?.includes('Authentic');

  return (
    <div className="bg-white dark:bg-[#2D141E]/75 dark:backdrop-blur-2xl rounded-xl border border-stone-200 dark:border-[#E5C158]/30 p-5 shadow-editorial dark:shadow-[0_10px_30px_rgba(0,0,0,0.5),_inset_0_1px_1px_rgba(255,255,255,0.08)]">
      <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-[#E5C158]/20 mb-4">
        <div className="flex items-center space-x-2">
          <Fingerprint className="w-5 h-5 text-stone-700 dark:text-[#E5C158]" />
          <h3 className="font-serif-editorial text-lg font-bold text-stone-900 dark:text-[#FAF6F0]">
            Image Forensics & Perceptual Hash
          </h3>
        </div>
        <span className="text-xs font-mono uppercase tracking-wider text-stone-400 dark:text-[#E5C158]/70">
          Stage 1 & 3 Analysis
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {/* Thumbnail preview if available */}
        {imagePreviewUrl && (
          <div className="md:col-span-1 rounded-lg overflow-hidden border border-stone-200 dark:border-[#E5C158]/30 bg-stone-100 dark:bg-black/50 flex flex-col items-center justify-center p-2">
            <img
              src={imagePreviewUrl}
              alt="Uploaded Claim Media"
              className="max-h-44 object-contain rounded"
            />
            <span className="text-[10px] font-mono text-stone-500 dark:text-[#E5C158]/70 mt-1">
              {forensics?.image_dimensions || 'Input Media'}
            </span>
          </div>
        )}

        {/* Perceptual Hash Fingerprints & Status */}
        <div className={imagePreviewUrl ? 'md:col-span-2 space-y-3' : 'md:col-span-3 space-y-3'}>
          {forensics && (
            <>
              {/* Authenticity Status Banner */}
              <div
                className={`p-3 rounded-lg border flex items-center space-x-2.5 ${
                  isHoax
                    ? 'bg-red-50 dark:bg-rose-950/40 border-red-200 dark:border-rose-700/50 text-red-900 dark:text-rose-300'
                    : isAuthentic
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-700/50 text-emerald-900 dark:text-emerald-300'
                    : 'bg-stone-50 dark:bg-[#200C12]/80 border-stone-200 dark:border-[#E5C158]/20 text-stone-800 dark:text-[#FAF6F0]'
                }`}
              >
                {isHoax ? (
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-rose-400 flex-shrink-0" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                )}
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider font-bold">
                    {forensics.status_label}
                  </div>
                  <div className="text-xs mt-0.5">{forensics.explanation}</div>
                </div>
              </div>

              {/* Hash Values Table */}
              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                <div className="bg-stone-50 dark:bg-[#200C12] p-2 rounded border border-stone-200 dark:border-[#E5C158]/20">
                  <span className="text-stone-400 dark:text-[#E5C158]/70 block text-[9px] uppercase">pHash (DCT)</span>
                  <span className="text-stone-800 dark:text-[#FAF6F0] font-bold truncate block">{forensics.phash}</span>
                </div>
                <div className="bg-stone-50 dark:bg-[#200C12] p-2 rounded border border-stone-200 dark:border-[#E5C158]/20">
                  <span className="text-stone-400 dark:text-[#E5C158]/70 block text-[9px] uppercase">dHash (Diff)</span>
                  <span className="text-stone-800 dark:text-[#FAF6F0] font-bold truncate block">{forensics.dhash}</span>
                </div>
                <div className="bg-stone-50 dark:bg-[#200C12] p-2 rounded border border-stone-200 dark:border-[#E5C158]/20">
                  <span className="text-stone-400 dark:text-[#E5C158]/70 block text-[9px] uppercase">Hamming Dist</span>
                  <span className="text-stone-800 dark:text-[#FAF6F0] font-bold block">
                    {forensics.hamming_distance !== null ? `${forensics.hamming_distance} bits` : 'No match'}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* OCR Extraction Details */}
          {ocr && (
            <div className="pt-2 border-t border-stone-100 dark:border-[#E5C158]/20">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-stone-700 dark:text-[#E5C158] flex items-center space-x-1">
                  <FileText className="w-3.5 h-3.5 text-stone-500 dark:text-[#E5C158]" />
                  <span>OpenCV Preprocessed OCR:</span>
                </span>
                <span className="font-mono text-[10px] text-stone-500 dark:text-[#E5C158]/70">
                  Confidence: {ocr.confidence}% {ocr.metadata?.preprocessed ? '• Deskewed' : ''}
                </span>
              </div>
              <p className="text-xs font-mono text-stone-600 dark:text-[#FAF6F0] bg-stone-50 dark:bg-[#200C12]/70 p-2 rounded border border-stone-200 dark:border-[#E5C158]/20">
                {ocr.text || '(Empty or non-text image detected)'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
