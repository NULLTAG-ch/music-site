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

  // ---- Releases feed (auto-loaded, client-side) ----------------------------
  // Pulled from Deezer's public JSONP API: no key, no CORS issue, no build.
  // If anything fails the section is hidden again and the pinned release
  // above remains as the fallback. Progressive enhancement only.
  function loadReleases() {
    var cfg = C.releases || {};
    var section = document.getElementById("releases-section");
    var grid = document.getElementById("releases-grid");
    var status = document.getElementById("releases-status");
    if (!section || !grid) return;
    if (cfg.show === false || cfg.source !== "deezer" || !cfg.deezerArtistId) return;

    section.removeAttribute("hidden");

    var done = false;
    var cb = "__ntDeezer" + Date.now();
    var script = el("script", {
      src: "https://api.deezer.com/artist/" + encodeURIComponent(cfg.deezerArtistId) +
           "/albums?limit=" + (cfg.limit || 24) + "&output=jsonp&callback=" + cb
    });

    function cleanup() {
      try { delete window[cb]; } catch (e) { window[cb] = undefined; }
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    function fail() {
      if (done) return;
      done = true;
      cleanup();
      section.setAttribute("hidden", "");
    }

    function render(albums) {
      if (done) return;
      done = true;
      cleanup();

      var list = albums.slice().sort(function (a, b) {
        return String(b.release_date || "").localeCompare(String(a.release_date || ""));
      });
      if (cfg.limit) list = list.slice(0, cfg.limit);

      list.forEach(function (al) {
        var cover = al.cover_big || al.cover_medium || al.cover || "";
        var year = (al.release_date || "").slice(0, 4);
        var kind = (al.record_type || "release").toUpperCase();

        var card = el("a", {
          class: "release-card",
          href: al.link || "#",
          target: "_blank",
          rel: "noopener noreferrer"
        });
        if (cover) {
          card.appendChild(el("img", {
            class: "rc-art",
            src: cover,
            alt: (al.title || "") + " cover art",
            loading: "lazy",
            width: "320",
            height: "320"
          }));
        }
        var body = el("div", { class: "rc-body" });
        body.appendChild(el("span", { class: "rc-title" }, al.title || "Untitled"));
        body.appendChild(el("span", { class: "rc-meta" },
          kind + (year ? " · " + year : "")));
        card.appendChild(body);
        grid.appendChild(card);
      });

      if (status) {
        status.textContent = list.length + " release" + (list.length === 1 ? "" : "s") +
          " · live from Deezer";
      }
    }

    window[cb] = function (resp) {
      if (resp && resp.data && resp.data.length) render(resp.data);
      else fail();
    };
    script.onerror = fail;
    setTimeout(fail, 9000);
    document.head.appendChild(script);
  }
  loadReleases();

  // ---- Footer --------------------------------------------------------------
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
  var foot = document.getElementById("footer-name");
  if (foot) foot.textContent = profile.name || "";
})();
