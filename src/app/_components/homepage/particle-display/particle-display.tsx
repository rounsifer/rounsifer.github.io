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
const HOLD_SECONDS = 2.2; // dwell on each shape
const MORPH_SECONDS = 1.6; // transition time between shapes

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

const SHAPE_BUILDERS: Build[] = [sphere, galaxy, torus, cube];

function easeInOutCubic(x: number) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

type ParticlesProps = {
  count: number;
  reducedMotion: boolean;
  advanceRef: React.RefObject<boolean>;
};

const MorphingParticles = ({ count, reducedMotion, advanceRef }: ParticlesProps) => {
  const points = useRef<Points<BufferGeometry, ShaderMaterial>>(null!);

  // Generate every shape once (lazy initializer keeps the RNG out of render).
  const [shapes] = useState(() => SHAPE_BUILDERS.map((build) => build(count)));
  const [render] = useState(() => shapes[0]!.slice()); // mutable buffer fed to the GPU

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uRadius: { value: 0.5 } }),
    [],
  );

  const morph = useRef({ from: 0, to: 1 % shapes.length, t: 0, hold: HOLD_SECONDS });

  useFrame((state, delta) => {
    // Reduced motion: freeze the field entirely (no shimmer, no morph).
    if (reducedMotion) return;

    const dt = Math.min(delta, 0.05); // clamp to avoid jumps after tab refocus
    // Mutate via the material ref (not the memoized uniforms object directly).
    const uTime = points.current?.material.uniforms.uTime;
    if (uTime) uTime.value = state.clock.elapsedTime;

    const m = morph.current;
    if (advanceRef.current) {
      advanceRef.current = false;
      m.hold = 0; // a click skips the remaining dwell
    }

    if (m.hold > 0) {
      m.hold -= dt;
    } else {
      m.t += dt / MORPH_SECONDS;
      if (m.t >= 1) {
        m.t = 0;
        m.from = m.to;
        m.to = (m.to + 1) % shapes.length;
        m.hold = HOLD_SECONDS;
      }
    }

    const f = easeInOutCubic(Math.min(m.t, 1));
    const attr = points.current?.geometry.attributes.position;
    if (attr) {
      const arr = attr.array as Float32Array;
      const A = shapes[m.from]!;
      const B = shapes[m.to]!;
      for (let i = 0; i < arr.length; i++) arr[i] = A[i]! + (B[i]! - A[i]!) * f;
      attr.needsUpdate = true;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[render, 3]} />
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
  const advanceRef = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const fade_in_sequence: AnimationSequence = [
      [".particle-display", { opacity: [0, 1] }, { duration: 4, at: 0 }],
    ];
    void animate(fade_in_sequence);
  }, [prefersReducedMotion]);

  return (
    <div
      aria-hidden="true"
      title="Drag to rotate · scroll to zoom · click to change shape"
      onClick={() => {
        advanceRef.current = true;
      }}
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
          reducedMotion={prefersReducedMotion}
          advanceRef={advanceRef}
        />
      </Canvas>
    </div>
  );
};
