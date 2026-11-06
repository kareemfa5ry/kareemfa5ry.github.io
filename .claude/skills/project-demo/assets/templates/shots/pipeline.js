// Shot "pipeline": stages in a row (a column in 9:16). Stages arrive, then a marker travels from stage to stage:
// each connector fills with the accent as it passes and every stage it has reached sits on --accent-soft.
// The travel is a proxy tweened on tl; paint() reads only the proxy, so seek(t) gives the same frame.
DEMO_SHOTS.pipeline = {
  min_ms: 3500,
  params: {
    type: "object",
    additionalProperties: false,
    required: ["stages"],
    properties: {
      heading: { type: "string", default: "", description: "Optional line above the stages." },
      stages: {
        type: "array",
        minItems: 2,
        maxItems: 5,
        description: "Stages in flow order, e.g. data, model, output.",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["label"],
          properties: {
            label: { type: "string", minLength: 1, description: "Stage name." },
            detail: { type: "string", default: "", description: "One short line under the name." },
          },
        },
      },
    },
  },
  css:
    ".shot-pipeline .flow{display:flex;align-items:stretch}" +
    "[data-aspect='9:16'] .shot-pipeline .flow{flex-direction:column}" +
    ".shot-pipeline .stage-card{flex:1 1 0;min-width:0;display:flex;flex-direction:column;gap:1cqmin}" +
    ".shot-pipeline .stage-card.on{background:var(--accent-soft);border-color:var(--accent)}" +
    ".shot-pipeline .link{flex:0 0 5cqmin;align-self:center;width:5cqmin;height:.7cqmin;background:var(--rule)}" +
    ".shot-pipeline .link i{display:block;height:100%;background:var(--accent);" +
    "transform:scaleX(var(--f,0));transform-origin:left center}" +
    "[data-aspect='9:16'] .shot-pipeline .link{width:.7cqmin;height:5cqmin}" +
    "[data-aspect='9:16'] .shot-pipeline .link i{width:100%;height:100%;" +
    "transform:scaleY(var(--f,0));transform-origin:center top}",
  build: function (tl, p, root, kit) {
    var m = kit.motion;
    if (p.heading) tl.from(root.appendChild(kit.el("h2", "h2", p.heading)), { autoAlpha: 0, duration: m.enter }, 0);
    var flow = root.appendChild(kit.el("div", "flow"));
    var cards = [];
    var fills = [];
    p.stages.forEach(function (stage, i) {
      if (i) fills.push(flow.appendChild(kit.el("div", "link")).appendChild(kit.el("i")));
      var card = flow.appendChild(kit.el("div", "card stage-card"));
      card.appendChild(kit.el("span", "h2", stage.label));
      if (stage.detail) card.appendChild(kit.el("span", "lede", stage.detail));
      cards.push(card);
    });
    var marker = { k: 0 };
    var paint = function () {
      var reached = Math.round(marker.k);
      cards.forEach(function (card, i) {
        card.classList.toggle("on", i <= reached);
      });
      fills.forEach(function (fill, i) {
        fill.style.setProperty("--f", Math.min(Math.max(marker.k - i, 0), 1).toFixed(4));
      });
    };
    paint();
    tl.from(cards, { yPercent: 25, autoAlpha: 0, duration: m.enter, ease: m.easeEnter, stagger: m.stagger }, 0.1);
    var travel = Math.max(kit.dur * 0.6 - 0.8, m.move);
    tl.to(marker, { k: cards.length - 1, duration: travel, ease: "none", onUpdate: paint }, 0.8);
  },
};
