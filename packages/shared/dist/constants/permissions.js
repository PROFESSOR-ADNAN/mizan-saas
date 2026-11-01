"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = void 0;
exports.hasPermission = hasPermission;
exports.ROLE_PERMISSIONS = {
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
function hasPermission(role, permission) {
    const permissions = exports.ROLE_PERMISSIONS[role];
    return Boolean(permissions && permissions.includes(permission));
}
//# sourceMappingURL=permissions.js.map