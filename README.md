# music-site — music.nulltag.ch

The single "link-in-bio" page for NULLTAG. It is the one URL to share
everywhere; it forwards fans to every streaming platform, the socials, and the
latest release. No framework, no build step — just static files deployed by
GitHub Pages.

## Edit the content

Everything you normally change lives in **`config.js`**. Edit it (the GitHub web
editor is fine), commit to the deploy branch, and the page redeploys itself.

- `profile` — name, tagline, logo, share URL
- `latestRelease` — featured release card (set `show: false` to hide it)
- `streaming` — platform buttons, shown in order
- `social` — social links

Items whose `url` is still `"#"` render as greyed-out placeholders, so an empty
scaffold is safe to ship.

## Brand / corporate design

All colours, fonts and corner radius are CSS variables in the clearly-marked
banner at the top of **`styles.css`** (`███ NULLTAG CD BRAND TOKENS ███`).
Paste the real values from `nulltag-cd` there — nothing else needs to change.

Logo / artwork / favicon / social image are placeholders in **`assets/`**
(`logo.svg`, `cover-placeholder.svg`, `favicon.svg`, `og-image.svg`) — swap the
files in place. For the social share image, replace `og-image.svg` with a
1200×630 PNG/JPG and update the `og:image` path in `index.html`.

## Local preview

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Deployment (GitHub Pages)

`.github/workflows/deploy.yml` builds and deploys on every push to `main` or
`claude/music-landing-page-KcIPo`.

**One-time setup:** repo **Settings → Pages → Source = "GitHub Actions"**. This
toggle cannot be set from code.

### Custom domain (music.nulltag.ch) — deferred

When ready: add a `CNAME` file containing `music.nulltag.ch`, set the custom
domain under Settings → Pages, and point the DNS `CNAME` record for
`music.nulltag.ch` at the GitHub Pages host. The `og:image` / `canonical` URLs
already assume this domain.
