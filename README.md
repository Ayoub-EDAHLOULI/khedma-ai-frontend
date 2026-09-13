# Khedma.ai — Web

**The web frontend for Khedma.ai** — a multilingual AI job-search agent. Type or talk (live voice) in Darija, French, Arabic, or English to search jobs, review AI-ranked matches, manage tailored applications, and practice mock interviews before the real thing.

> This is a client for a self-hosted backend — it talks to your own running instance of [khedma-ai-backend](../khedma-ai-backend), not a shared/hosted API. See that repo for the full architecture and the legal/scraping disclaimer.

---

## What it does

- 🗣️ **One conversational search box** — no separate "input search" vs "chat," typing a keyword or a full sentence in any of the four supported languages goes through the same pipeline.
- 🎙️ **Voice search** — a mic button opens a live conversation with the agent (Gemini Live); it can search your ingested jobs mid-conversation and narrates results back to you.
- 🎯 **Ranked match cards** — each result shows the job, a 0–100 match score, and a one-line reason it was matched. Select one or several results and save them as draft applications in one action.
- 📄 **Applications page** — track saved jobs by status (draft/applied/interview/rejected), generate a tailored CV + cover letter for any of them on demand, download as `.docx`, or remove ones you're not pursuing.
- 👤 **Profile page** — your CV text, skills, contact links, and resume file, either typed in or auto-filled by uploading a PDF/Word resume (parsed server-side into structured fields, not just dumped as raw text). View or replace the stored resume at any time.
- 🎤 **Interview practice** — set up a live mock interview for a specific job (HR, Technical, or Manager persona), pick your language and local/international style, then have a real spoken conversation with the interviewer. Afterward, get a written report: overall score, strengths, weaknesses, and per-question feedback with a concrete "better answer" suggestion.
- 🌍 **Local/International awareness** — reflects the scope your backend already filters by, so you're only ever looking at realistically-applicable roles.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/base-ui · `@google/genai` (Gemini Live, client-side voice)

## Getting started

### Prerequisites

- Node.js 18+
- A running instance of [khedma-ai-backend](../khedma-ai-backend) (locally or on your own server)

### Setup

```bash
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL to your backend's URL
npm run dev
```

App runs at `http://localhost:3000`. Make sure your backend is running first (default: `http://localhost:8000`) — the frontend has no functionality of its own without it.

## Project structure

```
src/
├── app/
│   ├── layout.tsx              root layout, fonts, metadata, global nav chrome
│   ├── page.tsx                main search page (chat box, voice mode, results)
│   ├── profile/page.tsx        profile fields, resume upload/view/replace
│   ├── applications/page.tsx   saved applications, status, generate/download, remove
│   ├── interview/page.tsx      interview setup (job source, type, language, scope)
│   └── interview/[id]/page.tsx live voice interview + transcript + scoring report
├── components/
│   ├── search/                 MatchCard, SelectableResults, JobDetailDialog, GeminiVoiceMode, AgentAvatar
│   ├── form/                   CountryInput, TagInput
│   └── ui/                     shadcn primitives
├── hooks/
│   ├── useGeminiLiveVoice.ts   voice search assistant (search_jobs tool-calling)
│   └── useInterviewVoice.ts    live interview session (persona instruction, transcript capture)
├── services/                   one typed client per backend domain (profile, jobs, matches,
│                                applications, search, voice, interviews)
├── types/api.ts                shared API types
└── lib/                        api client, utils, country list
```

## Environment variables

| Variable              | Description                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL` | Base URL of your running khedma-ai-backend instance (e.g. `http://localhost:8000`, or your deployed backend's URL) |

## Design system

Dark-first, Gemini-adjacent blue-violet palette, search-first UX with no dashboard/sidebar — see this repo's own `CLAUDE.md` for the full spec (colors, typography, the agent avatar, motion rules, accessibility baseline) before touching styling.

## Roadmap

- [x] Search UI (conversational input, ranked match cards) + voice search
- [x] Applications view (status tracking, tailored CV/cover letter, bulk drafting)
- [x] Resume parsing + profile contact fields
- [x] Interview practice (setup flow, live voice, scored report)
- [ ] Filter chips as first-class UI (currently expressed via the same structured query the chat box produces)
- [ ] Mobile app — separate client, same backend API

## Related repos

- **Backend / API**: [khedma-ai-backend](../khedma-ai-backend) — architecture, data model, and full design docs live there

## Contributing

Issues and PRs welcome. This frontend should stay a thin client — business logic (matching, language detection, scoring, scraping) belongs in the backend, not here.

## License

MIT — see [LICENSE](LICENSE).
