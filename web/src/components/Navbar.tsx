import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Globe, LogOut, Building, Shield, Moon, Sun } from 'lucide-react';

interface NavbarProps {
  currentOrg: any;
  userOrgs: any[];
  onSelectOrg: (orgId: string) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentOrg,
  userOrgs,
  onSelectOrg,
  onLogout,
}) => {
  const { t, i18n } = useTranslation();
  const [isDark, setIsDark] = useState(() => {
    return (
      localStorage.getItem('mizan_theme') === 'dark' ||
      (!('mizan_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mizan_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mizan_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'am' ? 'en' : 'am';
    i18n.changeLanguage(nextLang);
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            ሚ
          </div>
          <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">
            {t('appName')}
          </span>
        </div>

        {/* Organization Switcher */}
        {userOrgs.length > 0 && (
          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5">
            <Building className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <select
              value={currentOrg?._id || ''}
              onChange={(e) => onSelectOrg(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {userOrgs.map(({ org, role }) => (
                <option key={org._id} value={org._id} className="dark:bg-slate-900 dark:text-slate-200">
                  {org.name} ({role})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-3">
        {/* Security & Verification */}
        <Link
          to="/verify"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
          title="Security & Verification"
        >
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Security & Verification</span>
        </Link>

        {/* Dark / Light Mode Toggle (Item 6) */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
          title="Toggle Language"
        >
          <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>{i18n.language === 'am' ? 'English' : 'አማርኛ'}</span>
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('nav.logout')}</span>
        </button>
      </div>
    </header>
  );
};
