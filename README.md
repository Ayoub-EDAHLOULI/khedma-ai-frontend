# Khedma.ai — Web

**The web frontend for Khedma.ai** — a multilingual AI job-search agent. Type or chat in Darija, French, Arabic, or English to search jobs, review AI-ranked matches, and generate tailored applications.

> This is a client for a self-hosted backend — it talks to your own running instance of [khedma-ai-backend](#), not a shared/hosted API. See that repo for the full architecture and the legal/scraping disclaimer.

---

## What it does

- 🗣️ **One conversational search box** — no separate "input search" vs "chat," typing a keyword or a full sentence in any of the four supported languages goes through the same pipeline. See the backend docs, section 5.
- 🎯 **Ranked match cards** — each result shows the job, a 0-100 match score, and a one-line reason it was matched.
- 📄 **Application view** — review and download the AI-generated tailored CV + cover letter per job before applying yourself (this tool never auto-submits applications).
- 🌍 **Local/International awareness** — reflects the scope your backend already filters by, so you're only ever looking at realistically-applicable roles.

## Tech stack

Next.js (App Router) · React · Tailwind CSS · TypeScript

## Getting started

### Prerequisites

- Node.js 18+
- A running instance of [khedma-ai-backend](#) (locally or on your own server)

### Setup

```bash
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL to your backend's URL
npm run dev
```

App runs at `http://localhost:3000`. Make sure your backend is running first (default: `http://localhost:8000`) — the frontend has no functionality of its own without it.

## Project structure

```
app/
├── layout.tsx          root layout, fonts, metadata
├── page.tsx            main search page (chat box + results)
└── globals.css         Tailwind entrypoint
lib/
└── api.ts              typed fetch client for the backend API
```

## Environment variables

| Variable              | Description                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL` | Base URL of your running khedma-ai-backend instance (e.g. `http://localhost:8000`, or your deployed backend's URL) |

## Roadmap

- [x] Search UI (conversational input, ranked match cards)
- [ ] Filter chips (scope, remote, country, seniority) — see backend docs section 13; these pre-fill the same structured query the chat box produces, not a separate search path
- [ ] Application view (tailored CV / cover letter download)
- [ ] Mobile app ([khedma-ai-mobile](#)) — separate repo, same backend API

## Related repos

- **Backend / API**: [khedma-ai-backend](#) — architecture, data model, and full design docs live there
- **Mobile**: planned, not started

## Contributing

Issues and PRs welcome. This frontend should stay a thin client — business logic (matching, language detection, scraping) belongs in the backend, not here.

## License

MIT — see [LICENSE](LICENSE).
