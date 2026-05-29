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

import vertexShader from "./shaders/vertexShader.glsl";
import fragmentShader from "./shaders/fragmentShader.glsl";

const RADIUS = 0.45;
const MORPH_SECONDS = 1.6; // transition time between shapes
const CYCLE_MS = 4200; // auto-advance cadence

// ---- Shape generators: each returns a Float32Array of `count` xyz points,
// kept within ~RADIUS of the origin so the shader's size/colour math holds. ----

type Build = (count: number) => Float32Array;

const sphere: Build = (count) => {
  const p = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    // Volume fill (cube-root keeps density even) so distance-from-center
    // varies — gives the orb a warmer, larger-pointed core.
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

// 3D lattice — particles cluster tightly at each grid node so it reads as a
// crisp data cube / matrix of points rather than a fuzzy cloud.
const grid: Build = (count) => {
  const p = new Float32Array(count * 3);
  const n = 9; // 9 x 9 x 9 = 729 nodes
  const nodes = n * n * n;
  const span = 0.74;
  const jitter = 0.008;
  for (let i = 0; i < count; i++) {
    const node = i % nodes; // spread particles evenly across nodes
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

// Rippling surface — reads like a signal / waveform.
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

const SHAPES: { name: string; build: Build }[] = [
  { name: "Orb", build: sphere },
  { name: "Galaxy", build: galaxy },
  { name: "Torus", build: torus },
  { name: "Cube", build: cube },
  { name: "Grid", build: grid },
  { name: "Wave", build: wave },
];

function easeInOutCubic(x: number) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

type ParticlesProps = {
  count: number;
  active: number;
  reducedMotion: boolean;
};

const MorphingParticles = ({ count, active, reducedMotion }: ParticlesProps) => {
  const points = useRef<Points<BufferGeometry, ShaderMaterial>>(null!);

  // Build every shape once (lazy initializer keeps the RNG out of render).
  const [shapes] = useState(() => SHAPES.map((s) => s.build(count)));
  const [renderBuffer] = useState(() => shapes[0]!.slice());

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uRadius: { value: 0.5 } }),
    [],
  );

  // Tracks the in-flight morph: which shape we're showing and the lerp source.
  const morph = useRef({ shown: 0, from: shapes[0]!.slice(), t: 1 });

  useFrame((state, delta) => {
    const attr = points.current?.geometry.attributes.position;
    if (!attr) return;
    const arr = attr.array as Float32Array;
    const m = morph.current;

    if (reducedMotion) {
      // Snap to the active shape, no animation or shimmer.
      if (m.shown !== active) {
        arr.set(shapes[active]!);
        attr.needsUpdate = true;
        m.shown = active;
      }
      return;
    }

    const dt = Math.min(delta, 0.05); // clamp to avoid jumps after tab refocus
    const uTime = points.current?.material.uniforms.uTime;
    if (uTime) uTime.value = state.clock.elapsedTime;

    // Active changed → start a fresh morph from wherever we currently are.
    if (m.shown !== active) {
      m.from.set(arr);
      m.shown = active;
      m.t = 0;
    }

    if (m.t < 1) {
      m.t = Math.min(1, m.t + dt / MORPH_SECONDS);
      const f = easeInOutCubic(m.t);
      const target = shapes[active]!;
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
  const [active, setActive] = useState(0);

  // Auto-cycle through shapes; a manual pick (below) resets the timer because
  // `active` is a dependency, so the field dwells on a chosen shape before
  // resuming.
  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(
      () => setActive((a) => (a + 1) % SHAPES.length),
      CYCLE_MS,
    );
    return () => clearInterval(id);
  }, [prefersReducedMotion, active]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const fade_in_sequence: AnimationSequence = [
      [".particle-display", { opacity: [0, 1] }, { duration: 4, at: 0 }],
    ];
    void animate(fade_in_sequence);
  }, [prefersReducedMotion]);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div
        aria-hidden="true"
        title="Drag to rotate · scroll to zoom · click to change shape"
        onClick={() => setActive((a) => (a + 1) % SHAPES.length)}
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
        {SHAPES.map((s, i) => (
          <button
            key={s.name}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={active === i}
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-colors ${
              active === i
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
