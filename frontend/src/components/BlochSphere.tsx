"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, Line } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { Globe2 } from "lucide-react";

interface BlochCoords {
  x: number;
  y: number;
  z: number;
}

interface BlochSphereProps {
  blochCoords: BlochCoords[];
  selectedQubit: number;
  onSelectQubit: (q: number) => void;
}

/** The 3D sphere + vector rendered inside the Canvas */
function BlochSphere3D({ coords }: { coords: BlochCoords }) {
  // Generate wireframe circles for the three great circles
  const circleXY = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0));
    }
    return pts;
  }, []);

  const circleXZ = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)));
    }
    return pts;
  }, []);

  const circleYZ = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(0, Math.cos(angle), Math.sin(angle)));
    }
    return pts;
  }, []);

  return (
    <>
      {/* Semi-transparent sphere */}
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhongMaterial
          color="#6366f1"
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wireframe circles */}
      <Line points={circleXY} color="#334155" lineWidth={0.5} />
      <Line points={circleXZ} color="#334155" lineWidth={0.5} />
      <Line points={circleYZ} color="#334155" lineWidth={0.5} />

      {/* Axes */}
      <Line
        points={[new THREE.Vector3(-1.3, 0, 0), new THREE.Vector3(1.3, 0, 0)]}
        color="#475569"
        lineWidth={1}
      />
      <Line
        points={[new THREE.Vector3(0, -1.3, 0), new THREE.Vector3(0, 1.3, 0)]}
        color="#475569"
        lineWidth={1}
      />
      <Line
        points={[new THREE.Vector3(0, 0, -1.3), new THREE.Vector3(0, 0, 1.3)]}
        color="#475569"
        lineWidth={1}
      />

      {/* Axis labels */}
      <Text position={[1.5, 0, 0]} fontSize={0.15} color="#94a3b8">
        X
      </Text>
      <Text position={[0, 1.5, 0]} fontSize={0.15} color="#94a3b8">
        Y
      </Text>
      <Text position={[0, 0, 1.5]} fontSize={0.15} color="#94a3b8">
        |0⟩
      </Text>
      <Text position={[0, 0, -1.5]} fontSize={0.15} color="#94a3b8">
        |1⟩
      </Text>

      {/* State vector arrow */}
      <Line
        points={[
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(coords.x, coords.y, coords.z),
        ]}
        color="#f59e0b"
        lineWidth={3}
      />
      {/* Arrow tip sphere */}
      <mesh position={[coords.x, coords.y, coords.z]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.4} />
    </>
  );
}

export function BlochSpherePanel({
  blochCoords,
  selectedQubit,
  onSelectQubit,
}: BlochSphereProps) {
  const coords = blochCoords[selectedQubit] ?? { x: 0, y: 0, z: 1 };

  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
      <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <Globe2 className="h-3.5 w-3.5" />
        Bloch Sphere
      </h2>

      {/* Qubit selector tabs */}
      <div className="mb-3 flex gap-1">
        {blochCoords.map((_, i) => (
          <button
            key={i}
            onClick={() => onSelectQubit(i)}
            className={`rounded px-2.5 py-1 text-xs font-mono transition-colors ${
              i === selectedQubit
                ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/40"
                : "bg-slate-700/40 text-slate-400 border border-transparent hover:bg-slate-700/60"
            }`}
          >
            q[{i}]
          </button>
        ))}
      </div>

      {/* 3D Canvas */}
      <div className="h-64 w-full rounded-lg bg-slate-900/60 border border-slate-700/30 overflow-hidden">
        <Canvas camera={{ position: [2.5, 1.5, 2.5], fov: 40 }}>
          <BlochSphere3D coords={coords} />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            rotateSpeed={0.5}
          />
        </Canvas>
      </div>

      {/* Coordinates display */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {(["x", "y", "z"] as const).map((axis) => (
          <div
            key={axis}
            className="rounded bg-slate-900/50 px-2 py-1.5 border border-slate-700/30"
          >
            <span className="text-[10px] uppercase text-slate-500">{axis}</span>
            <span className="ml-1 font-mono text-xs text-amber-400">
              {coords[axis].toFixed(3)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
