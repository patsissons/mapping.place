import { ImageResponse } from "next/og";

import { siteConfig } from "@/lib/site";

export const size = {
  width: siteConfig.icon.size,
  height: siteConfig.icon.size,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          position: "relative",
          overflow: "hidden",
          borderRadius: "120px",
          background:
            "radial-gradient(circle at top left, #d6f3ee 0, transparent 38%), radial-gradient(circle at bottom right, #ffe2c2 0, transparent 34%), linear-gradient(145deg, #f7f2e9 0%, #fcf7ef 50%, #efe7db 100%)",
          fontFamily:
            '"Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif',
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "46px",
            borderRadius: "100px",
            border: `8px solid ${siteConfig.colors.cardLine}`,
            background:
              "linear-gradient(180deg, #eef8f4 0%, #fff6e8 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "46px",
            borderRadius: "100px",
            backgroundImage:
              "linear-gradient(90deg, #ffffff88 3px, transparent 3px), linear-gradient(180deg, #ffffff88 3px, transparent 3px)",
            backgroundSize: "74px 74px",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "152px",
            left: "58px",
            width: "320px",
            height: "152px",
            borderTop: `18px solid ${siteConfig.colors.primary}`,
            borderRadius: "999px",
            transform: "rotate(18deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "244px",
            left: "138px",
            width: "250px",
            height: "126px",
            borderTop: `18px solid ${siteConfig.colors.accent}`,
            borderRadius: "999px",
            transform: "rotate(-16deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "100px",
            left: "188px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "136px",
              height: "136px",
              borderRadius: "40px 40px 40px 16px",
              border: "10px solid #ffffff",
              background: siteConfig.colors.primary,
              color: "#ffffff",
              fontSize: "58px",
              fontWeight: 900,
              boxShadow: "0 24px 44px #16303c24",
            }}
          >
            M
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "-10px",
              width: "24px",
              height: "24px",
              transform: "rotate(45deg)",
              background: siteConfig.colors.primary,
              borderBottom: "8px solid #ffffff",
              borderRight: "8px solid #ffffff",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            right: "78px",
            bottom: "78px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "120px",
            height: "120px",
            borderRadius: "36px",
            background: "#ffffffd9",
            border: `8px solid ${siteConfig.colors.cardLine}`,
            color: siteConfig.colors.deep,
            fontSize: "44px",
            fontWeight: 800,
          }}
        >
          4.8
        </div>
      </div>
    ),
    size,
  );
}
