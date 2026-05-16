/*
 * ============================================================================
 *  music.nulltag.ch — CONTENT
 * ============================================================================
 *  This is the ONLY file you normally need to edit. Change the values below
 *  (via the GitHub web UI is fine), commit — the page redeploys itself.
 *
 *  Everything here works with zero external services. The release grid is
 *  additionally enriched live from Deezer when available.
 * ============================================================================
 */
window.CONFIG = {
  profile: {
    name: "NULLTAG",
    tagline: "All our music. One link.",
    logo: "assets/logo.svg",
    shareUrl: "https://music.nulltag.ch"
  },

  // Pinned hero release. Always shown — the dependable front door.
  latestRelease: {
    show: true,
    title: "Plastic Paradise EP",
    subtitle: "EP · 2026",
    artwork: "assets/cover-placeholder.svg",
    ctaLabel: "Listen on Apple Music",
    listenUrl: "https://music.apple.com/ch/album/plastic-paradise-ep/6769685431"
  },

  // Release overview. Enriched live from Deezer (no key) and/or a
  // releases.json baked by the feed Action. If neither is available the
  // catalog falls back to the streaming links below so fans can ALWAYS
  // get to the music.
  releases: {
    show: true,
    source: "deezer",
    deezerArtistId: "388775221",
    youtubeChannelId: "UCWl0DW85arbD6uHnD29HA_Q",
    limit: 24
  },

  // Where the music lives — every distributor, in display order.
  streaming: [
    { label: "Spotify",       url: "https://open.spotify.com/artist/5V17xFUuN6H4jqZNChnrdV" },
    { label: "Apple Music",   url: "https://music.apple.com/ch/album/plastic-paradise-ep/6769685431" },
    { label: "YouTube Music", url: "https://music.youtube.com/channel/UCWl0DW85arbD6uHnD29HA_Q" },
    { label: "YouTube",       url: "https://www.youtube.com/channel/UCWl0DW85arbD6uHnD29HA_Q" },
    { label: "SoundCloud",    url: "https://soundcloud.com/nulltag" },
    { label: "Deezer",        url: "https://www.deezer.com/artist/388775221" }
  ],

  // Social profiles.
  social: [
    { label: "Instagram", url: "https://www.instagram.com/nulltag.ch/" },
    { label: "YouTube",   url: "https://www.youtube.com/channel/UCWl0DW85arbD6uHnD29HA_Q" }
  ],

  // Updates / news — "what just dropped". Add a line, commit, it's live.
  // Newest first is fine; the page sorts by date anyway.
  // YouTube uploads are appended automatically by the feed Action.
  updates: [
    { date: "2026-05-16", platform: "Release",   text: "Plastic Paradise EP is out — listen on every platform.", url: "https://music.apple.com/ch/album/plastic-paradise-ep/6769685431" },
    { date: "2026-05-16", platform: "Instagram", text: "New visuals + behind-the-scenes on Instagram.",            url: "https://www.instagram.com/nulltag.ch/" }
  ],

  // Upcoming projects — what's next. Fields: title, schiene, status
  // (Concept · Writing · In mix · Mastering · Scheduled), eta (free text),
  // note (1–2 sentences), link (optional "more info ↗" url, "" to hide).
  upcoming: [
    {
      title: "NACHTSTROM NS-01",
      schiene: "Nachtstrom",
      status: "Writing",
      eta: "2026",
      note: "First single of the asphalt-black rail — German night-techno, Sodium-Orange palette, Phrygian-Dom keys. Architecture heroes, single light source.",
      link: ""
    },
    {
      title: "LICHTJAHRE Vol.2",
      schiene: "Lichtjahre",
      status: "Concept",
      eta: "2026",
      note: "Second cosmic-frenchcore volume. Brief locked, cover system in design — successor to the released Vol.1.",
      link: ""
    }
  ]
};
