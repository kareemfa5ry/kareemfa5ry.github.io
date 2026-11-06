// Shot "title": kinetic typography. The heading rises word by word out of a mask, an accent rule draws under it,
// then the tagline and the stack tags follow. Empty heading / tagline fall back to the spec's title / tagline.
DEMO_SHOTS.title = {
  min_ms: 2500,
  params: {
    type: "object",
    additionalProperties: false,
    properties: {
      heading: { type: "string", default: "", description: "Big words; empty = spec.title." },
      tagline: { type: "string", default: "", description: "One line under the heading; empty = spec.tagline." },
      show_stack: { type: "boolean", default: true, description: "Show spec.stack as tags." },
    },
  },
  css:
    ".shot-title .words{display:flex;flex-wrap:wrap;gap:0 .28em}" +
    ".shot-title .mask{display:inline-block;overflow:hidden;padding-bottom:.08em}" +
    ".shot-title .word{display:inline-block}" +
    ".shot-title .rule{width:22cqmin}" +
    ".shot-title .tags{display:flex;flex-wrap:wrap;gap:1.2cqmin}",
  build: function (tl, p, root, kit) {
    var m = kit.motion;
    var heading = root.appendChild(kit.el("h1", "display words"));
    var words = (p.heading || kit.spec.title).split(/\s+/).map(function (text) {
      return heading.appendChild(kit.el("span", "mask")).appendChild(kit.el("span", "word", text));
    });
    var rule = root.appendChild(kit.el("div", "rule"));
    var tagline = root.appendChild(kit.el("p", "lede", p.tagline || kit.spec.tagline));
    var tags = root.appendChild(kit.el("div", "tags"));
    var stack = p.show_stack ? kit.spec.stack : [];
    var chips = stack.map(function (name) {
      return tags.appendChild(kit.el("span", "tag", name));
    });

    tl.from(words, { yPercent: 110, duration: m.enter, ease: m.easeEnter, stagger: m.stagger }, 0.1);
    tl.from(rule, { scaleX: 0, duration: m.move, ease: m.easeMove }, ">-0.3");
    tl.from(tagline, { yPercent: 60, autoAlpha: 0, duration: m.enter, ease: m.easeEnter }, "<0.15");
    if (chips.length) {
      tl.from(chips, { yPercent: 60, autoAlpha: 0, duration: m.enter, ease: m.easeEnter, stagger: m.stagger }, "<0.3");
    }
  },
};
