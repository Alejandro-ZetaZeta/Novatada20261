"use client";

// ============================================================
// components/ui/CountdownTimerWrapper.tsx
// Wrapper cliente para importar CountdownTimer con ssr:false
// ============================================================
// En Next.js 16 App Router, `dynamic` con `ssr: false` solo
// puede usarse en Client Components ("use client").
// ============================================================

import dynamic from "next/dynamic";

const CountdownTimer = dynamic(() => import("./CountdownTimer"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "88px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
        Cargando...
      </span>
    </div>
  ),
});

export default CountdownTimer;
