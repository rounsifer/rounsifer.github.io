"use client";
import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MathUtils,
  AdditiveBlending,
  type Points,
  type BufferGeometry,
  type ShaderMaterial,
} from "three";

import { animate, type AnimationSequence } from "motion";

import { usePrefersReducedMotion } from "~/hooks/use-prefers-reduced-motion";

import vertexShader from "./shaders/vertexShader.glsl";
import fragmentShader from "./shaders/fragmentShader.glsl";

export const ParticleDisplay = () => {
  const prefersReducedMotion = usePrefersReducedMotion();

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
      className="particle-display flex h-[300px] w-[300px] items-center  justify-center"
    >
      <Canvas
        className="flex "
        camera={{ position: [1.5, 1.5, 1.5], zoom: 4, near: 1, far: 1000 }}
      >
        <OrbitControls />
        <CustomGeometryParticles count={10000} reducedMotion={prefersReducedMotion} />
      </Canvas>
    </div>
  );
};

type CustomGeometryParticlesProps = {
  count: number;
  reducedMotion: boolean;
};

const CustomGeometryParticles = ({
  count,
  reducedMotion,
}: CustomGeometryParticlesProps) => {
  const radius = 0.5;

  // This reference gives us direct access to our points
  const points = useRef<Points<BufferGeometry, ShaderMaterial>>(null!);

  // Particle positions are randomized once on mount. A lazy useState
  // initializer keeps the impure random generation out of render (React 19
  // purity rule) while still running a single time.
  const [particlesPosition] = useState(() => {
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const distance = Math.sqrt(Math.random()) * radius;
      const theta = MathUtils.randFloatSpread(360);
      const phi = MathUtils.randFloatSpread(360);

      const x = distance * Math.sin(theta) * Math.cos(phi);
      const y = distance * Math.sin(theta) * Math.sin(phi);
      const z = distance * Math.cos(theta);

      positions.set([x, y, z], i * 3);
    }

    return positions;
  });

  const uniforms = useMemo(
    () => ({
      uTime: {
        value: 0.0,
      },
      uRadius: {
        value: radius,
      },
    }),
    [],
  );

  useFrame(({ clock }) => {
    // Freeze the field for users who prefer reduced motion.
    if (reducedMotion) return;
    const uTime = points.current?.material.uniforms.uTime;
    if (uTime) uTime.value = clock.elapsedTime;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particlesPosition, 3]}
        />
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
