// Shot "screenshot": a real product screenshot (img/<name>.webp, made by scripts/images.mjs from
// src/assets/projects/<slug>/<image>) with a slow Ken Burns move and optional callouts that outline regions in turn.
// The image keeps its own ratio inside the stage (letterboxed on --surface); callouts are in percent of the image.
var SCREENSHOT_POINT = {
  type: "object",
  additionalProperties: false,
  properties: {
    x: { type: "number", minimum: -10, maximum: 10, description: "Shift right, percent of the image width." },
    y: { type: "number", minimum: -10, maximum: 10, description: "Shift down, percent of the image height." },
    scale: { type: "number", minimum: 1, maximum: 1.25, description: "Zoom ratio." },
  },
};

DEMO_SHOTS.screenshot = {
  min_ms: 4000,
  params: {
    type: "object",
    additionalProperties: false,
    required: ["image", "alt"],
    properties: {
      image: {
        type: "string",
        pattern: "^[A-Za-z0-9_.-]+\\.(png|jpe?g|webp)$",
        description: "File name inside src/assets/projects/<slug>/ (no folders).",
      },
      alt: { type: "string", minLength: 1, description: "What the screenshot shows, for screen readers." },
      caption: { type: "string", default: "", description: "Optional line above the image." },
      move: {
        type: "object",
        additionalProperties: false,
        description: "Ken Burns. Missing keys use x 1.5 y 1 scale 1 (from) and x 0 y 0 scale 1.06 (to).",
        properties: { from: SCREENSHOT_POINT, to: SCREENSHOT_POINT },
      },
      callouts: {
        type: "array",
        default: [],
        maxItems: 4,
        description: "Regions outlined one after another, in percent of the image.",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["x", "y", "w", "h", "label"],
          properties: {
            x: { type: "number", minimum: 0, maximum: 100, description: "Left edge." },
            y: { type: "number", minimum: 0, maximum: 100, description: "Top edge." },
            w: { type: "number", minimum: 1, maximum: 100, description: "Width." },
            h: { type: "number", minimum: 1, maximum: 100, description: "Height." },
            label: { type: "string", minLength: 1, description: "Short text on the outline." },
          },
        },
      },
    },
  },
  validate: function (p, at) {
    var errors = [];
    p.callouts.forEach(function (c, i) {
      if (c.x + c.w > 100) errors.push(at + ".callouts[" + i + "]: x + w goes past the image (100)");
      if (c.y + c.h > 100) errors.push(at + ".callouts[" + i + "]: y + h goes past the image (100)");
    });
    return errors;
  },
  css:
    ".shot-screenshot{padding:2cqmin 2cqmin 0}" +
    ".shot-screenshot .frame{flex:1;min-height:0;container-type:size;display:grid;place-items:center;" +
    "overflow:hidden;background:var(--surface);border:1px solid var(--rule);border-radius:var(--radius)}" +
    ".shot-screenshot .pan{position:relative;width:fit-content;height:fit-content}" +
    ".shot-screenshot img{display:block;max-width:100cqw;max-height:100cqh}" +
    ".shot-screenshot .callout{position:absolute;border:0.5cqmin solid var(--accent);border-radius:var(--radius)}" +
    ".shot-screenshot .callout .tag{position:absolute;left:0;top:100%;margin-top:0.8cqmin;white-space:nowrap;" +
    "background:var(--accent);color:var(--bg);border-color:var(--accent)}" +
    ".shot-screenshot .callout.above .tag{top:auto;bottom:100%;margin:0 0 0.8cqmin}",
  build: function (tl, p, root, kit) {
    var m = kit.motion;
    if (p.caption) root.appendChild(kit.el("p", "lede", p.caption));
    var frame = root.appendChild(kit.el("div", "frame"));
    var pan = frame.appendChild(kit.el("div", "pan"));
    var img = pan.appendChild(kit.el("img"));
    img.src = "img/" + p.image.replace(/\.[^.]+$/, "") + ".webp";
    img.alt = p.alt;
    img.loading = "eager";
    var move = p.move || {};
    var from = Object.assign({ x: 1.5, y: 1, scale: 1 }, move.from);
    var to = Object.assign({ x: 0, y: 0, scale: 1.06 }, move.to);
    tl.from(frame, { autoAlpha: 0, duration: m.enter }, 0);
    tl.fromTo(
      pan,
      { xPercent: from.x, yPercent: from.y, scale: from.scale },
      { xPercent: to.x, yPercent: to.y, scale: to.scale, duration: kit.dur, ease: "none" },
      0,
    );
    var step = Math.min(1.4, (kit.dur * 0.6) / Math.max(p.callouts.length, 1));
    p.callouts.forEach(function (c, i) {
      var box = pan.appendChild(kit.el("div", c.y + c.h > 80 ? "callout above" : "callout"));
      box.style.cssText = "left:" + c.x + "%;top:" + c.y + "%;width:" + c.w + "%;height:" + c.h + "%";
      box.appendChild(kit.el("span", "tag", c.label));
      tl.from(box, { autoAlpha: 0, scale: 0.94, duration: m.enter, ease: m.easeEnter }, 0.8 + i * step);
    });
  },
};
