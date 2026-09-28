import React from 'react';
import { useLanguage } from '../context/LanguageContext.js';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ variant = 'compact', className = '' }) => {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className={`liquid-glass-switcher p-1 rounded-xl flex items-center gap-1 shrink-0 ${className}`}
      title={lang === 'th' ? 'เปลี่ยนภาษา / Switch Language' : 'Switch Language / เปลี่ยนภาษา'}
    >
      <Globe className="w-3.5 h-3.5 text-teal-400/80 ml-1.5 hidden sm:block" />

      {/* Thai button */}
      <button
        type="button"
        onClick={() => setLang('th')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all duration-300 flex items-center gap-1.5 ${
          lang === 'th'
            ? 'bg-gradient-to-r from-teal-500/80 to-emerald-500/80 text-white shadow-[0_2px_10px_rgba(20,184,166,0.35)] border border-teal-300/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
        }`}
      >
        <span>🇹🇭</span>
        <span>TH</span>
        {variant === 'full' && <span className="hidden md:inline text-[11px] font-normal">ไทย</span>}
      </button>

      {/* English button */}
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all duration-300 flex items-center gap-1.5 ${
          lang === 'en'
            ? 'bg-gradient-to-r from-cyan-500/80 to-blue-500/80 text-white shadow-[0_2px_10px_rgba(6,182,212,0.35)] border border-cyan-300/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
        }`}
      >
        <span>🇬🇧</span>
        <span>EN</span>
        {variant === 'full' && <span className="hidden md:inline text-[11px] font-normal">English</span>}
      </button>
    </div>
  );
};
