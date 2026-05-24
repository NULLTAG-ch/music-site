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
    title: "Plastic Paradise EP",
    subtitle: "EP · 2026",
    artwork: "assets/cover-placeholder.svg",
    ctaLabel: "Listen on Apple Music",
    listenUrl: "https://music.apple.com/ch/album/plastic-paradise-ep/6769685431",
    appleEmbed: "https://embed.music.apple.com/ch/album/plastic-paradise-ep/6769685431",
    meta: {
      cat: "",                 // e.g. "NULLTAG-01"
      bpm: "",                 // e.g. "152"
      key: "",                 // e.g. "F♯m"
      duration: "",            // e.g. "18:24"
      format: "WAV · MP3-320",
      isrc: "",                // e.g. "CH-XXX-26-00001"
      year: "2026",
      schiene: ""              // e.g. "Echo"
    },
    tags: ["Electronic", "EP", "Independent"]
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
    { id: "lichtjahre", name: "LICHTJAHRE", sound: "Cosmic frenchcore",    accent: "#e879c4" },
    { id: "cinetekk",   name: "CINETEKK",   sound: "Cinematic techno",     accent: "#c44a3a" },
    { id: "nachtstrom", name: "NACHTSTROM", sound: "German night-techno",  accent: "#e8703a" },
    { id: "echo",       name: "ECHO",       sound: "Standalones",          accent: "#5fc8e0" },
    { id: "tonband",    name: "TONBAND",    sound: "Comedy hardtek",       accent: "#d4c8a8" }
  ],
  // Map each release (by its exact Deezer title, case-insensitive) to a
  // Schiene id above. Unmapped releases simply show no rail tag — nothing
  // is invented. Current Deezer titles to assign (your call):
  //   "PLASTIC PARADISE"  -> ""   (e.g. "echo")
  //   "BLACKBOX"          -> ""   (e.g. "cinetekk")
  //   "TEKKNO TRAIN"      -> ""   (e.g. "tonband")
  //   "Tausend Stimmen / Thousand Voices" -> ""   (e.g. "echo")
  //   "Lichtjahr"         -> "lichtjahre"   (assigned — clearly the LJ rail)
  schieneMap: {
    "lichtjahr": "lichtjahre"
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
