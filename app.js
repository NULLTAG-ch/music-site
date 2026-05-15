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
  document.title = (profile.name || "Music") + " — Listen everywhere";

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

  // ---- Footer --------------------------------------------------------------
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
  var foot = document.getElementById("footer-name");
  if (foot) foot.textContent = profile.name || "";
})();
