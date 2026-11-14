import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  Database,
  Key,
  CreditCard,
  Users,
  Webhook,
  FileSpreadsheet,
  History,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  orgId: string;
  isPlatformAdmin?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ orgId, isPlatformAdmin }) => {
  const { t } = useTranslation();

  const links = [
    { to: `/orgs/${orgId}/dashboard`, label: t('nav.dashboard'), icon: BarChart3 },
    { to: `/orgs/${orgId}/datasources`, label: t('nav.dataSources'), icon: Database },
    { to: `/orgs/${orgId}/apikeys`, label: t('nav.apiKeys'), icon: Key },
    { to: `/orgs/${orgId}/billing`, label: t('nav.billing'), icon: CreditCard },
    { to: `/orgs/${orgId}/team`, label: t('nav.team'), icon: Users },
    { to: `/orgs/${orgId}/webhooks`, label: t('nav.webhooks'), icon: Webhook },
    { to: `/orgs/${orgId}/imports`, label: t('nav.imports'), icon: FileSpreadsheet },
    { to: `/orgs/${orgId}/audit`, label: t('nav.audit'), icon: History },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between transition-colors">
      <div className="space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </NavLink>
        ))}

        {isPlatformAdmin && (
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`
              }
            >
              <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>{t('nav.admin')}</span>
            </NavLink>
          </div>
        )}
      </div>

      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p className="font-semibold text-slate-700 dark:text-slate-300">Mizan SaaS v1.0</p>
        <p>Addis Ababa, Ethiopia (UTC+3)</p>
      </div>
    </aside>
  );
};
