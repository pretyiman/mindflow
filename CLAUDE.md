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
- Access control: `plugins/auth.ts` + `plugins/authorization.ts`. Sharing is managed via
  `MapCollaborator` rows (ShareModal.tsx + `/api/maps/:mapId/collaborators`) or invite links
  (`/api/invites`) - read those files directly for the exact role-check mechanics.
- Client-side, `myRole` on each map (`MapRole = 'OWNER' | 'EDITOR' | 'VIEWER'`) gates edit
  affordances (Add Node, quick-add, Save/Delete in modals) - display-only; the real enforcement is
  server-side.

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

- `GROUP_MARGIN = 12` (px, in `groups.service.ts`) - the gap between a member's edge and the group
  border, on all 4 sides. Was 2px, then 8px, now 12px, each bump made because the user couldn't
  clearly see the margin at the smaller values. If asked to change it again, it's this one constant.
- `resizeGroupToFitMembers(groupId)` is the **single source of truth** for box dimensions - both
  `createGroup` (on creation) and `nodes.service.ts`'s `updateNode` (on every drag or rename of a
  grouped node) call it, so creation and later drag/rename-driven resizing can never disagree. Width
  comes from `estimateNodeWidth` (a character-count approximation, since the server has no real font
  metrics - see its own comment for the exact formula/tradeoff); height from the members' actual
  vertical spread, not a fixed gap. Every member's `posX` is force-reset to `GROUP_MARGIN` on every
  resize (horizontal position is never a persisted layout choice).
- Client-side (`graphAdapter.ts`), grouped nodes deliberately do **not** get React Flow's
  `extent: 'parent'` - see that file's comment for why (short version: it would block a drag from
  ever growing the box, since the server-side resize never gets the chance to run).

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
