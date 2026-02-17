<p align="center">
  <img src="./app/icon.svg" alt="Polyform logo" width="88" height="88" />
</p>

<h1 align="center">Polyform</h1>
<p align="center"><strong>One workspace. Every language. Zero barriers.</strong></p>

Polyform is a real-time multilingual collaboration workspace built for the lingo.dev hackathon. Teams can write in their own language while everyone else sees live translated content in theirs.

## What Polyform does
- Real-time shared document editing in a Google-Docs-style A4 flow.
- Live multilingual rendering per collaborator language.
- Instant sharing links for edit/view/snapshot flows.
- Presence cursors with user identity in shared spaces.
- AI drafting assistant (`Write with Polly`) with voice input and animated insertion into the document.

## Core stack
- Next.js 14 (App Router)
- Supabase (database, realtime, share/snapshot backing)
- lingo.dev SDK (translation engine)
- Tailwind CSS

## Why lingo.dev is central
Polyform treats language as infrastructure. The app stores canonical source content once, then localizes outward per active language.

### Translation path
1. Source content changes in a document block.
2. Change is debounced and sent to `POST /api/translate`.
3. Server calls lingo.dev using `localizeStringArray`.
4. Translations are cached and broadcast to clients in the same room.
5. Each client renders content in its selected language.

### Polly language path
1. User prompts Polly in chat.
2. Gemini generates a high-quality draft in English.
3. If user requested another language (for example German/French), server routes through lingo.dev `localizeText`.
4. Draft is sanitized and typed into the document with animation.

## Project structure
- `app/api/translate/route.ts` translation endpoint (lingo.dev + cache)
- `app/api/polly/route.ts` AI drafting endpoint (Gemini + lingo.dev translation)
- `components/space/workspace.tsx` realtime workspace, toolbar, Polly UI, focus mode
- `components/blocks/document-block.tsx` A4 multi-page document renderer/editor
- `lib/realtime/supabase-room-client.ts` realtime channel client
- `supabase/migrations/*` DB schema + realtime setup

## Environment variables
Copy `.env.example` to `.env.local` and fill:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LINGO_API_KEY`
- `GEMINI_API_KEY` (or `GOOGLE_API_KEY`)
- `GEMINI_MODEL` (optional override)
- `UPSTASH_REDIS_REST_URL` (optional cache)
- `UPSTASH_REDIS_REST_TOKEN` (optional cache)

## Local setup
```bash
npm install
npm run dev
```

## Quality checks
```bash
npm run typecheck
npm run lint
npm test
```

## Supabase migrations
Apply migrations in order:
- `202602170001_init.sql`
- `202602170002_enable_realtime.sql`
- `202602170003_remove_legacy_blocks.sql`
- `202602170004_document_only.sql`

## Current behavior notes
- Document pages auto-grow one-by-one (no inner page scrollbar).
- Polly sanitizes output to avoid `**`, `#`, and em dashes.
- If Gemini model availability changes, Polly auto-falls back to supported models.
