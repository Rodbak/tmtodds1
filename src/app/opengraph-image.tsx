import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "TMTODDS — Ghana's Football Picks & Proof of Results";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
          background: "#0B0C0F",
          backgroundImage:
            "repeating-linear-gradient(135deg, #15181F 0px, #15181F 14px, #191D26 14px, #191D26 28px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 40 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#CCFF33",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: 900,
              color: "#0B0C0F",
            }}
          >
            ⚡
          </div>
          <div style={{ fontSize: 44, fontWeight: 900, color: "#F2F4F7", letterSpacing: 2 }}>TMTODDS</div>
        </div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 900, color: "#F2F4F7", lineHeight: 1.05, maxWidth: 950 }}>
          Ghana&apos;s #1 betting <span style={{ color: "#CCFF33", marginLeft: 20 }}>slips</span>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#9AA3B2", marginTop: 30, fontWeight: 600 }}>
          Free daily pick · Proof of results · Members&apos; lounge
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#5B636F", marginTop: 50, fontWeight: 600 }}>
          18+ only · Gambling can be addictive · Play responsibly
        </div>
      </div>
    ),
    { ...size }
  );
}
