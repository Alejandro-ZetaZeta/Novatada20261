"use client";

// ============================================================
// components/ui/QRCodeWrapper.tsx
// Wrapper cliente para importar QRCode con ssr:false
// ============================================================

import dynamic from "next/dynamic";

const QRCode = dynamic(() => import("./QRCode"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: 200,
        height: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(124, 58, 237, 0.05)",
        borderRadius: "12px",
        border: "1px solid var(--color-border)",
      }}
    >
      <span className="spinner" />
    </div>
  ),
});

export default QRCode;
