<p align="center">
  <img src="./app/icon.svg" alt="Polyform logo" width="88" height="88" />
</p>

<h1 align="center">Polyform</h1>
<p align="center"><strong>One workspace. Every language. Zero barriers.</strong></p>

Polyform is a real-time multilingual collaboration app built for the lingo.dev hackathon. It is currently scoped to a high-quality, Google-Docs-style document workflow with live translation, share links, and realtime presence.

## Current scope (hackathon)
- Document-only collaborative workspace (`Polly Doc`).
- Source-first translation model powered by lingo.dev.
- Realtime sync and cursor presence via Supabase Realtime broadcast.
- Share links for live edit, view-only, and snapshot.
- AI assistant (`Write with Polly`) with speech input and animated drafting into the doc.
- Landing + Product + Architecture + Demo marketing pages.

## Stack
- Next.js 14 (App Router)
- React 18 + Tailwind CSS
- Supabase (Postgres + Realtime + link/snapshot data)
- lingo.dev SDK
- Gemini API (Polly drafting)
- Upstash Redis (optional translation cache)

## lingo.dev integration
Polyform treats language as infrastructure. The canonical source text is stored once; translated views are derived per language.

### Content translation flow
1. User edits source text in the document.
2. Client debounces changes and calls `POST /api/translate`.
3. Server uses lingo.dev `localizeStringArray` per active target language.
4. Results are cached by space/block/version/hash.
5. Translations broadcast over Supabase Realtime.
6. Each collaborator sees the doc rendered in their selected language.

### UI localization flow
1. User selects a language in landing/workspace UI.
2. Client calls `POST /api/ui-localize` with copy object.
3. Server uses lingo.dev `localizeObject`.
4. UI labels, buttons, and helper text update in that language.

### Polly language flow
1. User asks Polly in chat.
2. Gemini generates structured draft text in English.
3. If another language is requested, server translates the draft with lingo.dev `localizeText`.
4. Draft is sanitized (removes `**`, `#`, em dash variants) and typed into the document with animation.

## Realtime architecture (Supabase-only)
- Transport client: `lib/realtime/supabase-room-client.ts`
- Broadcast events:
  - `cursor_update`
  - `block_patch`
  - `document_update`
  - `translation_update`
- Presence payload includes: session id, display name, language, color, cursor position, timestamp.
- No PartyKit dependency in the current implementation.

## Key routes
- `app/api/spaces/route.ts` create/list spaces
- `app/api/spaces/[spaceId]/route.ts` get/update/delete a space
- `app/api/spaces/[spaceId]/blocks/route.ts` patch blocks
- `app/api/spaces/[spaceId]/share/route.ts` generate edit/view token links
- `app/api/spaces/[spaceId]/snapshot/route.ts` create snapshots
- `app/api/snapshots/[snapshotId]/route.ts` fetch snapshots
- `app/api/translate/route.ts` lingo.dev document translation
- `app/api/ui-localize/route.ts` lingo.dev UI localization
- `app/api/polly/route.ts` Gemini + lingo.dev drafting pipeline

## Environment variables
Copy `.env.example` to `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
LINGO_API_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Notes:
- `LINGODOTDEV_API_KEY` is also accepted as an alias.
- `GOOGLE_API_KEY` is accepted as an alias for `GEMINI_API_KEY`.
- Upstash vars are optional.

## Local development
```bash
npm install
npm run dev
```

App URLs:
- Landing: `http://localhost:3000/`
- Dashboard: `http://localhost:3000/app`

## Database setup (Supabase)
Run migrations in `supabase/migrations` in order:
1. `202602170001_init.sql`
2. `202602170002_enable_realtime.sql`
3. `202602170003_remove_legacy_blocks.sql`
4. `202602170004_document_only.sql`

If using Supabase CLI:
```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

## Quality checks
```bash
npm run typecheck
npm run lint
npm test
```

## Demo script (recommended)
1. Open one space in two browser windows.
2. Choose different languages per window.
3. Type in one window and show translated updates in the other.
4. Move cursor to show live presence with display name.
5. Open Share modal and show edit/view/snapshot link generation.
6. Ask Polly for a draft and show animated insertion into the document.

## Known limits (current build)
- Supported collaborative block type is currently document only.
- Mixed-language source detection is basic and not enterprise glossary-aware yet.
- Realtime depends on Supabase channel reliability and client connection quality.

## Troubleshooting
- `Missing required env var: NEXT_PUBLIC_SUPABASE_URL`
  - Add it to `.env.local` and restart dev server.
- `lingo.dev request failed`
  - Verify `LINGO_API_KEY` and check API quota/network access.
- Gemini model not found
  - Keep `GEMINI_MODEL` default or use a currently listed model; Polly route auto-tries fallback models.

## Security note
Do not commit real API keys. If secrets were ever exposed, rotate them immediately in Supabase, lingo.dev, and Gemini consoles.
