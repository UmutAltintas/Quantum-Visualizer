"use client";

import { QuantumLab } from "@/components/QuantumLab";
import { Atom } from "lucide-react";

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="flex items-center justify-center gap-3 text-4xl font-bold tracking-tight">
          <Atom className="h-9 w-9 text-indigo-400" />
          Quantum Algorithm Visualizer
        </h1>
        <p className="mt-2 text-slate-400">
          Drag quantum gates onto the circuit, then simulate to see measurement
          probabilities.
        </p>
      </header>
      <QuantumLab />
    </main>
  );
}
