// Demo player: reads the inlined spec, builds ONE paused GSAP master timeline from the shot templates and drives
// it. Live: autoplay when scrolled into view, play/pause/replay button. ?render=1: no autoplay, no controls, only
// window.demo.seek moves the playhead. Contract (render.mjs relies on it):
//   window.demo = { duration, ready, seek(tMs), play(), pause() }   await ready before the first seek.
// Same t -> same DOM: nothing here reads the wall clock; randomness comes from kit.rand (seeded by spec.seed).
// Inlined by scripts/new_demo.mjs after the GSAP script and the templates (which register on window.DEMO_SHOTS).
(function () {
  "use strict";

  // Pinned ES modules for templates that declare needs: ["three"]; imported only when a shot in the spec needs it.
  var LIBS = {
    three: "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.187.0/three.module.min.js",
  };
  // Motion tokens (references/design-system.md); templates read them from kit.motion, never re-type them.
  var MOTION = {
    enter: 0.6,
    move: 0.9,
    stagger: 0.08,
    fade: 0.3,
    easeEnter: "power3.out",
    easeMove: "power2.inOut",
    easeCount: "power2.out",
  };
  var VISIBLE_RATIO = 0.5;

  var spec = JSON.parse(document.getElementById("demo-spec").textContent);
  var query = new URLSearchParams(location.search);
  var renderMode = query.get("render") === "1";
  var reducedMotion = !renderMode && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var stage = document.querySelector(".stage");
  var button = stage.querySelector(".control");
  var master = null;
  var userPaused = false;

  // mulberry32: tiny seeded PRNG, returns floats in [0, 1). Same seed -> same sequence on every load.
  function seededRandom(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function templateFor(type) {
    var def = window.DEMO_SHOTS[type];
    if (!def) throw new Error("project-demo: no template registered for shot type '" + type + "'");
    return def;
  }

  function neededLibs() {
    var names = [];
    spec.shots.forEach(function (shot) {
      (templateFor(shot.type).needs || []).forEach(function (name) {
        if (names.indexOf(name) < 0) names.push(name);
      });
    });
    return names;
  }

  function loadLibs(names) {
    return Promise.all(
      names.map(function (name) {
        return import(LIBS[name]);
      }),
    ).then(function (modules) {
      var lib = {};
      names.forEach(function (name, i) {
        lib[name] = modules[i];
      });
      return lib;
    });
  }

  function injectTemplateCss() {
    var seen = {};
    var css = "";
    spec.shots.forEach(function (shot) {
      var def = templateFor(shot.type);
      if (def.css && !seen[shot.type]) css += def.css;
      seen[shot.type] = true;
    });
    document.head.appendChild(el("style", "", css));
  }

  // One shot: its section and caption are visible for [start, start + dur); the last shot stays on the end frame.
  function addShot(shot, start, isLast, kit) {
    var dur = shot.duration_ms / 1000;
    var root = stage.querySelector(".shots").appendChild(el("section", "shot shot-" + shot.type));
    var caption = stage.querySelector(".captions").appendChild(el("p", "caption", shot.caption || ""));
    var layers = [root, caption];
    var sub = gsap.timeline();
    templateFor(shot.type).build(sub, shot.params, root, Object.assign({ dur: dur }, kit));
    if (sub.duration() > dur + 0.001) console.warn("project-demo: shot '" + shot.type + "' runs past duration_ms");
    // The first shot is shown at build time, not by a zero-length tween at 0 (those do not render on a seek to 0).
    if (start === 0) gsap.set(layers, { autoAlpha: 1 });
    else master.fromTo(layers, { autoAlpha: 0 }, { autoAlpha: 1, duration: MOTION.fade, ease: "none" }, start);
    master.add(sub, start);
    if (!isLast) master.to(layers, { autoAlpha: 0, duration: MOTION.fade, ease: "none" }, start + dur - MOTION.fade);
  }

  function build(lib) {
    var kit = { rand: seededRandom(spec.seed), motion: MOTION, el: el, spec: spec, lib: lib, aspect: spec.aspect };
    var total = window.demo.duration / 1000;
    var start = 0;
    injectTemplateCss();
    master = gsap.timeline({ paused: true, onComplete: syncButton });
    spec.shots.forEach(function (shot, i) {
      addShot(shot, start, i === spec.shots.length - 1, kit);
      start += shot.duration_ms / 1000;
    });
    master.fromTo(stage.querySelector(".progress"), { scaleX: 0 }, { scaleX: 1, duration: total, ease: "none" }, 0);
    master.set({}, {}, total);
    master.seek(reducedMotion ? total : 0, false);
    if (!renderMode && !reducedMotion) watchVisibility();
    syncButton();
  }

  // Not master.isActive(): that stays false until the first tick after play(), so the label would lag.
  function isPlaying() {
    return !master.paused() && master.progress() < 1;
  }

  function syncButton() {
    var ended = master.progress() === 1;
    var playing = isPlaying();
    button.textContent = playing ? "Pause" : ended ? "Replay" : "Play";
    button.setAttribute("aria-label", button.textContent + " demo");
  }

  function play() {
    if (master.progress() === 1) master.restart();
    else master.play();
    syncButton();
  }

  function pause() {
    master.pause();
    syncButton();
  }

  function seek(tMs) {
    master.pause();
    master.seek(Math.min(Math.max(tMs, 0), window.demo.duration) / 1000, false);
    syncButton();
  }

  // Autoplay while at least half the stage is on screen (inside the site's iframe this tracks the page viewport).
  function watchVisibility() {
    new IntersectionObserver(
      function (entries) {
        var visible = entries[0].intersectionRatio >= VISIBLE_RATIO;
        if (visible && !userPaused && master.progress() < 1) play();
        if (!visible && isPlaying()) pause();
      },
      { threshold: [0, VISIBLE_RATIO] },
    ).observe(stage);
  }

  button.addEventListener("click", function () {
    userPaused = isPlaying();
    if (userPaused) pause();
    else play();
  });

  var duration = spec.shots.reduce(function (sum, shot) {
    return sum + shot.duration_ms;
  }, 0);
  window.demo = { duration: duration, seek: seek, play: play, pause: pause };
  window.demo.ready = loadLibs(neededLibs()).then(build);
})();
