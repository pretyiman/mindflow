# Mindflow

A domain-agnostic node/wire diagramming webapp: users build a graph of nodes connected by typed,
labeled edges. Not a mind-mapping tool in the strict tree sense (unlike WiseMapping/MindMup) - the
core model is a **property graph**, so a node can have multiple parents, non-hierarchy connections
(e.g. "married to"), and cycles. A family tree, a software architecture diagram, a trading-bot
execution flow, or a comparison of this app against its competitors are all the same underlying
model, just different categories/relation types/data.

This file is the map for an AI agent picking up this project cold. Read it before making changes.
**Keep it updated** whenever you change the schema, the API surface, or any non-obvious behavior
described below - that's the whole point of this file existing.

## Tech stack

- **Server**: Fastify + Prisma + PostgreSQL, TypeScript, zod for request validation.
- **Client**: React + Vite + TypeScript, `@xyflow/react` (React Flow) for the canvas, Zustand for
  local UI state, TanStack Query for server state.
- npm workspaces (`server`, `client`), one root `package.json` with `npm run dev` running both
  concurrently.

## Repo layout

```
server/
  prisma/schema.prisma       - the whole data model
  src/routes/*.routes.ts     - Fastify route registration + preHandler auth/authorization
  src/schemas/*.schema.ts    - zod request-body validation
  src/services/*.service.ts  - all actual business logic; routes are thin
  src/plugins/auth.ts            - JWT verification, attaches request.user
  src/plugins/authorization.ts   - requireMapAccess / requireMapOwner helpers
  src/plugins/errorHandler.ts    - maps thrown errors (NotFoundError etc.) to HTTP responses
  src/index.ts                - registers everything, mounts under /api
client/
  src/components/graph/       - GraphCanvas (React Flow wrapper), CustomNode, CustomEdge, GroupNode,
                                 graphAdapter (DB shape -> React Flow shape), filterGraph
  src/components/panels/      - Toolbar, FilterPanel, NodeDetailPanel
  src/components/settings/    - Manage{Categories,RelationTypes,Tags}Modal, ShareModal, AccountSettingsModal
  src/components/maps/        - MapsListPage
  src/components/auth/        - AuthPage (login/register), AccountBadge
  src/components/invite/      - InviteAcceptPage
  src/api/*.api.ts            - one thin fetch wrapper per resource, all going through api/client.ts
  src/state/                  - graphStore (UI state: selection/filters/modals), authStore, themeStore
  src/App.tsx                 - single-view app, no router (one exception: /invite/:token is read
                                 once from the URL on cold load - see App.tsx's matchInviteToken)
```

## Core data model (`server/prisma/schema.prisma`)

Treat this as frozen in shape unless the user explicitly asks for a schema change - it's been
deliberately settled after earlier churn (see git log for the "accounts + sharing" and "grouping"
milestones). Additive migrations are fine; don't restructure existing tables casually.

- **Map** - top-level container. `ownerId` nullable (`SetNull` on user delete).
- **User** - email/passwordHash (Node's `crypto.scrypt`, no native deps)/name.
- **MapCollaborator** - `(mapId, userId)` unique, `role: EDITOR | VIEWER`. Ownership itself is
  `Map.ownerId`, never a collaborator row - one source of truth for "who owns this."
- **MapInvite** - shareable single-use token (`acceptedAt` set on redemption, can't be reused).
  Requires the recipient to log in and explicitly accept; the token alone grants nothing.
- **NodeCategory** - visual identity (icon + color) for a node, unique per map by name.
- **RelationType** - visual/semantic identity for an edge: directional?, color, line style,
  `isHierarchy` flag, optional `maxOutgoingPerSource`/`maxIncomingPerTarget` caps.
- **Node** - belongs to a map, optionally a category, optionally a `NodeGroup`. `posX`/`posY` are
  **absolute canvas coordinates when ungrouped, but relative to the parent group's own posX/posY
  when `groupId` is set** - this matches React Flow's own parent/child coordinate convention
  exactly, so `graphAdapter.ts` never has to convert anything at render time. Conversion only
  happens when a node joins/leaves a group (`groups.service.ts`).
- **NodeGroup** - a purely visual/organizational box wrapping 2+ nodes (e.g. a married couple).
  Owns no edges. Members keep independent identity/edges/notes/properties. See "Node Groups" below
  for the sizing rules - this took many iterations to get right, don't casually change the margin
  math without re-reading that section.
- **Tag** / **NodeTag** - freeform many-to-many labels for filtering/analysis, deliberately no
  icon/visual role (that's what NodeCategory is for). A node can carry any number of tags.
- **Edge** - `sourceNodeId`/`targetNodeId`/`relationTypeId`, unique on that triple (no duplicate
  identical edges). `sourceHandle`/`targetHandle` record which of the 4 connection points
  (top/left = always target, bottom/right = always source - see CustomNode.tsx) was actually used,
  so reloading never collapses an edge onto the wrong side. Nullable, with a left/right fallback in
  `graphAdapter.ts` for edges created before per-handle support existed.
- Both `Node` and `Edge` have per-instance `iconOverride`/`colorOverride`/`labelOverride`/etc. so two
  nodes of the same category (or edges of the same relation type) can still look distinct.

**Why a property graph, not a tree**: a node can have two "parent of" incoming edges (two parents),
plus a non-hierarchy edge like "married to" between two otherwise-unrelated nodes. This is the
concrete differentiator from WiseMapping/MindMup, both of which assume a strict single-parent tree.
See the "Mindflow Explained" map (built in-app, in the user's own account) for a worked example.

## Auth & sharing model (implemented, not aspirational)

- JWT in the response body (`Authorization: Bearer <token>`), stored client-side - not an httpOnly
  cookie. Deliberate tradeoff: this whole project is verified via curl/headless-Chrome scripts, and
  bearer tokens keep that trivial. Revisit before a real production deploy.
- `requireAuth` (plugins/auth.ts) verifies the JWT and sets `request.user`.
- `requireMapAccess(minRole)` / `requireMapOwner()` (plugins/authorization.ts) - applied as
  `preHandler` per route. `VIEWER` < `EDITOR`; owner always passes. A collaborator is never
  auto-promoted; sharing is managed via `MapCollaborator` rows (ShareModal.tsx + `/api/maps/:mapId/collaborators`)
  or via invite links (`/api/invites`).
- Client-side, `myRole` on each map (`MapRole = 'OWNER' | 'EDITOR' | 'VIEWER'`) gates edit
  affordances (Add Node, quick-add, Save/Delete in modals) - display-only; the real enforcement is
  server-side.

## API surface

All routes mounted under `/api`. Pattern per resource: `routes/X.routes.ts` (thin, just
preHandler + calls the service) → `schemas/X.schema.ts` (zod validation) → `services/X.service.ts`
(all real logic, transactions, cross-entity side effects).

| Resource | Routes |
|---|---|
| auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PATCH /auth/password` |
| maps | `GET/POST /maps`, `GET/PATCH/DELETE /maps/:mapId`, `GET /maps/:mapId/graph` (the one call that returns the full `GraphData` bundle - categories/relationTypes/tags/nodes/edges/groups - the client's single source of truth per map) |
| collaborators | `GET/POST /maps/:mapId/collaborators`, `PATCH/DELETE /collaborators/:id` |
| invites | `GET /invites/:token`, `POST /invites/:token/accept`, `DELETE /invites/:id` |
| categories | `GET/POST /maps/:mapId/categories`, `PATCH/DELETE /categories/:id` |
| relationTypes | `GET/POST /maps/:mapId/relation-types`, `PATCH/DELETE /relation-types/:id` |
| tags | `GET/POST /maps/:mapId/tags`, `PATCH/PUT/DELETE /tags/:id` |
| nodes | `GET/POST /maps/:mapId/nodes`, `PATCH/DELETE /nodes/:id` |
| edges | `GET/POST /maps/:mapId/edges`, `PATCH/DELETE /edges/:id` |
| groups | `GET/POST /maps/:mapId/groups`, `PATCH/DELETE /groups/:id` |

## Feature implementation status

All of the following are implemented and working, not planned:

- Accounts (register/login/JWT), per-map ownership, role-based sharing (EDITOR/VIEWER via
  collaborator rows or shareable invite links), account settings (change password).
- Full graph CRUD: nodes, edges (with 4-handle connection points and per-edge label/color/style
  overrides), categories, relation types (with directional/hierarchy flags and per-relation-type
  in/out degree caps), tags (many-to-many, filterable).
- **Node Groups**: create from 2+ selected nodes, auto-fit box (see rules below), drag/rename any
  member and the box resizes to follow, ungroup restores absolute positions.
- Filtering: a single search box (name/tags/properties) plus an "advanced" popover (tags, group,
  "connected to node X"), with dimmed-not-hidden non-matches so context isn't lost.
- Quick-add: click a node's "+" to create a new connected node in one step, without leaving the
  canvas. Toolbar's own "Add Node" (🔷) for an unconnected node.
- Light/dark theme toggle (defaults to light), applied at `<html data-theme>` so it covers the
  logged-out auth page too.
- Maps list page (create/rename/delete/share entry point).

## Node Groups - sizing rules (read this before touching `groups.service.ts`)

This went through many iterations before landing on the current rule, driven directly by user
feedback. The rule, verbatim intent: **width follows whichever member's name is widest; every
member is always left-aligned at a fixed margin; vertical spacing between members is whatever the
user leaves it as - grouping must never force members closer together, and dragging a member
further apart must grow the box to follow, not block the drag.**

Implementation (`server/src/services/groups.service.ts`):

- `GROUP_MARGIN = 12` (px) - the gap between a member's edge and the group border, on all 4 sides.
  Was 2px, then 8px, now 12px, each bump made because the user couldn't clearly see the margin
  at the smaller values. If asked to change it again, it's this one constant.
- `estimateNodeWidth(name)` - the server has no real font metrics, so width is approximated from
  character count (`WIDTH_OVERHEAD=46 + name.length*8.5`), clamped to `[90, 200]` to match the
  client CSS's own `.flow-node { min-width: 90px; max-width: 200px }` exactly. This is a known
  approximation - it can be off by a few px on fonts/characters that render wider/narrower than the
  8.5px/char estimate (verified: left/top/bottom margins measure exactly correct, right margin can
  be ~4px tighter for wide characters). Never overflows the border either way. Don't try to
  "fix" this precisely without real DOM measurement (would require moving the fit logic to the
  client, a bigger change) - it's an accepted, documented tradeoff.
- `resizeGroupToFitMembers(groupId)` is the **single source of truth** for box dimensions - width
  from `Math.max(...members.map(estimateNodeWidth))`, height from the actual min/max Y spread of
  members (not a fixed stacking gap). Every member's `posX` is force-reset to `GROUP_MARGIN`
  (horizontal position is never a persisted layout choice); `posY` is preserved/shifted by whatever
  delta keeps the box's top edge at the margin.
- Triggered from `nodes.service.ts`'s `updateNode` whenever a grouped node's `posX`/`posY`/`name`
  changes - this is the only hook point keeping the box in sync with drag or rename.
- `createGroup` does the minimal work (assign `groupId`, translate absolute → group-relative
  positions **preserving whatever spacing already existed** between the selected nodes - it must
  never compress them into a tight stack) then calls `resizeGroupToFitMembers` immediately after,
  so creation and later drag/rename-driven resizing can never disagree.
- Client-side (`graphAdapter.ts`): grouped nodes deliberately do **not** get React Flow's
  `extent: 'parent'`. That prop clamps a live drag to the group's *current* rendered box, which
  makes it physically impossible to ever drag a member somewhere that would grow the box - the
  server-side resize never gets the chance to run. The box growing/shrinking to follow its members
  is the intended behavior.
- `GraphCanvas.tsx`'s `handleNodeDragStop` calls `onChanged()` (refetch) after persisting a grouped
  node's drag, to pick up the server's corrected box dimensions.

## Popover cancel affordances

Two floating popovers exist for node creation: the toolbar's "Add Node" (`GraphCanvas.tsx`,
`.canvas-add-node-popover`) and a node's own "+" quick-add (`CustomNode.tsx`,
`.flow-quick-add-popover`). Both must support **Escape**, **click-away**, and an explicit **Cancel**
button - all three reset the input/category/error state without creating anything. If you add
another creation popover, copy this exact pattern, and note the one non-obvious part: the
click-away `document.addEventListener('mousedown', handler, true)` **must use the capture phase**.
React Flow's own pane/node mousedown handlers call `stopPropagation()` for pan/drag-selection
purposes, which silently swallows a bubble-phase document listener before it ever fires.

## Dev workflow / environment quirks (Windows)

- `npm run dev` at the repo root runs both server (:4000) and client (:5173) concurrently.
- Before any server code change requiring a restart: stop whatever's bound to port 4000 first
  (`Get-NetTCPConnection -LocalPort 4000 -State Listen | Stop-Process`), Windows file-locks the
  running process otherwise. Restart via `nohup npx tsx src/index.ts > /tmp/server.log 2>&1 &`
  from `server/`. The first health-check immediately after restart often needs a ~2s retry.
- `node -e` / any Node script invoked from Git Bash needs **Windows-style forward-slash paths**
  (`C:/Users/...`), not bash-style `/c/Users/...` - the latter gets misread as relative to the
  current drive and throws `ENOENT`.
- Client API base URL defaults to a relative `/api` (see `client/src/api/client.ts`), proxied to
  `localhost:4000` by Vite's dev server (`client/vite.config.ts`) - this is what makes the app work
  when accessed from a different device (phone, another machine) without hardcoding an absolute
  URL that would only resolve on the host machine.
- ngrok tunneling: `vite.config.ts` has `allowedHosts: ['.ngrok-free.app']`. ngrok's free tier
  serves a one-time browser interstitial page before the real app loads - expect that in any
  automated test hitting a fresh ngrok URL.
- `.env` at the repo root is shared by both workspaces (`server/src/env.ts` reads
  `../.env` relative to its own cwd, then also allows a `server/.env` override).

## Verification discipline

No change is "done" until: typecheck both packages (`npx tsc -b --noEmit` client /
`npx tsc --noEmit` server) → build clean (`npm run build`) → restart affected dev server(s) →
live-verify (curl for API-level checks, puppeteer-core + a real Chrome install for anything
UI-visible - there's no browser-automation MCP/extension wired up in this environment) → clean up
any scratch data created purely for testing. Report back before committing; commit only on
explicit go-ahead.
