"use client";

import { useState } from "react";

export default function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{ borderBottom: "1px solid #1a1a1a" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span style={{ color: "#f0f0f0", fontSize: "16px", fontWeight: 500 }}>{question}</span>
        <span
          style={{
            color: "#00ff88",
            fontSize: "22px",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          +
        </span>
      </button>
      {open && (
        <div style={{ color: "#bbbbbb", fontSize: "15px", lineHeight: 1.7, paddingBottom: "20px" }}>
          {answer}
        </div>
      )}
    </div>
  );
}
