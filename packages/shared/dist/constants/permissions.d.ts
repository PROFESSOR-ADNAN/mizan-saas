export type OrgRole = 'owner' | 'admin' | 'billing' | 'analyst' | 'viewer';
export type PlatformRole = 'user' | 'platform_admin';
export type Permission = 'events:ingest' | 'data:read' | 'data:export' | 'dashboards:read' | 'dashboards:write' | 'dashboards:delete' | 'dashboards:share' | 'sources:manage' | 'apikeys:manage' | 'members:read' | 'members:manage' | 'teams:manage' | 'billing:read' | 'billing:manage' | 'webhooks:manage' | 'audit:read' | 'org:update' | 'org:delete' | 'org:transfer';
export declare const ROLE_PERMISSIONS: Record<OrgRole, Permission[]>;
export declare function hasPermission(role: OrgRole, permission: Permission): boolean;
//# sourceMappingURL=permissions.d.ts.map