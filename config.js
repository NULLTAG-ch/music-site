/*
 * ============================================================================
 *  music.nulltag.ch — CONTENT
 * ============================================================================
 *  This is the ONLY file you normally need to edit. Change the values below
 *  (via the GitHub web UI is fine), commit, and the page redeploys itself.
 *
 *  Anything marked TODO is a placeholder — replace it with the real value.
 *  Leave a `url` as "#" to keep an item as a visible placeholder.
 * ============================================================================
 */
window.CONFIG = {
  profile: {
    name: "NULLTAG",                       // TODO: artist / project name
    tagline: "All our music. One link.",   // TODO: short tagline
    logo: "assets/logo.svg",               // TODO: swap for the CD logo
    shareUrl: "https://music.nulltag.ch"   // canonical share URL
  },

  // Featured latest release. Set show:false to hide the whole card.
  latestRelease: {
    show: true,
    title: "Plastic Paradise EP",
    subtitle: "EP",                        // TODO: add year, e.g. "EP · 2026"
    artwork: "assets/cover-placeholder.svg", // TODO: replace with real cover art (square)
    ctaLabel: "Listen on Apple Music",
    listenUrl: "https://music.apple.com/ch/album/plastic-paradise-ep/6769685431"
  },

  // Streaming platforms — rendered in this order.
  streaming: [
    { label: "Spotify",      url: "#" },   // TODO
    { label: "Apple Music",  url: "https://music.apple.com/ch/album/plastic-paradise-ep/6769685431" },
    { label: "YouTube Music", url: "#" },  // TODO
    { label: "YouTube",      url: "#" },   // TODO
    { label: "SoundCloud",   url: "#" },   // TODO
    { label: "Bandcamp",     url: "#" },   // TODO
    { label: "Deezer",       url: "#" },   // TODO
    { label: "Tidal",        url: "#" },   // TODO
    { label: "Amazon Music", url: "#" }    // TODO
  ],

  // Social links — rendered as a compact row.
  social: [
    { label: "Instagram", url: "#" },      // TODO
    { label: "TikTok",    url: "#" },      // TODO
    { label: "YouTube",   url: "#" },      // TODO
    { label: "Facebook",  url: "#" },      // TODO
    { label: "X",         url: "#" }       // TODO
  ]
};
