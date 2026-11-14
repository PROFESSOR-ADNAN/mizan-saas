import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Globe, LogOut, Building, Shield } from 'lucide-react';

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

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'am' ? 'en' : 'am';
    i18n.changeLanguage(nextLang);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            ሚ
          </div>
          <span className="font-bold text-xl text-slate-900 tracking-tight">
            {t('appName')}
          </span>
        </div>

        {/* Organization Switcher */}
        {userOrgs.length > 0 && (
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <Building className="w-4 h-4 text-slate-500" />
            <select
              value={currentOrg?._id || ''}
              onChange={(e) => onSelectOrg(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              {userOrgs.map(({ org, role }) => (
                <option key={org._id} value={org._id}>
                  {org.name} ({role})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {/* Security & Verification */}
        <Link
          to="/verify"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
          title="Security & Verification"
        >
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Security & Verification</span>
        </Link>

        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
          title="Toggle Language"
        >
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <span>{i18n.language === 'am' ? 'English' : 'አማርኛ'}</span>
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </header>
  );
};
