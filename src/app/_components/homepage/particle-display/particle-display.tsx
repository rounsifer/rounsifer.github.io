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

const sphere: Build = (count) => {
  const p = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = RADIUS * Math.cbrt(Math.random());
    p.set(
      [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      ],
      i * 3,
    );
  }
  return p;
};

const galaxy: Build = (count) => {
  const p = new Float32Array(count * 3);
  const arms = 3;
  for (let i = 0; i < count; i++) {
    const t = Math.random();
    const dist = t * 0.42;
    const arm = Math.floor(Math.random() * arms);
    const angle = arm * ((Math.PI * 2) / arms) + dist * 7.0;
    const jitter = (Math.random() - 0.5) * 0.05;
    p.set(
      [
        Math.cos(angle) * dist + jitter,
        (Math.random() - 0.5) * 0.05 * (1 - t * 0.7),
        Math.sin(angle) * dist + jitter,
      ],
      i * 3,
    );
  }
  return p;
};

const torus: Build = (count) => {
  const p = new Float32Array(count * 3);
  const R = 0.3;
  const r = 0.12;
  for (let i = 0; i < count; i++) {
    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI * 2;
    p.set(
      [
        (R + r * Math.cos(v)) * Math.cos(u),
        r * Math.sin(v),
        (R + r * Math.cos(v)) * Math.sin(u),
      ],
      i * 3,
    );
  }
  return p;
};

const cube: Build = (count) => {
  const p = new Float32Array(count * 3);
  const h = 0.3;
  for (let i = 0; i < count; i++) {
    const a = (Math.random() * 2 - 1) * h;
    const b = (Math.random() * 2 - 1) * h;
    const face = Math.floor(Math.random() * 6);
    const xyz =
      face === 0
        ? [h, a, b]
        : face === 1
          ? [-h, a, b]
          : face === 2
            ? [a, h, b]
            : face === 3
              ? [a, -h, b]
              : face === 4
                ? [a, b, h]
                : [a, b, -h];
    p.set(xyz, i * 3);
  }
  return p;
};

const grid: Build = (count) => {
  const p = new Float32Array(count * 3);
  const n = 9;
  const nodes = n * n * n;
  const span = 0.74;
  const jitter = 0.008;
  for (let i = 0; i < count; i++) {
    const node = i % nodes;
    const ix = node % n;
    const iy = Math.floor(node / n) % n;
    const iz = Math.floor(node / (n * n)) % n;
    p.set(
      [
        (ix / (n - 1) - 0.5) * span + (Math.random() - 0.5) * jitter,
        (iy / (n - 1) - 0.5) * span + (Math.random() - 0.5) * jitter,
        (iz / (n - 1) - 0.5) * span + (Math.random() - 0.5) * jitter,
      ],
      i * 3,
    );
  }
  return p;
};

const wave: Build = (count) => {
  const p = new Float32Array(count * 3);
  const span = 0.82;
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * span;
    const z = (Math.random() - 0.5) * span;
    const d = Math.sqrt(x * x + z * z);
    const y = Math.sin(d * 16.0) * 0.07 + Math.sin(x * 10.0) * 0.02;
    p.set([x, y, z], i * 3);
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

type ShapeDef = { name: string; build: Build };
const THEMES: Record<"default" | "medtronic" | "raytheon", ShapeDef[]> = {
  default: [
    { name: "Orb", build: sphere },
    { name: "Galaxy", build: galaxy },
    { name: "Torus", build: torus },
    { name: "Cube", build: cube },
    { name: "Grid", build: grid },
    { name: "Wave", build: wave },
  ],
  medtronic: [
    { name: "Heart", build: heart },
    { name: "Pulse", build: heartbeat },
    { name: "Pill", build: pill },
    { name: "Cross", build: cross },
  ],
  raytheon: [
    { name: "Radar", build: radar },
    { name: "Orbit", build: orbit },
    { name: "Signal", build: signal },
    { name: "Globe", build: globe },
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
  const [sets] = useState<Record<ThemeKey, Float32Array[]>>(() => ({
    default: THEMES.default.map((s) => s.build(count)),
    medtronic: THEMES.medtronic.map((s) => s.build(count)),
    raytheon: THEMES.raytheon.map((s) => s.build(count)),
  }));
  const [renderBuffer] = useState(() => sets.default[0]!.slice());

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uRadius: { value: 0.5 } }),
    [],
  );

  const morph = useRef({
    theme: "default" as ThemeKey,
    idx: 0,
    from: new Float32Array(count * 3),
    t: 1,
  });

  useFrame((state, delta) => {
    const attr = points.current?.geometry.attributes.position;
    if (!attr) return;
    const arr = attr.array as Float32Array;
    const set = sets[theme];
    const idx = active % set.length;
    const target = set[idx];
    if (!target) return;
    const m = morph.current;

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
    if (uTime) uTime.value = state.clock.elapsedTime;
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
