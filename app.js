/*
 * NULLTAG · music.nulltag.ch
 * Renders the page from window.CONFIG (config.js). No build step, no deps.
 * Catalog + player pull live from Deezer (releases.json → JSONP fallback).
 */
(function () {
  "use strict";

  var C = window.CONFIG || {};
  var profile = C.profile || {};

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (attrs[k] != null) node.setAttribute(k, attrs[k]);
    });
    if (text != null) node.textContent = text;
    return node;
  }
  function byId(id) { return document.getElementById(id); }
  function isPlaceholder(u) { return !u || u === "#"; }

  // ---- Sticky nav ----------------------------------------------------------
  var nav = byId("nav");
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("nav--scrolled", window.scrollY > 40);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // ---- Deterministic starfields -------------------------------------------
  function starfield(svg, seed, count, w, h, biasCenter) {
    if (!svg) return;
    var s = seed >>> 0;
    function rng() { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; }
    var ns = "http://www.w3.org/2000/svg";
    for (var i = 0; i < count; i++) {
      var x = rng(), y = rng();
      if (biasCenter) {
        var dx = x - 0.5, dy = y - 0.5;
        if (Math.sqrt(dx * dx + dy * dy) < 0.22 && rng() < 0.85) { x = rng(); y = rng(); }
      }
      var c = document.createElementNS(ns, "circle");
      c.setAttribute("cx", (x * w).toFixed(1));
      c.setAttribute("cy", (y * h).toFixed(1));
      c.setAttribute("r", (0.4 + rng() * 1.5).toFixed(2));
      c.setAttribute("fill", "#f8e8d4");
      c.setAttribute("opacity", (0.15 + rng() * 0.5).toFixed(2));
      svg.appendChild(c);
    }
  }
  // ---- Hero · BISECT background --------------------------------------------
  // Faint deterministic star dust (SVG); the rotating bisect disc, orbital
  // TIEFROT pin and shockwave rings are pure CSS (frozen under reduced-motion).
  starfield(byId("hero-stars"), 31, 70, 1440, 810, true);

  // ---- Hero · background SoundCloud player --------------------------------
  // Nothing loads from SoundCloud until the visitor interacts (browser
  // autoplay policy + our no-third-party-before-consent posture). First
  // gesture (or the ▶ button) loads a hidden widget; a slim NOW PLAYING
  // strip reflects state.
  (function scPlayer() {
    var wrap = byId("hero-sc");
    if (!wrap) return;
    var stEl = byId("sc-state"), trEl = byId("sc-track"), tg = byId("sc-toggle"),
        pulse = byId("sc-pulse"), fill = byId("sc-fill");
    var scUrl = "https://soundcloud.com/nulltag";
    (C.streaming || []).concat(C.social || []).forEach(function (i) {
      if (/soundcloud/i.test(i.label || "") && i.url && i.url !== "#") scUrl = i.url;
    });
    var widget = null, loaded = false, playing = false;

    function setState(txt, on) {
      if (stEl) stEl.textContent = txt;
      if (pulse) pulse.setAttribute("data-on", on ? "1" : "0");
      if (tg) { tg.textContent = on ? "❚❚" : "▶"; tg.setAttribute("aria-label", on ? "Pause" : "Play"); }
    }
    function bind() {
      if (!window.SC || !window.SC.Widget) return;
      var ifr = byId("sc-frame");
      widget = window.SC.Widget(ifr);
      var E = window.SC.Widget.Events, tick = false;
      function sound() {
        widget.getCurrentSound(function (s) { if (s && trEl) trEl.textContent = s.title || "NULLTAG · SOUNDCLOUD"; });
      }
      widget.bind(E.READY, function () { sound(); widget.play(); setState("CUED", false); });
      widget.bind(E.PLAY, function () { playing = true; setState("NOW PLAYING", true); sound(); });
      widget.bind(E.PAUSE, function () { playing = false; setState("PAUSED", false); });
      widget.bind(E.FINISH, function () { playing = false; setState("PAUSED", false); });
      widget.bind(E.PLAY_PROGRESS, function (e) {
        if (tick) return; tick = true;
        requestAnimationFrame(function () {
          if (fill) fill.style.width = ((e.relativePosition || 0) * 100).toFixed(2) + "%";
          tick = false;
        });
      });
    }
    function load() {
      if (loaded) return;
      loaded = true;
      setState("LOADING", false);
      var u = encodeURIComponent(scUrl);
      var ifr = el("iframe", {
        id: "sc-frame", title: "NULLTAG audio (hidden)", allow: "autoplay",
        tabindex: "-1", "aria-hidden": "true",
        src: "https://w.soundcloud.com/player/?url=" + u +
          "&auto_play=true&hide_related=true&show_comments=false&show_user=false" +
          "&show_reposts=false&show_teaser=false&visual=false&buying=false" +
          "&liking=false&sharing=false&download=false&single_active=true"
      });
      ifr.style.cssText = "position:absolute;width:1px;height:1px;opacity:0;border:0;left:-9999px;top:-9999px;pointer-events:none";
      wrap.appendChild(ifr);
      if (window.SC && window.SC.Widget) { bind(); return; }
      var sc = el("script", { src: "https://w.soundcloud.com/player/api.js" });
      sc.onload = bind;
      sc.onerror = function () { setState("OPEN ON SOUNDCLOUD ↗", false); };
      document.head.appendChild(sc);
    }
    function kick() {
      document.removeEventListener("pointerdown", kick, true);
      document.removeEventListener("keydown", kick, true);
      if (widget) { try { widget.play(); } catch (e) {} }
      else load();
    }
    // Autostart: load the widget + attempt playback immediately. Browsers
    // that block autoplay-with-sound will start on the visitor's first
    // interaction (the strip shows the state meanwhile).
    load();
    document.addEventListener("pointerdown", kick, true);
    document.addEventListener("keydown", kick, true);
    if (tg) tg.addEventListener("click", function (e) {
      e.stopPropagation();
      if (!loaded) { load(); return; }
      if (!widget) return;
      if (playing) widget.pause(); else widget.play();
    });
  })();

  // ---- Hero + footer copy --------------------------------------------------
  if (profile.tagline) {
    var ht = byId("hero-tagline");
    if (ht) ht.textContent = profile.tagline;
  }
  var yr = byId("year");
  if (yr) yr.textContent = new Date().getFullYear();
  var fn = byId("footer-name");
  if (fn) fn.textContent = profile.name || "NULLTAG";

  // ---- §01 Latest (pinned release from config) -----------------------------
  (function latest() {
    var r = C.latestRelease || {};
    if (r.show === false) return;
    var cover = byId("latest-cover");
    if (cover && r.artwork) { cover.src = r.artwork; cover.alt = (r.title || "") + " cover art"; }
    var t = byId("latest-title"); if (t) t.textContent = r.title || "—";
    var sub = byId("latest-sub"); if (sub) sub.textContent = r.subtitle || "";
    var eye = byId("latest-eyebrow"); if (eye) eye.textContent = "NULLTAG · " + (r.subtitle || "RELEASE");
    var rail = byId("latest-railmeta"); if (rail) rail.textContent = (r.subtitle || "RELEASE").toUpperCase();
    var hl = byId("hero-latest"); if (hl) hl.textContent = (r.title || "—").toUpperCase();

    // Technical meta strip — only fields that are actually set (no fakes).
    var metaEl = byId("latest-meta");
    if (metaEl) {
      var m = r.meta || {};
      var order = [
        ["cat", "CAT"], ["bpm", "BPM"], ["key", "KEY"], ["duration", "DUR"],
        ["format", "FMT"], ["isrc", "ISRC"], ["year", "YEAR"], ["schiene", "RAIL"]
      ];
      var shown = 0;
      order.forEach(function (pair) {
        var v = m[pair[0]];
        if (!v) return;
        var cell = el("div");
        cell.appendChild(el("span", { class: "k" }, pair[1]));
        cell.appendChild(el("span", { class: "v" },
          pair[0] === "schiene" ? String(v).toUpperCase() : String(v)));
        metaEl.appendChild(cell);
        shown++;
      });
      if (!shown) metaEl.setAttribute("hidden", "");
    }

    // Tag chips.
    var tagsEl = byId("latest-tags");
    if (tagsEl) {
      var tags = r.tags || [];
      if (!tags.length) tagsEl.setAttribute("hidden", "");
      else tags.forEach(function (tg) {
        tagsEl.appendChild(el("span", { class: "tag" }, String(tg)));
      });
    }

    var actions = byId("latest-actions");
    if (actions) {
      if (!isPlaceholder(r.listenUrl)) {
        var primary = el("a", {
          class: "btn btn--primary", href: r.listenUrl,
          target: "_blank", rel: "noopener noreferrer"
        }, "▶ " + (r.ctaLabel || "LISTEN").toUpperCase());
        actions.appendChild(primary);
      }
      (C.streaming || []).slice(0, 4).forEach(function (s) {
        if (isPlaceholder(s.url)) return;
        actions.appendChild(el("a", {
          class: "btn", href: s.url, target: "_blank", rel: "noopener noreferrer"
        }, s.label.toUpperCase()));
      });
    }
  })();

  // ---- §05 Channels (from config connectors) -------------------------------
  (function channels() {
    var wrap = byId("channels");
    if (!wrap) return;
    var seen = {};
    var list = [];
    (C.streaming || []).concat(C.social || []).forEach(function (item) {
      if (isPlaceholder(item.url) || seen[item.url]) return;
      seen[item.url] = 1;
      var handle = item.url;
      try {
        var u = new URL(item.url);
        handle = u.hostname.replace(/^www\./, "") + (u.pathname !== "/" ? u.pathname : "");
        handle = handle.replace(/\/$/, "");
        if (handle.length > 30) handle = handle.slice(0, 29) + "…";
      } catch (e) {}
      list.push({ name: item.label, handle: handle, url: item.url });
    });

    list.forEach(function (c, i) {
      var row = el("a", {
        class: "channel-row", href: c.url, target: "_blank", rel: "noopener noreferrer"
      });
      row.appendChild(el("span", { class: "channel-idx" }, (i + 1 < 10 ? "0" : "") + (i + 1)));
      row.appendChild(el("span", { class: "channel-name" }, c.name));
      row.appendChild(el("span", { class: "channel-handle" }, c.handle));
      row.appendChild(el("span", { class: "channel-arrow", "aria-hidden": "true" }, "→"));
      wrap.appendChild(row);
    });

    var right = byId("channels-right");
    if (right) right.textContent =
      (list.length < 10 ? "0" : "") + list.length + " PLATFORMS";

    var fc = byId("footer-channels");
    if (fc) list.forEach(function (c) {
      fc.appendChild(el("a", {
        href: c.url, target: "_blank", rel: "noopener noreferrer"
      }, c.name));
    });
  })();

  // ---- §03 Updates (config + auto YouTube uploads from the feed) -----------
  var feedUpdates = [];
  function renderUpdates() {
    var wrap = byId("updates-list");
    var section = byId("updates");
    if (!wrap) return;
    var seen = {};
    var list = (C.updates || []).concat(feedUpdates).filter(function (u) {
      if (!u || (!u.text && !u.title)) return false;
      var key = (u.url || "") + "|" + (u.text || u.title);
      if (seen[key]) return false;
      seen[key] = 1;
      return true;
    }).sort(function (a, b) {
      return String(b.date || "").localeCompare(String(a.date || ""));
    });

    if (!list.length) { if (section) section.setAttribute("hidden", ""); return; }
    if (section) section.removeAttribute("hidden");
    wrap.textContent = "";
    list.forEach(function (u) {
      var hasUrl = u.url && u.url !== "#";
      var row = el(hasUrl ? "a" : "div", {
        class: "update-row",
        href: hasUrl ? u.url : null,
        target: hasUrl ? "_blank" : null,
        rel: hasUrl ? "noopener noreferrer" : null
      });
      row.appendChild(el("span", { class: "update-date" }, u.date || ""));
      row.appendChild(el("span", { class: "update-tag" }, (u.platform || "NEWS").toUpperCase()));
      row.appendChild(el("span", { class: "update-text" }, u.text || u.title || ""));
      if (hasUrl) row.appendChild(el("span", { class: "update-arrow", "aria-hidden": "true" }, "→"));
      wrap.appendChild(row);
    });
    var right = byId("updates-right");
    if (right) right.textContent = list.length + " ENTRIES";
  }
  renderUpdates();

  // ---- §04 Upcoming projects ----------------------------------------------
  (function upcoming() {
    var wrap = byId("upcoming-list");
    var section = byId("upcoming");
    if (!wrap) return;
    var list = C.upcoming || [];
    if (!list.length) { if (section) section.setAttribute("hidden", ""); return; }
    list.forEach(function (p, i) {
      var row = el("div", { class: "upcoming-row" });
      row.appendChild(el("span", { class: "upcoming-idx" }, (i + 1 < 10 ? "0" : "") + (i + 1)));
      var body = el("div", { class: "upcoming-body" });
      body.appendChild(el("div", { class: "upcoming-title" }, p.title || "Untitled"));

      if (p.status || p.schiene) {
        var meta = el("div", { class: "upcoming-meta" });
        if (p.status) meta.appendChild(el("span", { class: "upcoming-status" }, p.status.toUpperCase()));
        if (p.schiene) meta.appendChild(el("span", { class: "upcoming-schiene" }, p.schiene.toUpperCase()));
        body.appendChild(meta);
      }
      if (p.note) body.appendChild(el("div", { class: "upcoming-note" }, p.note));
      if (p.link && p.link !== "#") {
        body.appendChild(el("a", {
          class: "upcoming-link", href: p.link,
          target: "_blank", rel: "noopener noreferrer"
        }, "More info ↗"));
      }
      row.appendChild(body);
      row.appendChild(el("span", { class: "upcoming-eta" }, (p.eta || "TBA").toUpperCase()));
      wrap.appendChild(row);
    });
    var right = byId("upcoming-right");
    if (right) right.textContent = list.length + " IN PIPELINE";
  })();

  // ---- §02 Catalog feed + interactive player -------------------------------
  // Pulled live from Deezer (no key, no CORS). Progressive enhancement:
  // failure simply leaves the catalog empty + status hidden; the pinned
  // release above always stands on its own.

  var jsonpN = 0;
  function jsonp(url, onData, onErr, timeoutMs) {
    var name = "__nt" + (++jsonpN) + "_" + Date.now();
    var sep = url.indexOf("?") < 0 ? "?" : "&";
    var script = el("script", { src: url + sep + "output=jsonp&callback=" + name });
    var done = false;
    function clean() {
      try { delete window[name]; } catch (e) { window[name] = undefined; }
      if (script.parentNode) script.parentNode.removeChild(script);
    }
    function fail() { if (done) return; done = true; clean(); if (onErr) onErr(); }
    window[name] = function (d) { if (done) return; done = true; clean(); onData(d); };
    script.onerror = fail;
    setTimeout(fail, timeoutMs || 9000);
    document.head.appendChild(script);
  }

  function fmtTime(s) {
    s = Math.max(0, Math.floor(s || 0));
    var m = Math.floor(s / 60), r = s % 60;
    return m + ":" + (r < 10 ? "0" : "") + r;
  }

  function loadCatalog() {
    var cfg = C.releases || {};
    var grid = byId("releases-grid");
    var status = byId("releases-status");
    var albumView = byId("album-view");
    if (!grid || !albumView) return;
    var hc0 = byId("hero-catalog"); if (hc0) hc0.textContent = "LIVE";
    if (cfg.show === false || cfg.source !== "deezer" || !cfg.deezerArtistId) {
      grid.setAttribute("hidden", "");
      if (status) status.setAttribute("hidden", "");
      return;
    }

    // -- Audio engine --
    var audio = new Audio();
    audio.preload = "none";
    var queue = [], qi = -1, curAlbumTitle = "";
    var pl = byId("player");
    var plCover = byId("pl-cover"), plTitle = byId("pl-title"), plAlbum = byId("pl-album");
    var plToggle = byId("pl-toggle"), plPrev = byId("pl-prev"), plNext = byId("pl-next");
    var plSeek = byId("pl-seek"), plTime = byId("pl-time");
    var seeking = false;
    function noop() {}

    function markRows() {
      var rows = document.querySelectorAll(".track");
      Array.prototype.forEach.call(rows, function (row) {
        var i = parseInt(row.getAttribute("data-i"), 10);
        var on = i === qi;
        row.classList.toggle("is-playing", on);
        if (on) row.setAttribute("aria-current", "true");
        else row.removeAttribute("aria-current");
        var b = row.querySelector(".tk-play");
        if (b) b.textContent = (on && !audio.paused) ? "⏸" : "▶";
      });
    }
    function reflect() {
      var playing = !audio.paused && !audio.ended;
      plToggle.textContent = playing ? "⏸" : "▶";
      plToggle.setAttribute("aria-label", playing ? "Pause" : "Play");
      markRows();
    }
    function playIndex(i) {
      if (i < 0 || i >= queue.length) return;
      var t = queue[i];
      if (!t || !t.preview) return;
      qi = i;
      audio.src = t.preview;
      var p = audio.play(); if (p && p.catch) p.catch(noop);
      plCover.src = t.cover || "";
      plTitle.textContent = t.title || "—";
      plAlbum.textContent = curAlbumTitle;
      pl.removeAttribute("hidden");
      document.body.classList.add("player-open");
      reflect();
    }
    audio.addEventListener("ended", function () {
      if (qi + 1 < queue.length && queue[qi + 1].preview) playIndex(qi + 1);
      else reflect();
    });
    audio.addEventListener("play", reflect);
    audio.addEventListener("pause", reflect);
    audio.addEventListener("timeupdate", function () {
      if (seeking || !audio.duration) return;
      plSeek.value = String(Math.round((audio.currentTime / audio.duration) * 1000));
      plTime.textContent = fmtTime(audio.currentTime) + " / " + fmtTime(audio.duration);
    });
    plToggle.addEventListener("click", function () {
      if (audio.paused) { var p = audio.play(); if (p && p.catch) p.catch(noop); }
      else audio.pause();
    });
    plPrev.addEventListener("click", function () { playIndex(qi - 1); });
    plNext.addEventListener("click", function () { playIndex(qi + 1); });
    plSeek.addEventListener("input", function () {
      seeking = true;
      if (audio.duration) plTime.textContent =
        fmtTime((plSeek.value / 1000) * audio.duration) + " / " + fmtTime(audio.duration);
    });
    plSeek.addEventListener("change", function () {
      if (audio.duration) audio.currentTime = (plSeek.value / 1000) * audio.duration;
      seeking = false;
    });

    byId("album-back").addEventListener("click", function () {
      albumView.setAttribute("hidden", "");
      grid.removeAttribute("hidden");
    });

    function coverOf(al) {
      return al.cover || al.cover_xl || al.cover_big || al.cover_medium || al.cover_small || "";
    }

    function renderAlbum(al, tracks) {
      if (!tracks || !tracks.length) {
        if (al.link) window.open(al.link, "_blank", "noopener");
        return;
      }
      var cover = coverOf(al);
      curAlbumTitle = al.title || "";
      queue = tracks.map(function (t) {
        return { title: t.title, preview: t.preview || "", duration: t.duration || 0, cover: cover };
      });
      var cEl = byId("album-cover");
      cEl.src = cover; cEl.alt = curAlbumTitle + " cover art";
      byId("album-title").textContent = curAlbumTitle;
      byId("album-meta").textContent =
        (al.record_type || "release").toUpperCase() +
        ((al.release_date || "").slice(0, 4) ? " · " + al.release_date.slice(0, 4) : "") +
        " · " + tracks.length + " track" + (tracks.length === 1 ? "" : "s");
      var alink = byId("album-link");
      if (al.link) { alink.href = al.link; alink.removeAttribute("hidden"); }
      else alink.setAttribute("hidden", "");

      var ol = byId("tracklist");
      ol.textContent = "";
      queue.forEach(function (t, i) {
        var li = el("li", {
          class: "track" + (t.preview ? "" : " track--np"), "data-i": String(i)
        });
        var play = el("button", {
          class: "tk-play", type: "button",
          "aria-label": t.preview ? ("Play " + t.title) : (t.title + " — no preview"),
          disabled: t.preview ? null : "disabled"
        }, "▶");
        li.appendChild(play);
        li.appendChild(el("span", { class: "tk-no" }, (i + 1 < 10 ? "0" : "") + (i + 1)));
        li.appendChild(el("span", { class: "tk-title" }, t.title || "Untitled"));
        li.appendChild(el("span", { class: "tk-dur" }, t.preview ? fmtTime(t.duration) : "—"));
        if (t.preview) {
          var go = function () { playIndex(i); };
          play.addEventListener("click", function (e) { e.stopPropagation(); go(); });
          li.addEventListener("click", go);
        }
        ol.appendChild(li);
      });

      grid.setAttribute("hidden", "");
      albumView.removeAttribute("hidden");
      var first = 0;
      while (first < queue.length && !queue[first].preview) first++;
      if (first < queue.length) playIndex(first);
    }

    function openAlbum(al) {
      var unlock = audio.play(); if (unlock && unlock.catch) unlock.catch(noop);
      if (al.tracks && al.tracks.length) { renderAlbum(al, al.tracks); return; }
      jsonp("https://api.deezer.com/album/" + encodeURIComponent(al.id),
        function (alb) {
          renderAlbum(al, alb && alb.tracks && alb.tracks.data ? alb.tracks.data : []);
        },
        function () { if (al.link) window.open(al.link, "_blank", "noopener"); },
        9000);
    }

    // ── Schiene (release-rail) lookup — config-driven, nothing invented ──
    var SCH = {};
    (C.schienen || []).forEach(function (s) { SCH[s.id] = s; });
    var SMAP = {};
    Object.keys(C.schieneMap || {}).forEach(function (k) {
      SMAP[String(k).trim().toLowerCase()] = String(C.schieneMap[k] || "").toLowerCase();
    });
    function schieneOf(title) {
      var id = SMAP[String(title || "").trim().toLowerCase()];
      return id && SCH[id] ? SCH[id] : null;
    }

    function applyFilter(id) {
      Array.prototype.forEach.call(grid.querySelectorAll(".release-card"), function (c) {
        c.style.display = (!id || c.getAttribute("data-schiene") === id) ? "" : "none";
      });
      Array.prototype.forEach.call(document.querySelectorAll("#filter-row .chip"), function (ch) {
        ch.classList.toggle("chip--on", ch.getAttribute("data-f") === (id || "all"));
      });
    }

    function buildSchieneFilter(list) {
      var fr = byId("filter-row");
      if (!fr) return;
      var present = (C.schienen || []).map(function (s) {
        return { s: s, n: list.filter(function (a) {
          var x = schieneOf(a.title); return x && x.id === s.id;
        }).length };
      }).filter(function (p) { return p.n > 0; });

      var all = byId("cat-all");
      if (all) {
        all.removeAttribute("disabled");
        all.setAttribute("data-f", "all");
        all.textContent = "ALL · " + (list.length < 10 ? "0" : "") + list.length;
        all.addEventListener("click", function () { applyFilter(null); });
      }
      if (!present.length) { fr.setAttribute("hidden", ""); return; }

      present.forEach(function (p) {
        var chip = el("button", {
          class: "chip", type: "button", "data-f": p.s.id,
          "aria-label": "Filter " + p.s.name
        });
        var dot = el("span", { class: "chip-dot" });
        dot.style.background = p.s.accent;
        chip.appendChild(dot);
        chip.appendChild(document.createTextNode(
          p.s.name + " · " + (p.n < 10 ? "0" : "") + p.n));
        chip.addEventListener("click", function () { applyFilter(p.s.id); });
        fr.appendChild(chip);
      });
      fr.removeAttribute("hidden");
    }

    function tagSchienenSection(list) {
      Array.prototype.forEach.call(document.querySelectorAll(".schiene-card"), function (card) {
        var nameEl = card.querySelector(".schiene-name");
        var cntEl = card.querySelector(".schiene-count");
        if (!nameEl || !cntEl) return;
        var nm = nameEl.textContent.trim().toUpperCase();
        var sid = null;
        (C.schienen || []).forEach(function (s) { if (s.name.toUpperCase() === nm) sid = s.id; });
        if (!sid) return;
        var n = list.filter(function (a) {
          var x = schieneOf(a.title); return x && x.id === sid;
        }).length;
        cntEl.textContent = n ? (n < 10 ? "0" : "") + n + " REL." : "RAIL";
      });
    }

    // §01 cover comes from the real release feed (config artwork is only
    // the offline fallback). Match the pinned title to a feed release,
    // else use the newest. Only the cover/alt is overridden — the curated
    // title/subtitle from config stay.
    function applyFeatured(sorted) {
      if (!sorted || !sorted.length) return;
      var want = String((C.latestRelease || {}).title || "")
        .toLowerCase().replace(/[^a-z0-9]/g, "");
      var pick = null;
      if (want) {
        pick = sorted.filter(function (a) {
          var t = String(a.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          return t && (t.indexOf(want) === 0 || want.indexOf(t) === 0);
        })[0] || null;
      }
      if (!pick) pick = sorted[0];
      var c = coverOf(pick);
      if (!c) return;
      var img = byId("latest-cover");
      if (img) {
        img.src = c;
        img.alt = ((C.latestRelease || {}).title || pick.title || "") + " cover art";
      }
      var hl = byId("hero-latest");
      if (hl) hl.textContent = String((C.latestRelease || {}).title || pick.title || "—").toUpperCase();
    }

    function renderGrid(albums) {
      var list = albums.slice().sort(function (a, b) {
        return String(b.release_date || "").localeCompare(String(a.release_date || ""));
      });
      applyFeatured(list);
      if (cfg.limit) list = list.slice(0, cfg.limit);

      list.forEach(function (al) {
        var cover = coverOf(al);
        var year = (al.release_date || "").slice(0, 4);
        var kind = (al.record_type || "release").toUpperCase();
        var sc = schieneOf(al.title);

        var card = el("button", {
          class: "release-card", type: "button",
          "aria-label": "Play " + (al.title || "release")
        });
        if (sc) card.setAttribute("data-schiene", sc.id);
        var cw = el("div", { class: "release-cover" });
        if (cover) cw.appendChild(el("img", {
          class: "rc-art", src: cover, alt: (al.title || "") + " cover art",
          loading: "lazy", width: "320", height: "320"
        }));
        cw.appendChild(el("span", { class: "release-cover-stamp" }, kind));
        cw.appendChild(el("span", { class: "rc-play", "aria-hidden": "true" }, "▶"));
        card.appendChild(cw);

        var meta = el("div", { class: "release-card-meta" });
        meta.appendChild(el("div", { class: "release-card-title" }, al.title || "Untitled"));
        var sub = el("div", { class: "release-card-sub" });
        if (sc) {
          var st = el("span", { class: "rc-schiene" });
          var d = el("span", { class: "rc-schiene-dot" });
          d.style.background = sc.accent;
          st.appendChild(d);
          st.appendChild(document.createTextNode(sc.name));
          sub.appendChild(st);
          sub.appendChild(el("span", { class: "meta-sep" }, "·"));
        }
        sub.appendChild(el("span", null, kind));
        if (year) {
          sub.appendChild(el("span", { class: "meta-sep" }, "·"));
          sub.appendChild(el("span", null, year));
        }
        meta.appendChild(sub);
        card.appendChild(meta);

        card.addEventListener("click", function () { openAlbum(al); });
        grid.appendChild(card);
      });

      grid.removeAttribute("hidden");
      var n = list.length;
      var nn = (n < 10 ? "0" : "") + n;
      if (status) {
        status.removeAttribute("hidden");
        status.textContent = "+ " + n + " more on Deezer · tap to play";
      }
      var hc = byId("hero-catalog"); if (hc) hc.textContent = nn + " REL.";
      buildSchieneFilter(list);
      tagSchienenSection(list);
    }

    // The Spotify embed above is the dependable, always-present catalog.
    // The Deezer grid is pure enrichment — if Deezer has nothing, just
    // keep it hidden (no redundant fallback; Listen § covers platforms).
    function fallbackListen() {
      grid.setAttribute("hidden", "");
      if (status) status.setAttribute("hidden", "");
    }

    function liveJsonp() {
      jsonp("https://api.deezer.com/artist/" + encodeURIComponent(cfg.deezerArtistId) +
            "/albums?limit=" + (cfg.limit || 24),
        function (resp) {
          if (resp && resp.data && resp.data.length) renderGrid(resp.data);
          else fallbackListen();
        },
        fallbackListen,
        9000);
    }

    if (window.fetch) {
      fetch("releases.json", { cache: "no-store" })
        .then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function (data) {
          if (data && data.updates && data.updates.length) {
            feedUpdates = data.updates; renderUpdates();
          }
          var albums = data && data.albums ? data.albums : [];
          if (albums.length) renderGrid(albums);
          else liveJsonp();
        })
        .catch(function () { liveJsonp(); });
    } else {
      liveJsonp();
    }
  }
  loadCatalog();

  // ---- Embed consent gate (CH/EU) -----------------------------------------
  // No third-party request to Apple/Spotify until the visitor opts in.
  // Choice is saved per device; returning visitors auto-load.
  (function embeds() {
    var KEY = "nt-embed-consent";
    var consented = false;
    try { consented = localStorage.getItem(KEY) === "1"; } catch (e) {}

    function activate(wrap) {
      var frame = wrap.querySelector("iframe[data-src]");
      if (frame && !frame.getAttribute("src")) {
        frame.setAttribute("src", frame.getAttribute("data-src"));
      }
      wrap.classList.add("embed-wrap--loaded");
    }
    function activateAll() {
      Array.prototype.forEach.call(document.querySelectorAll(".embed-wrap"), activate);
    }
    if (consented) { activateAll(); return; }
    Array.prototype.forEach.call(document.querySelectorAll(".embed-load"), function (btn) {
      btn.addEventListener("click", function () {
        try { localStorage.setItem(KEY, "1"); } catch (e) {}
        activateAll();
      });
    });
  })();

  // ---- §02 Player chooser — multiple ways to listen -----------------------
  (function playerPick() {
    var btns = document.querySelectorAll(".player-pick [data-pick]");
    if (!btns.length) return;
    function show(pick) {
      Array.prototype.forEach.call(document.querySelectorAll(".player-panel"), function (p) {
        var on = p.id === "pick-" + pick;
        if (on) p.removeAttribute("hidden"); else p.setAttribute("hidden", "");
      });
      Array.prototype.forEach.call(btns, function (b) {
        b.classList.toggle("pp-on", b.getAttribute("data-pick") === pick);
      });
    }
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener("click", function () { show(b.getAttribute("data-pick")); });
    });
  })();
})();
