import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Elfgents — the elf that checks your agent's work";

// Social card: Discord-blurple field + Elf deep-green tile + cream type.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #5865F2 0%, #4752C4 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 28,
              background: "linear-gradient(135deg, #0F6E56, #1D9E75)",
              color: "#F1EFE8",
              fontSize: 60,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            E
          </div>
          <div style={{ color: "#9FE1CB", fontSize: 30, fontWeight: 700, letterSpacing: 2 }}>
            ELFGENTS
          </div>
        </div>

        <div
          style={{
            marginTop: 40,
            color: "white",
            fontSize: 78,
            fontWeight: 800,
            lineHeight: 1.05,
            maxWidth: 1000,
          }}
        >
          The elf that checks your agent&apos;s work.
        </div>

        <div style={{ marginTop: 28, color: "rgba(255,255,255,0.85)", fontSize: 34 }}>
          Verify · Recon · Validate — paid, callable, on CROO.
        </div>

        <div style={{ display: "flex", marginTop: 44 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 999,
              padding: "14px 28px",
              color: "white",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            <div style={{ width: 16, height: 16, borderRadius: 999, background: "#57F287" }} />
            Live on the CROO Agent Protocol
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
