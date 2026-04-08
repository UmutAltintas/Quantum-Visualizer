"use client";

import { QuantumLab } from "@/components/QuantumLab";

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          ⚛️ Quantum Algorithm Visualizer
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Drag quantum gates onto the circuit, then simulate to see measurement
          probabilities.
        </p>
      </header>
      <QuantumLab />
    </main>
  );
}
