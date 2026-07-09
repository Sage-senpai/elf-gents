import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Apple touch icon — Elf deep-green tile with the cream wordmark initial.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0F6E56 0%, #1D9E75 100%)",
          color: "#F1EFE8",
          fontSize: 112,
          fontWeight: 800,
        }}
      >
        E
      </div>
    ),
    { ...size },
  );
}
