/*
 * Builds releases.json from Deezer (REST) + YouTube-RSS + SoundCloud.
 * Runs in GitHub Actions (open network), so no JSONP/CORS and — except
 * SoundCloud's OAuth app token — no keys. ids/secrets come from config.js +
 * Action-Secrets. Every source is independent and failure-guarded: a dead
 * source never sinks the others, so the site always has something fresh.
 *
 * Efficiency (best-practice, 2026-05-24):
 *  - Fingerprint-Short-Circuit: ein billiger Pass (Album-METADATEN via
 *    /artist/{id}/albums + Updates) bildet einen Fingerprint aus stabilen
 *    Feldern. Stimmt er mit der vorigen releases.json überein UND sind die
 *    Previews jünger als REFRESH_MS, wird NICHTS geschrieben → kein git-diff,
 *    kein Pages-Deploy, und die teuren Per-Album-Track-Calls entfallen ganz.
 *  - Nur bei echter Katalog-/Update-Änderung (oder Preview-Auffrischung alle
 *    REFRESH_MS) wird voll neu gebaut. Previews tragen ablaufende Deezer-
 *    Tokens, darum werden sie bei einem Rebuild frisch geholt, nie reused.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dedupeUpdates } from "./feed-merge.mjs";

const OUT = new URL("../releases.json", import.meta.url);
const cfgSrc = readFileSync(new URL("../config.js", import.meta.url), "utf8");
const ARTIST = (cfgSrc.match(/deezerArtistId:\s*"(\d+)"/) || [])[1] || "";
const LIMIT = Number((cfgSrc.match(/limit:\s*(\d+)/) || [])[1] || 24);
const YT = (cfgSrc.match(/youtubeChannelId:\s*"([\w-]+)"/) || [])[1] || "";
const SC_USER = (cfgSrc.match(/soundcloudUserId:\s*"(\d+)"/) || [])[1] || "";
const SP_ARTIST = (cfgSrc.match(/spotifyArtistId:\s*"([A-Za-z0-9]+)"/) || [])[1] || "";

// Preview-Token-Auffrischung: auch ohne Katalog-Änderung spätestens nach 12h
// neu bauen, damit gebackene Deezer-Preview-URLs nicht ablaufen.
const REFRESH_MS = 12 * 60 * 60 * 1000;

async function dz(path) {
  const res = await fetch("https://api.deezer.com" + path);
  if (!res.ok) throw new Error(path + " → HTTP " + res.status);
  const json = await res.json();
  if (json && json.error) throw new Error(path + " → " + JSON.stringify(json.error));
  return json;
}

// ---- Vorigen Stand lesen (für Short-Circuit + Track-Reuse-Vermeidung) ----
let prev = null;
try { prev = JSON.parse(readFileSync(OUT, "utf8")); } catch { /* erster Lauf */ }

// ---- Billiger Pass: Deezer Album-METADATEN (1 Call, keine Tracks) -------
let albMeta = [];
try {
  if (!ARTIST) throw new Error("no deezerArtistId");
  const resp = await dz(`/artist/${ARTIST}/albums?limit=${LIMIT}`);
  albMeta = (resp.data || []).slice().sort((a, b) =>
    String(b.release_date || "").localeCompare(String(a.release_date || "")));
} catch (e) { console.warn("Deezer (meta) skipped:", String(e)); }

// ---- Updates: YouTube + SoundCloud + Spotify ----------------------------
// Jede Quelle ist unabhängig und failure-guarded. WICHTIG: schlägt eine Quelle
// fehl ODER liefert sie (transient) 0 Einträge, übernehmen wir ihre Einträge
// aus dem vorigen Stand ("carry-forward"). Das verhindert das Flattern der
// updates-Liste (12→6→12 …), das sonst dazu führte, dass dieselben Tracks bei
// jedem Wiederauftauchen erneut nach Telegram announced wurden.
const prevUpdates = prev && Array.isArray(prev.updates) ? prev.updates : [];

async function source(platform, fn) {
  let items = null;
  try { items = await fn(); }
  catch (e) { console.warn(`${platform} failed: ${String(e)}`); }
  if (!items || items.length === 0) {
    const carried = prevUpdates.filter((u) => u.platform === platform);
    if (carried.length) {
      console.warn(`${platform}: carrying over ${carried.length} previous item(s).`);
      return carried;
    }
    return [];
  }
  console.log(`${platform}: ${items.length} item(s).`);
  return items;
}

// YouTube uploads (RSS, kein Key)
const ytUpdates = await source("YouTube", async () => {
  if (!YT) throw new Error("no youtubeChannelId");
  const res = await fetch("https://www.youtube.com/feeds/videos.xml?channel_id=" + YT);
  if (!res.ok) throw new Error("YT RSS HTTP " + res.status);
  const xml = await res.text();
  const out = [];
  for (const e of xml.split("<entry>").slice(1, 7)) {
    const title = (e.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
    const link = (e.match(/<link rel="alternate" href="([^"]+)"/) || [])[1] || "";
    const pub = (e.match(/<published>([^<]+)<\/published>/) || [])[1] || "";
    const text = title.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    if (text && link) out.push({ date: pub.slice(0, 10), platform: "YouTube", text, url: link });
  }
  return out;
});

// SoundCloud uploads (OAuth client_credentials — stateless app token)
const scUpdates = await source("SoundCloud", async () => {
  const cid = process.env.SC_CLIENT_ID, csec = process.env.SC_CLIENT_SECRET;
  if (!SC_USER) throw new Error("no soundcloudUserId");
  if (!cid || !csec) throw new Error("no SC creds (SC_CLIENT_ID/SECRET)");
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
  const out = [];
  for (const t of coll.slice(0, 8)) {
    const url = String(t.permalink_url || "").split("?")[0];
    const name = t.title || "";
    if (!name || !url) continue;
    out.push({
      date: String(t.created_at || "").slice(0, 10).replace(/\//g, "-"),
      platform: "SoundCloud", text: name, url,
      // 500px artwork so the site can render SC-only uploads as catalog cards
      artwork: t.artwork_url ? String(t.artwork_url).replace("-large.", "-t500x500.") : ""
    });
  }
  return out;
});

// Spotify releases (client_credentials — braucht Premium-Account, sonst 403)
const spUpdates = await source("Spotify", async () => {
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
  const out = [];
  for (const al of items) {
    const url = al.external_urls?.spotify || "";
    const name = al.name || "";
    if (!name || !url) continue;
    out.push({ date: (al.release_date || "").slice(0, 10), platform: "Spotify", text: name, url });
  }
  return out;
});

// Cross-Source-Dedup + Album-Filter + neueste-zuerst, auf 20 begrenzt
// (deterministisch für den Fingerprint). Siehe tools/feed-merge.mjs.
const updates = dedupeUpdates([ytUpdates, scUpdates, spUpdates], albMeta.map((a) => a.title), 20);

// ---- Fingerprint aus stabilen Feldern, die der billige Pass kennt --------
// Nur Felder aus /artist/{id}/albums (KEIN nb_tracks — das gibt's nur im
// vollen Album-Objekt) + ohne generated/Preview-Tokens. Reihenfolge-
// unabhängig, weil Deezer gleich-datierte Alben mal so, mal so liefert.
function fingerprint(metaList, ups) {
  const norm = (v) => String(v == null ? "" : v);
  const a = metaList
    .map((x) => [norm(x.id), norm(x.title), norm(x.release_date), norm(x.record_type)])
    .sort((p, q) => p[0].localeCompare(q[0]));
  const u = ups
    .map((x) => [norm(x.platform), norm(x.text), norm(x.url), norm(x.date), norm(x.artwork)])
    .sort((p, q) => (p[2] + p[1]).localeCompare(q[2] + q[1]));
  return JSON.stringify({ a, u });
}
const freshFp = fingerprint(albMeta, updates);
const prevFp = prev ? fingerprint(prev.albums || [], prev.updates || []) : null;
const prevAge = prev && prev.generated ? Date.now() - Date.parse(prev.generated) : Infinity;

// Short-Circuit: nichts Bedeutsames geändert + Previews frisch → nichts tun.
// (Datei bleibt unangetastet → git diff quiet → kein Commit/Deploy/Notify.)
if (prev && freshFp === prevFp && prevAge < REFRESH_MS && albMeta.length) {
  console.log("No meaningful change + previews fresh — feed unchanged (skip rebuild/deploy).");
  process.exit(0);
}

// ---- Voller Rebuild: Per-Album-Tracks holen (frische Preview-Tokens) -----
let albums = [];
for (const al of albMeta) {
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
    release_date: al.release_date || "",
    nb_tracks: al.nb_tracks != null ? al.nb_tracks : tracks.length,
    tracks
  });
}

// Deezer komplett tot, aber alter Stand vorhanden? Dann alten Katalog behalten
// (nur Updates auffrischen) statt die Seite leer zu schießen.
if (!albums.length && prev && (prev.albums || []).length) {
  albums = prev.albums;
  console.warn("Deezer empty — keeping previous albums, refreshing updates only.");
}

const out = {
  generated: new Date().toISOString(),
  artist: ARTIST,
  count: albums.length,
  albums,
  updates
};
writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote releases.json — ${albums.length} releases, ${updates.length} updates.`);
