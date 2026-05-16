/*
 * Builds releases.json from Deezer's public REST API + the artist's
 * YouTube uploads RSS. Runs in GitHub Actions (open network), so no
 * JSONP/CORS and no API key. ids come from config.js (single source of
 * truth). Every source is independent and failure-guarded: a dead Deezer
 * still ships YouTube updates, and vice-versa, so the site always has
 * something fresh.
 */
import { readFileSync, writeFileSync } from "node:fs";

const cfgSrc = readFileSync(new URL("../config.js", import.meta.url), "utf8");
const ARTIST = (cfgSrc.match(/deezerArtistId:\s*"(\d+)"/) || [])[1] || "";
const LIMIT = Number((cfgSrc.match(/limit:\s*(\d+)/) || [])[1] || 24);
const YT = (cfgSrc.match(/youtubeChannelId:\s*"([\w-]+)"/) || [])[1] || "";

async function dz(path) {
  const res = await fetch("https://api.deezer.com" + path);
  if (!res.ok) throw new Error(path + " → HTTP " + res.status);
  const json = await res.json();
  if (json && json.error) throw new Error(path + " → " + JSON.stringify(json.error));
  return json;
}

// ---- Deezer discography (guarded) ---------------------------------------
let albums = [];
try {
  if (!ARTIST) throw new Error("no deezerArtistId");
  const resp = await dz(`/artist/${ARTIST}/albums?limit=${LIMIT}`);
  const raw = (resp.data || []).slice().sort((a, b) =>
    String(b.release_date || "").localeCompare(String(a.release_date || "")));
  for (const al of raw) {
    let tracks = [];
    try {
      const full = await dz(`/album/${al.id}`);
      tracks = (full.tracks?.data || []).map((t) => ({
        title: t.title, preview: t.preview || "", duration: t.duration || 0
      }));
    } catch (e) { console.warn("tracks failed", al.id, String(e)); }
    albums.push({
      id: al.id, title: al.title, link: al.link,
      cover: al.cover_xl || al.cover_big || al.cover_medium || al.cover || "",
      record_type: al.record_type || "release",
      release_date: al.release_date || "", tracks
    });
  }
} catch (e) { console.warn("Deezer skipped:", String(e)); }

// ---- YouTube uploads → updates (guarded, no key) ------------------------
let updates = [];
try {
  if (!YT) throw new Error("no youtubeChannelId");
  const res = await fetch("https://www.youtube.com/feeds/videos.xml?channel_id=" + YT);
  if (!res.ok) throw new Error("YT RSS HTTP " + res.status);
  const xml = await res.text();
  const entries = xml.split("<entry>").slice(1, 7);
  updates = entries.map((e) => {
    const title = (e.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
    const link = (e.match(/<link rel="alternate" href="([^"]+)"/) || [])[1] || "";
    const pub = (e.match(/<published>([^<]+)<\/published>/) || [])[1] || "";
    return {
      date: pub.slice(0, 10),
      platform: "YouTube",
      text: title.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
      url: link
    };
  }).filter((u) => u.text && u.url);
} catch (e) { console.warn("YouTube skipped:", String(e)); }

const out = {
  generated: new Date().toISOString(),
  artist: ARTIST,
  count: albums.length,
  albums,
  updates
};
writeFileSync(new URL("../releases.json", import.meta.url),
  JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote releases.json — ${albums.length} releases, ${updates.length} updates.`);
