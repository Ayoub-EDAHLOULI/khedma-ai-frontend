@AGENTS.md

## Design system — Khedma.ai web

Follow this for every component and page. Don't default to generic shadcn/Tailwind styling or introduce new colors/fonts outside this spec without flagging it first.

### Identity

Khedma.ai is a personal, self-hosted AI job-search agent — not a generic SaaS dashboard. The product's core interaction is a single conversational search box (Darija/French/Arabic/English), not a dashboard with filters and stats cards. Design accordingly: search-first, quiet everywhere else.

### Color (dark-first — this is the only theme for now, don't build a light-mode variant yet)

Cool, Gemini-adjacent dark palette — deep near-black/navy with a soft blue-violet glow, not a warm amber/terracotta direction.

| Token          | Hex       | Use                                                                                       |
| -------------- | --------- | ----------------------------------------------------------------------------------------- |
| `--background` | `#0B0D14` | page background — near-black with a cool navy cast                                        |
| `--foreground` | `#E8EAF2` | primary text — cool off-white, faint blue tint                                            |
| `--primary`    | `#5B8DEF` | primary accent — clear blue. Use for the main CTA, the match-score number, active states  |
| `--secondary`  | `#8B7FE8` | secondary accent — soft violet. Use sparingly: the agent avatar, glow accents, highlights |
| `--muted`      | `#7A7E93` | muted text, borders, placeholders — cool grey-blue                                        |

A soft radial glow (blue to violet, low opacity, centered behind the hero input) is part of the identity — see Glow effects below. Do not introduce amber/terracotta warm tones, acid-green, or flat neutral greys — these read as generic AI-generated defaults or as an earlier palette this project moved away from.

### Glow effects

- The landing state gets one large, bright radial gradient centered behind the input — blue to violet, filling most of the viewport with a smooth, soft-edged falloff (reference: Gemini's own landing page glow — bright and atmospheric, not a small tight blob). Fixed behind content, non-interactive (`pointer-events-none`).
- Don't repeat the glow per-card or per-component — it's one atmospheric layer for the whole page, not decoration on every element.
- No glow on hover states for buttons/inputs — keep interactive feedback to the existing border/ring treatment; the glow is ambient, not reactive.

### Typography

- **Headlines**: one distinctive serif/slab with real character (Fraunces or Newsreader). Large, tight tracking, used only for page-level headlines — not for every card title.
- **Body/UI**: Inter (or the project's existing sans stack) for everything else — body text, labels, buttons, inputs.
- Don't introduce a third typeface. Don't use the headline serif for small UI text.

### Layout principles

- The landing/search state is: wordmark (small, top-left) → one-line headline in the display serif → the conversational input box, large and centered, as the single hero element. No sidebar, no stat cards, no dashboard chrome before a search has happened.
- Results stream in below the input after a search — don't pre-build empty-state dashboard furniture.
- Line lengths under ~80 characters for any body text/descriptions.
- Left-align by default; center only the hero headline + input on the landing state.

### The agent avatar

The conversational agent is the centerpiece of this product — this is not a plain chat log. Give it a visible presence:

- A small animated avatar (CSS/SVG-driven, no 3D engine) sits near the input — an abstract orb/glow shape rather than a literal robot illustration, consistent with the glow-accent identity above.
- It has distinct visual states: idle (slow ambient pulse/breathing motion), thinking (while a search request is in flight — a more active pulse or rotation), and replying (a brief accent flash/pulse when a response lands).
- Motion is smooth and continuous for idle/thinking (loops), and a single one-shot transition for replying — not a jarring cut between states.
- Respect `prefers-reduced-motion`: fall back to a static state change (no pulsing/looping animation) when reduced motion is requested.

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

One entrance animation for results appearing after a search. No hover-lift or fade-in animation on every card by default — motion should answer a user action (search submitted, application generated), not decorate idle content. The agent avatar's idle/thinking loops are the one exception to "no idle animation," since the avatar's aliveness is core to the product (see The agent avatar above).

### Copy/writing tone

- Sentence case, not Title Case, for buttons and labels.
- Active voice, plain verbs: "Search jobs," not "Submit query." Keep the same verb through a flow (a button that says "Prepare application" produces a result labeled with "application," not "package" or "docs").
- Empty/error states explain what happened and what to do next, in plain language — no apologetic tone, no vague errors.
- No filler copy. Every line of UI text does one job.

### Accessibility baseline (non-negotiable, not a nice-to-have)

- Visible keyboard focus states on all interactive elements.
- Respect `prefers-reduced-motion`.
- Color contrast must hold against `--background` for all text tokens above — check `--muted` on `--background` specifically, cool greys can wash out too.
- Fully responsive down to mobile width — the search box and result cards are the two things that must work perfectly small.

### Chrome: profile access

No sidebar/icon rail (see Layout principles). A single profile button lives bottom-left of the viewport (fixed position), consistent across every page — this is the only persistent nav chrome the app has.

### Future direction (not built yet — noted so it isn't lost)

- **Voice conversation**: a mic button next to the search input opens a live, real-time voice conversation with the agent (speech-to-text in, streamed spoken/text reply out) instead of typing.
- **Agent-triggered live actions**: during that conversation, the agent should be able to act on request mid-conversation — e.g. "fetch me today's Indeed jobs matching my resume" triggers a live, on-demand ingestion run scoped to the user's profile, not just a search over the existing pool.
- This reverses an earlier deliberate decision (`/search` only ever queries the already-ingested pool; ingestion is a separate, periodic step — see backend docs section 9). Revisit that decision deliberately when this gets built: on-demand live ingestion has real cost/latency/rate-limit implications (a live Indeed fetch alone takes tens of seconds per query, per our own scraper's Playwright implementation) that need a different UX (e.g. a visible "fetching new listings…" agent state) than an instant pool search.
- Scope this as its own dedicated step — touches speech APIs, a streaming chat protocol, and backend architecture, not just frontend polish.
- **Resume parsing (ATS-style)**: the resume upload dialog (top-right icon on the search page) currently only lets the user pick a PDF/Word file — it does not extract anything yet. Building this needs a backend endpoint that accepts the file, extracts text (e.g. `pdfplumber`/`python-docx`), and uses an LLM call to structure it into `ProfileIn` fields (name, skills, experience) rather than dumping raw text into `cv_text`. Scope as its own backend step before wiring the dialog's submit action to anything real.
