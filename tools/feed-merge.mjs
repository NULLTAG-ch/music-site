/*
 * Pure (network-free) helpers for assembling the `updates` list.
 * Extracted from build-feed.mjs so the dedup logic is unit-testable offline.
 */

/**
 * Normalise a title for fuzzy cross-platform matching: lowercased, with
 * bracketed suffixes "(Remastered)" / "[feat. X]", trailing "feat. …", and
 * all punctuation stripped, whitespace collapsed. "TEKKNO TRAIN (Remastered)"
 * and "Tekkno Train" → "tekkno train".
 */
export function normTitle(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/\([^)]*\)|\[[^\]]*\]/g, " ") // drop (…) and […]
    .replace(/\bfeat\.?\b.*$/, " ")        // drop "feat. …" tails
    .replace(/[^a-z0-9]+/g, " ")           // punctuation → space
    .trim();
}

/**
 * Merge several update sources into one deduped, date-sorted, capped list.
 *
 * The same release commonly surfaces on multiple platforms (a YouTube video
 * AND a SoundCloud upload) and/or is already a Deezer album. We keep only the
 * newest variant per normalised title and drop anything that matches a known
 * album title — so the same release is never listed (or announced) twice.
 *
 * @param {Array<Array<object>>} sources  arrays of {date,platform,text,url}
 * @param {Array<string>} albumTitles     Deezer album titles to suppress
 * @param {number} limit                  max items to keep
 */
export function dedupeUpdates(sources, albumTitles = [], limit = 20) {
  const known = new Set(albumTitles.map(normTitle).filter(Boolean));
  const merged = []
    .concat(...sources)
    .filter((u) => u && u.text && u.url)
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

  const seen = new Set();
  const out = [];
  for (const u of merged) {
    const k = normTitle(u.text);
    if (k && (known.has(k) || seen.has(k))) continue; // album dup or cross-source dup
    if (k) seen.add(k);
    out.push(u);
  }
  return out.slice(0, limit);
}
