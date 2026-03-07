'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

interface AntigravityProps {
    count?: number;
    magnetRadius?: number;
    ringRadius?: number;
    waveSpeed?: number;
    waveAmplitude?: number;
    particleSize?: number;
    lerpSpeed?: number;
    color?: string;
    autoAnimate?: boolean;
    particleVariance?: number;
    rotationSpeed?: number;
    depthFactor?: number;
    pulseSpeed?: number;
    particleShape?: 'circle' | 'square' | 'capsule';
    fieldStrength?: number;
}

const AntigravityInner = ({
    count = 200, // Reduced count for cleaner look
    magnetRadius = 12,
    ringRadius = 10,
    waveSpeed = 0.2,
    waveAmplitude = 2,
    particleSize = 1.2,
    lerpSpeed = 0.08,
    color = '#a855f7', // Vivid Purple/Pink default
    autoAnimate = true,
    particleVariance = 2,
    rotationSpeed = 0,
    depthFactor = 1.5,
    pulseSpeed = 2,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    particleShape = 'capsule',
    fieldStrength = 15
}: AntigravityProps) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const { viewport, mouse } = useThree();
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Particle data
    const particles = useMemo(() => {
        const temp = [];
        const width = viewport.width;
        const height = viewport.height;

        for (let i = 0; i < count; i++) {
            // Distribute more widely
            const x = (Math.random() - 0.5) * width * 2;
            const y = (Math.random() - 0.5) * height * 2;
            const z = (Math.random() - 0.5) * 15 * depthFactor;

            temp.push({
                x, y, z,
                origX: x, origY: y, origZ: z,
                vx: 0, vy: 0, vz: 0,
                size: Math.random() * particleVariance + 0.5,
                phase: Math.random() * Math.PI * 2,
                // Random rotation for capsules
                rotX: Math.random() * Math.PI,
                rotY: Math.random() * Math.PI,
                rotZ: Math.random() * Math.PI
            });
        }
        return temp;
    }, [count, viewport, depthFactor, particleVariance]);

    useFrame((state) => {
        const mesh = meshRef.current;
        if (!mesh) return;

        const time = state.clock.getElapsedTime();

        // Mouse conversion
        const mouseX = (state.pointer.x * viewport.width) / 2;
        const mouseY = (state.pointer.y * viewport.height) / 2;

        particles.forEach((p, i) => {
            // 1. Flowing Wave Motion (Simplex-like)
            const waveX = Math.cos(time * waveSpeed + p.phase) * waveAmplitude * 0.3;
            const waveY = Math.sin(time * waveSpeed * 0.8 + p.phase) * waveAmplitude;

            let targetX = p.origX + waveX;
            let targetY = p.origY + waveY;
            let targetZ = p.origZ;

            // 2. Mouse Repulsion Field (Anti-Gravity)
            const dx = mouseX - p.x;
            const dy = mouseY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < magnetRadius) {
                const force = (magnetRadius - dist) / magnetRadius;
                const angle = Math.atan2(dy, dx);

                // Push away logic
                const pushX = Math.cos(angle) * force * fieldStrength;
                const pushY = Math.sin(angle) * force * fieldStrength;

                // Add velocity
                p.vx -= pushX * 0.08;
                p.vy -= pushY * 0.08;
                p.vz -= force * 2; // Also push back in Z for 3D feel
            }

            // 3. Auto Animation
            if (autoAnimate) {
                // Gentle pulse in Z
                targetZ += Math.sin(time * pulseSpeed + p.phase) * 2;
            }

            // Physics: Spring to target
            p.vx += (targetX - p.x) * lerpSpeed;
            p.vy += (targetY - p.y) * lerpSpeed;
            p.vz += (targetZ - p.z) * lerpSpeed;

            // Friction
            p.vx *= 0.9;
            p.vy *= 0.9;
            p.vz *= 0.9;

            // Update position
            p.x += p.vx;
            p.y += p.vy;
            p.z += p.vz;

            // Update Instance
            dummy.position.set(p.x, p.y, p.z);

            // Dynamic scale based on Z (depth perception)
            // Closer particles (higher Z) appear slightly larger naturally, but let's enhance
            const scale = p.size * particleSize * 0.15;
            dummy.scale.set(scale, scale, scale);

            // Continuous gentle rotation
            dummy.rotation.set(
                p.rotX + time * 0.1,
                p.rotY + time * 0.15,
                p.rotZ
            );

            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        });

        mesh.instanceMatrix.needsUpdate = true;
    });

    return (
        <>
            <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
                {/* Capsule Geometry for the "Pill" look found in Google's design system */}
                <capsuleGeometry args={[0.2, 0.8, 4, 8]} />
                <meshStandardMaterial
                    color={color}
                    // Emissive makes it glow with Bloom
                    emissive={color}
                    emissiveIntensity={1.5}
                    roughness={0.1}
                    metalness={0.9}
                />
            </instancedMesh>

            {/* Lighting environment */}
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color={color} />
        </>
    );
};

const Antigravity = (props: AntigravityProps) => {
    return (
        <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
            <Canvas
                camera={{ position: [0, 0, 25], fov: 60 }}
                dpr={[1, 1.5]}
                gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
            >
                <AntigravityInner {...props} />
                <EffectComposer>
                    {/* Bloom for that Neon/Cyber look matching the reference style */}
                    <Bloom
                        luminanceThreshold={0.2}
                        luminanceSmoothing={0.9}
                        height={300}
                        intensity={1.2}
                        radius={0.6}
                    />
                </EffectComposer>
            </Canvas>
        </div>
    );
};

export default Antigravity;
