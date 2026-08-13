/* ============================================================
   NULLTAG · DESIGN SYSTEM · WEB BEHAVIOUR
   ------------------------------------------------------------
   The behaviour half of web.css. Plain ES5-compatible script,
   no build step, no dependencies — drop it in with a <script>
   tag and the components in web.css come alive.

       <script src="web.js" defer></script>

   Exposes a single global, `NT`. Everything is idempotent and
   guards on missing DOM, so a page that only uses some of the
   components can still load the whole file.
   ============================================================ */
(function (global) {
  "use strict";

  var NT = global.NT || (global.NT = {});

  /* ---- helpers -------------------------------------------- */

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  NT.esc = esc;

  /* YouTube ids are exactly the 11-char url-safe-base64 alphabet.
     Anything else is refused rather than interpolated into a URL. */
  var YT_ID = /^[A-Za-z0-9_-]{11}$/;

  NT.isVideoId = function (id) { return YT_ID.test(String(id || "")); };

  /* Pull the id out of any of the shapes YouTube hands out:
     watch?v=, youtu.be/, /embed/, /shorts/. Returns "" if none. */
  NT.videoId = function (url) {
    var s = String(url || "");
    var m = s.match(/[?&]v=([A-Za-z0-9_-]{11})/)
         || s.match(/youtu\.be\/([A-Za-z0-9_-]{11})/)
         || s.match(/\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/);
    return m ? m[1] : "";
  };

  /* Thumbnails come from the cookieless image host, so a page that
     is never played still sets no youtube.com cookie. */
  NT.thumb = function (id, size) {
    if (!YT_ID.test(id)) return "";
    return "https://i.ytimg.com/vi/" + id + "/" + (size || "hqdefault") + ".jpg";
  };

  NT.watchUrl = function (id) {
    return YT_ID.test(id) ? "https://www.youtube.com/watch?v=" + id : "";
  };

  /* ============================================================
     VIDEO FACADE
     Turns a `.nt-vid[data-video]` element into a click-to-load
     player. Until it is clicked the element is a poster image and
     a link — no youtube.com request has been made.
     ============================================================ */

  /* A facade stands for one of two things: a YouTube id (`data-video`) or a
     self-hosted file (`data-src`). Both stay inert until pressed — the
     self-hosted one so the page never downloads a multi-megabyte mp4 the
     visitor did not ask for. */
  function buildFacade(el) {
    var id = el.getAttribute("data-video");
    var src = el.getAttribute("data-src");
    var isYt = YT_ID.test(id);
    if (!isYt && !src) return false;

    var title = el.getAttribute("data-title") || "Video";
    var stamp = el.getAttribute("data-stamp") || "";
    var poster = el.getAttribute("data-poster") || (isYt ? NT.thumb(id, "maxresdefault") : "");
    var fallback = isYt
      ? ' onerror="this.onerror=null;this.src=\'' + esc(NT.thumb(id, "hqdefault")) + '\'"'
      : "";

    el.innerHTML =
      (stamp ? '<span class="nt-vid__stamp">' + esc(stamp) + "</span>" : "") +
      (poster
        ? '<img src="' + esc(poster) + '" alt="" loading="lazy" decoding="async"' + fallback + " />"
        : "") +
      '<span class="nt-vid__veil"></span>' +
      '<span class="nt-vid__play"><span class="nt-vid__disc" aria-hidden="true">▶</span></span>';

    // An <a> is already focusable and already activates on Enter, and it
    // carries a real destination for middle-click, "open in new tab", and
    // anyone browsing without JS. Adding role="button" would only take that
    // away. Only a non-link needs to be told it behaves like a button.
    if (el.tagName !== "A") {
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
    }
    el.setAttribute("aria-label", title + " — Video abspielen" + (isYt ? " (lädt YouTube)" : ""));
    el.dataset.ntFacade = "1";
    return true;
  }

  /* Swap the facade for the real player. autoplay=1 is honest here:
     the visitor just pressed play. */
  function activate(el) {
    if (el.dataset.ntPlaying === "1") return;
    var id = el.getAttribute("data-video");
    var src = el.getAttribute("data-src");
    var title = el.getAttribute("data-title") || "Video";

    if (YT_ID.test(id)) {
      el.dataset.ntPlaying = "1";
      el.innerHTML =
        '<iframe src="https://www.youtube-nocookie.com/embed/' + id +
        '?autoplay=1&rel=0&modestbranding=1&playsinline=1" ' +
        'title="' + esc(title) + '" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" ' +
        'allowfullscreen loading="lazy"></iframe>';
    } else if (src) {
      el.dataset.ntPlaying = "1";
      el.innerHTML =
        '<video src="' + esc(src) + '" title="' + esc(title) + '" ' +
        'controls autoplay playsinline preload="metadata" ' +
        'style="position:absolute;inset:0;width:100%;height:100%;background:#000"></video>';
    } else {
      return;
    }
    el.removeAttribute("role");
    el.removeAttribute("tabindex");
  }
  NT.playVideo = activate;

  /* Point an existing facade at a different video without a reload.
     Used by the split view when a row in the index is chosen. */
  NT.setVideo = function (el, video) {
    if (!el || !video) return;
    if (!YT_ID.test(video.id) && !video.src) return;
    if (video.src) { el.setAttribute("data-src", video.src); el.removeAttribute("data-video"); }
    else { el.setAttribute("data-video", video.id); el.removeAttribute("data-src"); }
    el.setAttribute("data-title", video.title || "Video");
    if (video.stamp) el.setAttribute("data-stamp", video.stamp);
    if (video.poster) el.setAttribute("data-poster", video.poster);
    else el.removeAttribute("data-poster");
    // If the stage is a link, keep its destination pointing at whatever it
    // currently stands for — otherwise a middle-click would open the video
    // the stage was showing when the page loaded.
    if (el.tagName === "A") {
      var href = YT_ID.test(video.id) ? NT.watchUrl(video.id) : (video.src || "");
      if (href) el.setAttribute("href", href);
    }
    delete el.dataset.ntPlaying;
    buildFacade(el);
  };

  var FACADE_SEL = ".nt-vid[data-video], .nt-vid[data-src]";

  NT.facades = function (root) {
    var scope = root || document;
    var nodes = scope.querySelectorAll(FACADE_SEL);
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].dataset.ntFacade !== "1") buildFacade(nodes[i]);
    }
  };

  /* One delegated listener for the whole document — facades added
     later (by the feed hydration) need no extra wiring. */
  function onActivate(ev) {
    var el = ev.target.closest ? ev.target.closest(FACADE_SEL) : null;
    if (!el || el.dataset.ntPlaying === "1") return;
    if (ev.type === "keydown" && ev.key !== "Enter" && ev.key !== " ") return;
    ev.preventDefault();
    activate(el);
  }

  /* ============================================================
     SPLIT VIEW
     Wires an index of rows to a stage. Each row carries the video
     it stands for; choosing one re-points the stage and moves the
     current marker. Selection state lives in the DOM (aria-current)
     so it stays true for assistive tech, not just visually.
     ============================================================ */

  NT.splitView = function (opts) {
    var stage = typeof opts.stage === "string" ? document.querySelector(opts.stage) : opts.stage;
    var index = typeof opts.index === "string" ? document.querySelector(opts.index) : opts.index;
    if (!stage || !index) return null;

    var titleEl = opts.title ? document.querySelector(opts.title) : null;
    var metaEl = opts.meta ? document.querySelector(opts.meta) : null;
    var linkEl = opts.link ? document.querySelector(opts.link) : null;
    var items = [];

    function select(i, autoplay) {
      var v = items[i];
      if (!v) return;
      NT.setVideo(stage, v);
      if (titleEl) titleEl.textContent = v.title || "";
      if (metaEl) metaEl.textContent = v.meta || "";
      if (linkEl) {
        var href = NT.watchUrl(v.id);
        linkEl.href = href;
        linkEl.hidden = !href;
      }
      var rows = index.querySelectorAll(".nt-row");
      for (var r = 0; r < rows.length; r++) {
        rows[r].setAttribute("aria-current", String(r) === String(i) ? "true" : "false");
      }
      if (autoplay) activate(stage);
    }

    function render(list) {
      items = (list || []).filter(function (v) { return v && (YT_ID.test(v.id) || v.src); });
      if (!items.length) {
        index.innerHTML = '<div class="nt-empty">' +
          esc(opts.emptyText || "Noch keine Videos") + "</div>";
        return;
      }
      var head = opts.indexLabel
        ? '<div class="nt-split__indexhead"><span>' + esc(opts.indexLabel) +
          '</span><span>' + items.length + "</span></div>"
        : "";
      var rows = items.map(function (v, i) {
        var thumb = v.thumb || (YT_ID.test(v.id) ? NT.thumb(v.id, "mqdefault") : "");
        return '<button type="button" class="nt-row" data-i="' + i + '" aria-current="' +
          (i === 0 ? "true" : "false") + '">' +
          (thumb
            ? '<img class="nt-row__thumb" src="' + esc(thumb) + '" alt="" loading="lazy" decoding="async" />'
            : '<span class="nt-row__thumb"></span>') +
          '<span><span class="nt-row__title">' + esc(v.title || "") + "</span>" +
          '<span class="nt-row__meta">' + esc(v.meta || "") + "</span></span></button>";
      }).join("");
      index.innerHTML = head + rows;
      select(0, false);
    }

    index.addEventListener("click", function (ev) {
      var row = ev.target.closest ? ev.target.closest(".nt-row[data-i]") : null;
      if (!row) return;
      select(+row.dataset.i, true);
    });

    render(opts.items);
    return { render: render, select: select };
  };

  /* ---- boot ------------------------------------------------ */

  function boot() {
    NT.facades();
    document.addEventListener("click", onActivate);
    document.addEventListener("keydown", onActivate);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
