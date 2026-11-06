// Shot "hero3d": a Three.js scene with a slow camera orbit. Three.js is lazy-loaded by the player only for specs
// that contain this shot (needs: ["three"]). Loading choice: the pinned cdnjs URL is import()ed WITHOUT an SRI hash
// (dynamic import cannot carry one; an import map would need a player/scaffold change). No animation loop: a
// proxy k tweened 0 -> 1 on tl drives the camera and renders inside onUpdate, so seek(t) yields the same frame.
DEMO_SHOTS.hero3d = {
  min_ms: 3000,
  needs: ["three"],
  params: {
    type: "object",
    additionalProperties: false,
    properties: {
      shape: { enum: ["cloud", "knot"], default: "cloud", description: "Seeded point cloud or a wireframe knot." },
      orbit_deg: { type: "integer", minimum: 0, maximum: 180, default: 60, description: "Camera sweep over the shot." },
      heading: { type: "string", default: "", description: "Optional line above the scene." },
    },
  },
  css: ".shot-hero3d .view{flex:1;min-height:0;position:relative}.shot-hero3d canvas{width:100%;height:100%;display:block}",
  build: function (tl, p, root, kit) {
    var THREE = kit.lib.three;
    var m = kit.motion;
    if (p.heading) tl.from(root.appendChild(kit.el("h2", "h2", p.heading)), { autoAlpha: 0, duration: m.enter }, 0);
    var view = root.appendChild(kit.el("div", "view"));
    var probe = view.appendChild(kit.el("i"));
    var colour = function (token) {
      probe.style.color = "var(" + token + ")";
      return new THREE.Color(getComputedStyle(probe).color);
    };
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
    var renderer = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    } catch (e) {
      console.warn("project-demo: hero3d needs WebGL, scene skipped");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(view.clientWidth || 640, view.clientHeight || 360, false);
    camera.aspect = (view.clientWidth || 640) / (view.clientHeight || 360);
    camera.updateProjectionMatrix();
    view.appendChild(renderer.domElement);
    if (p.shape === "knot") {
      var knot = new THREE.TorusKnotGeometry(1.2, 0.35, 160, 20);
      scene.add(new THREE.LineSegments(new THREE.WireframeGeometry(knot), new THREE.LineBasicMaterial({ color: colour("--accent") })));
    } else {
      var count = 600;
      var xyz = new Float32Array(count * 3);
      for (var i = 0; i < count; i++) {
        var theta = kit.rand() * Math.PI * 2;
        var z = kit.rand() * 2 - 1;
        var r = 1 + kit.rand() * 1.8;
        var s = Math.sqrt(1 - z * z);
        xyz.set([r * s * Math.cos(theta), r * z, r * s * Math.sin(theta)], i * 3);
      }
      var geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(xyz, 3));
      scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: colour("--accent"), size: 0.06 })));
    }
    var rad = (p.orbit_deg * Math.PI) / 180;
    var cam = { k: 0 };
    var paint = function () {
      var a = cam.k * rad;
      var dist = 6.5 - cam.k;
      camera.position.set(Math.sin(a) * dist, 0.5 + cam.k * 0.8, Math.cos(a) * dist);
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    paint();
    tl.from(view, { autoAlpha: 0, duration: m.enter }, 0);
    tl.to(cam, { k: 1, duration: kit.dur, ease: "none", onUpdate: paint }, 0);
  },
};
