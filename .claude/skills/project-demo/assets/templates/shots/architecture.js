// Shot "architecture": boxes on a coarse grid joined by arrows, revealed one node at a time in `order`. An edge
// draws (stroke-dashoffset, pathLength 1) once both of its ends are on screen. One SVG, uniform scale, real text.
// 16:9 uses a 160x80 box (x 0-4 across, y 0-2 down); 9:16 transposes the grid into an 80x160 box.
DEMO_SHOTS.architecture = {
  min_ms: 4000,
  params: {
    type: "object",
    additionalProperties: false,
    required: ["nodes", "edges"],
    properties: {
      nodes: {
        type: "array",
        minItems: 2,
        maxItems: 8,
        description: "Boxes. Labels of about 12 characters or fewer fit.",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "label", "x", "y"],
          properties: {
            id: { type: "string", minLength: 1, description: "Unique id used by edges and order." },
            label: { type: "string", minLength: 1, description: "Text in the box." },
            x: { type: "integer", minimum: 0, maximum: 4, description: "Grid column, 0-4." },
            y: { type: "integer", minimum: 0, maximum: 2, description: "Grid row, 0-2." },
          },
        },
      },
      edges: {
        type: "array",
        maxItems: 12,
        description: "Arrows between node ids.",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["from", "to"],
          properties: {
            from: { type: "string", description: "Source node id." },
            to: { type: "string", description: "Target node id." },
            label: { type: "string", default: "", description: "Optional short text on the arrow." },
          },
        },
      },
      order: {
        type: "array",
        default: [],
        items: { type: "string" },
        description: "Node ids in reveal order; empty = the order of nodes.",
      },
    },
  },
  // Cross-references the schema cannot express; returns "path: problem" strings, run by new_demo.mjs.
  validate: function (p, at) {
    var ids = p.nodes.map(function (n) {
      return n.id;
    });
    var errors = [];
    var known = function (id) {
      return ids.indexOf(id) >= 0;
    };
    ids.forEach(function (id, i) {
      if (ids.indexOf(id) !== i) errors.push(at + ".nodes[" + i + "].id: '" + id + "' is used twice");
    });
    p.edges.forEach(function (e, i) {
      ["from", "to"].forEach(function (end) {
        if (!known(e[end])) errors.push(at + ".edges[" + i + "]." + end + ": no node '" + e[end] + "'");
      });
    });
    (p.order || []).forEach(function (id, i) {
      if (!known(id)) errors.push(at + ".order[" + i + "]: no node '" + id + "'");
    });
    return errors;
  },
  css:
    ".shot-architecture svg{flex:1;min-height:0;width:100%}" +
    ".shot-architecture text{font-family:inherit;fill:var(--ink);text-anchor:middle;dominant-baseline:central}" +
    ".shot-architecture .edge-label{fill:var(--muted);font-size:2.6px}" +
    ".shot-architecture .box{fill:var(--surface);stroke:var(--rule);stroke-width:.4}" +
    ".shot-architecture .name{font-size:3.2px;font-weight:700}" +
    ".shot-architecture .edge{fill:none;stroke:var(--accent);stroke-width:.7;stroke-dasharray:1}" +
    ".shot-architecture .head{fill:var(--accent)}",
  build: function (tl, p, root, kit) {
    var m = kit.motion;
    var tall = kit.aspect === "9:16";
    var NODE_W = 24;
    var NODE_H = 12;
    var NS = "http://www.w3.org/2000/svg";
    var svg = root.appendChild(document.createElementNS(NS, "svg"));
    svg.setAttribute("viewBox", tall ? "0 0 80 160" : "0 0 160 80");
    var add = function (parent, tag, attrs, text) {
      var node = parent.appendChild(document.createElementNS(NS, tag));
      Object.keys(attrs).forEach(function (name) {
        node.setAttribute(name, attrs[name]);
      });
      if (text) node.textContent = text;
      return node;
    };
    var pos = {};
    p.nodes.forEach(function (n) {
      pos[n.id] = tall ? { x: 14 + n.y * 26, y: 20 + n.x * 30 } : { x: 20 + n.x * 30, y: 14 + n.y * 26 };
    });
    var edges = p.edges.map(function (e) {
      var a = pos[e.from];
      var b = pos[e.to];
      var dx = b.x - a.x;
      var dy = b.y - a.y;
      var len = Math.hypot(dx, dy) || 1;
      var ux = dx / len;
      var uy = dy / len;
      // Where the centre-to-centre ray leaves a box, plus a 1-unit gap.
      var cut = Math.min(NODE_W / 2 / (Math.abs(ux) || 1e-6), NODE_H / 2 / (Math.abs(uy) || 1e-6)) + 1;
      var from = [a.x + ux * cut, a.y + uy * cut];
      var to = [b.x - ux * cut, b.y - uy * cut];
      var g = add(svg, "g", {});
      var line = add(g, "path", { d: "M" + from + "L" + to, pathLength: 1, class: "edge" });
      var wing = function (s) {
        return [to[0] - 2.4 * ux + s * 1.2 * uy, to[1] - 2.4 * uy - s * 1.2 * ux];
      };
      add(g, "polygon", { points: [to, wing(1), wing(-1)].join(" "), class: "head" });
      if (e.label) {
        add(g, "text", { x: (from[0] + to[0]) / 2, y: (from[1] + to[1]) / 2 - 3, class: "edge-label" }, e.label);
      }
      return { e: e, g: g, line: line };
    });
    var boxes = {};
    p.nodes.forEach(function (n) {
      var g = add(svg, "g", {});
      add(g, "rect", { x: pos[n.id].x - NODE_W / 2, y: pos[n.id].y - NODE_H / 2, width: NODE_W, height: NODE_H, rx: 1.6, class: "box" });
      add(g, "text", { x: pos[n.id].x, y: pos[n.id].y, class: "name" }, n.label);
      boxes[n.id] = g;
    });
    var order = p.order.length ? p.order : p.nodes.map(function (n) { return n.id; });
    var step = Math.max((kit.dur * 0.6 - m.enter) / Math.max(order.length - 1, 1), m.stagger);
    var shownAt = {};
    order.forEach(function (id, i) {
      shownAt[id] = 0.2 + i * step;
      tl.from(boxes[id], { y: 3, autoAlpha: 0, duration: m.enter, ease: m.easeEnter }, shownAt[id]);
    });
    edges.forEach(function (x) {
      var at = Math.max(shownAt[x.e.from] || 0, shownAt[x.e.to] || 0) + 0.2;
      tl.fromTo(x.g, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, at);
      tl.fromTo(x.line, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: m.enter, ease: m.easeMove }, at);
    });
  },
};
