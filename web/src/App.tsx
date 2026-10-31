import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { DataSourcesPage } from './pages/DataSourcesPage.js';
import { ApiKeysPage } from './pages/ApiKeysPage.js';
import { BillingPage } from './pages/BillingPage.js';
import { TeamPage } from './pages/TeamPage.js';
import { WebhooksPage } from './pages/WebhooksPage.js';
import { ImportsPage } from './pages/ImportsPage.js';
import { AuditLogPage } from './pages/AuditLogPage.js';
import { AdminPage } from './pages/AdminPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { PublicSharePage } from './pages/PublicSharePage.js';
import { apiRequest } from './api/client.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const { orgId } = useParams<{ orgId: string }>();

  const { data: userData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const res = await apiRequest('/auth/me');
      return res.user;
    },
  });

  const { data: orgsData, isLoading } = useQuery({
    queryKey: ['userOrgs'],
    queryFn: async () => {
      const res = await apiRequest('/orgs');
      return res.organizations;
    },
  });

  const userOrgs = orgsData || [];
  const activeOrgEntry = userOrgs.find((item: any) => item.org?._id === orgId) || userOrgs[0];
  const activeOrg = activeOrgEntry?.org;

  const handleSelectOrg = (newOrgId: string) => {
    navigate(`/orgs/${newOrgId}/dashboard`);
  };

  const handleLogout = () => {
    localStorage.removeItem('mizan_token');
    navigate('/login');
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">Loading Mizan Workspace...</div>;
  }

  if (userOrgs.length === 0) {
    return <Navigate to="/login" replace />;
  }

  const currentOrgId = orgId || activeOrg?._id;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        currentOrg={activeOrg}
        userOrgs={userOrgs}
        onSelectOrg={handleSelectOrg}
        onLogout={handleLogout}
      />
      <div className="flex flex-1">
        <Sidebar
          orgId={currentOrgId}
          isPlatformAdmin={userData?.platformRole === 'platform_admin'}
        />
        <main className="flex-1 p-6 md:p-8 max-w-7xl">
          <Routes>
            <Route path="dashboard" element={<DashboardPage orgId={currentOrgId} />} />
            <Route path="datasources" element={<DataSourcesPage orgId={currentOrgId} />} />
            <Route path="apikeys" element={<ApiKeysPage orgId={currentOrgId} />} />
            <Route path="billing" element={<BillingPage orgId={currentOrgId} />} />
            <Route path="team" element={<TeamPage orgId={currentOrgId} />} />
            <Route path="webhooks" element={<WebhooksPage orgId={currentOrgId} />} />
            <Route path="imports" element={<ImportsPage orgId={currentOrgId} />} />
            <Route path="audit" element={<AuditLogPage orgId={currentOrgId} />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/share/:token" element={<PublicSharePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/orgs/:orgId/*" element={<MainLayout />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
