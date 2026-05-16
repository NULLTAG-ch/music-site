/*
 * Renders the page from window.CONFIG (see config.js).
 * No dependencies, no build step.
 */
(function () {
  "use strict";

  var C = window.CONFIG || {};
  var profile = C.profile || {};

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (attrs[k] != null) node.setAttribute(k, attrs[k]);
      });
    }
    if (text != null) node.textContent = text;
    return node;
  }

  function isPlaceholder(url) {
    return !url || url === "#";
  }

  // Anchor that is inert + visually muted when the URL is still a placeholder.
  function linkButton(item, className) {
    var placeholder = isPlaceholder(item.url);
    var a = el("a", {
      class: className + (placeholder ? " is-placeholder" : ""),
      href: placeholder ? "#" : item.url,
      target: placeholder ? null : "_blank",
      rel: placeholder ? null : "noopener noreferrer"
    });
    if (placeholder) {
      a.setAttribute("aria-disabled", "true");
      a.addEventListener("click", function (e) { e.preventDefault(); });
    }
    a.appendChild(el("span", { class: "label" }, item.label));
    return a;
  }

  function badge(text) {
    var b = el("span", { class: "badge", "aria-hidden": "true" });
    b.textContent = (text || "?").trim().charAt(0).toUpperCase();
    return b;
  }

  // ---- Profile -------------------------------------------------------------
  document.title = (profile.name || "Music") + " — Releases";

  var logo = document.getElementById("logo");
  if (logo && profile.logo) {
    logo.src = profile.logo;
    logo.alt = (profile.name || "") + " logo";
  }
  var nameEl = document.getElementById("name");
  if (nameEl) nameEl.textContent = profile.name || "";
  var taglineEl = document.getElementById("tagline");
  if (taglineEl) taglineEl.textContent = profile.tagline || "";

  // ---- Latest release ------------------------------------------------------
  var release = C.latestRelease || {};
  var releaseSection = document.getElementById("release");
  if (releaseSection) {
    if (release.show === false) {
      releaseSection.remove();
    } else {
      var art = releaseSection.querySelector(".release-art");
      if (art && release.artwork) {
        art.src = release.artwork;
        art.alt = (release.title || "Latest release") + " cover art";
      }
      var rTitle = releaseSection.querySelector(".release-title");
      if (rTitle) rTitle.textContent = release.title || "";
      var rSub = releaseSection.querySelector(".release-subtitle");
      if (rSub) rSub.textContent = release.subtitle || "";
      var cta = releaseSection.querySelector(".release-cta");
      if (cta) {
        cta.textContent = release.ctaLabel || "Listen everywhere";
        if (isPlaceholder(release.listenUrl)) {
          cta.classList.add("is-placeholder");
          cta.setAttribute("aria-disabled", "true");
          cta.addEventListener("click", function (e) { e.preventDefault(); });
        } else {
          cta.href = release.listenUrl;
          cta.target = "_blank";
          cta.rel = "noopener noreferrer";
        }
      }
    }
  }

  // ---- Streaming -----------------------------------------------------------
  var streamingList = document.getElementById("streaming-list");
  (C.streaming || []).forEach(function (item) {
    var btn = linkButton(item, "link-button");
    btn.insertBefore(badge(item.label), btn.firstChild);
    var li = el("li");
    li.appendChild(btn);
    streamingList.appendChild(li);
  });

  // ---- Social --------------------------------------------------------------
  var socialList = document.getElementById("social-list");
  (C.social || []).forEach(function (item) {
    var li = el("li");
    li.appendChild(linkButton(item, "social-link"));
    socialList.appendChild(li);
  });

  // ---- Releases feed + interactive player ----------------------------------
  // Everything is pulled live from Deezer's public JSONP API (no key, no
  // CORS, no build step). The whole block is progressive enhancement: if
  // anything fails the releases section hides itself and the pinned release
  // above remains as the fallback.

  // Minimal JSONP. Deezer answers `output=jsonp&callback=NAME`.
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
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ":" + (r < 10 ? "0" : "") + r;
  }

  function loadReleases() {
    var cfg = C.releases || {};
    var section = document.getElementById("releases-section");
    var grid = document.getElementById("releases-grid");
    var status = document.getElementById("releases-status");
    var albumView = document.getElementById("album-view");
    if (!section || !grid || !albumView) return;
    if (cfg.show === false || cfg.source !== "deezer" || !cfg.deezerArtistId) return;

    section.removeAttribute("hidden");

    // -- Audio engine ---------------------------------------------------------
    var audio = new Audio();
    audio.preload = "none";
    var queue = [];          // [{ title, preview, duration }]
    var qi = -1;
    var curAlbumTitle = "";

    var pl = document.getElementById("player");
    var plCover = document.getElementById("pl-cover");
    var plTitle = document.getElementById("pl-title");
    var plAlbum = document.getElementById("pl-album");
    var plToggle = document.getElementById("pl-toggle");
    var plPrev = document.getElementById("pl-prev");
    var plNext = document.getElementById("pl-next");
    var plSeek = document.getElementById("pl-seek");
    var plTime = document.getElementById("pl-time");
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

    function reflectPlayState() {
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
      var p = audio.play();
      if (p && p.catch) p.catch(noop);
      plCover.src = t.cover || "";
      plTitle.textContent = t.title || "—";
      plAlbum.textContent = curAlbumTitle;
      pl.removeAttribute("hidden");
      document.body.classList.add("player-open");
      reflectPlayState();
    }

    audio.addEventListener("ended", function () {
      if (qi + 1 < queue.length && queue[qi + 1].preview) playIndex(qi + 1);
      else reflectPlayState();
    });
    audio.addEventListener("play", reflectPlayState);
    audio.addEventListener("pause", reflectPlayState);
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

    // -- Album view -----------------------------------------------------------
    document.getElementById("album-back").addEventListener("click", function () {
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

      var coverEl = document.getElementById("album-cover");
      coverEl.src = cover;
      coverEl.alt = curAlbumTitle + " cover art";
      document.getElementById("album-title").textContent = curAlbumTitle;
      document.getElementById("album-meta").textContent =
        (al.record_type || "release").toUpperCase() +
        ((al.release_date || "").slice(0, 4) ? " · " + al.release_date.slice(0, 4) : "") +
        " · " + tracks.length + " track" + (tracks.length === 1 ? "" : "s");
      var alink = document.getElementById("album-link");
      if (al.link) { alink.href = al.link; alink.removeAttribute("hidden"); }
      else alink.setAttribute("hidden", "");

      var ol = document.getElementById("tracklist");
      ol.textContent = "";
      queue.forEach(function (t, i) {
        var li = el("li", {
          class: "track" + (t.preview ? "" : " track--np"),
          "data-i": String(i)
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
      // Grab the user-gesture token now so the first track can autoplay
      // even if the tracklist still has to arrive over an async request.
      var unlock = audio.play();
      if (unlock && unlock.catch) unlock.catch(noop);

      if (al.tracks && al.tracks.length) { renderAlbum(al, al.tracks); return; }

      jsonp("https://api.deezer.com/album/" + encodeURIComponent(al.id),
        function (alb) {
          renderAlbum(al, alb && alb.tracks && alb.tracks.data ? alb.tracks.data : []);
        },
        function () { if (al.link) window.open(al.link, "_blank", "noopener"); },
        9000);
    }

    // -- Grid -----------------------------------------------------------------
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
        if (cover) {
          card.appendChild(el("img", {
            class: "rc-art", src: cover, alt: (al.title || "") + " cover art",
            loading: "lazy", width: "320", height: "320"
          }));
        }
        card.appendChild(el("span", { class: "rc-play", "aria-hidden": "true" }, "▶"));
        var body = el("div", { class: "rc-body" });
        body.appendChild(el("span", { class: "rc-title" }, al.title || "Untitled"));
        body.appendChild(el("span", { class: "rc-meta" }, kind + (year ? " · " + year : "")));
        card.appendChild(body);
        card.addEventListener("click", function () { openAlbum(al); });
        grid.appendChild(card);
      });

      if (status) {
        status.textContent = list.length + " release" + (list.length === 1 ? "" : "s") +
          " · tap to play";
      }
    }

    function liveJsonp() {
      jsonp("https://api.deezer.com/artist/" + encodeURIComponent(cfg.deezerArtistId) +
            "/albums?limit=" + (cfg.limit || 24),
        function (resp) {
          if (resp && resp.data && resp.data.length) renderGrid(resp.data);
          else section.setAttribute("hidden", "");
        },
        function () { section.setAttribute("hidden", ""); },
        9000);
    }

    // Primary source: a same-origin releases.json baked by the scheduled
    // GitHub Action (no CORS, guaranteed to list every release with its
    // tracks + previews). Falls back to Deezer's live JSONP API if that
    // file isn't there yet (e.g. before the first feed run).
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
  loadReleases();

  // ---- Footer --------------------------------------------------------------
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
  var foot = document.getElementById("footer-name");
  if (foot) foot.textContent = profile.name || "";
})();
