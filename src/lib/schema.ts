/**
 * Fixed schema for routing content into AI_CONTEXT.md
 */

export const LAYERS = {
  PROJECTS: "PROJECTS",
  ADMIN: "ADMIN",
  VISION_IDEAS: "VISION / IDEAS",
} as const;

export const CATEGORIES = {
  [LAYERS.PROJECTS]: [
    "Live generative visual works (e.g. organism)",
    "Live AV performance (e.g. Signal Dreams)",
    "Music albums / releases (e.g. DTTM)",
    "Commission work (TV, film, sync)",
    "Web / interactive builds",
    "Residencies / grants / applications",
  ],
  [LAYERS.ADMIN]: [
    "Finance & invoicing",
    "Contacts & collaborators",
    "Scheduling & travel",
    "Legal & IP",
    "Tools & systems",
    "Outreach & marketing",
  ],
  [LAYERS.VISION_IDEAS]: [
    "Aesthetic & artistic direction",
    "Future projects & concepts",
    "Research & references",
    "Business & practice strategy",
    "Notes from conversations / reading",
  ],
} as const;

export const SCHEMA_PROMPT = `
The content must be routed into one of three LAYERS, each with specific CATEGORIES:

## PROJECTS
- Live generative visual works (e.g. organism)
- Live AV performance (e.g. Signal Dreams)
- Music albums / releases (e.g. DTTM)
- Commission work (TV, film, sync)
- Web / interactive builds
- Residencies / grants / applications

## ADMIN
- Finance & invoicing
- Contacts & collaborators
- Scheduling & travel
- Legal & IP
- Tools & systems
- Outreach & marketing

## VISION / IDEAS
- Aesthetic & artistic direction
- Future projects & concepts
- Research & references
- Business & practice strategy
- Notes from conversations / reading
`.trim();
