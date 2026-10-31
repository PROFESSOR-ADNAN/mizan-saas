# Mizan Role-Based Access Control (RBAC) & Team Scoping

## 1. Roles Overview

Mizan implements a strict multi-tenant permission matrix. Roles are assigned at the **Organization Membership** level, not globally on the user.

| Role | Intended Audience | Core Capabilities |
|---|---|---|
| **Owner** | Business founder / General manager | Full administrative, billing, team, webhook, and API key management. Cannot be deleted or demoted without explicit ownership transfer. |
| **Admin** | Operations manager / Store lead | Manages data sources, dashboards, members (except other admins/owner), invitations, and webhook endpoints. Cannot alter billing or transfer ownership. |
| **Billing** | Accountant / Finance officer | Full access to invoices, payments, plan changes, credit notes, and usage meters. Read-only access to sales summary dashboards. |
| **Analyst** | Business analyst / Inventory manager | Full access to dashboards, reports, queries, CSV exports, and imports. Cannot manage team, API keys, or billing. |
| **Viewer** | Staff / Junior clerk / Store associate | Read-only access to dashboards and reports. Can be restricted to specific team data sources. |

---

## 2. Permission Matrix

| Permission | Owner | Admin | Billing | Analyst | Viewer |
|---|:---:|:---:|:---:|:---:|:---:|
| `events:ingest` | :white_check_mark: | :white_check_mark: | :x: | :x: | :x: |
| `data:read` | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `data:export` | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: |
| `dashboards:read` | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `dashboards:write` | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: | :x: |
| `dashboards:delete` | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: | :x: |
| `dashboards:share` | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: | :x: |
| `sources:manage` | :white_check_mark: | :white_check_mark: | :x: | :x: | :x: |
| `apikeys:manage` | :white_check_mark: | :white_check_mark: | :x: | :x: | :x: |
| `members:read` | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `members:manage` | :white_check_mark: | :white_check_mark: | :x: | :x: | :x: |
| `teams:manage` | :white_check_mark: | :white_check_mark: | :x: | :x: | :x: |
| `billing:read` | :white_check_mark: | :x: | :white_check_mark: | :x: | :x: |
| `billing:manage` | :white_check_mark: | :x: | :white_check_mark: | :x: | :x: |
| `webhooks:manage` | :white_check_mark: | :white_check_mark: | :x: | :x: | :x: |
| `audit:read` | :white_check_mark: | :white_check_mark: | :x: | :x: | :x: |
| `org:update` | :white_check_mark: | :white_check_mark: | :x: | :x: | :x: |
| `org:delete` | :white_check_mark: | :x: | :x: | :x: | :x: |
| `org:transfer` | :white_check_mark: | :x: | :x: | :x: | :x: |

---

## 3. Team Scoping Rules

An organization can partition access via **Teams**:
1. A **Team** links a group of members to a specific subset of **Data Sources** (e.g., "Bole Branch POS", "Telegram Orders") and **Dashboards**.
2. When a user with the `Viewer` or `Analyst` role is assigned to a Team, the query engine automatically injects the team's `dataSourceIds` into the query filter:
   `query.sourceId = { $in: team.allowedSourceIds }`.
3. Users with `Owner` or `Admin` roles always bypass team scoping and can inspect all data sources.
4. Attempting to query a data source outside the team's grant returns empty or `404 Not Found`.

---

## 4. Last-Owner Protection

- An organization MUST have at least one active `Owner`.
- If a user is the sole owner of an organization:
  - They cannot leave the organization (`400 Cannot leave as sole owner`).
  - Their role cannot be changed to another role (`400 Cannot demote sole owner`).
  - They cannot be removed by any other user (`403 Forbidden`).
- Ownership transfer requires:
  1. Current owner initiates transfer specifying target member.
  2. Target member accepts transfer.
  3. Original owner is demoted to `Admin`.
