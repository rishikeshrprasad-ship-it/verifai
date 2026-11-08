import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DailyBriefingBureau } from './components/DailyBriefingBureau';
import { InvestigationDesk } from './components/InvestigationDesk';
import { WhatsAppMode } from './components/WhatsAppMode';
import { HistoryDashboard } from './components/HistoryDashboard';
import { PipelineArchitectureView } from './components/PipelineArchitectureView';
import { TransparentLoginView, UserProfile } from './components/TransparentLoginView';
import { VerificationResponse } from './types';
import { safeFetchJson } from './api/client';
import { useLanguage } from './context/LanguageContext';
import { runVerificationPipeline } from './services/verificationEngine';
import confetti from 'canvas-confetti';

export function App() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'briefing' | 'editorial' | 'whatsapp' | 'history' | 'pipeline'>('briefing');
  const [apiConnected, setApiConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VerificationResponse | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [verificationQuery, setVerificationQuery] = useState<string>('');

  // User Authentication State
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('fusionx_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Dark / Light Mode Theme Engine (Default Dark Obsidian)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const savedTheme = localStorage.getItem('fusionx_theme');
      return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark';
    } catch (e) {
      return 'dark';
    }
  });

  // Global Language Selector State
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    try {
      return localStorage.getItem('fusionx_lang') || 'ALL';
    } catch (e) {
      return 'ALL';
    }
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('fusionx_theme', theme);
  }, [theme]);

  // Persist Language
  useEffect(() => {
    try {
      localStorage.setItem('fusionx_lang', selectedLanguage);
    } catch (e) {
      console.error(e);
    }
  }, [selectedLanguage]);

  // Health check on startup
  useEffect(() => {
    const checkApi = async () => {
      try {
        await safeFetchJson('/api/health');
        setApiConnected(true);
      } catch (e) {
        setApiConnected(false);
      }
    };
    checkApi();
    const timer = setInterval(checkApi, 10000);
    return () => clearInterval(timer);
  }, []);

  // Master Verify API Call with Plausibility Sanity Guard & Live RAG Grounding
  const handleVerify = async (text: string, file: File | null = null, mode: string = 'editorial') => {
    setLoading(true);
    setError(null);

    try {
      const result = await runVerificationPipeline(text, file, mode);
      setData(result);

      // If verdict is Verified True, fire confetti
      if (result.verdict?.final_verdict === 'Verified True') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      }
    } catch (err: any) {
      setError(err.message || 'Verification pipeline encountered an unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppVerify = async (text: string) => {
    await handleVerify(text, null, 'whatsapp');
  };

  const handleSelectFromHistory = (claimText: string) => {
    setVerificationQuery(claimText);
    setActiveTab('editorial');
    handleVerify(claimText, null, 'editorial');
  };

  const handleAuditFromBriefing = (headline: string, publisherOrImage?: string) => {
    const isUrl = publisherOrImage && (publisherOrImage.startsWith('http://') || publisherOrImage.startsWith('https://'));
    const query = publisherOrImage && !isUrl
      ? `${headline} — ${publisherOrImage}`
      : headline;
    const imgUrl = isUrl ? publisherOrImage : null;

    setVerificationQuery(query);
    setImagePreviewUrl(imgUrl);
    setActiveTab('editorial');
    handleVerify(query, null, 'editorial');
  };

  if (!user) {
    return (
      <TransparentLoginView
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onLogin={(loggedInUser) => {
          setUser(loggedInUser);
          localStorage.setItem('fusionx_user', JSON.stringify(loggedInUser));
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] dark:bg-[#200C12] text-stone-900 dark:text-[#FAF6F0] flex flex-col font-sans transition-colors relative overflow-x-hidden">
      {/* Global Ambient Atmospheric Radial Glow Vignette */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_85%_15%,_rgba(229,193,88,0.07)_0%,_transparent_45%),radial-gradient(circle_at_15%_85%,_rgba(109,27,38,0.15)_0%,_transparent_55%)]" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          apiConnected={apiConnected}
          user={user}
          onLogout={() => {
            setUser(null);
            localStorage.removeItem('fusionx_user');
          }}
          theme={theme}
          setTheme={setTheme}
          selectedLanguage={selectedLanguage}
          setSelectedLanguage={setSelectedLanguage}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'briefing' && (
            <DailyBriefingBureau onAuditHeadline={handleAuditFromBriefing} />
          )}

          {activeTab === 'editorial' && (
            <InvestigationDesk
              onVerify={handleVerify}
              onReset={() => {
                setData(null);
                setError(null);
              }}
              data={data}
              loading={loading}
              error={error}
              imagePreviewUrl={imagePreviewUrl}
              setImagePreviewUrl={setImagePreviewUrl}
              claimTextProp={verificationQuery}
            />
          )}

          {activeTab === 'whatsapp' && (
            <WhatsAppMode
              onVerifyText={handleWhatsAppVerify}
              currentResult={data}
              loading={loading}
              onOpenFullReport={() => setActiveTab('editorial')}
            />
          )}

          {activeTab === 'history' && (
            <HistoryDashboard onSelectClaim={handleSelectFromHistory} />
          )}

          {activeTab === 'pipeline' && (
            <PipelineArchitectureView />
          )}
        </main>

        {/* Editorial Footer */}
        <footer className="border-t border-stone-200 dark:border-[#E5C158]/20 bg-white/80 dark:bg-[#1B080E]/90 backdrop-blur-md py-6 mt-12 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 dark:text-[#D4B29E] font-mono">
            <div>
              <span className="dark:text-[#FAF6F0]/90">{t('footer.platform', 'VerifAI Platform — FUSIONX 1.0 (AI for Social Good Track)')}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>{t('footer.weights', 'Ensemble Weights: 0.50 Evidence / 0.30 Style / 0.20 Visual')}</span>
              <span>•</span>
              <span className="text-[#E5C158] font-semibold">{t('footer.scale', 'Truth-O-Meter 5-Zone Scale')}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
