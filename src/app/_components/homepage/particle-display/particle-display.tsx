"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AdditiveBlending,
  type Points,
  type BufferGeometry,
  type ShaderMaterial,
} from "three";

import { animate, type AnimationSequence } from "motion";

import { usePrefersReducedMotion } from "~/hooks/use-prefers-reduced-motion";
import { useParticleTheme } from "../../particle-theme";

import vertexShader from "./shaders/vertexShader.glsl";
import fragmentShader from "./shaders/fragmentShader.glsl";

const RADIUS = 0.45;
const MORPH_SECONDS = 1.6;
const CYCLE_MS = 8000; // ms each shape holds before morphing to the next

// --- Background tuning knobs (safe to change by number) ---
const COUNT = 65000; // particle count — higher = denser, bigger-feeling shapes
const CAMERA_ZOOM = 4.0; // higher = the shape fills more of the screen
const BG_OPACITY = 0.7; // overall background presence (readability vs presence)
const AUTO_ROTATE = 0.12; // radians/sec the field slowly spins

type Build = (count: number) => Float32Array;

// ---------------------------- Default shapes ----------------------------

// Milky Way: a barred spiral — central flattened bulge, a bar, and two
// logarithmic arms emanating from the bar ends in a thin disk.
const galaxy: Build = (count) => {
  const p = new Float32Array(count * 3);
  const maxR = 0.42;
  const arms = 2;
  const pitch = 0.22; // ~12.6deg arm pitch
  const barLen = 0.16; // half-length of the central bar
  for (let i = 0; i < count; i++) {
    const roll = Math.random();
    if (roll < 0.24) {
      // central bulge: dense, slightly flattened ellipsoid (warm core)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const rr = 0.12 * Math.cbrt(Math.random());
      p.set(
        [
          rr * Math.sin(phi) * Math.cos(theta),
          rr * Math.cos(phi) * 0.45,
          rr * Math.sin(phi) * Math.sin(theta),
        ],
        i * 3,
      );
    } else if (roll < 0.36) {
      // central bar through the bulge (along x)
      const bx = (Math.random() * 2 - 1) * barLen;
      const taper = 1 - (Math.abs(bx) / barLen) * 0.5;
      p.set(
        [
          bx,
          (Math.random() - 0.5) * 0.035 * taper,
          (Math.random() - 0.5) * 0.06 * taper,
        ],
        i * 3,
      );
    } else if (roll < 0.92) {
      // two logarithmic spiral arms from the bar ends
      const arm = Math.floor(Math.random() * arms);
      const t = Math.random();
      const r = barLen + (maxR - barLen) * t * t; // denser inner
      const theta =
        arm * ((Math.PI * 2) / arms) + Math.log(r / barLen) / Math.tan(pitch);
      const ax = Math.cos(theta);
      const az = Math.sin(theta);
      const spread = (Math.random() - 0.5 + Math.random() - 0.5) * 0.05; // arm width
      p.set(
        [
          ax * r - az * spread,
          (Math.random() - 0.5) * 0.025 * (1 - t * 0.6), // thin disk
          az * r + ax * spread,
        ],
        i * 3,
      );
    } else {
      // faint inter-arm disk scatter
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * maxR;
      p.set(
        [Math.cos(a) * r, (Math.random() - 0.5) * 0.03, Math.sin(a) * r],
        i * 3,
      );
    }
  }
  return p;
};

// ------------------------- Medtronic (cardiac) -------------------------

const heart: Build = (count) => {
  const p = new Float32Array(count * 3);
  const sc = 0.026;
  for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 2;
    const s = Math.cbrt(Math.random()); // fill toward edge
    let x = 16 * Math.pow(Math.sin(t), 3) * sc;
    let y =
      (13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t)) *
        sc +
      0.11; // shift up so the heart is centered
    x *= s;
    y *= s;
    const z = (Math.random() - 0.5) * 0.12 * (1 - s * 0.4);
    p.set([x, y, z], i * 3);
  }
  return p;
};

const heartbeat: Build = (count) => {
  const p = new Float32Array(count * 3);
  const width = 0.92;
  const beats = 2.2;
  const g = (u: number, c: number, w: number, h: number) =>
    h * Math.exp(-((u - c) * (u - c)) / (2 * w * w));
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * width;
    const u = (((x + width / 2) / width) * beats) % 1;
    const y =
      (g(u, 0.18, 0.03, 0.06) -
        g(u, 0.34, 0.015, 0.06) +
        g(u, 0.38, 0.012, 0.34) -
        g(u, 0.42, 0.015, 0.12) +
        g(u, 0.62, 0.05, 0.1)) *
      0.55;
    const band = (Math.random() - 0.5) * 0.015;
    const z = (Math.random() - 0.5) * 0.04;
    p.set([x, y + band, z], i * 3);
  }
  return p;
};

// Capsule / pill: a filled capsule along the x-axis (rejection-sampled volume).
const pill: Build = (count) => {
  const p = new Float32Array(count * 3);
  const half = 0.31; // half-length of the cylindrical body (clearly elongated)
  const r = 0.1; // radius
  let i = 0;
  while (i < count) {
    const x = (Math.random() * 2 - 1) * (half + r);
    const y = (Math.random() * 2 - 1) * r;
    const z = (Math.random() * 2 - 1) * r;
    // distance to the central segment [-half, half] along x
    const cx = Math.max(-half, Math.min(half, x));
    const dx = x - cx;
    if (dx * dx + y * y + z * z <= r * r) {
      p.set([x, y, z], i * 3);
      i++;
    }
  }
  return p;
};

const cross: Build = (count) => {
  const p = new Float32Array(count * 3);
  const arm = 0.4;
  const w = 0.14;
  const th = 0.09;
  for (let i = 0; i < count; i++) {
    const vert = Math.random() < 0.5;
    const x = (Math.random() * 2 - 1) * (vert ? w : arm);
    const y = (Math.random() * 2 - 1) * (vert ? arm : w);
    const z = (Math.random() * 2 - 1) * th;
    p.set([x, y, z], i * 3);
  }
  return p;
};

// ------------------- Raytheon (radar / aerospace / RF) -------------------

const radar: Build = (count) => {
  const p = new Float32Array(count * 3);
  const ringCount = 4;
  for (let i = 0; i < count; i++) {
    const roll = Math.random();
    if (roll < 0.8) {
      const ring = 1 + Math.floor(Math.random() * ringCount);
      const rad = (ring / ringCount) * 0.42;
      const a = Math.random() * Math.PI * 2;
      const j = (Math.random() - 0.5) * 0.008;
      p.set(
        [
          Math.cos(a) * (rad + j),
          (Math.random() - 0.5) * 0.02,
          Math.sin(a) * (rad + j),
        ],
        i * 3,
      );
    } else {
      const d = Math.random() * 0.42;
      const ang = roll < 0.9 ? 0.7 : Math.PI / 2; // sweep spoke + crosshair
      p.set([Math.cos(ang) * d, (Math.random() - 0.5) * 0.02, Math.sin(ang) * d], i * 3);
    }
  }
  return p;
};

const orbit: Build = (count) => {
  const p = new Float32Array(count * 3);
  const tilt = 0.5;
  const R = 0.4;
  for (let i = 0; i < count; i++) {
    const roll = Math.random();
    if (roll < 0.4) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.15 * Math.cbrt(Math.random());
      p.set(
        [
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi),
        ],
        i * 3,
      );
    } else {
      const onRing = roll < 0.92;
      const a = onRing ? Math.random() * Math.PI * 2 : 1.1 + (Math.random() - 0.5) * 0.3;
      const spread = onRing ? 0.012 : 0.05;
      const x = Math.cos(a) * R + (Math.random() - 0.5) * spread;
      const y0 = (Math.random() - 0.5) * spread;
      const z0 = Math.sin(a) * R + (Math.random() - 0.5) * spread;
      p.set([x, y0 * Math.cos(tilt) - z0 * Math.sin(tilt), y0 * Math.sin(tilt) + z0 * Math.cos(tilt)], i * 3);
    }
  }
  return p;
};

const signal: Build = (count) => {
  const p = new Float32Array(count * 3);
  const width = 0.92;
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * width;
    const y = (Math.sin(x * 20) * 0.5 + Math.sin(x * 9 + 1) * 0.3) * 0.22;
    const band = (Math.random() - 0.5) * 0.015;
    const z = (Math.random() - 0.5) * 0.04;
    p.set([x, y + band, z], i * 3);
  }
  return p;
};

const globe: Build = (count) => {
  const p = new Float32Array(count * 3);
  const R = 0.42;
  const latLines = 7;
  const lonLines = 9;
  for (let i = 0; i < count; i++) {
    if (Math.random() < 0.5) {
      const li = Math.floor(Math.random() * latLines);
      const lat = (li / (latLines - 1) - 0.5) * Math.PI * 0.9;
      const lon = Math.random() * Math.PI * 2;
      p.set(
        [R * Math.cos(lat) * Math.cos(lon), R * Math.sin(lat), R * Math.cos(lat) * Math.sin(lon)],
        i * 3,
      );
    } else {
      const lj = Math.floor(Math.random() * lonLines);
      const lon = (lj / lonLines) * Math.PI * 2;
      const lat = (Math.random() - 0.5) * Math.PI;
      p.set(
        [R * Math.cos(lat) * Math.cos(lon), R * Math.sin(lat), R * Math.cos(lat) * Math.sin(lon)],
        i * 3,
      );
    }
  }
  return p;
};

// ------------------- Default shapes: things Ron has built -------------------

// A shape is a buffer of positions plus an optional per-frame `animate` that
// mutates the buffer while the shape is on screen (so it can move/flow).
type ShapeInstance = {
  positions: Float32Array;
  animate?: (buf: Float32Array, t: number) => void;
};
type Factory = (count: number) => ShapeInstance;

// Wrap a static point-cloud builder as a (non-animated) factory.
const stat =
  (build: Build): Factory =>
  (count) => ({ positions: build(count) });

// Network graph: node clusters joined by edges, with particles flowing along
// the edges (comms moving through the graph).
const graphFactory: Factory = (count) => {
  const NODES = 18;
  const nodes: [number, number, number][] = [];
  for (let k = 0; k < NODES; k++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    const r = RADIUS * 0.85 * Math.cbrt(Math.random());
    nodes.push([
      r * Math.sin(ph) * Math.cos(th),
      r * Math.sin(ph) * Math.sin(th),
      r * Math.cos(ph),
    ]);
  }
  const edges: [number, number][] = [];
  for (let k = 0; k < NODES; k++) {
    for (let m = 0; m < 2; m++) {
      edges.push([k, (k + 1 + Math.floor(Math.random() * (NODES - 1))) % NODES]);
    }
  }
  const isEdge = new Uint8Array(count);
  const ref = new Int32Array(count);
  const phase = new Float32Array(count);
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    if (Math.random() < 0.32) {
      const n = nodes[Math.floor(Math.random() * NODES)]!;
      positions[i * 3] = n[0] + (Math.random() - 0.5) * 0.03;
      positions[i * 3 + 1] = n[1] + (Math.random() - 0.5) * 0.03;
      positions[i * 3 + 2] = n[2] + (Math.random() - 0.5) * 0.03;
    } else {
      isEdge[i] = 1;
      ref[i] = Math.floor(Math.random() * edges.length);
      phase[i] = Math.random();
    }
  }
  const animate = (buf: Float32Array, t: number) => {
    for (let i = 0; i < count; i++) {
      if (isEdge[i]) {
        const e = edges[ref[i]!]!;
        const a = nodes[e[0]]!;
        const b = nodes[e[1]]!;
        const f = (phase[i]! + t * 0.18) % 1; // packet position along the edge
        buf[i * 3] = a[0] + (b[0] - a[0]) * f;
        buf[i * 3 + 1] = a[1] + (b[1] - a[1]) * f;
        buf[i * 3 + 2] = a[2] + (b[2] - a[2]) * f;
      }
    }
  };
  animate(positions, 0);
  return { positions, animate };
};

// Drone swarm: a cohesive body of agents that coherently drift and jostle.
const swarmFactory: Factory = (count) => {
  const base = new Float32Array(count * 3);
  const seed = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    const r = 0.34 * Math.cbrt(Math.random());
    base[i * 3] = r * Math.sin(ph) * Math.cos(th) * 1.25; // elongated forward
    base[i * 3 + 1] = r * Math.cos(ph) * 0.8;
    base[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    seed[i * 3] = Math.random() * Math.PI * 2;
    seed[i * 3 + 1] = Math.random() * Math.PI * 2;
    seed[i * 3 + 2] = Math.random() * Math.PI * 2;
  }
  const positions = new Float32Array(count * 3);
  const animate = (buf: Float32Array, t: number) => {
    const gx = Math.sin(t * 0.6) * 0.05; // coherent group drift
    const gy = Math.sin(t * 0.5 + 1.3) * 0.04;
    const gz = Math.cos(t * 0.45) * 0.05;
    const amp = 0.025; // per-agent jitter
    for (let i = 0; i < count; i++) {
      buf[i * 3] = base[i * 3]! + gx + Math.sin(t * 1.4 + seed[i * 3]!) * amp;
      buf[i * 3 + 1] =
        base[i * 3 + 1]! + gy + Math.sin(t * 1.7 + seed[i * 3 + 1]!) * amp;
      buf[i * 3 + 2] =
        base[i * 3 + 2]! + gz + Math.sin(t * 1.2 + seed[i * 3 + 2]!) * amp;
    }
  };
  animate(positions, 0);
  return { positions, animate };
};

// WiFi / wardriving: nested radiating arcs (a signal fan) from a source point.
const wifi: Build = (count) => {
  const p = new Float32Array(count * 3);
  const rings = 4;
  const span = (130 * Math.PI) / 180;
  const baseY = -0.28;
  for (let i = 0; i < count; i++) {
    if (Math.random() < 0.12) {
      p.set(
        [
          (Math.random() - 0.5) * 0.04,
          baseY + (Math.random() - 0.5) * 0.04,
          (Math.random() - 0.5) * 0.04,
        ],
        i * 3,
      );
    } else {
      const ring = 1 + Math.floor(Math.random() * rings);
      const rad = (ring / rings) * 0.46;
      const a = Math.PI / 2 + (Math.random() - 0.5) * span;
      const jit = (Math.random() - 0.5) * 0.01;
      p.set(
        [
          Math.cos(a) * (rad + jit),
          baseY + Math.sin(a) * (rad + jit),
          (Math.random() - 0.5) * 0.02,
        ],
        i * 3,
      );
    }
  }
  return p;
};

// Particle filter: a belief cloud (dense estimate + diffuse uncertainty +
// competing hypotheses) that periodically converges/resamples toward the estimate.
const particleFilterFactory: Factory = (count) => {
  const base = new Float32Array(count * 3);
  const centers: [number, number, number][] = [
    [0, 0, 0],
    [0.22, 0.12, -0.1],
    [-0.18, -0.1, 0.14],
  ];
  const weights = [0.7, 0.18, 0.12];
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 0.66;
  for (let i = 0; i < count; i++) {
    const r = Math.random();
    let c = 0;
    let acc = 0;
    for (let k = 0; k < centers.length; k++) {
      acc += weights[k]!;
      if (r < acc) {
        c = k;
        break;
      }
    }
    const center = centers[c]!;
    const sd = c === 0 ? 0.14 : 0.09;
    base[i * 3] = center[0] + gauss() * sd;
    base[i * 3 + 1] = center[1] + gauss() * sd;
    base[i * 3 + 2] = center[2] + gauss() * sd;
  }
  const positions = new Float32Array(count * 3);
  const animate = (buf: Float32Array, t: number) => {
    const converge = Math.max(0, Math.sin(t * 0.5)) * 0.5; // resampling pulse
    const k = 1 - converge;
    for (let i = 0; i < count * 3; i++) buf[i] = base[i]! * k;
  };
  animate(positions, 0);
  return { positions, animate };
};

type ShapeDef = { name: string; factory: Factory };
const THEMES: Record<"default" | "medtronic" | "raytheon", ShapeDef[]> = {
  default: [
    { name: "Milky Way", factory: stat(galaxy) },
    { name: "Graph", factory: graphFactory },
    { name: "Swarm", factory: swarmFactory },
    { name: "WiFi", factory: stat(wifi) },
    { name: "Filter", factory: particleFilterFactory },
  ],
  medtronic: [
    { name: "Heart", factory: stat(heart) },
    { name: "Pulse", factory: stat(heartbeat) },
    { name: "Pill", factory: stat(pill) },
    { name: "Cross", factory: stat(cross) },
  ],
  raytheon: [
    { name: "Radar", factory: stat(radar) },
    { name: "Orbit", factory: stat(orbit) },
    { name: "Signal", factory: stat(signal) },
    { name: "Globe", factory: stat(globe) },
  ],
};
type ThemeKey = keyof typeof THEMES;

function easeInOutCubic(x: number) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

type ParticlesProps = {
  count: number;
  theme: ThemeKey;
  active: number;
  reducedMotion: boolean;
};

const MorphingParticles = ({ count, theme, active, reducedMotion }: ParticlesProps) => {
  const points = useRef<Points<BufferGeometry, ShaderMaterial>>(null!);

  // Build every shape of every theme once (lazy initializer keeps RNG out of render).
  const [sets] = useState<Record<ThemeKey, ShapeInstance[]>>(() => ({
    default: THEMES.default.map((s) => s.factory(count)),
    medtronic: THEMES.medtronic.map((s) => s.factory(count)),
    raytheon: THEMES.raytheon.map((s) => s.factory(count)),
  }));
  const [renderBuffer] = useState(() => sets.default[0]!.positions.slice());

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uRadius: { value: 0.5 } }),
    [],
  );

  const morph = useRef({
    theme: "default" as ThemeKey,
    idx: 0,
    from: new Float32Array(count * 3),
    t: 1,
    restStart: 0,
  });

  useFrame((state, delta) => {
    const attr = points.current?.geometry.attributes.position;
    if (!attr) return;
    const arr = attr.array as Float32Array;
    const set = sets[theme];
    const idx = active % set.length;
    const shape = set[idx];
    if (!shape) return;
    const target = shape.positions;
    const m = morph.current;
    const elapsed = state.clock.elapsedTime;

    if (reducedMotion) {
      if (m.theme !== theme || m.idx !== idx) {
        arr.set(target);
        attr.needsUpdate = true;
        m.theme = theme;
        m.idx = idx;
      }
      return;
    }

    const dt = Math.min(delta, 0.05);
    const uTime = points.current?.material.uniforms.uTime;
    if (uTime) uTime.value = elapsed;
    // Slow auto-spin (replaces OrbitControls autoRotate for the non-interactive bg).
    if (points.current) points.current.rotation.y += dt * AUTO_ROTATE;

    if (m.theme !== theme || m.idx !== idx) {
      m.from.set(arr);
      m.theme = theme;
      m.idx = idx;
      m.t = 0;
    }

    if (m.t < 1) {
      m.t = Math.min(1, m.t + dt / MORPH_SECONDS);
      const f = easeInOutCubic(m.t);
      for (let i = 0; i < arr.length; i++)
        arr[i] = m.from[i]! + (target[i]! - m.from[i]!) * f;
      attr.needsUpdate = true;
      if (m.t >= 1) m.restStart = elapsed; // mark when the shape settles
    } else if (shape.animate) {
      // Animated shapes keep moving while displayed (local time keeps the
      // hand-off from the morph seamless, since animate(buf, 0) === positions).
      shape.animate(arr, elapsed - m.restStart);
      attr.needsUpdate = true;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[renderBuffer, 3]} />
      </bufferGeometry>
      <shaderMaterial
        depthWrite={false}
        fragmentShader={fragmentShader}
        vertexShader={vertexShader}
        uniforms={uniforms}
        blending={AdditiveBlending}
      />
    </points>
  );
};

/**
 * Full-bleed ambient particle field rendered behind all page content.
 * Non-interactive (pointer-events: none) so the page scrolls/clicks normally;
 * it auto-cycles shapes and morphs to a company theme when an experience card
 * is hovered/focused (via ParticleThemeProvider).
 */
export const ParticleBackground = ({ count = COUNT }: { count?: number }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { theme: ctxTheme } = useParticleTheme();
  const theme: ThemeKey = ctxTheme ?? "default";
  const [active, setActive] = useState(0);

  // Auto-cycle through the active theme's shapes.
  useEffect(() => {
    if (prefersReducedMotion) return;
    const len = THEMES[theme].length;
    const id = setInterval(() => setActive((a) => (a + 1) % len), CYCLE_MS);
    return () => clearInterval(id);
  }, [prefersReducedMotion, active, theme]);

  // Gentle fade-in to the background opacity.
  useEffect(() => {
    if (prefersReducedMotion) return;
    const fade: AnimationSequence = [
      [".particle-bg", { opacity: [0, BG_OPACITY] }, { duration: 3, at: 0 }],
    ];
    void animate(fade);
  }, [prefersReducedMotion]);

  return (
    <div
      aria-hidden="true"
      style={{ opacity: BG_OPACITY }}
      className="particle-bg pointer-events-none fixed inset-0 -z-10"
    >
      <Canvas
        camera={{
          position: [1.5, 1.5, 1.5],
          fov: 50,
          near: 0.1,
          far: 100,
          zoom: CAMERA_ZOOM,
        }}
      >
        <MorphingParticles
          count={count}
          theme={theme}
          active={active}
          reducedMotion={prefersReducedMotion}
        />
      </Canvas>
    </div>
  );
};
