# Giles Memory Machine — Agent Briefing

## What this project is
A local Next.js web app that maintains a single master file (`AI_CONTEXT.md`) giving any AI instant context about the user's work. Every input updates that file automatically. Nothing is ever overwritten — every update creates a timestamped archive copy.

## Current state
- Project is scaffolded and file structure is complete
- API key has just been added to `.env.local`
- Dev server needs to be restarted
- Core paste-anything → Claude merge flow needs to be tested

## To get back up and running
```bash
npm run dev
```
Then open http://localhost:3000

## Project structure
```
giles-memory-machine/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── context/
│   │   │   │   ├── route.ts          # GET/PUT AI_CONTEXT.md
│   │   │   │   └── merge/route.ts    # POST paste → Claude merge
│   │   │   └── settings/route.ts    # Data directory config
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   └── lib/
│       ├── file-system.ts            # Read/write + auto-archive
│       └── schema.ts                 # Three layers & categories
├── data/
│   ├── AI_CONTEXT.md                 # Master file
│   └── archive/                      # Timestamped backups
├── .env.local                        # ANTHROPIC_API_KEY lives here
└── README.md
```

## Three fixed layers and categories
These are used to automatically route all incoming content:

**PROJECTS**
- Live generative visual works (e.g. organism)
- Live AV performance (e.g. Signal Dreams)
- Music albums / releases (e.g. DTTM)
- Commission work (TV, film, sync)
- Web / interactive builds
- Residencies / grants / applications

**ADMIN**
- Finance & invoicing
- Contacts & collaborators
- Scheduling & travel
- Legal & IP
- Tools & systems
- Outreach & marketing

**VISION / IDEAS**
- Aesthetic & artistic direction
- Future projects & concepts
- Research & references
- Business & practice strategy
- Notes from conversations / reading

## How content enters the system
1. **Paste anything** — raw text, file contents, folder listings, exported docs, meeting notes. Claude identifies the layer/category, extracts relevant context, merges into the right section of AI_CONTEXT.md
2. **Guided entry** — conversational Q&A per layer/category (scaffolded, needs implementation)
3. **PDF upload** — Claude reads and extracts into master file (scaffolded, needs implementation)

## Merge rules (critical)
- Never overwrite existing content — always merge and update
- If a project already exists, update its entry rather than duplicating
- Add `last updated` timestamp to any changed section
- Keep master file clean and concise — summarise, don't dump raw text
- Consistent structure per entry: what it is, current status, key people, next steps, decisions made

## Claude API
- Model: `claude-sonnet-4-20250514`
- Key in `.env.local` as `ANTHROPIC_API_KEY`

## Immediate next task
Test the core loop:
1. Paste a project description into the paste box
2. Verify Claude routes it correctly into AI_CONTEXT.md
3. Verify a timestamped archive copy is created in `/data/archive/`
4. Check copy-to-clipboard works on the master file view

## UI notes
- Dark minimal aesthetic
- Large paste box always prominent — lowest friction entry point
- Live view of AI_CONTEXT.md always visible
- Three layer tabs for guided entry
- Copy to clipboard button
