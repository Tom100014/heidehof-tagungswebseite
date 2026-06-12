import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles } from "@react-three/drei";
import * as THREE from "three";

/**
 * Animated golden torus + distorted icosahedron + particle field.
 * Lightweight, GPU-friendly. Pointer events disabled so it never blocks UI.
 */
function FloatingGeometry() {
  const torusRef = useRef<THREE.Mesh>(null);
  const icoRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (torusRef.current) {
      torusRef.current.rotation.x = t * 0.15;
      torusRef.current.rotation.y = t * 0.22;
    }
    if (icoRef.current) {
      icoRef.current.rotation.x = -t * 0.18;
      icoRef.current.rotation.z = t * 0.1;
    }
  });

  // Heidehof gold ≈ #C9A66B
  const gold = useMemo(() => new THREE.Color("#c9a66b"), []);
  const goldDeep = useMemo(() => new THREE.Color("#8a6d3b"), []);

  return (
    <>
      <Float speed={1.2} rotationIntensity={0.6} floatIntensity={1.4}>
        <mesh ref={torusRef} position={[2.4, 0.4, -1]} scale={1.1}>
          <torusKnotGeometry args={[1, 0.28, 220, 32]} />
          <meshStandardMaterial
            color={gold}
            metalness={0.95}
            roughness={0.18}
            emissive={goldDeep}
            emissiveIntensity={0.25}
          />
        </mesh>
      </Float>

      <Float speed={0.9} rotationIntensity={1.4} floatIntensity={2}>
        <mesh ref={icoRef} position={[-2.6, -0.6, 0.5]} scale={1.4}>
          <icosahedronGeometry args={[1, 6]} />
          <MeshDistortMaterial
            color={gold}
            metalness={0.85}
            roughness={0.22}
            distort={0.32}
            speed={1.4}
            emissive={goldDeep}
            emissiveIntensity={0.18}
          />
        </mesh>
      </Float>
    </>
  );
}

export const Hero3D = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.35} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} color="#fff5d6" />
          <directionalLight position={[-5, -2, -3]} intensity={0.6} color="#c9a66b" />
          <FloatingGeometry />
          <Sparkles count={80} scale={[10, 6, 4]} size={2.4} speed={0.4} color="#e9cb8a" opacity={0.7} />
          <pointLight position={[0, 3, 4]} intensity={0.8} color="#e9cb8a" />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Hero3D;
