@AGENTS.md

## Design system — Khedma.ai web

Follow this for every component and page. Don't default to generic shadcn/Tailwind styling or introduce new colors/fonts outside this spec without flagging it first.

### Identity

Khedma.ai is a personal, self-hosted AI job-search agent — not a generic SaaS dashboard. The product's core interaction is a single conversational search box (Darija/French/Arabic/English), not a dashboard with filters and stats cards. Design accordingly: search-first, quiet everywhere else.

### Color (dark-first — this is the only theme for now, don't build a light-mode variant yet)

| Token          | Hex       | Use                                                                                              |
| -------------- | --------- | ------------------------------------------------------------------------------------------------ |
| `--background` | `#15130F` | page background — warm near-black, not cool `#0B0B0B`/`#111`                                     |
| `--foreground` | `#F1E9DC` | primary text — warm off-white                                                                    |
| `--primary`    | `#C98A3E` | primary accent — warm amber/saffron. Use for the main CTA, the match-score number, active states |
| `--secondary`  | `#2F6B5E` | secondary accent — deep emerald. Use sparingly: success/status only, never decoration            |
| `--muted`      | `#8A8072` | muted text, borders, placeholders — warm grey, not cool grey                                     |

Do not introduce terracotta (`#D97757`-adjacent), acid-green, or cool greys — these read as generic AI-generated defaults.

### Typography

- **Headlines**: one distinctive serif/slab with real character (Fraunces or Newsreader). Large, tight tracking, used only for page-level headlines — not for every card title.
- **Body/UI**: Inter (or the project's existing sans stack) for everything else — body text, labels, buttons, inputs.
- Don't introduce a third typeface. Don't use the headline serif for small UI text.

### Layout principles

- The landing/search state is: wordmark (small, top-left) → one-line headline in the display serif → the conversational input box, large and centered, as the single hero element. No sidebar, no stat cards, no dashboard chrome before a search has happened.
- Results stream in below the input after a search — don't pre-build empty-state dashboard furniture.
- Line lengths under ~80 characters for any body text/descriptions.
- Left-align by default; center only the hero headline + input on the landing state.

### Explicitly avoid (generic AI-page tells)

- ALL-CAPS eyebrow labels above headings
- Numbered markers (01/02/03) unless the content is a genuine sequence/steps
- `→` appended to button or link text
- Meta strings joined with middle dots (`A · B · C`)
- Identical rounded cards with the same soft grey shadow on everything, regardless of hierarchy
- Accenting a single word in a headline with italic/bold/color

### Match result cards specifically

The match score (e.g. "82%") is the one bold, confident visual element per card — large, in `--primary`. Don't also add colored badges, multiple borders, or drop shadows competing with it. Keep the rest of the card (title, company, reasoning line) quiet and legible.

### Motion

One entrance animation for results appearing after a search. No hover-lift or fade-in animation on every card by default — motion should answer a user action (search submitted, application generated), not decorate idle content.

### Copy/writing tone

- Sentence case, not Title Case, for buttons and labels.
- Active voice, plain verbs: "Search jobs," not "Submit query." Keep the same verb through a flow (a button that says "Prepare application" produces a result labeled with "application," not "package" or "docs").
- Empty/error states explain what happened and what to do next, in plain language — no apologetic tone, no vague errors.
- No filler copy. Every line of UI text does one job.

### Accessibility baseline (non-negotiable, not a nice-to-have)

- Visible keyboard focus states on all interactive elements.
- Respect `prefers-reduced-motion`.
- Color contrast must hold against `--background` for all text tokens above — check `--muted` on `--background` specifically, warm greys can wash out.
- Fully responsive down to mobile width — the search box and result cards are the two things that must work perfectly small.
