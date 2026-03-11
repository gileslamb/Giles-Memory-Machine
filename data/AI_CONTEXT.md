# AI Context

*Last updated: 2026-03-11*

---

## CURRENT TODOS
- [ ] finish Gileslamb.com website · added 2026-03-11 · Projects > General
- [ ] Giles Lamb new site - finish · added 2026-03-11 · Projects > General
- [ ] Build gileslamb.com master site in Cursor using Next.js App Router + Tailwind CSS · added 2026-03-11 · Projects > Web builds
- [ ] Deploy gileslamb.com to Vercel · added 2026-03-11 · Projects > Web builds
- [ ] Upload videos to Cloudflare Stream and embed in project cases · added 2026-03-11 · Projects > Web builds
- [ ] Complete professional portrait photography shoot · added 2026-03-11 · Projects > Web builds
- [x] Resolve feedbackTOP resolution + initialisation issues in organism · completed 2026-03-07 · Projects > organism
- [x] Write MIDI-over-network README for organism setup · completed 2026-03-07 · Projects > organism
- [ ] Berlin performance prep — confirm date and set milestones · added 2026-03-07 · Projects > organism
- [x] File tax return · completed 2026-03-07 · Admin > Finance & invoicing
- [x] Create Diddy Das Dreamland bible for Levi Jan · completed 2026-03-07 · Projects > Diddy Das Dreamland
- [ ] Contact Marie and Alex about music session · added 2026-03-07 · Admin > Contacts & collaborators
- [x] Work on Evie's iPhone song recording · completed 2026-03-07 · Projects > Evie's Song
- [ ] Complete Hushabye Lullaby website · added 2026-03-07 · Projects > Hushabye Lullaby
- [ ] Build Wonder Club website · added 2026-03-07 · Projects > Wonder Club
- [ ] Create rotating cylinder design for Curious Dreamers core website · added 2026-03-07 · Projects > Curious Dreamers
- [ ] Continue music demos for Tier Reno · added 2026-03-07 · Projects > Tier Reno
- [x] Write songs for Diddy Das Dreamland album · completed 2026-03-07 · Projects > Diddy Das Dreamland
- [x] Develop first Living Album prototype with Distance to the Moon · completed 2026-03-07 · Projects > Distance to the Moon
- [ ] Plan Apollo x6 + ADAT system upgrade · added 2026-03-07 · Admin > Tools & systems
- [ ] Purchase Lyra-8 + Cosmos when income allows · added 2026-03-07 · Admin > Finance & invoicing
- [ ] Seed Vision / Ideas layer in Memory Machine · added 2026-03-07 · Projects > Giles Memory Machine
- [ ] Chase ISO payment · added 2026-03-07 · Admin > Finance & invoicing
- [ ] Take £5k DLA withdrawal after ISO payment lands · added 2026-03-07 · Admin > Finance & invoicing
- [ ] Ring-fence £1,600 VAT when invoices paid · added 2026-03-07 · Admin > Finance & invoicing
- [ ] Register for PAYE before April 2026 · added 2026-03-07 · Admin > Finance & invoicing
- [ ] Complete VAT retrospective coding in Xero · added 2026-03-07 · Admin > Finance & invoicing
- [ ] Enter personal expenses in Xero via Manual Journal · added 2026-03-07 · Admin > Finance & invoicing
- [ ] Create MVP generative music system for Immersive Art / Drift · added 2026-03-07 · Projects > Immersive Art / Drift
- [ ] Build web-based generative visual prototype for Drift project · added 2026-03-07 · Projects > Immersive Art / Drift
- [ ] Map musical behavior to visual movement in Drift system · added 2026-03-07 · Projects > Immersive Art / Drift

## PROJECTS

### Live generative visual works

- **Immersive Art / Drift** — Long-term research-based artistic practice exploring sound, perception, consciousness, generative systems, and immersive environments. Three interconnected explorations: (1) Sonic Kinship - parallels between nature, sound, and consciousness through deep listening; (2) Wave State - musical systems reflecting brainwave states (4Hz-80Hz) with X/Y interaction controlling music layers; (3) Generative Immersive Systems - interactive audiovisual environments for VR/web/live performance/museum installations. Technical stack: Next.js, React Three Fiber, Three.js, Tone.js for web-native generative audiovisual work. MVP approach: music-first development → web visual system → immersive installation → live performance. Current focus: generative line animation system using motion extracted from birds/dancing/natural phenomena, converted to line drawings, mapped to musical parameters. Development period: Feb-Mar 2026.

**Conceptual Evolution**: Drift operates as open-ended umbrella for generative visual and modular synth experiments, governed by emergence rather than intention. Principle of *slow pedagogy* — letting experiments find their own context over time. Distinct from Signal Dreams (defined concept album). Influenced by Linea-relazione project (generative art and kinetic notation).

- **organism** — Live generative visual system built in TouchDesigner, driven by MPE MIDI from Expressive E Osmose controller. Visuals respond to pressure, touch intensity, and pitch bend in real time — organic blob forms that react to performance nuance. Core concept: the instrument and the visual world are one unified responsive system. **Status:** In active development. **Deadline:** Live performance in Berlin, ~6 weeks away. **Current focus:** Vibrato-triggered "pointillist dissolution" effect — shatter and reform visual using feedbackTOP displacement chain. Partially working, unresolved resolution and feedback initialisation issues. **Setup:** Osmose (Mac) → MIDI over network (rtpMIDI, loopMIDI, macOS Network MIDI) → Windows PC (RTX 3060) running TouchDesigner. **Why Windows PC:** Moved from Mac M3 due to jerky playback performance issues, resolved on Windows with RTX 3060. **Key technical lesson:** `execute_python_script` in TouchDesigner MCP is unreliable — prefer `get_td_node_parameters` with `detailLevel: detailed` and manual wiring.
*Last updated: 2026-03-11*

### Live AV performance
- **Signal Dreams** — Originally "Signal Films", evolved into concept album exploring narrative of *a machine learning to see*, moving from abstract data and generative marks toward human movement and figurative content. Combines generative visuals (TouchDesigner) and modular synthesizer music. Live ambient AV performance with immersive sonic worlds. Current gear: Osmose, Norns, 0-Coast, iPad/AUM, Apollo Twin, modular synthesizer rig (portable, flight-cased). Lyra-8 + Cosmos identified as ideal hardware addition for organic/meditative aesthetic, pending income.

**Technical System**: Active project "Signal Dreams V4 fast" - most resolved visual system to date. Core: animated PNG sequences on instanced planes with phong materials, "conveyor belt" effect with planes moving toward camera. Breakthrough: crossfades between different image sequences (Linea-relazione generative lines transitioning to Dualities video footage) - conceptual spine made visible. Claude–TouchDesigner MCP integration (port 9981) enables real-time creative direction and live collaboration.

**Performance Setup**: Contained improvisation philosophy - structured enough to hold, flexible enough to breathe. Recording studio improvisations develop both album material and live performance patches. Next: MIDI–visual integration using Osmose expressivity to directly shape TouchDesigner visuals.

**Berlin Performance**: Pictoplasma Creative Film Festival (May 5–10) pop-up event, actively seeking venues with projectors. Key milestone for testing integrated audio-visual setup.

**Signal Dreams Identity**: Fully separate identity from main gileslamb.com presence. signaldreams.com as experimental/ambient/immersive identity for live audiovisual performance, electronic album releases, installation work. Site should feel more experimental, immersive, quiet — different world with generative CSS/canvas visuals. Architecturally independent but bridges to main site.
*Last updated: 2026-03-11*

### Music albums / releases
- **DTTM** — Cinematic soundtrack album with interactive website. Site built in Next.js + Three.js featuring 11-track player, 10k star field, parallax objects. Deployed on Render via GitHub. Collaborator: Florian (video editor). Chapter largely closed unless specifically revisited.

- **Teatrino** — Music demos in progress for Curious Dreamers project. Musical direction shifting toward more quirky, upbeat tone. Current experiments include voice tests (Cole Porter-esque, Italian, French styles) and bagpipe sounds integration. Listed as current priority project.
*Last updated: 2026-03-11*

- **Distance to the Moon** — Short film re-edited from ~20 minutes to ~14.5 minutes for festival accessibility. Music direction evolved from orchestral to intimate felt piano theme ("X's Theme") with abstract sonic environments. Previously received European festival selections, music award at Athens Short Film Festival, selection at New Venice Film Festival. Candidate for first "Living Album" prototype.
*Last updated: 2026-03-11*

- **Dillie Dally's Dreamland** — Music album project from the creators of Hushabye Lullabye. Active crowdfunding campaign in preparation with launch target Wednesday March 4th. Research phase includes studying other Creative Scotland crowdfunded albums for reward tier strategies. Asset collection linked from shared Google Drive folder.
*Last updated: 2026-03-11*

### Commission work
- **Hushabye Lullabye** — BBC CBeebies award-winning children's animated series. Giles Lamb (composer/sound designer), Sacha Kyle (creator/director/producer). Series stats: 650K+ viewers per episode, 6 countries, 10M+ streams. Awards: RTS Best Children's Series, RTS Best Animation & VFX. Broadcast on BBC CBeebies, iPlayer, YOUKU China, NRK Norway, YLE Finland, Daekyo South Korea, Hop Israel, TVO Canada. Expansion plans include new album, immersive digital experiences, sleep-focused tools, workshops, partnerships with sleep organisations. Listed as current priority project.
- **Dreamscreen** — Experimental short film exploring AI and filmmaking. Hybrid live action/AI workflow, creative production with Sacha, documented publicly. Future directions: motion graphic novel, interactive audiovisual website, "living album" presentation, immersive performance integration.
- **Starchild** — Film project in final edit stage. **Target completion: this week (March 2026)**. Budget: £750 fee limits time investment to a few days maximum. Current work: finalizing mood, sound effects, and ADR notes for completion. **Director's Brief**: Subtle, story-supporting approach that complements visuals. Key focus on strategic silence and emotional high points where music/SFX will be prominent. Goal: memorable theme that develops from suggestion to full realization. Creative direction emphasizes restraint and narrative support over wall-to-wall scoring. Listed as current priority project.
*Last updated: 2026-03-11*

### Web / interactive builds
- **Curious Dreamers** — Umbrella project with core website featuring rotating cylinder design. Contains three sub-projects: Hushabye Lullaby, Wonder Club, Creating Growth websites.
- **Hushabye Lullaby** — Website build project in early stage. Immersive single-page site with canvas-based rocket mobile, 10-track music player, day/night modes, floating emoji songs. Live at https://hushabye-lullabye-music-site.onrender.com. Built in vanilla JS/Canvas API, deployed via GitHub/Render. Local folder: `/Users/gileslamb/Hsuhbaye Luallabye SITE/`. Critical workflow: edit hushabye.html, sync with index.html, commit both files. Includes spinoff music project "Diddy Das Dreamland". Next: mobile responsive layout, streaming links, character animations. Major expansion concept: broader Hushabye universe site with constellation navigation system using Three.js, immersive nightlight universe with rotating mobile structure, central light source, character cutouts. Listed as current priority project.
- **Wonder Club** — Website build project under Curious Dreamers umbrella, children's animation project in development with funding support. Due next after Hushabye Lullaby. Also referenced as "Wunderklub" - listed as current priority project.
- **Creating Growth** — Website project under Curious Dreamers umbrella.

- **gileslamb.com — Master Site** — **COMPLETE PROTOTYPE PHASE** — Single definitive website representing unified professional identity. Replaces existing underdeveloped sites (gileslamb.com and gileslambmusic.com).

**Strategic Positioning**: "An artist whose medium includes film scores." Cinematic composer and immersive audiovisual artist with 30 years of experience. All work unified under three professional lanes: (1) Film & Television (trailers, features, TV series, animation), (2) Immersive & Installation (spatial sound, exhibition commissions, cultural institutions), (3) Live Audiovisual Performance (modular synthesis, generative visuals, TouchDesigner).

**Design System**: Dark cinematic foundation with warm textural accents. Typography: Cormorant Garamond (display), Karla Light (body). Palette: near-black #080808, warm off-white #ede5d8, muted gold accent #c9a96e. Features: custom cursor, waveform parallax hero, grain overlay, scroll-triggered reveals.

**Photography Assets**: Wide_studio_2026.png (hero background showing SSL console, Logic setup, cinematic screen), unnamed.jpg (portrait for About section).

**Live Practice Section**: Deliberately NOT branded as "Signal Dreams" on main site — described simply as live audiovisual work. Signal Dreams potential name for specific debut performance work, to be decided.

**Build Status**: Complete HTML/CSS/JS prototype in `gileslamb-homepage.html`. Ready for Next.js build in Cursor with components: Nav, Hero, Practice, Work, LivePractice, Contact, Footer. Deploy to Vercel.

**gileslambmusic.com Decision**: Keep separate as potential future "living album" generative/immersive experience (working title: *Before the Bird*). Does not block main site launch.
*Last updated: 2026-03-11*

- **Giles Memory Machine** — Personal AI context management tool. Next.js app with Claude API integration that pastes anything and auto-updates AI_CONTEXT.md with timestamped archives. Dashboard shows staleness of each layer and entry. Check-in chat extracts todos and context updates with review-before-commit flow.

**2.0 Architecture**: Fully local, private AI-powered personal operating system. Google Drive Memory Inbox folder for passive file ingestion, browser dashboard at localhost:3000 for active control. Four-layer system (Projects, Admin, Vision/Ideas, Life). Auto-generates selective context files: AI_CONTEXT.md (master), projects_context.md, admin_context.md, vision_context.md, life_context.md, signals.md (weekly pattern observations). Dashboard features: health system with staleness colours (0-7 days green, 8-14 amber, 15-30 orange, 30+ red), layer cards, completion charts, Kanban todo board, check-in chat with voice/text entry. Auto-archive every update.

**Current Build Status (March 2026)**: Chat input works with silent background merge, coach message generates on every open, todos sync with checkboxes, Google Drive MEMORY_INBOX folder structure active, auto-archive functional, Mac Dock launcher via Automator app. UI significantly simplified - removed active projects section, recent activity log, pie charts for reduced noise. Primary daily interface: coach message + todos + stale alert + chat box.

**Workflow Established**: Morning check of coach message and todos, quick thoughts via chat box, end-of-session routine of generating structured MD summaries → download → drag into relevant MEMORY_INBOX folder for automatic processing. Large documents dropped directly into Google Drive folders. Context files located at `/Users/gileslamb/giles-memory-machine/data/`, Google Drive inbox at `/Users/gileslamb/Library/CloudStorage/GoogleDrive-giles@gileslamb.com/My Drive/MEMORY_INBOX/`.

**Key Technical Decisions**: Render hosting abandoned permanently due to data resets, Ollama/local LLM deprioritised due to RAM pressure, Claude API (claude-sonnet-4-20250514) as single AI backend, three-tier model router removed for complexity reduction. Ollama qwen3:32b installed but unused, qwen3:8b available as lighter option.

**Outstanding Tasks**: Stale alert implementation, add todo button, priority badges on project cards, AI_CONTEXT.md auto-copy to Google Drive, end-to-end Google Drive watcher testing.
*Last updated: 2026-03-11*

### Residencies / grants / applications

---

## ADMIN

### Finance & invoicing
- **Company:** Giles Lamb Limited (UTR: 3532228115), music production company handling royalties, commissions, direct sales, events. Financial year end: 31 March. Xero accounting platform (VAT registered, MTD connected to HMRC), Monzo Business banking, Dash Accounting (under review post year-end).
- **Current Position (March 2026):** Projected year-end turnover ~£69,936, profit after tax ~£36,606. Cash position: £2,260 (Monzo), £17,563 receivables, £9,754 S455 tax refund due January 2027. BBL outstanding £6,545, payment holiday ends April 2026 (£375/month resumes).
- **March 2026 Incoming:** ISO project payment £6,000 (Epic Ireland - priority chase item), sign-off payment £1,800, PRS royalties £2,000, iMac sale £650 (received). Total: £10,450.
- **VAT:** Standard rate, Cash Accounting Scheme. Retrospective coding in progress (services 6 months back, goods to October 2024). Outstanding invoices will generate £1,600 VAT when paid — ring-fence immediately.
- **Payroll/PAYE:** Not yet registered. Salary structure starts April 2026: £1,047.50/month (within personal allowance). Register at gov.uk/register-employer before April.
- **Dividend Strategy 2026/27:** Annual total £60,000 (£12,570 salary + £47,430 quarterly dividends), effective tax rate ~5.9%. Schedule: end Jun/Sep/Dec 2026, Mar 2027.
- **Directors' Loan Account:** Company owes Giles £21,666 (updated with recent personal expenses). Planned £5,000 withdrawal once ISO payment lands.
- **Key Actions:** Chase ISO payment, take £5k DLA withdrawal, ring-fence £1,600 VAT, register for PAYE, complete VAT retrospective coding, enter personal expenses via Manual Journal.
- Pending income from upcoming gigs and potential TV commission — relevant to Lyra-8 + Cosmos hardware purchase decision
*Last updated: 2026-03-11*

### Contacts & collaborators

- **Marie** — Potential collaborator for music session/recording
- **Alex South** — Potential collaborator for music session/recording
- **Florian** — Video editor, collaborator on DTTM and related work
- **Levi Jan** — Contact for Diddy Das Dreamland project bible
- **Sacha Kyle** — Creator/director/producer of Hushabye Lullabye
- **Evie** — Artist working on iPhone song project
- **Experience.fi** — Finnish company focused on immersive experiences connected to nature. Potential early collaboration partner for sound/environment research. Finland offers strong cultural connection to landscape, natural acoustic environments, and existing interest in immersive experiences. Opportunity for short artistic research visit.
*Last updated: 2026-03-11*

### Scheduling & travel
- Berlin performance: Pictoplasma Creative Film Festival (May 5–10) pop-up event, actively seeking venues with projectors (~6 weeks away)
- **Finland Research Visit** — Potential short artistic research trip for environmental sound experiments, landscape-based performance, collaboration development with Experience.fi. Activities: forest/water sound performances, ambisonic field recording, experimental audiovisual documentation, small listening sessions. Funding through research or travel grants.
*Last updated: 2026-03-11*

### Legal & IP

### Tools & systems
- **Audio**: Luna (primary DAW on Mac), Logic, Apollo Twin interface (Duo). Planned upgrade: Apollo x6 with ADAT expansion (Arturia interface) for expanded I/O and potential 16-output configuration. Future surround monitoring system consideration.
- **Controllers**: Expressive E Osmose (MPE), Norns, 0-Coast, iPad/AUM. Interest in Soma Terra, expanded generative CV routing.
- **Visuals**: TouchDesigner on Windows PC (RTX 3060). Mac M3 → Windows move resolved jerky playback issues. Claude–TouchDesigner MCP integration (port 9981, via `mcp_webserver_base.tox`) enables real-time creative direction.
- **Dev**: Cursor, Next.js, Three.js, GitHub, Render, vanilla JS/Canvas API
- **AI**: Claude (primary), ChatGPT (reflection + synthesis), Cursor/Claude Code (coding). Claude API (claude-sonnet-4-20250514) single backend for Memory Machine. Ollama installed with qwen3:32b and qwen3:8b models but deprioritised due to RAM pressure during creative sessions.
- **Daily tools**: Bear (notes + thinking), Google Drive/Sheets (admin), Basecamp/Campfire (project comms), Fantastical (calendar), Apple Reminders (task capture), Apple Notes, Slack (occasional), LinkedIn + Messages (outreach)
- **VR/Testing**: HTC Vive Pro, Steam VR, previously used with DearVR Spatial Connect for spatial audio testing
- **Field Recording**: Potential ambisonic microphones for environmental sound research
*Last updated: 2026-03-11*

### Outreach & marketing

---

## VISION / IDEAS

### Aesthetic & artistic direction
- **Core Creative Identity**: Creative technologist, performer, and composer working at intersection of live performance, generative visuals, and ambient/cinematic music. Classically trained pianist who also does sound design — rare combination in ambient music space. Core aesthetic: organic, evolving, immersive, melancholic. Generative and reactive systems over static media. Three interconnected domains — commercial composition (film/TV/animation/immersive), children's IP development (Curious Dreamers), immersive/experimental artist practice. Influences include Brian Eno, Pauline Oliveros, generative art, deep listening. Goal: experiences between concert, installation, and cinema. Based in Salford / Manchester, UK.

**Professional Identity Evolution**: "Cinematic composer and sound artist working at the intersection of film, generative visuals, and passive cinematic electronic music. Unique position: I am both the composer and the artist — the musician who thinks visually, the sound artist who understands narrative structure." Single master presence (gileslamb.com) represents unified identity rather than separate composer/artist personas.

**Unified Professional Positioning (2025)**: "An artist whose medium includes film scores." Manifesto: "The question has always been the same: how does sound shape what we see, feel, and understand? A practice that has evolved continuously — through albums, film scores, trailers, animation, live performance. Each form a different expression of the same investigation. The medium shifts. The obsession doesn't."

- **AI as Instrument**: Strong conviction that AI should function as instrument or creative collaborator — reactive, expressive, organic — not as vending machine or content generator. Shapes organism development (MPE-driven, gestural) and AI tool usage across practice.
- **Living Album Concept**: New music format using interactive audiovisual experiences, web-based environments with generative visuals, evolving compositions, immersive narrative contexts. Workflow: compose → build generative visual layer → create interactive website → present online and as live performance.
- **Music as Pre-Language Communication**: Exploration of music as pre-verbal emotional communication through "units of sonic meaning" that correspond to behavioral characteristics. Musical parameters (dynamics, phrasing, frequency, amplitude, timbre) map to visual behaviors (line intensity, motion arcs, spatial position, thickness, texture). Foundation for music-driven animation language.
- **Consciousness as Vibrational System**: Hypothesis that consciousness may be a vibrational system of relationships rather than fixed entity, with emotion, music, movement, and energy following similar underlying patterns.
- **Emergence as Method**: Building systems that surprise you, then following where they lead rather than imposing predetermined destinations. Core philosophy across all generative work.

**Sound as Fundamental Vibration**: Central premise that everything in the world exists as vibration. Sound becomes way of exploring connections between humans, natural environments, machines, technological systems. Through sound we can perceive relationships between water, wind, voice, instruments, digital systems. Core philosophy for emerging artistic research direction.

**Career Strategy Reset**: Unified professional positioning as "cinematic composer and immersive audiovisual artist" working at intersection of film scoring, generative sound systems, and immersive audiovisual environments. Three professional lanes: (1) Film & Television (credibility + income), (2) Immersive & Installation (museums, exhibitions, spatial sound, cultural institutions), (3) Audiovisual Performance (modular synthesis, generative visuals, festivals, touring). Key insight: stop presenting as "composer who experiments" → present as "artist whose medium includes film scores." Strategic goal: create one remarkable 45-60 minute audiovisual performance piece as festival calling card and artistic centre of practice.

**Memory Machine Philosophy**: The Memory Machine's job is to hold the noise so your brain doesn't have to — not to show you all the noise at once. Chat box and todos are daily interface, left panel and context files provide background intelligence, coach message serves as daily filter for what matters today.
*Last updated: 2026-03-11*

### Future projects & concepts
- **Unified Live AV Performance** — Combining organism visual system with Signal Dreams sonic world, single Osmose controller driving both sound and visuals simultaneously
- **Broader Hushabye universe site** — Constellation navigation system with Three.js for expanded Hushabye Lullabye content, characters, animation system
- **Character animation system** — Extract character sequences from source MOV files at 12fps with background removal, normalise to unified canvas size (0.78 alpha), generate manifest.json for drift animations
- **Wonder Club / Dreamland** — Children's animation projects under Curious Dreamers, music-led storytelling IP
- **Generative Instrument Systems** — Semi-autonomous generative performance setups combining modular synthesis, acoustic instruments, generative sequencing, improvisation
- **Rotating cylinder concept** — Visual/installation idea for development
- **Large-Scale Immersive Performance Environments** — Warehouse/club/planetarium/museum installations combining generative sound systems, spatial sound, generative visuals for transformative sensory experiences and altered perception states. Late-night club environments particularly effective.
- **Stop Motion Asset Reuse** — Extract animated objects from existing films as transparent animation layers for integration into generative environments, treating film assets as modular visual components.

**Sound, Environment, Technology Research Programme**: Three-strand artistic research framework: (1) Environmental Listening & Field Performance — performances in natural environments, Soma Terra in landscape, ambisonic field recording, improvisation with environmental sound; (2) Sonic Transformation — voice transformation into environmental textures, AI-assisted sound processing, generative sound systems, spatial audio experiments; (3) Immersive Performance & Installation — public presentations combining environmental recordings, generative visuals, live improvisation, spatial sound. Outputs include immersive performances, gallery installations, spatial sound compositions, environmental recordings, documentation films. Prioritises experience and presence over traditional music releases.

**Flagship Audiovisual Work Development**: Plan to create 45-60 minute audiovisual performance piece combining modular sound exploration, cinematic composition, and generative visuals. This becomes the touring performance, installation work, festival show, and artistic calling card. Key components: Eurorack system (~£2k budget), cinematic composition framework, TouchDesigner visual system, performance documentation for festival submissions.
*Last updated: 2026-03-11*

### Research & references
- **Generative Line Animation System** — Motion extraction from natural phenomena (birds flying, people dancing, water ripples, leaves moving, animal motion) converted to line drawings, broken into motion fragments, reconstructed into generative animation. Tools: EbSynth, motion extraction tools. Single-line generative animations evolving dynamically with natural, expressive, organic motion mapped to musical parameters.
- **Linea-relazione** — Previous generative art and kinetic notation project that feeds directly into Signal Dreams both visually (animations as "early machine vision" material) and conceptually (interest in marks, motion, and notation as language).
- **Listening as Artistic Practice** — Deep listening to environments and spaces as primary creative act rather than composing fixed works. Research questions: How do we listen to natural environments? How does listening change perception of place? How does sound influence emotional and embodied experience? Performances emerge from improvisation and responsiveness to location.
- **Human–Machine Sound Interaction** — Technology treated as instrument rather than content generator. Exploring voice transformation, generative systems responding to environmental sound, audiovisual environments driven by sound. Focus on hybrid human–machine sound systems.

**Immersive Performance Systems Research**: Analysis of artist approaches and technical setups: Brian Eno (laptop + generative software + visual playback), Suzanne Ciani (Buchla modular + quadraphonic audio), Ben Frost (laptop + modular + live processing), Max Cooper (Ableton + Push + TouchDesigner), Ryoji Ikeda (laptop + high-res projection), Hannah Rice (laptop + modular + real-time visuals). Common pattern: artists tour with laptop + instrument + visual system, venues provide sound/projection infrastructure. Key insight: value is in artistic system and work, not equipment.
*Last updated: 2026-03-11*

### Business & practice strategy
- **Commercial Strategy**: TV and sync commission work identified as key income stream to fund hardware and sustain practice. Secure high-value scoring commissions and installation projects leveraging immersive sound and emotional musical storytelling strengths.
- **Children's IP Strategy**: Expand Hushabye Lullabye through albums, immersive experiences, sleep-focused tools, educational workshops, sleep organisation partnerships
- **Ambient Music Positioning**: Classical piano + sound design combination in ambient music is rare. Opportunity to develop distinctive voice bridging composed and generative approaches.
- **AI-Assisted Practice**: Memory Machine part of broader effort to make practice more organised and AI-assisted without adding friction
- **Immersive Art Practice Positioning**: Work sits between sound art, generative music, computational art, and immersive installation. Potential for museum installation work demonstrating new possibilities for immersive sound as powerful artistic showcase.

**Artistic Research Funding Strategy**: Multiple pathways including Creative Scotland, Creative UK, Arts Council development funds (support artistic research, immersive media, interdisciplinary practice), university partnerships for spatial audio research/immersive media/human perception, cultural research foundations exploring human perception/environment/technology. Sound-listening-environment projects align with these programmes.

**Website & Visual Identity Strategy**: Create unified professional site with cinematic visual tone, minimal UI, dark aesthetic. Structure: Hero/Showreel → Three Lanes → Selected Work → About → Contact. Professional portrait photography essential (6-10 high-quality images for website, press, festivals, LinkedIn). Master showreel 60-90 seconds mixing film work, installation footage, studio/modular content, visuals.

**12-Month Development Plan**: Phase 1 (0-3 months) - Complete Eurorack system, launch new website, update reel/imagery, clarify positioning. Phase 2 (3-6 months) - Develop flagship audiovisual work. Phase 3 (6-9 months) - Professional documentation and festival video production. Phase 4 (9-12 months) - Festival submissions and commission outreach (Sonar, MUTEK, Unsound, digital arts festivals, museum programmes).
*Last updated: 2026-03-11*

### Notes from conversations / reading

**Artistic Research Framework Summary**: Practice centres on sound as fundamental vibrational force connecting people, environments, machines. Explores how listening, performance, technology create immersive experiences reconnecting audiences with natural world. Shifts towards live experiential work where sound exists as interaction between performer, landscape, technology, audience. Sits at intersection of sound art, environmental listening, immersive media, spatial audio, generative audiovisual systems, artistic research. Builds on award-winning film composer/sound designer background, extending into practice-based research and performance. Core philosophy: everything exists as vibration — sound reveals vibrational relationships connecting humans, machines, natural world.

**Creative System Architecture**: Studio workflow of improvisation → record everything → extract fragments → compose in DAW has already produced albums and scoring work. Planned system: MacBook Pro + Logic (core brain), small Eurorack setup with Pamela's Pro, Marbles, Morphagene, Maths, utilities, Mimeophon (~£2k budget), Osmose controller, 0-Coast, iPad synth ecosystem, PC with TouchDesigner for visuals. Purpose: generative playground in studio evolving into portable performance rig. Key principle: don't tour infrastructure, venues provide sound systems and projection.
*Last updated: 2026-03-11*

---

## LIFE

### Health & energy

**Physical Health Status (Feb-Mar 2026)**: Strong baseline fitness with intermittent energy strain. High HRV, low resting heart rate, good cardiovascular fitness (running 30-40km/week), strong recovery scores after rest days. However, recurring issues include sleep instability (5-6 hours with low deep sleep, mind racing), fatigue cycles (energy followed by "brick wall" exhaustion), and stress symptoms (headaches/migraines, hemorrhoid flare-ups, extreme hunger on tired days, feeling wired but tired). Exercise pattern generally strong but pushing too hard causes quick fatigue spikes. System responds very well to 1-2 rest days.

**Supplements & Nutrition**: Light current stack - magnesium glycinate, occasional CBD, previously ashwagandha/lion's mane (paused). Considering zinc, vitamin C, B12, biotin, multivitamin for optimization rather than fixing illness. Energy affected more by sleep, stress, and workload than micronutrient deficiency.

**Medical Concerns**: Possible Dupuytren's nodule (hard lump in palm between 3rd/4th finger, no movement restriction/contracture - very early stage if confirmed). Apple Watch oxygen saturation error (93% vs 98% medical-grade reading). Finasteride side effects - stopped and noticed improved libido, less night urination/cramping, but hair thinning resumed. Plan: try every-other-day protocol with continued topical minoxidil.

**Key Pattern**: Not unhealthy or completely burning out, but running close to edge of cognitive capacity from life transition + creative ambition. Primary leverage points: sleep consistency, strategic rest days, reducing mental multitasking.

**New Health Log – Chilblain / Recovery Decision Date: March 2026**

### Finger Issue
- Developed a red, swollen, slightly itchy and warm middle fingertip.
- Recent exposure to significant cold during running, walking and cycling.
- History of Raynaud's episodes (fingers turning white/blue in cold).
- Photo showed localized redness consistent with early chilblain (pernio).

### Likely Cause
Combination of: Raynaud's-related vascular sensitivity, cold exposure during outdoor exercise, increased activity in winter weather, possibly being leaner (less insulation in extremities). Mechanism: Cold → blood vessels constrict → rapid rewarming → leakage/inflammation in skin → chilblain.

### Management Advice
- Keep hands consistently warm (gloves when outdoors).
- Avoid rapid rewarming (no hot water directly).
- Gentle circulation (finger movement).
- Moisturize skin barrier.
- Anti-inflammatory if sore. Typical course: peaks in 2–3 days, resolves in 1–2 weeks. Seek medical advice if: spreading redness, severe pain, pus or infection signs, ulceration.

### Prevention Notes
Relevant for running/cycling: liner gloves + windproof gloves, keep core warm, avoid prolonged cold grips on handlebars, gradual rewarming after exercise.

### Exercise / Recovery Reflection
User reported fatigue after recent run and decided to: take a day off running, go for an easy walk for low-level movement, resume strength training the next day, run the following day. Observation: Recovery metrics improve when exercise sessions are spaced out rather than consecutive hard efforts. Training insight: Active recovery (walking) supports circulation, nervous system recovery and sustainable consistency. Conclusion: Decision to rest and walk was appropriate and aligns with a sustainable training pattern.
*Last updated: 2026-03-11*

### Personal reflections

**Psychological State (Feb-Mar 2026)**: Functioning well externally but carrying heavy internal load. Major emotional pattern: high performance under pressure but intermittent feelings of being drained, hopeless, stuck between two lives. Clear stress indicators include "brick wall" days, everything feeling like treacle, questioning direction, needing to switch off. This represents cognitive overload rather than depression - brain processing legal stress, family transition, creative ambition, technical learning, physical training simultaneously.

**Burnout Signals**: Warning signs include sudden exhaustion, feeling stuck, creative pressure from "huge vision vs slow reality" mismatch, overwhelming sense of multiple demanding projects (modular synth setup, Norns learning, building music systems, film/sound work, strategic creative thinking). Current approach: treat new technical systems as play rather than productivity to reduce pressure.
*Last updated: 2026-03-11*

### Habits & routines

**Exercise**: Running 30-40km/week, walking on recovery days, occasional strength work. Optimal training load appears to be 80-90% of current level - system recovers better with occasional restraint.

**Sleep**: Protect sleep aggressively - no heavy thinking after 9pm rule could improve deep sleep quality. Sleep