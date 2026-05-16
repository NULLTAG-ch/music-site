/*
 * Builds releases.json from Deezer's public REST API.
 *
 * Runs in GitHub Actions (runners have open network), so it does NOT need
 * JSONP/CORS — it just fetches JSON server-side and writes a same-origin
 * file the site loads directly. No API key. The artist id + limit come
 * from config.js so there is a single source of truth.
 */
import { readFileSync, writeFileSync } from "node:fs";

const cfgSrc = readFileSync(new URL("../config.js", import.meta.url), "utf8");
const idMatch = cfgSrc.match(/deezerArtistId:\s*"(\d+)"/);
const limitMatch = cfgSrc.match(/limit:\s*(\d+)/);
if (!idMatch) {
  console.error("No deezerArtistId in config.js — nothing to build.");
  process.exit(0);
}
const ARTIST = idMatch[1];
const LIMIT = limitMatch ? Number(limitMatch[1]) : 24;

async function dz(path) {
  const res = await fetch("https://api.deezer.com" + path);
  if (!res.ok) throw new Error(path + " → HTTP " + res.status);
  const json = await res.json();
  if (json && json.error) throw new Error(path + " → " + JSON.stringify(json.error));
  return json;
}

const albumsResp = await dz(`/artist/${ARTIST}/albums?limit=${LIMIT}`);
const raw = (albumsResp.data || []).slice().sort((a, b) =>
  String(b.release_date || "").localeCompare(String(a.release_date || "")));

const albums = [];
for (const al of raw) {
  let tracks = [];
  try {
    const full = await dz(`/album/${al.id}`);
    tracks = (full.tracks && full.tracks.data ? full.tracks.data : []).map((t) => ({
      title: t.title,
      preview: t.preview || "",
      duration: t.duration || 0
    }));
  } catch (e) {
    console.warn("tracks failed for album", al.id, String(e));
  }
  albums.push({
    id: al.id,
    title: al.title,
    link: al.link,
    cover: al.cover_xl || al.cover_big || al.cover_medium || al.cover || "",
    record_type: al.record_type || "release",
    release_date: al.release_date || "",
    tracks
  });
}

const out = {
  generated: new Date().toISOString(),
  artist: ARTIST,
  count: albums.length,
  albums
};
writeFileSync(new URL("../releases.json", import.meta.url),
  JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote releases.json — ${albums.length} releases.`);
