import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.js';
import { useLanguage } from '../context/LanguageContext.js';

interface ThemeToggleProps {
  variant?: 'compact' | 'full';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'compact' }) => {
  const { theme, toggleTheme } = useTheme();
  const { lang } = useLanguage();

  const isDark = theme === 'dark';
  const label = isDark
    ? (lang === 'th' ? 'โหมดมืด (Dark)' : 'Dark Mode')
    : (lang === 'th' ? 'โหมดสว่าง (Light)' : 'Light Mode');
  const actionTooltip = isDark
    ? (lang === 'th' ? 'เปลี่ยนเป็นโหมดสว่าง' : 'Switch to Light Mode')
    : (lang === 'th' ? 'เปลี่ยนเป็นโหมดมืด' : 'Switch to Dark Mode');

  if (variant === 'full') {
    return (
      <div className="flex items-center gap-1.5 p-1 liquid-glass-switcher rounded-2xl shadow-inner">
        <button
          onClick={() => isDark && toggleTheme()}
          type="button"
          title={lang === 'th' ? 'โหมดสว่าง' : 'Light Mode'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all duration-200 ${
            !isDark
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sun className="w-3.5 h-3.5 text-amber-300" />
          <span>{lang === 'th' ? 'สว่าง' : 'Light'}</span>
        </button>

        <button
          onClick={() => !isDark && toggleTheme()}
          type="button"
          title={lang === 'th' ? 'โหมดมืด' : 'Dark Mode'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all duration-200 ${
            isDark
              ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Moon className="w-3.5 h-3.5 text-cyan-300" />
          <span>{lang === 'th' ? 'มืด' : 'Dark'}</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={actionTooltip}
      aria-label={actionTooltip}
      className="relative p-2 rounded-xl liquid-glass-button transition-all duration-200 flex items-center justify-center group overflow-hidden"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-300 transition-transform group-hover:rotate-45 duration-300" />
      ) : (
        <Moon className="w-4 h-4 text-teal-600 dark:text-cyan-300 transition-transform group-hover:-rotate-12 duration-300" />
      )}
      <span className="sr-only">{label}</span>
    </button>
  );
};
