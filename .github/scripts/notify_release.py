#!/usr/bin/env python3
"""Postet Release- & Update-Änderungen aus releases.json nach Telegram.

Läuft als Step in feed.yml — NACH dem Deezer-Build, VOR dem Commit. Dann gilt:
HEAD:releases.json = alter committeter Stand, ./releases.json = neu gebaut.
Vergleicht beide und postet pro Änderung eine Nachricht in den NULLTAG-Channel.

releases.json-Struktur (Objekt):
  { "generated": ISO, "artist": id, "count": int,
    "albums":  [ {id, title, link, cover, record_type, release_date, tracks[]} ],
    "updates": [ {date, platform, text, url} ] }

Diffing läuft pro albums-`id` bzw. pro update-Key — NICHT über die ganze Datei
(das `generated`-Feld wechselt bei jedem Build und würde sonst Falschalarm geben).

stdlib-only (urllib/json/subprocess) — keine Dependencies, kein pip-Step nötig.
"""

import json
import os
import subprocess
import sys
import urllib.parse
import urllib.request
from html import escape

RELEASES_FILE = "releases.json"
API = "https://api.telegram.org/bot{token}/{method}"

# Album-Felder, deren Änderung einen "✏️ geändert"-Post auslöst.
TRACKED_FIELDS = ("title", "record_type", "release_date")


def load_current():
    with open(RELEASES_FILE, encoding="utf-8") as fh:
        return json.load(fh)


def load_previous():
    """Holt den alten (committeten) releases.json-Stand zum Diffen. None = kein Baseline.

    Im feed.yml-Kontext (vor dem Commit) ist HEAD der alte Stand. BASELINE_REF
    überschreibbar (Default HEAD).
    """
    candidates = [os.environ.get("BASELINE_REF", "").strip(), "HEAD", "HEAD~1"]
    for ref in candidates:
        if not ref or set(ref) <= {"0"}:  # leer oder all-zero (neuer Branch)
            continue
        try:
            raw = subprocess.run(
                ["git", "show", f"{ref}:{RELEASES_FILE}"],
                capture_output=True, text=True, check=True,
            ).stdout
            return json.loads(raw)
        except (subprocess.CalledProcessError, json.JSONDecodeError):
            continue
    return None


def extract_albums(data):
    if isinstance(data, dict):
        return data.get("albums") or []
    return data if isinstance(data, list) else []  # Backward-Compat: Top-Level-Array


def extract_updates(data):
    return data.get("updates") or [] if isinstance(data, dict) else []


def albums_by_id(albums):
    return {str(a.get("id")): a for a in albums if a.get("id") is not None}


def update_key(u):
    return u.get("url") or f"{u.get('date')}|{u.get('platform')}|{u.get('text')}"


def fmt_date(iso):
    parts = (iso or "").split("-")
    return f"{parts[2]}.{parts[1]}.{parts[0]}" if len(parts) == 3 else (iso or "")


def label(rec_type):
    return {"album": "Album", "ep": "EP", "single": "Single"}.get(
        (rec_type or "").lower(), (rec_type or "Release").title()
    )


def caption(rel):
    title = escape(str(rel.get("title", "Unbekannt")))
    n = len(rel.get("tracks") or [])
    track_str = f"{n} Track{'s' if n != 1 else ''}"
    meta = f"{label(rel.get('record_type'))} · {track_str} · {fmt_date(rel.get('release_date'))}"
    link = rel.get("link")
    lines = [f"<b>{title}</b>", meta]
    if link:
        lines.append(f'🎧 <a href="{escape(link, quote=True)}">Jetzt hören</a>')
    return "\n".join(lines)


def changed_fields(old, new):
    diffs = []
    for f in TRACKED_FIELDS:
        if old.get(f) != new.get(f):
            diffs.append((f, old.get(f), new.get(f)))
    old_n, new_n = len(old.get("tracks") or []), len(new.get("tracks") or [])
    if old_n != new_n:
        diffs.append(("tracks", old_n, new_n))
    return diffs


def telegram(method, params):
    token = os.environ["TELEGRAM_TOKEN"]
    data = urllib.parse.urlencode(params).encode()
    url = API.format(token=token, method=method)
    req = urllib.request.Request(url, data=data)
    with urllib.request.urlopen(req, timeout=20) as resp:
        body = json.loads(resp.read().decode())
    if not body.get("ok"):
        raise RuntimeError(f"Telegram {method} fehlgeschlagen: {body}")


def send_new(chat, rel):
    cover = rel.get("cover")
    cap = "🆕 <b>Neues Release</b>\n" + caption(rel)
    if cover:
        telegram("sendPhoto", {"chat_id": chat, "photo": cover,
                               "caption": cap, "parse_mode": "HTML"})
    else:
        telegram("sendMessage", {"chat_id": chat, "text": cap,
                                 "parse_mode": "HTML"})


def send_changed(chat, old, new, diffs):
    names = {"title": "Titel", "record_type": "Typ",
             "release_date": "Datum", "tracks": "Track-Anzahl"}
    lines = ["✏️ <b>Release aktualisiert</b>", f"<b>{escape(str(new.get('title','')))}</b>"]
    for f, o, n in diffs:
        ov = fmt_date(o) if f == "release_date" else o
        nv = fmt_date(n) if f == "release_date" else n
        lines.append(f"· {names.get(f, f)}: {escape(str(ov))} → {escape(str(nv))}")
    link = new.get("link")
    if link:
        lines.append(f'🎧 <a href="{escape(link, quote=True)}">Anhören</a>')
    telegram("sendMessage", {"chat_id": chat, "text": "\n".join(lines),
                             "parse_mode": "HTML"})


def send_removed(chat, rel):
    text = (f"🗑️ <b>Release entfernt</b>\n<b>{escape(str(rel.get('title','')))}</b>"
            f"\n({label(rel.get('record_type'))})")
    telegram("sendMessage", {"chat_id": chat, "text": text, "parse_mode": "HTML"})


def send_update(chat, u):
    platform = escape(str(u.get("platform", "")))
    text = escape(str(u.get("text", "")))
    lines = [f"🔔 <b>Update — {platform}</b>", text, fmt_date(u.get("date"))]
    url = u.get("url")
    if url:
        lines.append(f'🔗 <a href="{escape(url, quote=True)}">Ansehen</a>')
    telegram("sendMessage", {"chat_id": chat, "text": "\n".join(lines),
                             "parse_mode": "HTML"})


def main():
    chat = os.environ.get("TELEGRAM_CHAT_ID")
    if not chat or not os.environ.get("TELEGRAM_TOKEN"):
        print("::error::TELEGRAM_TOKEN / TELEGRAM_CHAT_ID fehlen.")
        return 1

    current = load_current()
    previous = load_previous()
    if previous is None:
        print("::notice::Kein Baseline-Stand (erster Lauf) — kein Post.")
        return 0

    cur_albums = albums_by_id(extract_albums(current))
    prev_albums = albums_by_id(extract_albums(previous))
    cur_updates = {update_key(u): u for u in extract_updates(current)}
    prev_update_keys = {update_key(u) for u in extract_updates(previous)}

    added = [cur_albums[i] for i in cur_albums if i not in prev_albums]
    removed = [prev_albums[i] for i in prev_albums if i not in cur_albums]
    modified = [(prev_albums[i], cur_albums[i]) for i in cur_albums if i in prev_albums]
    new_updates = [cur_updates[k] for k in cur_updates if k not in prev_update_keys]

    errors = 0
    posted = 0

    def attempt(fn, what, *args):
        nonlocal errors, posted
        try:
            fn(chat, *args)
            posted += 1
            print(f"[{what}]")
        except Exception as e:  # noqa: BLE001 — eine Nachricht darf den Rest nicht killen
            errors += 1
            print(f"::error::Post ({what}) fehlgeschlagen: {e}")

    for rel in added:
        attempt(send_new, f"neu: {rel.get('title')}", rel)
    for old, new in modified:
        diffs = changed_fields(old, new)
        if diffs:
            attempt(send_changed, f"geändert: {new.get('title')}", old, new, diffs)
    for rel in removed:
        attempt(send_removed, f"entfernt: {rel.get('title')}", rel)
    for u in new_updates:
        attempt(send_update, f"update: {u.get('text')}", u)

    if posted == 0 and errors == 0:
        print("::notice::releases.json geändert, aber keine relevante Diff — kein Post.")

    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
