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
  starfield(byId("hero-stars"), 2026, 90, 1600, 900, true);
  starfield(byId("avatar-stars"), 77, 40, 1000, 1000, true);
  starfield(byId("banner-stars"), 31, 46, 2480, 520, false);

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
    if (cfg.show === false || cfg.source !== "deezer" || !cfg.deezerArtistId) {
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

    function renderGrid(albums) {
      var list = albums.slice().sort(function (a, b) {
        return String(b.release_date || "").localeCompare(String(a.release_date || ""));
      });
      if (cfg.limit) list = list.slice(0, cfg.limit);

      list.forEach(function (al) {
        var cover = coverOf(al);
        var year = (al.release_date || "").slice(0, 4);
        var kind = (al.record_type || "release").toUpperCase();

        var card = el("button", {
          class: "release-card", type: "button",
          "aria-label": "Play " + (al.title || "release")
        });
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

      var n = list.length;
      var nn = (n < 10 ? "0" : "") + n;
      if (status) status.textContent = n + " release" + (n === 1 ? "" : "s") + " · tap to play";
      var hc = byId("hero-catalog"); if (hc) hc.textContent = nn + " REL.";
      var cr = byId("catalog-right"); if (cr) cr.textContent = nn + " RELEASES · MMXXVI";
      var all = byId("cat-all"); if (all) all.textContent = "ALL · " + nn;
    }

    function liveJsonp() {
      jsonp("https://api.deezer.com/artist/" + encodeURIComponent(cfg.deezerArtistId) +
            "/albums?limit=" + (cfg.limit || 24),
        function (resp) {
          if (resp && resp.data && resp.data.length) renderGrid(resp.data);
          else if (status) status.setAttribute("hidden", "");
        },
        function () { if (status) status.setAttribute("hidden", ""); },
        9000);
    }

    if (window.fetch) {
      fetch("releases.json", { cache: "no-store" })
        .then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function (data) {
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
})();
