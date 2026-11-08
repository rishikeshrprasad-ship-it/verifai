import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles, UserCheck, Eye, EyeOff, Sun, Moon } from 'lucide-react';

export interface UserProfile {
  email: string;
  name: string;
  role: string;
  handle: string;
}

interface TransparentLoginViewProps {
  onLogin: (user: UserProfile) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const TransparentLoginView: React.FC<TransparentLoginViewProps> = ({
  onLogin,
  theme = 'dark',
  onToggleTheme
}) => {
  const [email, setEmail] = useState<string>('zorro.analyst@verifai.ai');
  const [password, setPassword] = useState<string>('••••••••••••');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const isDark = theme === 'dark';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);

    setTimeout(() => {
      const handle = email.split('@')[0] || 'Zorro';
      const name = handle.charAt(0).toUpperCase() + handle.slice(1);
      onLogin({
        email,
        name,
        role: 'Lead Investigator',
        handle: handle.toUpperCase() === 'ZORRO.ANALYST' ? 'Zorro' : handle
      });
      setLoading(false);
    }, 450);
  };

  const handleInstantDemo = () => {
    setLoading(true);
    setTimeout(() => {
      onLogin({
        email: 'zorro.analyst@verifai.ai',
        name: 'Zorro',
        role: 'Lead Investigator',
        handle: 'Zorro'
      });
      setLoading(false);
    }, 300);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans transition-colors duration-500 ${
      isDark
        ? 'bg-[#1A050B] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#581845]/40 via-[#1A050B] to-[#120307]'
        : 'bg-[#FDFBF7] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#E5C158]/15 via-[#FDFBF7] to-[#F4EFE6]'
    }`}>
      {/* Background Matrix Mesh Grid */}
      <div className={`absolute inset-0 bg-[size:36px_36px] pointer-events-none ${
        isDark
          ? 'bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)]'
          : 'bg-[linear-gradient(to_right,#6D1B2608_1px,transparent_1px),linear-gradient(to_bottom,#6D1B2608_1px,transparent_1px)]'
      }`} />

      {/* Wine/Gold Ambient Glow Leaks */}
      <div className={`absolute top-1/4 -right-20 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
        isDark ? 'bg-[#800020]/25' : 'bg-[#E5C158]/20'
      }`} />
      <div className={`absolute bottom-1/4 -left-20 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
        isDark ? 'bg-[#581845]/30' : 'bg-[#800020]/10'
      }`} />

      {/* Floating Top-Right Theme Toggle Switcher */}
      {onToggleTheme && (
        <div className="absolute top-5 right-5 z-20">
          <button
            type="button"
            onClick={onToggleTheme}
            title={isDark ? "Switch to Day Parchment" : "Switch to Nocturnal Wine"}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all duration-300 shadow-md backdrop-blur-md cursor-pointer border ${
              isDark
                ? 'bg-[#2D141E]/80 border-[#E5C158]/40 text-[#E5C158] hover:bg-[#3D1A29] hover:border-[#E5C158]'
                : 'bg-white/90 border-[#C5A059]/50 text-[#6D1B26] hover:bg-[#FBF6EE] hover:border-[#800020]'
            }`}
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-[#E5C158] animate-spin-slow" />
                <span className="tracking-wide">Day Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[#6D1B26]" />
                <span className="tracking-wide">Night Mode</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Floating Glassmorphic Login Gateway Card */}
      <div className={`backdrop-blur-2xl rounded-2xl p-8 sm:p-10 max-w-md w-full relative overflow-hidden z-10 space-y-6 shadow-2xl transition-all duration-300 ${
        isDark
          ? 'bg-[#2D141E]/80 border border-[#E5C158]/35 shadow-black/90'
          : 'bg-[#FFFDF9]/90 border border-[#C5A059]/40 shadow-stone-900/10'
      }`}>
        {/* Top Gold Foil Hairline Light Leak */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-[#E5C158]/20 via-[#800020]/20 to-transparent blur-xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#E5C158]/70 to-transparent" />

        {/* Brand / Masthead Block */}
        <div className="text-center space-y-2">
          <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl border shadow-lg mb-2 transition-all ${
            isDark
              ? 'bg-gradient-to-b from-[#4A1C2C] to-[#200C12] border-[#E5C158]/40 text-[#E5C158] shadow-black/50'
              : 'bg-gradient-to-b from-[#FAF5EC] to-[#F1E8DA] border-[#C5A059]/60 text-[#800020] shadow-stone-400/20'
          }`}>
            <ShieldCheck className={`w-7 h-7 ${isDark ? 'text-[#E5C158]' : 'text-[#800020]'}`} />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className={`font-serif-editorial text-3xl font-bold tracking-tight ${
              isDark ? 'text-[#FAF6F0]' : 'text-[#200C12]'
            }`}>
              VerifAI
            </h1>
            <span className={`text-[9px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded leading-none border ${
              isDark
                ? 'bg-[#4A1C2C] text-[#E5C158] border-[#E5C158]/40'
                : 'bg-[#F4ECE1] text-[#800020] border-[#C5A059]/40'
            }`}>
              FUSIONX 1.0
            </span>
          </div>
          <p className={`text-xs font-sans ${
            isDark ? 'text-[#FAF6F0]/70' : 'text-[#200C12]/75'
          }`}>
            AI Multi-Paper Intelligence & Real-Time Verification Bureau
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Email Field */}
          <div className="space-y-1.5 text-left">
            <label className={`text-xs font-mono font-semibold block uppercase tracking-wider ${
              isDark ? 'text-[#E5C158]' : 'text-[#800020]'
            }`}>
              Analyst Identifier / Email
            </label>
            <div className="relative">
              <Mail className={`w-4 h-4 absolute left-3.5 top-3.5 ${
                isDark ? 'text-[#E5C158]/70' : 'text-[#800020]/70'
              }`} />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@verifai.ai"
                required
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-all ${
                  isDark
                    ? 'bg-black/40 border-[#E5C158]/25 focus:border-[#E5C158] focus:ring-1 focus:ring-[#E5C158]/40 text-[#FAF6F0] placeholder-[#FAF6F0]/30'
                    : 'bg-white/80 border-[#C5A059]/35 focus:border-[#800020] focus:ring-1 focus:ring-[#800020]/30 text-[#200C12] placeholder-stone-400'
                }`}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5 text-left">
            <label className={`text-xs font-mono font-semibold block uppercase tracking-wider ${
              isDark ? 'text-[#E5C158]' : 'text-[#800020]'
            }`}>
              Access Key / Secret
            </label>
            <div className="relative">
              <Lock className={`w-4 h-4 absolute left-3.5 top-3.5 ${
                isDark ? 'text-[#E5C158]/70' : 'text-[#800020]/70'
              }`} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter access secret"
                required
                className={`w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm outline-none transition-all font-mono ${
                  isDark
                    ? 'bg-black/40 border-[#E5C158]/25 focus:border-[#E5C158] focus:ring-1 focus:ring-[#E5C158]/40 text-[#FAF6F0] placeholder-[#FAF6F0]/30'
                    : 'bg-white/80 border-[#C5A059]/35 focus:border-[#800020] focus:ring-1 focus:ring-[#800020]/30 text-[#200C12] placeholder-stone-400'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-3 p-0.5 cursor-pointer transition-colors ${
                  isDark
                    ? 'text-[#E5C158]/70 hover:text-[#E5C158]'
                    : 'text-[#800020]/70 hover:text-[#800020]'
                }`}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-[#6D1B26] via-[#800020] to-[#990033] hover:from-[#800020] hover:to-[#6D1B26] border border-[#E5C158]/40 text-[#FAF6F0] font-sans text-sm font-semibold shadow-lg shadow-black/40 hover:shadow-[0_0_25px_rgba(229,193,88,0.25)] transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin text-[#E5C158]" />
                <span>Authorizing Clearance...</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <span>Enter Verification Bureau</span>
                <ArrowRight className="w-4 h-4 text-[#E5C158]" />
              </span>
            )}
          </button>
        </form>

        {/* 1-Click Instant Demo Button */}
        <div className={`pt-3 border-t space-y-2 ${
          isDark ? 'border-white/10' : 'border-stone-200'
        }`}>
          <button
            type="button"
            onClick={handleInstantDemo}
            className={`w-full py-2.5 px-3 rounded-lg border font-mono text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs ${
              isDark
                ? 'border-[#E5C158]/35 bg-[#200C12]/80 hover:bg-[#4A1C2C] text-[#E5C158] hover:border-[#E5C158]'
                : 'border-[#C5A059]/50 bg-[#FAF5EB] hover:bg-[#F2E8D7] text-[#6D1B26] hover:border-[#800020]'
            }`}
          >
            <UserCheck className={`w-3.5 h-3.5 ${isDark ? 'text-[#E5C158]' : 'text-[#800020]'}`} />
            <span>⚡ Instant Demo Access (Handle: Zorro)</span>
          </button>

          <p className={`text-[11px] font-mono text-center ${
            isDark ? 'text-[#D4B29E]/60' : 'text-stone-500'
          }`}>
            Certified Newsroom & Public Truth-O-Meter Architecture
          </p>
        </div>
      </div>
    </div>
  );
};
