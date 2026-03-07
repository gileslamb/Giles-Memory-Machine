# Giles Memory Machine — Project Documentation

A Next.js web app that maintains a single master file (**AI_CONTEXT.md**) giving any AI instant context about your work. Paste anything, upload files, or chat — content is merged into the right layer and category automatically. Nothing is ever lost; every update creates a timestamped archive.

---

## Features

### Core
- **Paste & merge** — Raw text, meeting notes, exports. Claude reads, routes, and merges into AI_CONTEXT.md.
- **File upload** — PDF, CSV, Excel, images. Extracted via pdf-parse, xlsx, or Claude vision.
- **AI preview** — Preview merge summary before Accept / Cancel / Edit.
- **Auto-archive** — Every update creates a timestamped copy in `/archive` (e.g. `AI_CONTEXT_2026-03-07_14-32.md`).

### Dashboard
- **Layer cards** — PROJECTS, ADMIN, VISION / IDEAS with entry counts and health indicators.
- **Shape of things** — Bar charts (overview by layer, per-category breakdown). Collapsed by default.
- **Summary box** — Click a category bar or tag to see its summary in a right-hand panel.
- **Editable entries** — Edit or remove entries inline; changes sync to AI_CONTEXT.md.

### Check-in & Todos
- **Check-in chat** — Conversational Q&A to extract context updates and todos.
- **Kanban board** — Todos tab with Todo / In Progress / Done columns, synced with `## CURRENT TODOS`.
- **Procrastination indicators** — Flags entries with 14+ days no update and open todos.

---

## Architecture

### Three layers
```
PROJECTS
├── Live generative visual works
├── Live AV performance
├── Music albums / releases
├── Commission work
├── Web / interactive builds
└── Residencies / grants / applications

ADMIN
├── Finance & invoicing
├── Contacts & collaborators
├── Scheduling & travel
├── Legal & IP
├── Tools & systems
└── Outreach & marketing

VISION / IDEAS
├── Aesthetic & artistic direction
├── Future projects & concepts
├── Research & references
├── Business & practice strategy
└── Notes from conversations / reading
```

### Entry format
Entries use `- **Name** — summary` or `- **Name:** summary` (colon for Finance, Admin, etc.)
- `*Last updated: YYYY-MM-DD*` for staleness tracking
- `*edited at YYYY-MM-DD HH:MM:SS*` for manual edits

---

## Project structure

```
giles-memory-machine/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── context/
│   │   │   │   ├── route.ts          # GET/PUT AI_CONTEXT.md
│   │   │   │   ├── entry/route.ts    # PATCH entry (update/remove)
│   │   │   │   ├── merge/route.ts    # POST paste → Claude merge
│   │   │   │   ├── merge-preview/route.ts  # POST preview before merge
│   │   │   │   ├── refresh-timestamps/route.ts
│   │   │   │   └── todos/route.ts
│   │   │   ├── checkin/
│   │   │   │   ├── route.ts          # GET check-in status
│   │   │   │   └── commit/route.ts   # POST commit context updates
│   │   │   ├── extract-file/route.ts # PDF, image, CSV, Excel extraction
│   │   │   ├── settings/route.ts    # Data directory config
│   │   │   └── test-key/route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── todos/page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── AppNav.tsx
│   │   ├── CheckInPanel.tsx
│   │   ├── ContextDashboard.tsx
│   │   ├── DashboardErrorBoundary.tsx
│   │   ├── KanbanBoard.tsx
│   │   ├── LayerCard.tsx (in ContextDashboard)
│   │   ├── PastePanel.tsx
│   │   ├── ShapeOfThings.tsx
│   │   └── SummaryBox.tsx
│   └── lib/
│       ├── entry-edit.ts
│       ├── file-system.ts            # Read/write + auto-archive
│       ├── parse-context.ts          # Parse AI_CONTEXT.md
│       ├── parse-files.ts            # PDF, image, CSV, Excel
│       ├── parse-todos.ts
│       └── schema.ts
├── data/                             # Gitignored, created on first run
│   ├── AI_CONTEXT.md
│   └── archive/
├── .env.local                        # ANTHROPIC_API_KEY
├── render.yaml                       # Render deployment config
└── README.md
```

---

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Add Anthropic API key**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local: ANTHROPIC_API_KEY=your_key
   ```

3. **Set data directory** (optional)
   - Open app → Settings → enter absolute path
   - Default: `./data` (created automatically on first run)

4. **Run**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

### Remote access (same network)
```bash
npm run dev:remote
```
Then open `http://<your-ip>:3000`

---

## Deployment (Render)

1. Push to GitHub
2. In [Render](https://render.com): **New → Blueprint** (or Web Service)
3. Connect repo — `render.yaml` configures build/start
4. Add **Environment Variable**: `ANTHROPIC_API_KEY` = your key (Render → Environment)

### Persistent memory (Render Disk)

The `render.yaml` includes a persistent disk mounted at `/data`. **AI_CONTEXT.md and archives are stored there and survive redeploys.**

- **Requires paid plan** (Starter $7/mo or higher) — persistent disks are not available on the free tier
- On free tier: remove the `disk` block and `DATA_DIR` env var from `render.yaml`; content will reset on each deploy

---

## Tech stack

- **Next.js 15** — App Router
- **React 19** — UI
- **Tailwind CSS** — Styling
- **Claude API** — claude-sonnet-4-20250514
- **Recharts** — Bar charts
- **@hello-pangea/dnd** — Kanban drag-and-drop
- **pdf-parse, pdfjs-dist, xlsx** — File extraction
- **Node fs** — No database; file-based storage

---

## Merge rules

- Never overwrite existing content — always merge and update
- If a project exists, update its entry rather than duplicating
- Add `last updated` timestamp to any changed section
- Keep master file clean — summarise, don't dump raw text
- Consistent structure: what it is, current status, key people, next steps

---

## Version

**V1** — March 2026
