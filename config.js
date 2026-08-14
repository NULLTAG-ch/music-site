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
    // The channel is addressed by HANDLE — that is the identity that survives
    // a channel move. tools/build-feed.mjs resolves the handle to a UC… id at
    // build time (YouTube's RSS endpoint only speaks channel ids) and caches
    // the result in releases.json, so a handle change needs one edit here.
    youtubeHandle: "@realnulltag",
    soundcloudUserId: "1464141647",
    spotifyArtistId: "5V17xFUuN6H4jqZNChnrdV",
    limit: 24
  },

  // ── SCHIENEN ──────────────────────────────────────────────────────────
  // A "Schiene" (rail) is the release LINE / sound-world a release belongs
  // to (≠ the format EP/Single/Album).
  //
  // Diese Liste stand bis 2026-08-14 falsch hier: sie führte "DISTRIBUTION"
  // als fünfte Schiene. DISTRIBUTION ist keine Schiene, sondern ein
  // Auswertungs-Bucket im Release-Dashboard, das drei echte Schienen
  // zusammenfasst — BLACKBOX, TAUSEND STIMMEN und TONBAND. Der Vault
  // (nulltag-cd/vault-export/schienen.json) ist hier die Quelle: zwölf
  // Schienen insgesamt, davon sieben mit eigenem Katalog-Prefix und
  // Releases. NACHTSTROM, RFC und MERIDIAN existieren nur als Konzept —
  // eine Release-Seite hat für sie nichts zu zeigen, also stehen sie hier
  // auch nicht.
  //
  // CORONATION TRILOGY und PLASTIC PARADISE führt der Vault als eigene
  // Einträge, sie haben aber kein eigenes Prefix: sie belegen Nummern im
  // Standalone-Katalog (NULLTAG-05/06/07 bzw. NULLTAG-03/08/09) und
  // laufen deshalb hier unter "standalone".
  schienen: [
    { id: "lichtjahr",       name: "LICHTJAHR",       sound: "Cosmic frenchcore",       accent: "#e879c4" },
    { id: "cinetekk",        name: "CINETEKK",        sound: "Cinematic techno · Album",accent: "#3aa8ff" },
    { id: "dome",            name: "DOME EP",         sound: "Festival frenchcore",     accent: "#ff6a2a" },
    { id: "blackbox",        name: "BLACKBOX",        sound: "Industrial · Acid Techno",accent: "#ff2a55" },
    { id: "tausend-stimmen", name: "TAUSEND STIMMEN", sound: "Trance · Hands-Up",       accent: "#7adfe8" },
    { id: "tonband",         name: "TONBAND",         sound: "Comedy Hardtek",          accent: "#5ae082" },
    { id: "standalone",      name: "STANDALONES",     sound: "Singles, heterogen",      accent: "#5fc8e0" }
  ],
  // Map each release title (Deezer / SoundCloud, case-insensitive) to a
  // Schiene id above. Unmapped releases simply show no rail tag — nothing
  // is invented.
  schieneMap: {
    "lichtjahr": "lichtjahr",
    "cinetekk": "cinetekk",
    "in the dome": "dome", "god of bass": "dome", "stuck on repeat": "dome", "fell in love with the music": "dome",
    "blackbox": "blackbox", "ghost protocol": "blackbox", "honeypot": "blackbox", "kill switch": "blackbox",
    "tausend stimmen": "tausend-stimmen", "thousand voices": "tausend-stimmen",
    // TB-01..TB-09 laut vault-export/tracks.json.
    "swiss geeman": "tonband", "wo ist der bass": "tonband", "achthundert beamte": "tonband",
    "bayern crew": "tonband", "einfacher als du denkst": "tonband", "sternenstaub": "tonband",
    "saendele mit dominique": "tonband", "sandkastenparty": "tonband", "mein name ist hase": "tonband",
    "plastic paradise": "standalone", "plastic funeral": "standalone", "peace remains": "standalone",
    "lovesong": "standalone", "freedom": "standalone", "fifteen years": "standalone", "beauty of music": "standalone",
    // Vögel Einsneunzig (NULLTAG-01) und Tekkno Train (NULLTAG-02) tragen
    // Standalone-Katalognummern. Dass TONBAND seine Bildsprache aus dem
    // Vögel-Cover ableitet, macht den Track nicht zu einem TONBAND-Track.
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
    // No YouTube Music entry: music.youtube.com is addressed by channel id,
    // not by handle, and the id for @realnulltag is only known after the feed
    // Action resolves it. A link that certainly works beats one that might.
    { label: "YouTube",       url: "https://www.youtube.com/@realnulltag" },
    { label: "Deezer",        url: "https://www.deezer.com/artist/388775221" }
  ],

  // Social profiles.
  social: [
    { label: "Instagram", url: "https://www.instagram.com/nulltag.ch/" },
    { label: "YouTube",   url: "https://www.youtube.com/@realnulltag" },
    { label: "Groover",   url: "https://groover.co/de/band/profile/fd5c6b.nulltag/?tab=1" }
  ],

  // Updates / news — "what just dropped". Add a line, commit, it's live.
  // Newest first is fine; the page sorts by date anyway.
  // YouTube uploads are appended automatically by the feed Action.
  updates: [
    { date: "2026-05-16", platform: "Release",   text: "Plastic Paradise EP is out — listen on every platform.", url: "https://music.apple.com/ch/album/plastic-paradise-ep/6769685431" },
    { date: "2026-05-16", platform: "Instagram", text: "New visuals + behind-the-scenes on Instagram.",            url: "https://www.instagram.com/nulltag.ch/" }
  ],

  // ── PRESSE & BLOG ─────────────────────────────────────────────────────
  // Beitraege ueber NULLTAG und laengere eigene Texte. Bewusst getrennt von
  // `updates`: ein TV-Beitrag oder ein geschriebenes Stueck bleibt Jahre
  // relevant, waehrend "neue Single ist raus" nach einer Woche Altpapier
  // ist. §PRESSE zeigt Karten mit Quelle, Datum und Zitat statt einer
  // Feed-Zeile.
  //
  // Solange diese Liste leer ist, nimmt sich die ganze Sektion aus der
  // Seite — kein leerer Block, keine Ankuendigung ohne Termin.
  //
  // Felder:
  //   date    "JJJJ-MM-TT"  — sortiert, neueste zuerst
  //   source  Wer es publiziert hat ("1FL TV", "NULLTAG Blog", ...)
  //   kind    "TV" | "Artikel" | "Interview" | "Blog" — steuert das Badge
  //   title   Die Ueberschrift des Beitrags, nicht die eigene Zusammenfassung
  //   url     Link auf den Beitrag (extern oder eine eigene Seite)
  //   quote   optional, ein Satz aus dem Beitrag
  //   video   optional, 11-stellige YouTube-ID. Der erste Eintrag mit Video
  //           bekommt die volle Breite und eine Klick-Facade: bis zum Klick
  //           wird nichts von youtube.com geladen.
  //
  // Beispiel — beim Eintragen die Kommentarzeichen entfernen und die Werte
  // durch die echten ersetzen. Erfundene Platzhalter gehoeren nicht in eine
  // Live-Seite, darum steht hier nichts Halbrichtiges:
  //
  // { date: "2026-06-12", source: "1FL TV", kind: "TV",
  //   title: "…", url: "https://…", quote: "…", video: "…" },
  presse: [
    // Fernsehbeitrag von TV Liechtenstein, als Reel auf Facebook.
    //
    // `title` und `date` fehlen absichtlich: die Session, die diesen
    // Eintrag angelegt hat, kommt per Egress-Regel nicht an facebook.com
    // und kann Schlagzeile und Sendedatum nicht auslesen. Lieber kein
    // Titel als ein geratener — die Karte faellt dann auf „Beitrag über
    // NULLTAG" zurueck. Sobald beides bekannt ist, hier eintragen; ein
    // `quote` aus dem Beitrag macht die Karte deutlich staerker.
    //
    // Kein `video`: das Feld erwartet eine YouTube-ID fuer die
    // Klick-Facade. Ein Facebook-Reel liesse sich nur ueber deren SDK
    // einbetten, und das laedt Skripte und Cookies von Meta, bevor
    // irgendjemand auf Play gedrueckt hat. Die Seite liefert per Default
    // keinen Third-Party-Cookie aus, und dabei bleibt es — also verlinkt
    // die Karte, statt einzubetten.
    //
    // Die URL ist um den Tracking-Parameter `mibextid` gekuerzt.
    { source: "TV Liechtenstein", kind: "TV",
      url: "https://www.facebook.com/reel/2262232791280600/" }
  ]

  // Kein `upcoming` mehr — bewusst entfernt, nicht ersetzt (Entscheidung
  // Ivan Stricker, 2026-08-13, siehe nulltag-cd/vault-export/meta.json).
  // Der Eintrag kuendigte "Lichtjahr Vol.2" sieben Wochen nach dem Release
  // noch als `Scheduled` an. Bei rund einem Release pro Woche veraltet jede
  // Einzelankuendigung schneller, als die Seite gepflegt wird — und ein Feld,
  // das es nicht gibt, kann nicht falsch sein. Die Seite zeigt den Live-
  // Katalog; der kommt aus releases.json und pflegt sich selbst.
};
