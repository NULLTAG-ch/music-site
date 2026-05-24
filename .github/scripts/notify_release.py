#!/usr/bin/env python3
"""Postet Release-Änderungen aus releases.json in Echtzeit nach Telegram.

Läuft als GitHub-Action-Step (siehe ../workflows/telegram-notify.yml). Vergleicht
die aktuelle releases.json mit der Version vor dem Push und postet pro Änderung
eine Nachricht in den NULLTAG-Telegram-Channel.

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

# Felder, deren Änderung einen "✏️ geändert"-Post auslöst.
TRACKED_FIELDS = ("title", "record_type", "release_date")


def load_current():
    with open(RELEASES_FILE, encoding="utf-8") as fh:
        return json.load(fh)


def load_previous():
    """Holt die alte releases.json (committet) zum Diffen gegen den Working-Tree.

    Im feed.yml-Kontext läuft das Skript NACH dem Build, aber VOR dem Commit:
    HEAD = alte committete Version, ./releases.json = neu gebaute Version.
    BASELINE_REF überschreibbar (Default HEAD). None = kein Baseline.
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


def by_id(releases):
    return {str(r.get("id")): r for r in releases if r.get("id") is not None}


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
                                 "parse_mode": "HTML",
                                 "disable_web_page_preview": "false"})


def send_changed(chat, old, new, diffs):
    names = {"title": "Titel", "record_type": "Typ",
             "release_date": "Datum", "tracks": "Track-Anzahl"}
    lines = [f"✏️ <b>Release aktualisiert</b>", f"<b>{escape(str(new.get('title','')))}</b>"]
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


def main():
    chat = os.environ.get("TELEGRAM_CHAT_ID")
    if not chat or not os.environ.get("TELEGRAM_TOKEN"):
        print("::error::TELEGRAM_TOKEN / TELEGRAM_CHAT_ID fehlen.")
        return 1

    current = by_id(load_current())
    previous = load_previous()
    if previous is None:
        print("::notice::Kein Baseline-Stand (erster Lauf / Dispatch) — kein Post.")
        return 0
    previous = by_id(previous)

    added = [current[i] for i in current if i not in previous]
    removed = [previous[i] for i in previous if i not in current]
    modified = [(previous[i], current[i]) for i in current if i in previous]

    errors = 0
    for rel in added:
        try:
            send_new(chat, rel)
            print(f"[neu] {rel.get('title')}")
        except Exception as e:  # noqa: BLE001 — eine Nachricht darf den Rest nicht killen
            errors += 1
            print(f"::error::Post (neu) fehlgeschlagen für {rel.get('title')}: {e}")

    for old, new in modified:
        diffs = changed_fields(old, new)
        if not diffs:
            continue
        try:
            send_changed(chat, old, new, diffs)
            print(f"[geändert] {new.get('title')}: {[d[0] for d in diffs]}")
        except Exception as e:  # noqa: BLE001
            errors += 1
            print(f"::error::Post (geändert) fehlgeschlagen für {new.get('title')}: {e}")

    for rel in removed:
        try:
            send_removed(chat, rel)
            print(f"[entfernt] {rel.get('title')}")
        except Exception as e:  # noqa: BLE001
            errors += 1
            print(f"::error::Post (entfernt) fehlgeschlagen für {rel.get('title')}: {e}")

    if not (added or removed or any(changed_fields(o, n) for o, n in modified)):
        print("::notice::releases.json geändert, aber keine relevante Release-Diff — kein Post.")

    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
