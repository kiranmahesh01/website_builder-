import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Magic AI — free AI website builder";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
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
          background: "linear-gradient(135deg, #0a0a0b 0%, #141416 50%, #0f1410 100%)",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontStyle: "italic",
            color: "#f4f4f5",
            fontFamily: "Georgia, serif",
          }}
        >
          magic ai
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 52,
            fontWeight: 800,
            color: "#f4f4f5",
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          Your business in a sentence.
          <br />
          <span style={{ color: "#c8f542" }}>Your website in minutes.</span>
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 28,
            color: "#a1a1aa",
          }}
        >
          Free · No code · No API keys
        </div>
      </div>
    ),
    { ...size },
  );
}
