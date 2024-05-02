import { OrbitControls, Stage } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Quaternion, Vector3, MathUtils, AdditiveBlending, ShaderMaterial } from "three";
import { type Points, type Mesh } from "three";

import vertexShader from "./shaders/vertexShader.glsl";
import fragmentShader from "./shaders/fragmentShader.glsl";


export const ParticleDisplay = () => {

    return (
        <main className="flex h-[200px]  w-[200px]">
            <Canvas className="flex " camera={{ position: [1.5, 1.5, 1.5], zoom: 4, near: 1, far: 1000 }}>
                <OrbitControls />
                {/* <ambientLight intensity={0.5} /> */}
                {/* <directionalLight position={[-1, 2, 2]} intensity={4} /> */}
                {/* <BasicParticles /> */}
                <CustomGeometryParticles count={2000} />
            </Canvas>

        </main>
    );
}


const TwistedBox = () => {

    const mesh = useRef<Mesh>(null);
    const quaternion = new Quaternion();

    useEffect(() => {
        // Get the current attributes of the geometry
        const currentPositions = mesh.current?.geometry.attributes.position;
        // Copy the 
        if (currentPositions) {

            const originalPositions = currentPositions.clone();
            const originalPositionsArray = originalPositions?.array || [];

            // Go through each vector (series of 3 values) and modify the values
            for (let i = 0; i < originalPositionsArray.length; i = i + 3) {
                const modifiedPositionVector = new Vector3(originalPositionsArray[i], originalPositionsArray[i + 1], originalPositionsArray[i + 2]);
                const upVector = new Vector3(0, 1, 0);

                // Rotate along the y axis (0, 1, 0)
                quaternion.setFromAxisAngle(
                    upVector,
                    (Math.PI / 180) * (modifiedPositionVector.y + 10) * 100 // the higher along the y axis the vertex is, the more we rotate
                );
                modifiedPositionVector.applyQuaternion(quaternion);

                // Apply the modified position vector coordinates to the current position attributes array
                currentPositions.array[i] = modifiedPositionVector.x
                currentPositions.array[i + 1] = modifiedPositionVector.y
                currentPositions.array[i + 2] = modifiedPositionVector.z
            }
            // Set the needsUpdate flag to "true"
            currentPositions.needsUpdate = true;

        }
    }, [])

    return (
        <mesh ref={mesh} position={[0, 0, 0]}>
            <boxGeometry args={[1, 1, 1, 10, 10, 10]} />
            <meshLambertMaterial color="hotpink" emissive="hotpink" />
        </mesh>
    );
}

const BasicParticles = () => {
    // This reference gives us direct access to our points
    const points = useRef<Points>(null);

    // You can see that, like our mesh, points also takes a geometry and a material,
    // but a specific material => pointsMaterial
    return (
        <points ref={points}>
            <sphereGeometry args={[3.5, 48, 48]} />
            <pointsMaterial color="#5786F5" size={0.015} sizeAttenuation />
        </points>
    );
};


type CustomGeometryParticlesProps = {
    count: number,
}

const CustomGeometryParticles = ({ count }: CustomGeometryParticlesProps) => {
    const radius = 0.5;

    // This reference gives us direct access to our points
    const points = useRef<Points>(null!);

    // Generate our positions attributes array
    const particlesPosition = useMemo(() => {
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const distance = Math.sqrt(Math.random()) * radius;
            const theta = MathUtils.randFloatSpread(360);
            const phi = MathUtils.randFloatSpread(360);

            const x = distance * Math.sin(theta) * Math.cos(phi)
            const y = distance * Math.sin(theta) * Math.sin(phi);
            const z = distance * Math.cos(theta);

            positions.set([x, y, z], i * 3);
        }

        return positions;
    }, [count]);

    const uniforms = useMemo(() => ({
        uTime: {
            value: 0.0
        },
        uRadius: {
            value: radius
        }
    }), [])

    useFrame((state) => {
        const { clock } = state;

        const material = points.current.material as ShaderMaterial;
        if (material?.uniforms.uTime?.value) {
            material.uniforms.uTime.value = clock.elapsedTime;
        }

    });

    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particlesPosition.length / 3}
                    array={particlesPosition}
                    itemSize={3}
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