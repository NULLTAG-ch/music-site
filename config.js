/*
 * ============================================================================
 *  music.nulltag.ch — CONTENT
 * ============================================================================
 *  This is the ONLY file you normally need to edit. Change the values below
 *  (via the GitHub web UI is fine), commit, and the page redeploys itself.
 *
 *  Only platforms that actually exist are listed. The release grid is loaded
 *  live from Deezer's public API at page load — no build step, no API key.
 * ============================================================================
 */
window.CONFIG = {
  profile: {
    name: "NULLTAG",
    tagline: "All our music. One link.",
    logo: "assets/logo.svg",
    shareUrl: "https://music.nulltag.ch"
  },

  // Pinned hero release. Also the fallback if the live feed can't load.
  // Set show:false to hide the whole card.
  latestRelease: {
    show: true,
    title: "Plastic Paradise EP",
    subtitle: "EP · 2026",
    artwork: "assets/cover-placeholder.svg",
    ctaLabel: "Listen on Apple Music",
    listenUrl: "https://music.apple.com/ch/album/plastic-paradise-ep/6769685431"
  },

  // Auto-loaded release overview. Pulled client-side from Deezer's public
  // JSONP API (CORS-free, no key). Degrades silently if it can't load.
  releases: {
    show: true,
    source: "deezer",
    deezerArtistId: "388775221",
    limit: 24
  },

  // Streaming platforms — rendered in this order. Real links only.
  streaming: [
    { label: "Spotify",       url: "https://open.spotify.com/artist/5V17xFUuN6H4jqZNChnrdV" },
    { label: "Apple Music",   url: "https://music.apple.com/ch/album/plastic-paradise-ep/6769685431" },
    { label: "YouTube Music", url: "https://music.youtube.com/channel/UCWl0DW85arbD6uHnD29HA_Q" },
    { label: "YouTube",       url: "https://www.youtube.com/channel/UCWl0DW85arbD6uHnD29HA_Q" },
    { label: "SoundCloud",    url: "https://soundcloud.com/nulltag" },
    { label: "Deezer",        url: "https://www.deezer.com/artist/388775221" }
  ],

  // Social links — rendered as a compact row. Real links only.
  social: [
    { label: "Instagram", url: "https://www.instagram.com/nulltag.ch/" },
    { label: "YouTube",   url: "https://www.youtube.com/channel/UCWl0DW85arbD6uHnD29HA_Q" }
  ]
};
