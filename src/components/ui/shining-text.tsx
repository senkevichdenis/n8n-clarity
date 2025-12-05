"use client"

import * as React from "react"
import { motion } from "motion/react";

interface ShiningTextProps {
  text: string;
}

export function ShiningText({ text }: ShiningTextProps) {
  return (
    <motion.span
      className="bg-[linear-gradient(110deg,#737373,35%,#fff,50%,#737373,75%,#737373)] bg-[length:200%_100%] bg-clip-text text-sm font-regular text-transparent inline-block"
      initial={{ backgroundPosition: "200% 0" }}
      animate={{ backgroundPosition: "-200% 0" }}
      transition={{
        repeat: Infinity,
        duration: 2,
        ease: "linear",
      }}
    >
      {text}
    </motion.span>
  );
}
