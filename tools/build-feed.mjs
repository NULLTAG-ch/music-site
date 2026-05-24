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
const SC_USER = (cfgSrc.match(/soundcloudUserId:\s*"(\d+)"/) || [])[1] || "";
const SP_ARTIST = (cfgSrc.match(/spotifyArtistId:\s*"([A-Za-z0-9]+)"/) || [])[1] || "";

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

// ---- SoundCloud uploads → updates (guarded, OAuth client_credentials) ----
// Stateless app token via client_credentials (kein Refresh-Token-Rotations-
// Problem). Secrets: SC_CLIENT_ID, SC_CLIENT_SECRET. User-ID aus config.js.
try {
  const cid = process.env.SC_CLIENT_ID, csec = process.env.SC_CLIENT_SECRET;
  if (!SC_USER) throw new Error("no soundcloudUserId");
  if (!cid || !csec) throw new Error("no SC client creds (SC_CLIENT_ID/SECRET)");
  const tk = await fetch("https://api.soundcloud.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: cid, client_secret: csec })
  });
  if (!tk.ok) throw new Error("SC token HTTP " + tk.status);
  const token = (await tk.json()).access_token;
  const res = await fetch(
    `https://api.soundcloud.com/users/${SC_USER}/tracks?limit=8&access=playable&linked_partitioning=true`,
    { headers: { Authorization: "OAuth " + token, Accept: "application/json" } });
  if (!res.ok) throw new Error("SC tracks HTTP " + res.status);
  const body = await res.json();
  const coll = body.collection || (Array.isArray(body) ? body : []);
  let added = 0;
  for (const t of coll.slice(0, 8)) {
    const url = String(t.permalink_url || "").split("?")[0];
    if (!t.title || !url) continue;
    updates.push({
      date: String(t.created_at || "").slice(0, 10).replace(/\//g, "-"),
      platform: "SoundCloud", text: t.title, url
    });
    added++;
  }
  console.log(`SoundCloud: ${added} tracks.`);
} catch (e) { console.warn("SoundCloud skipped:", String(e)); }

// ---- Spotify releases → updates (guarded, client_credentials) -----------
// Secrets: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET (Spotify-Developer-App).
// Dedup gegen Deezer-albums per Titel, damit ein Release nicht doppelt postet.
try {
  const cid = process.env.SPOTIFY_CLIENT_ID, csec = process.env.SPOTIFY_CLIENT_SECRET;
  if (!SP_ARTIST) throw new Error("no spotifyArtistId");
  if (!cid || !csec) throw new Error("no Spotify creds (SPOTIFY_CLIENT_ID/SECRET)");
  const tk = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(cid + ":" + csec).toString("base64")
    },
    body: new URLSearchParams({ grant_type: "client_credentials" })
  });
  if (!tk.ok) throw new Error("Spotify token HTTP " + tk.status);
  const token = (await tk.json()).access_token;
  const res = await fetch(
    `https://api.spotify.com/v1/artists/${SP_ARTIST}/albums?include_groups=album,single&market=CH&limit=10`,
    { headers: { Authorization: "Bearer " + token } });
  if (!res.ok) throw new Error("Spotify albums HTTP " + res.status);
  const items = (await res.json()).items || [];
  const known = new Set(albums.map((a) => String(a.title || "").toLowerCase().trim()));
  let added = 0;
  for (const al of items) {
    const url = al.external_urls?.spotify || "";
    const name = al.name || "";
    if (!name || !url) continue;
    if (known.has(name.toLowerCase().trim())) continue; // schon als Deezer-Release erfasst
    updates.push({ date: (al.release_date || "").slice(0, 10), platform: "Spotify", text: name, url });
    added++;
  }
  console.log(`Spotify: ${added} new (nicht-Deezer) releases.`);
} catch (e) { console.warn("Spotify skipped:", String(e)); }

// Updates: neueste zuerst, auf 20 begrenzt (hält releases.json schlank;
// für den Notify-Bot unkritisch — der postet nur neu hinzugekommene Keys).
updates.sort((a, b) => String(b.date).localeCompare(String(a.date)));
updates = updates.slice(0, 20);

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
