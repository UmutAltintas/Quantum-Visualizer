"use client";

import { useMemo } from "react";
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

/* ── Isometric-style projection ── */
// Camera angles for a nice 3/4 view
const AZIMUTH = -Math.PI / 6; // 30° rotation around vertical
const ELEVATION = Math.PI / 6; // 30° tilt up

const cosA = Math.cos(AZIMUTH);
const sinA = Math.sin(AZIMUTH);
const cosE = Math.cos(ELEVATION);
const sinE = Math.sin(ELEVATION);

/** Project Bloch (x, y, z) where Z is vertical to 2D (sx, sy) in [-1,1]. */
function project(bx: number, by: number, bz: number): [number, number] {
  // Rotate around Z (vertical) by azimuth
  const rx = bx * cosA - by * sinA;
  const ry = bx * sinA + by * cosA;
  const rz = bz;
  // Tilt by elevation: project Y into depth, Z into screen-Y
  const sx = rx;
  const sy = -(rz * cosE - ry * sinE);
  return [sx, sy];
}

/** Depth for z-ordering (higher = closer to viewer) */
function depth(bx: number, by: number, bz: number): number {
  const ry = bx * sinA + by * cosA;
  return ry * cosE + bz * sinE;
}

/** Generate ellipse path for a great circle */
function greatCirclePath(
  cx: number,
  cy: number,
  r: number,
  plane: "xy" | "xz" | "yz",
  segments = 72
): string {
  const pts: string[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    let bx = 0,
      by = 0,
      bz = 0;
    if (plane === "xy") {
      bx = Math.cos(t);
      by = Math.sin(t);
    } else if (plane === "xz") {
      bx = Math.cos(t);
      bz = Math.sin(t);
    } else {
      by = Math.cos(t);
      bz = Math.sin(t);
    }
    const [sx, sy] = project(bx, by, bz);
    pts.push(`${cx + sx * r},${cy + sy * r}`);
  }
  return `M${pts.join("L")}`;
}

/** SVG-based Bloch Sphere visualization */
function BlochSphereSVG({ coords }: { coords: BlochCoords }) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const R = 85; // sphere radius in pixels

  const arrowEnd = useMemo(() => {
    const [sx, sy] = project(coords.x, coords.y, coords.z);
    return { x: cx + sx * R, y: cy + sy * R };
  }, [coords.x, coords.y, coords.z]);

  // Axis endpoints
  const axes = useMemo(() => {
    const len = 1.25;
    return {
      xPos: project(len, 0, 0),
      xNeg: project(-len, 0, 0),
      yPos: project(0, len, 0),
      yNeg: project(0, -len, 0),
      zPos: project(0, 0, len),
      zNeg: project(0, 0, -len),
    };
  }, []);

  // Great circle paths
  const circles = useMemo(
    () => ({
      xy: greatCirclePath(cx, cy, R, "xy"),
      xz: greatCirclePath(cx, cy, R, "xz"),
      yz: greatCirclePath(cx, cy, R, "yz"),
    }),
    []
  );

  // Vector depth determines if it's in front or behind sphere center
  const vecDepth = depth(coords.x, coords.y, coords.z);
  const tipOpacity = vecDepth >= 0 ? 1 : 0.5;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full h-full"
      style={{ maxHeight: 260 }}
    >
      <defs>
        <radialGradient id="sphereGrad" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#4338ca" stopOpacity="0.05" />
        </radialGradient>
        <marker
          id="arrowHead"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="4"
          orient="auto"
        >
          <path d="M0,1 L6,4 L0,7" fill="#fbbf24" />
        </marker>
      </defs>

      {/* Sphere fill */}
      <circle cx={cx} cy={cy} r={R} fill="url(#sphereGrad)" />
      <circle
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke="#a5b4fc"
        strokeWidth="1.5"
        opacity="0.3"
      />

      {/* Great circles */}
      <path
        d={circles.xy}
        fill="none"
        stroke="#475569"
        strokeWidth="0.7"
        opacity="0.5"
      />
      <path
        d={circles.xz}
        fill="none"
        stroke="#475569"
        strokeWidth="0.7"
        opacity="0.5"
      />
      <path
        d={circles.yz}
        fill="none"
        stroke="#475569"
        strokeWidth="0.7"
        opacity="0.5"
      />

      {/* Axes */}
      {(
        [
          ["xNeg", "xPos"],
          ["yNeg", "yPos"],
          ["zNeg", "zPos"],
        ] as const
      ).map(([neg, pos]) => (
        <line
          key={neg}
          x1={cx + axes[neg][0] * R}
          y1={cy + axes[neg][1] * R}
          x2={cx + axes[pos][0] * R}
          y2={cy + axes[pos][1] * R}
          stroke="#64748b"
          strokeWidth="0.8"
          strokeDasharray="3,3"
        />
      ))}

      {/* Axis labels */}
      <text
        x={cx + axes.xPos[0] * R + 8}
        y={cy + axes.xPos[1] * R + 3}
        fill="#94a3b8"
        fontSize="11"
        fontWeight="600"
      >
        X
      </text>
      <text
        x={cx + axes.yPos[0] * R + 6}
        y={cy + axes.yPos[1] * R + 4}
        fill="#94a3b8"
        fontSize="11"
        fontWeight="600"
      >
        Y
      </text>
      <text
        x={cx + axes.zPos[0] * R - 4}
        y={cy + axes.zPos[1] * R - 8}
        fill="#bae6fd"
        fontSize="11"
        fontWeight="bold"
      >
        |0⟩
      </text>
      <text
        x={cx + axes.zNeg[0] * R - 4}
        y={cy + axes.zNeg[1] * R + 14}
        fill="#fecaca"
        fontSize="11"
        fontWeight="bold"
      >
        |1⟩
      </text>

      {/* State vector arrow */}
      <line
        x1={cx}
        y1={cy}
        x2={arrowEnd.x}
        y2={arrowEnd.y}
        stroke="#fbbf24"
        strokeWidth="2.5"
        markerEnd="url(#arrowHead)"
        opacity={tipOpacity}
      />

      {/* Tip dot */}
      <circle
        cx={arrowEnd.x}
        cy={arrowEnd.y}
        r="4"
        fill="#fbbf24"
        opacity={tipOpacity}
      />

      {/* Origin dot */}
      <circle cx={cx} cy={cy} r="2" fill="#94a3b8" opacity="0.6" />
    </svg>
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
      <div className="mb-3 flex flex-wrap gap-1">
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

      {/* SVG Bloch sphere */}
      <div className="flex items-center justify-center rounded-lg bg-slate-900/60 border border-slate-700/30 p-2">
        <BlochSphereSVG coords={coords} />
      </div>

      {/* Coordinates display */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {(["x", "y", "z"] as const).map((axis) => (
          <div
            key={axis}
            className="rounded bg-slate-900/50 px-2 py-1.5 border border-slate-700/30"
          >
            <span className="text-[10px] uppercase text-slate-500">{axis}</span>
            <span className="ml-1 font-mono text-xs text-amber-300/80">
              {coords[axis].toFixed(3)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
