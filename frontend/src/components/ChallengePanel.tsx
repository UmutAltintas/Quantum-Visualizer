"use client";

import { useState, useCallback, useEffect } from "react";
import { verifyChallenge } from "@/lib/api";
import { PlacedGate, ChallengeVerifyResult } from "@/lib/types";
import { Trophy, CheckCircle2, XCircle, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface Challenge {
  id: string;
  title: string;
  description: string;
  numQubits: number;
}

interface ChallengePanelProps {
  challenges: Challenge[];
  gates: PlacedGate[];
  numQubits: number;
  onSelectChallenge: (c: Challenge | null) => void;
  activeChallenge: Challenge | null;
}

export function ChallengePanel({
  challenges,
  gates,
  numQubits,
  onSelectChallenge,
  activeChallenge,
}: ChallengePanelProps) {
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<ChallengeVerifyResult | null>(null);

  // Reset result when gates change
  useEffect(() => {
    setResult(null);
  }, [gates]);

  const handleVerify = useCallback(async () => {
    if (!activeChallenge) return;
    setVerifying(true);
    setResult(null);
    try {
      const res = await verifyChallenge({
        challengeId: activeChallenge.id,
        numQubits,
        gates,
      });
      setResult(res);
    } catch {
      setResult({
        passed: false,
        expected: {},
        actual: {},
        message: "Verification failed — check your circuit.",
      });
    } finally {
      setVerifying(false);
    }
  }, [activeChallenge, numQubits, gates]);

  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
      <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <Trophy className="h-3.5 w-3.5 text-amber-400" />
        Guided Challenges
      </h2>

      {!activeChallenge ? (
        /* ── Challenge list ── */
        <div className="space-y-2">
          {challenges.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectChallenge(c)}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-900/40 px-4 py-3 text-left transition-all hover:bg-slate-700/40 hover:border-slate-600/60 group"
            >
              <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-200">{c.title}</div>
                <div className="text-xs text-slate-400 truncate">{c.description}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
            </button>
          ))}
        </div>
      ) : (
        /* ── Active challenge ── */
        <div className="space-y-4">
          <button
            onClick={() => {
              onSelectChallenge(null);
              setResult(null);
            }}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            ← Back to challenges
          </button>

          <div className="rounded-lg bg-slate-900/50 border border-slate-700/30 p-4">
            <h3 className="text-sm font-semibold text-amber-400 mb-1">
              {activeChallenge.title}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {activeChallenge.description}
            </p>
            <p className="mt-2 text-[10px] text-slate-500">
              {activeChallenge.numQubits} qubits required
            </p>
          </div>

          <button
            onClick={handleVerify}
            disabled={verifying || gates.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {verifying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {verifying ? "Checking…" : "Verify Solution"}
          </button>

          {/* Verification result */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className={`rounded-lg border p-4 ${
                  result.passed
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-red-500/30 bg-red-500/10"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {result.passed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400" />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      result.passed ? "text-emerald-300" : "text-red-300"
                    }`}
                  >
                    {result.passed ? "Challenge Complete!" : "Not Quite Right"}
                  </span>
                </div>
                <p
                  className={`text-xs ${
                    result.passed ? "text-emerald-300/80" : "text-red-300/80"
                  }`}
                >
                  {result.message}
                </p>

                {/* Show expected vs actual for failed attempts */}
                {!result.passed &&
                  Object.keys(result.expected).length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                        Expected probabilities:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(result.expected).map(
                          ([state, prob]) =>
                            prob > 0 && (
                              <span
                                key={state}
                                className="rounded bg-slate-800/80 px-1.5 py-0.5 font-mono text-[10px] text-slate-300"
                              >
                                |{state}⟩: {(prob * 100).toFixed(0)}%
                              </span>
                            )
                        )}
                      </div>
                    </div>
                  )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
