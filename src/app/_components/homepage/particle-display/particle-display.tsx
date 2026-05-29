"use client";
import { OrbitControls } from "@react-three/drei";
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
const CYCLE_MS = 4200;

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

const dna: Build = (count) => {
  const p = new Float32Array(count * 3);
  const height = 0.82;
  const radius = 0.14;
  const turns = 3;
  for (let i = 0; i < count; i++) {
    const r = Math.random();
    const y = (r - 0.5) * height;
    const angle = r * turns * Math.PI * 2;
    if (Math.random() < 0.82) {
      const a = angle + (Math.random() < 0.5 ? 0 : Math.PI);
      const j = (Math.random() - 0.5) * 0.01;
      p.set([Math.cos(a) * radius + j, y, Math.sin(a) * radius + j], i * 3);
    } else {
      const t2 = Math.random();
      const x1 = Math.cos(angle) * radius;
      const z1 = Math.sin(angle) * radius;
      const x2 = Math.cos(angle + Math.PI) * radius;
      const z2 = Math.sin(angle + Math.PI) * radius;
      p.set([x1 + (x2 - x1) * t2, y, z1 + (z2 - z1) * t2], i * 3);
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
    { name: "DNA", build: dna },
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

export const ParticleDisplay = ({ count = 10000 }: { count?: number }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { theme: ctxTheme } = useParticleTheme();
  const theme: ThemeKey = ctxTheme ?? "default";
  const shapes = THEMES[theme];
  const [active, setActive] = useState(0);

  // Auto-cycle within the current theme; a manual pick resets the timer.
  useEffect(() => {
    if (prefersReducedMotion) return;
    const len = THEMES[theme].length;
    const id = setInterval(() => setActive((a) => (a + 1) % len), CYCLE_MS);
    return () => clearInterval(id);
  }, [prefersReducedMotion, active, theme]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const fade_in_sequence: AnimationSequence = [
      [".particle-display", { opacity: [0, 1] }, { duration: 4, at: 0 }],
    ];
    void animate(fade_in_sequence);
  }, [prefersReducedMotion]);

  const activeIdx = active % shapes.length;

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div
        aria-hidden="true"
        title="Drag to rotate · scroll to zoom · click to change shape"
        onClick={() => setActive((a) => (a + 1) % THEMES[theme].length)}
        className="particle-display flex aspect-square w-full max-w-[320px] items-center justify-center lg:max-w-[420px]"
      >
        <Canvas
          camera={{ position: [1.5, 1.5, 1.5], fov: 50, near: 0.1, far: 100, zoom: 2.4 }}
        >
          <OrbitControls
            makeDefault
            enablePan={false}
            enableZoom
            minDistance={1.2}
            maxDistance={5}
            enableDamping
            autoRotate={!prefersReducedMotion}
            autoRotateSpeed={0.6}
          />
          <MorphingParticles
            count={count}
            theme={theme}
            active={active}
            reducedMotion={prefersReducedMotion}
          />
        </Canvas>
      </div>

      <div
        role="group"
        aria-label="Particle shape"
        className="flex flex-wrap justify-center gap-1.5"
      >
        {shapes.map((s, i) => (
          <button
            key={s.name}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={activeIdx === i}
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-colors ${
              activeIdx === i
                ? "bg-[#5786F5]/30 text-white"
                : "bg-[#6071e2]/10 text-zinc-400 hover:text-white"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
};
