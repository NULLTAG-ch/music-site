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
  // appleEmbed plays the EP in-page (official iframe, no key, no CORS).
  // meta: any field left "" is skipped — never shows a fake number.
  // tags: short descriptive chips (genre / format / rail).
  latestRelease: {
    show: true,
    title: "Supernova",
    subtitle: "LJ-10 · Lichtjahr Vol.2 · 2026",
    artwork: "covers/supernova.jpg",
    ctaLabel: "Listen on SoundCloud",
    listenUrl: "https://soundcloud.com/nulltag",
    meta: {
      cat: "LJ-10",
      bpm: "200",
      key: "",
      duration: "04:23",
      format: "WAV · MP3-320",
      isrc: "",
      year: "2026",
      schiene: "lichtjahr"
    },
    tags: ["Cosmic Frenchcore", "Single", "Vol.2"]
  },

  // Release overview. Enriched live from Deezer (no key) and/or a
  // releases.json baked by the feed Action. If neither is available the
  // catalog falls back to the streaming links below so fans can ALWAYS
  // get to the music.
  // The catalog plays from the official Spotify artist embed (every
  // release, real audio, no key, no CORS) — the dependable surface.
  // Deezer is optional extra enrichment if the artist is ever on it.
  releases: {
    show: true,
    spotifyEmbed: "https://open.spotify.com/embed/artist/5V17xFUuN6H4jqZNChnrdV?utm_source=generator",
    source: "deezer",
    deezerArtistId: "388775221",
    youtubeChannelId: "UCWl0DW85arbD6uHnD29HA_Q",
    soundcloudUserId: "1464141647",
    spotifyArtistId: "5V17xFUuN6H4jqZNChnrdV",
    limit: 24
  },

  // ── SCHIENEN ──────────────────────────────────────────────────────────
  // A "Schiene" (rail) is the release LINE / sound-world a release belongs
  // to (≠ the format EP/Single/Album). The 5 NULLTAG rails:
  schienen: [
    { id: "lichtjahr",  name: "LICHTJAHR",    sound: "Cosmic frenchcore",               accent: "#e879c4" },
    { id: "cinetekk",   name: "CINETEKK",     sound: "Cinematic techno · Album",        accent: "#3aa8ff" },
    { id: "dome",       name: "DOME EP",      sound: "Festival frenchcore",             accent: "#ff6a2a" },
    { id: "dist",       name: "DISTRIBUTION", sound: "Trance · Hard Techno · Hands-Up", accent: "#d4c8a8" },
    { id: "standalone", name: "STANDALONES",  sound: "Singles, heterogen",              accent: "#5fc8e0" }
  ],
  // Map each release title (Deezer / SoundCloud, case-insensitive) to a
  // Schiene id above. Unmapped releases simply show no rail tag — nothing
  // is invented.
  schieneMap: {
    "lichtjahr": "lichtjahr",
    "cinetekk": "cinetekk",
    "in the dome": "dome", "god of bass": "dome", "stuck on repeat": "dome", "fell in love with the music": "dome",
    "blackbox": "dist", "tausend stimmen": "dist", "thousand voices": "dist", "swiss geeman": "dist",
    "plastic paradise": "standalone", "plastic funeral": "standalone", "peace remains": "standalone",
    "lovesong": "standalone", "freedom": "standalone", "fifteen years": "standalone", "beauty of music": "standalone",
    "voegel einsneunzig": "standalone", "tekkno train": "standalone"
  },

  // ── SHORT LINKS ───────────────────────────────────────────────────────
  // music.nulltag.ch/s/<slug> → target URL, resolved by 404.html on
  // GitHub Pages. Every slug below is a verified SoundCloud permalink —
  // check https://soundcloud.com/nulltag/<slug> returns 200 before adding.
  // Unknown slugs fall back to the SoundCloud profile.
  shortlinks: {
    "supernova":            "https://soundcloud.com/nulltag/supernova",
    "microwave":            "https://soundcloud.com/nulltag/microwave",
    "last-light":           "https://soundcloud.com/nulltag/last-light",
    "higher-ground":        "https://soundcloud.com/nulltag/higher-ground",
    "andromeda-approach":   "https://soundcloud.com/nulltag/andromeda-approach",
    "trappist-loop":        "https://soundcloud.com/nulltag/trappist-loop",
    "event-horizon":        "https://soundcloud.com/nulltag/event-horizon",
    "mercurys-burn":        "https://soundcloud.com/nulltag/mercurys-burn",
    "heat-death":           "https://soundcloud.com/nulltag/heat-death",
    "blue-planet":          "https://soundcloud.com/nulltag/blue-planet",
    "cosmic-sea":           "https://soundcloud.com/nulltag/cosmic-sea",
    "the-edge-recedes":     "https://soundcloud.com/nulltag/the-edge-recedes",
    "letzter-sommer":       "https://soundcloud.com/nulltag/letzter-sommer",
    "tekkno-train":         "https://soundcloud.com/nulltag/tekkno-train",
    "in-the-dome":          "https://soundcloud.com/nulltag/in-the-dome",
    "cinetekk":             "https://soundcloud.com/nulltag/cinetekk",
    "eisflug":              "https://soundcloud.com/nulltag/eisflug",
    "nachtfalter":          "https://soundcloud.com/nulltag/nachtfalter",
    "one-man-owns-the-sky": "https://soundcloud.com/nulltag/one-man-owns-the-sky",
    "showroom":             "https://soundcloud.com/nulltag/showroom",
    "paper-kings":          "https://soundcloud.com/nulltag/paper-kings"
  },

  // Where the music lives — prioritised: SoundCloud, Apple Music, Spotify.
  streaming: [
    { label: "SoundCloud",    url: "https://soundcloud.com/nulltag" },
    { label: "Apple Music",   url: "https://music.apple.com/ch/album/plastic-paradise-ep/6769685431" },
    { label: "Spotify",       url: "https://open.spotify.com/artist/5V17xFUuN6H4jqZNChnrdV" },
    { label: "YouTube Music", url: "https://music.youtube.com/channel/UCWl0DW85arbD6uHnD29HA_Q" },
    { label: "YouTube",       url: "https://www.youtube.com/channel/UCWl0DW85arbD6uHnD29HA_Q" },
    { label: "Deezer",        url: "https://www.deezer.com/artist/388775221" }
  ],

  // Social profiles.
  social: [
    { label: "Instagram", url: "https://www.instagram.com/nulltag.ch/" },
    { label: "YouTube",   url: "https://www.youtube.com/channel/UCWl0DW85arbD6uHnD29HA_Q" },
    { label: "Groover",   url: "https://groover.co/de/band/profile/fd5c6b.nulltag/?tab=1" }
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
      title: "Lichtjahr Vol.2 — Full EP",
      schiene: "Lichtjahr",
      status: "Scheduled",
      eta: "26.06.2026",
      note: "6-track cosmic-frenchcore EP. SoundCloud singles are uploads (last single 'Last Light', Fri 19.06); the real release — distribution to all streaming services — is 26 June 2026. Showroom 03 July.",
      link: ""
    }
  ]
};
