# music-site — music.nulltag.ch

NULLTAG's label site: one URL to share everywhere. Cinematic one-pager with
catalog, release rollout, live countdown, fan tools — plus standalone pages
(`tools.html`, `facts.html`, `facts-read.html`, `family-tree.html`,
`impressum.html`). No framework, no build step — static files on GitHub Pages.

## How the site stays fresh (automation)

```
SoundCloud API ─┐
Deezer REST ────┤   feed.yml (Action, ~15 min)          index.html (hydration)
Spotify API ────┼─► tools/build-feed.mjs ─► releases.json ─► hero "Latest" cell
YouTube RSS ────┘        │                                 ─► NEU catalog cards
                         └─► Telegram notify (announced.json ledger)
```

- **`releases.json` is owned by CI** (`feed.yml` commits it with `[skip ci]`).
  Never commit a locally built version — local runs lack the SC/Spotify
  secrets and may sit behind TLS inspection; `git checkout -- releases.json`
  if you ran the builder locally.
- **Hydration** (`index.html`, `hydrateFromFeed`): the newest feed release
  drives the hero "Latest" cell; anything newer than `CATALOG_AS_OF` that
  isn't already curated (fuzzy title match) is auto-prepended as a **NEU
  card** — distributed releases from `feed.albums` (Deezer, with cover +
  tracklist) and SoundCloud-only uploads from `feed.updates` (SC artwork,
  links to the track). Static HTML stays the no-JS fallback.
- **tools.html G-02 Smart-Link** hydrates to the newest release the same way;
  its copy button prefers a `/s/` short link when the slug exists.

### Editorial rituals (the only manual steps)

1. **New upload/release appears as NEU** → curate it into `CATALOG` in
   `index.html` (rail, BPM, catalog number, local cover in `covers/`), then
   bump `CATALOG_AS_OF` to today. Counts to update: filter buttons, §03
   header, hero "Tracks" stat + CTA.
2. **Future drop announced** → add it to `DROPS` (index.html **and**
   tools.html — keep in sync) and `RO_DROPS` (index.html). Countdowns
   auto-advance; after the last entry passes they show a TBA card, never a
   frozen clock. No API can see unpublished schedules — this stays manual.
3. **New short link** → add slug → URL to `shortlinks` in `config.js`.
   Verify the SoundCloud permalink returns 200 first (dead permalinks have
   bitten before).
4. **New trainer version on learn.nulltag.ch** → add a line to `LEARN_TRACKS`
   in `index.html` (§09 Tools, "Am Klavier"). That list is the one place this
   site knows which tracks are playable over there. The `slug` is the key
   between the two sites (`?track=<slug>`) and comes from the vault, not from
   the title — where catalog and trainer carry different titles, the catalog
   wins (`Pilze, Pläne und Panik` → `mushrooms-plans-and-panic`).

## Cross-property bar

The `.nt-bar` at the very top is the one element identical on every
nulltag.ch domain — it is defined in the design system (`web.css`, vendored
from `nulltag-cd`), not here. Do not restyle it locally: a change belongs in
the design system so both properties move together.

## Short links — `music.nulltag.ch/s/<slug>`

`404.html` (GitHub Pages serves it for every unknown path) resolves
`/s/<slug>` from `CONFIG.shortlinks` and redirects; unknown slugs fall back
to the SoundCloud profile; genuine 404s get a branded page.

## Content & brand

- **`config.js`** — profile, streaming/social links, Schienen, short links.
- **`colors_and_type.css`** — brand tokens (colors, type ramp) + Bebas Neue.
- **`fonts/fonts.css`** — self-hosted Inter Tight / JetBrains Mono / Space
  Grotesk (latin woff2). No Google Fonts requests; regenerate by re-running
  the download against fonts.googleapis.com css2 with a woff2 UA.
- **Covers** live in `covers/` at ≤1000px q82 (masters are gitignored
  `covers/*.png`). `assets/og-image.jpg` (1200×630) is the share image.

## Local preview

```sh
python3 -m http.server 4173   # or use .claude/launch.json
```

Note: python's server doesn't route unknown paths through `404.html`, so
`/s/…` short links only work end-to-end on Pages.

## Deployment

- **`deploy.yml`** — sole owner of push-to-main deploys (shared `pages`
  concurrency group; feed.yml deploys on its own schedule instead).
- **`feed.yml`** — rebuilds the feed every ~15 min, commits only on real
  change (fingerprint short-circuit), then deploys.
- Both prune `assets/proto`, `tools/`, `docs/` from the Pages artifact —
  dev tooling stays in the repo, never ships.
- **Known flake:** `deploy-pages` sometimes fails with a generic
  "Deployment failed, try again later" — that's a GitHub transient. Re-run
  the failed job (`gh run rerun <id> --failed`); it succeeds on retry.

**One-time setup:** repo Settings → Pages → Source = "GitHub Actions".
Custom domain `music.nulltag.ch` is live via `CNAME` + DNS.
