// Inlined by scripts/new_demo.mjs right after player.js, only when a spec has screenshot shots. Runs before anything
// can read window.demo.ready, so render.mjs and capture tools wait until every <img> is loaded and decoded.
(function () {
  "use strict";
  var base = window.demo.ready;
  window.demo.ready = base.then(function () {
    return Promise.all(
      Array.from(document.images, function (img) {
        return img.decode();
      }),
    );
  });
})();
