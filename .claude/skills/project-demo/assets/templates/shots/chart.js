// Shot "chart": an inline-SVG line or bar chart (no chart library). Lines draw by stroke-dashoffset, bars grow by
// scaleY, and a big counter above counts to the last value of the first series. Series use accent, ink, muted.
DEMO_SHOTS.chart = {
  min_ms: 3500,
  params: {
    type: "object",
    additionalProperties: false,
    required: ["series", "x_labels"],
    properties: {
      kind: { enum: ["line", "bar"], default: "line", description: "Line or grouped bars." },
      unit: { type: "string", default: "", description: "Appended to the counter, e.g. % or h." },
      x_labels: {
        type: "array",
        minItems: 2,
        maxItems: 12,
        items: { type: "string" },
        description: "One label per point.",
      },
      series: {
        type: "array",
        minItems: 1,
        maxItems: 3,
        description: "The first series carries the counter.",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["label", "values"],
          properties: {
            label: { type: "string", minLength: 1, description: "Series name (legend tag)." },
            values: { type: "array", minItems: 2, maxItems: 12, items: { type: "number" }, description: "Y values." },
          },
        },
      },
    },
  },
  css:
    ".shot-chart .legend{display:flex;gap:1.2cqmin}" +
    ".shot-chart .num{font-size:var(--t-h1);font-weight:800;font-variant-numeric:tabular-nums}" +
    ".shot-chart svg{flex:1;min-height:0;width:100%}" +
    ".shot-chart .grid{stroke:var(--rule);stroke-width:.3}" +
    ".shot-chart .tick{fill:var(--muted);font-size:3px;text-anchor:middle;font-family:inherit}" +
    ".shot-chart .s0{--c:var(--accent)}.shot-chart .s1{--c:var(--ink)}.shot-chart .s2{--c:var(--muted)}" +
    ".shot-chart .ln{fill:none;stroke:var(--c);stroke-width:.9;stroke-linecap:round;stroke-dasharray:1}" +
    ".shot-chart .bar{fill:var(--c);transform-box:fill-box;transform-origin:50% 100%}",
  build: function (tl, p, root, kit) {
    var m = kit.motion;
    var tall = kit.aspect === "9:16";
    var W = tall ? 80 : 160;
    var H = tall ? 90 : 70;
    var PAD = 6;
    var BASE = H - 8;
    var TOP = 4;
    var NS = "http://www.w3.org/2000/svg";
    var n = p.x_labels.length;
    var max = Math.max.apply(null, [1].concat.apply([], p.series.map(function (s) { return s.values; })));
    var last = p.series[0].values[p.series[0].values.length - 1];
    var legend = root.appendChild(kit.el("div", "legend"));
    var num = root.appendChild(kit.el("span", "num"));
    var svg = root.appendChild(document.createElementNS(NS, "svg"));
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var add = function (tag, attrs, text) {
      var node = svg.appendChild(document.createElementNS(NS, tag));
      Object.keys(attrs).forEach(function (name) {
        node.setAttribute(name, attrs[name]);
      });
      if (text) node.textContent = text;
      return node;
    };
    var yOf = function (v) {
      return BASE - ((v || 0) / max) * (BASE - TOP);
    };
    var slot = (W - 2 * PAD) / n;
    var xOf = function (i) {
      return p.kind === "bar" ? PAD + slot * (i + 0.5) : PAD + ((W - 2 * PAD) * i) / (n - 1);
    };
    [0, 0.5, 1].forEach(function (f) {
      add("line", { x1: PAD, x2: W - PAD, y1: BASE - f * (BASE - TOP), y2: BASE - f * (BASE - TOP), class: "grid" });
    });
    p.x_labels.forEach(function (label, i) {
      add("text", { x: xOf(i), y: BASE + 5, class: "tick" }, label);
    });
    var shapes = [];
    p.series.forEach(function (s, si) {
      legend.appendChild(kit.el("span", "tag", s.label));
      var cls = "s" + si;
      if (p.kind === "bar") {
        var bw = (slot * 0.7) / p.series.length;
        s.values.slice(0, n).forEach(function (v, i) {
          var x = xOf(i) - (slot * 0.35) + si * bw;
          shapes.push(add("rect", { x: x, y: yOf(v), width: bw * 0.9, height: BASE - yOf(v), class: "bar " + cls }));
        });
      } else {
        var d = s.values.slice(0, n).map(function (v, i) { return (i ? "L" : "M") + xOf(i) + " " + yOf(v); }).join("");
        shapes.push(add("path", { d: d, pathLength: 1, class: "ln " + cls }));
      }
    });
    var format = new Intl.NumberFormat("en-US", { maximumFractionDigits: Number.isInteger(last) ? 0 : 1 });
    var counter = { v: 0 };
    var paint = function () {
      num.textContent = format.format(counter.v) + p.unit;
    };
    paint();
    var draw = Math.max(kit.dur * 0.55, m.move);
    tl.from([legend, num], { yPercent: 40, autoAlpha: 0, duration: m.enter, ease: m.easeEnter, stagger: m.stagger }, 0);
    if (p.kind === "bar") {
      tl.from(shapes, { scaleY: 0, duration: m.move, ease: m.easeMove, stagger: draw / shapes.length / 2 }, 0.3);
    } else {
      tl.fromTo(shapes, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: draw, ease: m.easeMove }, 0.3);
    }
    tl.to(counter, { v: last, duration: draw, ease: m.easeCount, onUpdate: paint }, 0.3);
  },
};
