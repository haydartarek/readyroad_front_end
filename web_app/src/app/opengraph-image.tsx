import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

const readyRoadLogo = `data:image/png;base64,${readFileSync(
  path.join(process.cwd(), "public", "icons", "icon-192.png"),
).toString("base64")}`;

export const alt = "ReadyRoad Belgian driving theory exam preparation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f8fafc",
          color: "#172033",
          padding: "72px 80px",
          fontFamily: "Arial, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            width: 18,
            height: "100%",
            background: "#ce431c",
            position: "absolute",
            left: 0,
            top: 0,
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={readyRoadLogo}
            alt=""
            width={78}
            height={78}
            style={{ borderRadius: 18 }}
          />
          <div style={{ display: "flex", fontSize: 42, fontWeight: 800 }}>
            ReadyRoad
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              maxWidth: 940,
              fontSize: 68,
              lineHeight: 1.08,
              fontWeight: 800,
              letterSpacing: 0,
            }}
          >
            Belgian driving theory, made clear.
          </div>
          <div
            style={{
              display: "flex",
              maxWidth: 900,
              color: "#465166",
              fontSize: 30,
              lineHeight: 1.35,
            }}
          >
            Traffic signs, structured lessons and focused exam preparation in
            four languages.
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, fontSize: 23, fontWeight: 700 }}>
          {[
            "184 traffic signs",
            "30 theory lessons",
            "EN / NL / FR / AR",
          ].map((item) => (
            <div
              key={item}
              style={{
                display: "flex",
                border: "2px solid #cbd5e1",
                borderRadius: 999,
                padding: "12px 20px",
                background: "#ffffff",
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
