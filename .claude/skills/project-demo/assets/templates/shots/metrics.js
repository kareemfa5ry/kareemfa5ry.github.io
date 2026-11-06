// Shot "metrics": big-number impact stats. Cards rise in turn, each number counts up from 0 to its value (fixed
// en-US formatting, so the same t prints the same digits everywhere), and an accent rule draws under it.
DEMO_SHOTS.metrics = {
  min_ms: 3000,
  params: {
    type: "object",
    additionalProperties: false,
    required: ["items"],
    properties: {
      heading: { type: "string", default: "", description: "Optional line above the numbers." },
      items: {
        type: "array",
        minItems: 1,
        maxItems: 4,
        description: "One card per stat, left to right (top to bottom in 9:16).",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["value", "label"],
          properties: {
            value: { type: "number", description: "Final number the counter lands on." },
            label: { type: "string", minLength: 1, description: "What the number measures." },
            prefix: { type: "string", default: "", description: "Before the number, e.g. a currency sign." },
            suffix: { type: "string", default: "", description: "After the number, e.g. % or x." },
            decimals: { type: "integer", minimum: 0, maximum: 3, default: 0, description: "Digits after the point." },
          },
        },
      },
    },
  },
  css:
    ".shot-metrics .grid{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:var(--gap)}" +
    "[data-aspect='9:16'] .shot-metrics .grid{grid-auto-flow:row}" +
    ".shot-metrics .num{display:block;font-size:var(--t-h1);font-weight:800;font-variant-numeric:tabular-nums}" +
    ".shot-metrics .rule{margin:1.6cqmin 0;width:8cqmin}",
  build: function (tl, p, root, kit) {
    var m = kit.motion;
    var countFor = Math.max(kit.dur * 0.55, m.move);
    if (p.heading) tl.from(root.appendChild(kit.el("h2", "h2", p.heading)), { autoAlpha: 0, duration: m.enter }, 0);
    var grid = root.appendChild(kit.el("div", "grid"));
    p.items.forEach(function (item, i) {
      var at = 0.2 + i * m.stagger * 2;
      var card = grid.appendChild(kit.el("div", "card"));
      var num = card.appendChild(kit.el("span", "num"));
      var rule = card.appendChild(kit.el("div", "rule"));
      card.appendChild(kit.el("span", "label", item.label));
      var format = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: item.decimals,
        maximumFractionDigits: item.decimals,
      });
      var counter = { v: 0 };
      var paint = function () {
        num.textContent = item.prefix + format.format(counter.v) + item.suffix;
      };
      paint();
      tl.from(card, { yPercent: 25, autoAlpha: 0, duration: m.enter, ease: m.easeEnter }, at);
      tl.to(counter, { v: item.value, duration: countFor, ease: m.easeCount, onUpdate: paint }, at + 0.1);
      tl.from(rule, { scaleX: 0, duration: m.move, ease: m.easeMove }, at + 0.3);
    });
  },
};
