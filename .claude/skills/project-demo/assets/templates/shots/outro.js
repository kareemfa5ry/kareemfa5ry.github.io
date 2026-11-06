// Shot "outro": call to action. Heading, accent rule, then the repo / live links as visible text URLs (a video
// frame cannot be clicked). Live, each is a real anchor with target="_top" so it leaves the iframe.
DEMO_SHOTS.outro = {
  min_ms: 2500,
  params: {
    type: "object",
    additionalProperties: false,
    properties: {
      heading: { type: "string", default: "See it for yourself", description: "The call to action." },
      links: {
        type: "object",
        default: {},
        additionalProperties: false,
        description: "Override spec.links; anything unset falls back to it.",
        properties: {
          repo: { type: "string", pattern: "^https://", description: "Source repository URL." },
          live: { type: "string", pattern: "^https://", description: "Live site or app URL." },
        },
      },
    },
  },
  css:
    ".shot-outro .rule{width:22cqmin}" +
    ".shot-outro .links,.shot-outro .links div{display:flex;flex-direction:column;gap:var(--gap)}" +
    ".shot-outro .links div{gap:.5cqmin;align-items:flex-start}" +
    ".shot-outro a{color:var(--ink);text-decoration:none;border-bottom:.5cqmin solid var(--accent);" +
    "overflow-wrap:anywhere;font-size:var(--t-h2);font-weight:700}",
  build: function (tl, p, root, kit) {
    var m = kit.motion;
    var links = Object.assign({}, kit.spec.links, p.links);
    var heading = root.appendChild(kit.el("h1", "display", p.heading));
    var rule = root.appendChild(kit.el("div", "rule"));
    var box = root.appendChild(kit.el("div", "links"));
    var rows = [
      ["Source", links.repo],
      ["Live", links.live],
    ]
      .filter(function (row) {
        return row[1];
      })
      .map(function (row) {
        var item = box.appendChild(kit.el("div"));
        item.appendChild(kit.el("span", "label", row[0]));
        var a = item.appendChild(kit.el("a", "", row[1].replace(/^https:\/\//, "")));
        a.href = row[1];
        a.target = "_top";
        a.rel = "noopener";
        return item;
      });
    tl.from(heading, { yPercent: 40, autoAlpha: 0, duration: m.enter, ease: m.easeEnter }, 0.1);
    tl.from(rule, { scaleX: 0, duration: m.move, ease: m.easeMove }, ">-0.3");
    tl.from(rows, { yPercent: 40, autoAlpha: 0, duration: m.enter, ease: m.easeEnter, stagger: m.stagger * 2 }, "<0.2");
  },
};
