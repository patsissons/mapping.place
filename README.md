# mapping.place

`mapping.place` is a local-first web app for building and sharing curated place
collections with more context than a basic saved map. The first implementation
focuses on building maps from scratch, storing them locally by name, and keeping
the active collection encoded in the URL so it can be shared as a permalink.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn-style UI primitives
- Prettier for formatting consistency
- Leaflet + OpenStreetMap tiles for the visual map layer

The app intentionally keeps the visual map renderer decoupled from place data so
future Google Places or custom Google Map imports can be added without coupling
the whole UI to Google Maps display licensing.

The current builder now resolves URL-backed maps on the server, stores compact
permalinks that contain Google Place IDs plus optional custom metadata, hydrates
Google data before the page renders, and uses an internal API route for
single-place hydration from the client.

## Features in this scaffold

- Responsive layout down to 320px wide
- Light and dark theme support
- Left-side workspace with:
  - saved local maps
  - text filtering
  - open-only filtering on a selected date
  - sorting by rating and review count in both directions
  - a controlled place form with opening-hours editing
- Right-side map canvas with configurable pins for:
  - rating
  - review count
  - open / closed status
- Shareable permalink generation via a compact URL payload of Google Place IDs
  plus optional place metadata
- Server-side hydration of Google Place IDs found in the permalink payload
- Internal `/api/places/[placeId]` route for single-place hydration
- Local storage persistence keyed by map name
- Optional `placeId` on each place to support future Google data hydration/import

## Local development

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start the dev server:

   ```bash
   pnpm dev
   ```

3. Open [http://localhost:3000](http://localhost:3000).

Copy [`.env.example`](/Users/patsissons/src/github.com/patsissons/mapping.place/.env.example)
to `.env.local` and set `GOOGLE_PLACES_API_KEY` if you want server-side Google
Place hydration to work locally. Without it, the app still loads, but Google
Place references remain unresolved and the hydration route returns a `503`.

## Useful scripts

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm format
pnpm format:check
```

## Deployment

This project is intended for Vercel deployment.

1. Import the repository into Vercel.
2. Keep the framework preset as Next.js.
3. Add `GOOGLE_PLACES_API_KEY` when you want Google Place hydration enabled.
4. Deploy.

## Notes for the next iteration

- Add a Google OAuth flow only for optional import of user-owned custom maps.
- Add auth and rate limiting around the internal place hydration route before
  exposing higher-volume traffic to it.
- Keep URL payloads compact; if map size becomes a problem, swap the current
  base64-url encoding for compression without changing the higher-level app
  architecture.
