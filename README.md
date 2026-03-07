# Giles Memory Machine

A local Next.js app that maintains one master file — **AI_CONTEXT.md** — giving any AI instant context about your work.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Add your Anthropic API key**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local and add: ANTHROPIC_API_KEY=your_key
   ```

3. **Set your data directory** (optional)
   - Open the app, click **Settings**
   - Enter the absolute path where AI_CONTEXT.md and the archive folder should live
   - Default: `./data` inside the project

4. **Run the app**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

### Remote access (same network)

To reach the app from another device on your Wi‑Fi (e.g. phone, tablet, another computer):

```bash
npm run dev:remote
```

Then open `http://<your-machine-ip>:3000` (e.g. `http://192.168.1.5:3000`). Find your IP with `ipconfig getifaddr en0` (Mac) or `hostname -I` (Linux).

### Deploy to Render

1. Push the repo to GitHub
2. In [Render](https://render.com): **New → Web Service**, connect the repo
3. Build: `npm install && npm run build`
4. Start: `npm start`
5. Add **Environment Variable**: `ANTHROPIC_API_KEY` = your key (Render → Environment)
6. **Important**: The app uses local `fs` for `AI_CONTEXT.md`. On Render, the filesystem is ephemeral — content resets on redeploy. For production you’d need persistent storage (e.g. Render Disk, S3, or a DB). For now, Render is fine for testing the merge flow.

## How it works

- **Paste anything** — Meeting notes, Milanote exports, raw text. Claude reads it, routes it to the right layer/category, and merges it into AI_CONTEXT.md.
- **Auto-archive** — Every update creates a timestamped copy in `/archive` (e.g. `AI_CONTEXT_2026-03-07_14-32.md`). Nothing is ever lost.
- **Three layers** — PROJECTS, ADMIN, VISION/IDEAS — with fixed categories for consistent routing.

## Tech

- Next.js 15, Tailwind, Claude API (claude-sonnet-4-20250514)
- Node `fs` for file read/write — no database
