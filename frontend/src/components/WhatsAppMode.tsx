import React, { useState } from 'react';
import { VerificationResponse } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  Send,
  Forward,
  CheckCheck,
  ShieldCheck,
  Search,
  MoreVertical,
  Phone,
  Video,
  Smile,
  Paperclip,
  ExternalLink,
  RotateCcw
} from 'lucide-react';

interface WhatsAppModeProps {
  onVerifyText: (text: string) => Promise<void>;
  currentResult: VerificationResponse | null;
  loading: boolean;
  onOpenFullReport: () => void;
}

export const WhatsAppMode: React.FC<WhatsAppModeProps> = ({
  onVerifyText,
  currentResult,
  loading,
  onOpenFullReport
}) => {
  const { t } = useLanguage();
  const [inputText, setInputText] = useState(
    'Forwarded as received: Drinking a bowl of freshly boiled garlic water cures coronavirus infection within 24 hours!! Share with family immediately.'
  );

  const sampleForwards = [
    {
      title: 'Boiled Garlic Cure (COVID-19)',
      text: 'Forwarded as received: Drinking a bowl of freshly boiled garlic water cures coronavirus infection within 24 hours!! Share with family immediately.'
    },
    {
      title: '5G Birds Falling (Telecom Hoax)',
      text: 'Forwarded many times: 5G mobile network testing in India caused thousands of migratory birds to drop dead from the sky! Stop 5G towers now!!'
    },
    {
      title: 'Chandrayaan-3 Moon Landing (True)',
      text: 'Forwarded: India\'s Chandrayaan-3 successfully accomplished the first soft landing of a robotic spacecraft near the lunar south pole.'
    },
    {
      title: 'EU Ban on Petrol Cars (Distorted)',
      text: 'Forwarded: The European Union announced an immediate total ban on all petrol and diesel cars starting in 2025.'
    }
  ];

  const handleSend = () => {
    if (!inputText.trim() || loading) return;
    onVerifyText(inputText);
  };

  return (
    <div className="max-w-4xl mx-auto my-4 rounded-2xl shadow-xl overflow-hidden border border-stone-300 dark:border-[#D4AF37]/30 bg-white dark:bg-[#20080E]">
      {/* WhatsApp Web Outer Header */}
      <div className="bg-[#008069] dark:bg-[#005c4b] text-white px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center font-bold text-white shadow-inner">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#008069] rounded-full" />
          </div>

          <div>
            <h3 className="font-sans font-bold text-sm leading-tight flex items-center space-x-1.5">
              <span>{t('whatsapp.botTitle', 'VerifAI Forward Fact-Check Bot')}</span>
              <span className="text-[10px] bg-emerald-700/80 px-1.5 py-0.2 rounded font-mono">
                {t('whatsapp.officialBadge', 'Official')}
              </span>
            </h3>
            <span className="text-[11px] text-emerald-100 font-sans">
              {t('whatsapp.botStatus', 'Online • Responds with evidence-backed verdicts')}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-emerald-100">
          <Search className="w-5 h-5 cursor-pointer hover:text-white" />
          <Phone className="w-5 h-5 cursor-pointer hover:text-white hidden sm:block" />
          <MoreVertical className="w-5 h-5 cursor-pointer hover:text-white" />
        </div>
      </div>

      {/* Preset Viral Forwards Picker Bar */}
      <div className="bg-[#f0f2f5] dark:bg-[#200C12] px-4 py-2 border-b border-stone-200 dark:border-[#E5C158]/20 flex items-center space-x-2 overflow-x-auto text-xs">
        <span className="font-semibold text-stone-600 dark:text-[#E5C158]/70 flex-shrink-0 text-[11px] uppercase tracking-wider">
          {t('whatsapp.testViralForwards', 'Test Viral Forwards:')}
        </span>
        {sampleForwards.map((sample, idx) => (
          <button
            key={idx}
            onClick={() => setInputText(sample.text)}
            className="flex-shrink-0 px-2.5 py-1 rounded-full bg-white dark:bg-[#2D141E] text-stone-700 dark:text-[#FAF6F0] border border-stone-300 dark:border-[#E5C158]/30 hover:bg-stone-50 dark:hover:bg-[#3D1A28] transition-colors text-xs font-medium"
          >
            {sample.title}
          </button>
        ))}
      </div>

      {/* Chat Canvas (WhatsApp Authentic Wallpaper) */}
      <div className="whatsapp-chat-bg p-4 sm:p-6 min-h-[460px] max-h-[580px] overflow-y-auto space-y-4">
        {/* System Introduction Bubble */}
        <div className="flex justify-center">
          <span className="bg-[#fff3c4] text-stone-700 text-[11px] px-3 py-1 rounded-lg shadow-2xs font-sans text-center max-w-md border border-[#ffeaa7]">
            {t('whatsapp.systemNotice', '🔒 Messages forwarded to this channel are verified against institutional news wires, peer-reviewed registries, and fact-checking archives.')}
          </span>
        </div>

        {/* Incoming/Sent Forward Bubble */}
        <div className="flex justify-end">
          <div className="bg-[#dcf8c6] text-stone-900 rounded-lg p-3 max-w-md sm:max-w-lg shadow-sm relative border border-[#cbebb3] space-y-2">
            {/* Forwarded Header */}
            <div className="flex items-center space-x-1 text-stone-500 text-[11px] italic pb-1 border-b border-[#cdebb6]">
              <Forward className="w-3.5 h-3.5 text-stone-400" />
              <span className="font-medium">{t('whatsapp.forwardedManyTimes', 'Forwarded many times')}</span>
            </div>

            {/* Message Body */}
            <p className="text-sm text-stone-900 leading-relaxed font-sans select-text">
              {inputText}
            </p>

            {/* Bottom Meta & Action */}
            <div className="flex items-center justify-between pt-1 text-[10px] text-stone-500">
              <button
                onClick={handleSend}
                disabled={loading}
                className="px-2.5 py-1 rounded bg-[#008069] text-white font-semibold flex items-center space-x-1 hover:bg-[#00705a] transition-colors shadow-2xs"
              >
                {loading ? (
                  <span>{t('whatsapp.checkingSources', 'Checking Sources...')}</span>
                ) : (
                  <>
                    <ShieldCheck className="w-3 h-3" />
                    <span>{t('whatsapp.verifyForwardNow', 'Verify Forward Now')}</span>
                  </>
                )}
              </button>

              <div className="flex items-center space-x-1 font-mono">
                <span>12:42 PM</span>
                <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
              </div>
            </div>
          </div>
        </div>

        {/* Bot Verification Response Bubble (When Result Ready) */}
        {currentResult && (
          <div className="flex justify-start animate-fadeIn">
            <div className="bg-white text-stone-900 rounded-lg p-4 max-w-md sm:max-w-lg shadow-sm border border-stone-200 space-y-3">
              {/* Institutional Verdict Badge */}
              <div
                className="p-2.5 rounded-lg flex items-center justify-between"
                style={{
                  backgroundColor: `${currentResult.verdict.color_code}15`,
                  borderLeft: `5px solid ${currentResult.verdict.color_code}`
                }}
              >
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-mono font-bold text-stone-500">
                    {t('whatsapp.verificationVerdict', 'Verification Verdict')}
                  </div>
                  <div className="text-base font-serif-editorial font-bold text-stone-900">
                    {currentResult.verdict.final_verdict}
                  </div>
                </div>

                <div className="text-right font-mono text-xs font-bold text-stone-800">
                  {currentResult.verdict.confidence_percentage}% Confidence
                </div>
              </div>

              {/* RAG Explanation Snippet */}
              <div className="text-xs text-stone-700 leading-relaxed font-sans space-y-1.5">
                <p className="font-semibold text-stone-900">
                  {currentResult.explanation.verdict_headline}
                </p>
                <p className="text-stone-600">
                  {currentResult.explanation.executive_summary}
                </p>
              </div>

              {/* Top 2 Evidence Sources Preview */}
              <div className="pt-2 border-t border-stone-100 space-y-1.5">
                <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
                  {t('whatsapp.citedSources', 'Cited Authority Sources:')}
                </span>
                {currentResult.evidence.items.slice(0, 2).map((item, idx) => (
                  <div key={idx} className="text-xs bg-stone-50 p-2 rounded border border-stone-200">
                    <span className="font-bold text-stone-800">{item.source}</span>: "{item.snippet.substring(0, 100)}..."
                  </div>
                ))}
              </div>

              {/* View Full Bento Grid Report Link */}
              <div className="pt-2 flex items-center justify-between text-xs">
                <button
                  onClick={onOpenFullReport}
                  className="font-bold text-[#008069] hover:underline flex items-center space-x-1"
                >
                  <span>{t('whatsapp.openFullReport', 'Open Full Bento Investigation Report')}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono text-stone-400">12:43 PM</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Bar (Authentic WhatsApp Input Box) */}
      <div className="bg-[#f0f2f5] px-4 py-2.5 flex items-center space-x-3 border-t border-stone-200">
        <Smile className="w-6 h-6 text-stone-500 cursor-pointer hover:text-stone-700" />
        <Paperclip className="w-5 h-5 text-stone-500 cursor-pointer hover:text-stone-700" />

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={t('whatsapp.inputPlaceholder', 'Paste or type viral message to verify...')}
          className="flex-1 bg-white text-stone-900 px-4 py-2 rounded-lg text-sm border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#008069] placeholder:text-stone-400 font-sans"
        />

        <button
          onClick={handleSend}
          disabled={loading || !inputText.trim()}
          className="p-2.5 rounded-full bg-[#008069] text-white hover:bg-[#00705a] disabled:opacity-50 transition-colors shadow-sm"
          title="Send & Verify"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
