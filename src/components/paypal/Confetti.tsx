// ============================================
// TASKLYN — Lightweight confetti for payment success
// ============================================
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const colors = ["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899"];

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  size: number;
}

export default function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }

    const next: ConfettiPiece[] = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.25,
      size: 6 + Math.random() * 6,
    }));
    setPieces(next);

    const t = setTimeout(() => setPieces([]), 2500);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[150] overflow-hidden">
      <AnimatePresence>
        {pieces.map((p) => (
          <motion.div
            key={p.id}
            initial={{
              y: -20,
              x: `${p.x}vw`,
              opacity: 1,
              rotate: 0,
            }}
            animate={{
              y: "110vh",
              x: `${p.x + (Math.random() * 20 - 10)}vw`,
              opacity: [1, 1, 0],
              rotate: Math.random() * 720,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.8 + Math.random() * 0.7,
              delay: p.delay,
              ease: "linear",
            }}
            style={{
              position: "absolute",
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: Math.random() > 0.5 ? "50%" : "0%",
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
