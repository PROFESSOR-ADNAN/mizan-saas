export type OrgRole = 'owner' | 'admin' | 'billing' | 'analyst' | 'viewer';
export type PlatformRole = 'user' | 'platform_admin';

export type Permission =
  | 'events:ingest'
  | 'data:read'
  | 'data:export'
  | 'dashboards:read'
  | 'dashboards:write'
  | 'dashboards:delete'
  | 'dashboards:share'
  | 'sources:manage'
  | 'apikeys:manage'
  | 'members:read'
  | 'members:manage'
  | 'teams:manage'
  | 'billing:read'
  | 'billing:manage'
  | 'webhooks:manage'
  | 'audit:read'
  | 'org:update'
  | 'org:delete'
  | 'org:transfer';

export const ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = {
  owner: [
    'events:ingest',
    'data:read',
    'data:export',
    'dashboards:read',
    'dashboards:write',
    'dashboards:delete',
    'dashboards:share',
    'sources:manage',
    'apikeys:manage',
    'members:read',
    'members:manage',
    'teams:manage',
    'billing:read',
    'billing:manage',
    'webhooks:manage',
    'audit:read',
    'org:update',
    'org:delete',
    'org:transfer',
  ],
  admin: [
    'events:ingest',
    'data:read',
    'data:export',
    'dashboards:read',
    'dashboards:write',
    'dashboards:delete',
    'dashboards:share',
    'sources:manage',
    'apikeys:manage',
    'members:read',
    'members:manage',
    'teams:manage',
    'webhooks:manage',
    'audit:read',
    'org:update',
  ],
  billing: [
    'data:read',
    'data:export',
    'dashboards:read',
    'members:read',
    'billing:read',
    'billing:manage',
  ],
  analyst: [
    'data:read',
    'data:export',
    'dashboards:read',
    'dashboards:write',
    'dashboards:delete',
    'dashboards:share',
    'members:read',
  ],
  viewer: [
    'data:read',
    'dashboards:read',
    'members:read',
  ],
};

export function hasPermission(role: OrgRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return Boolean(permissions && permissions.includes(permission));
}
