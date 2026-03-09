import { ImageResponse } from "next/og";

import { siteConfig } from "@/lib/site";

export const size = {
  width: siteConfig.icon.appleSize,
  height: siteConfig.icon.appleSize,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          position: "relative",
          overflow: "hidden",
          borderRadius: "44px",
          background:
            "radial-gradient(circle at top left, #d6f3ee 0, transparent 38%), radial-gradient(circle at bottom right, #ffe2c2 0, transparent 34%), linear-gradient(145deg, #f7f2e9 0%, #fcf7ef 50%, #efe7db 100%)",
          fontFamily:
            '"Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif',
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "16px",
            borderRadius: "34px",
            border: `3px solid ${siteConfig.colors.cardLine}`,
            background:
              "linear-gradient(180deg, #eef8f4 0%, #fff6e8 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "16px",
            borderRadius: "34px",
            backgroundImage:
              "linear-gradient(90deg, #ffffff88 1px, transparent 1px), linear-gradient(180deg, #ffffff88 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "54px",
            left: "16px",
            width: "116px",
            height: "56px",
            borderTop: `8px solid ${siteConfig.colors.primary}`,
            borderRadius: "999px",
            transform: "rotate(16deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "92px",
            left: "58px",
            width: "92px",
            height: "48px",
            borderTop: `8px solid ${siteConfig.colors.accent}`,
            borderRadius: "999px",
            transform: "rotate(-16deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "28px",
            left: "60px",
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
              width: "54px",
              height: "54px",
              borderRadius: "16px 16px 16px 7px",
              border: "4px solid #ffffff",
              background: siteConfig.colors.primary,
              color: "#ffffff",
              fontSize: "28px",
              fontWeight: 900,
            }}
          >
            M
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "-4px",
              width: "12px",
              height: "12px",
              transform: "rotate(45deg)",
              background: siteConfig.colors.primary,
              borderBottom: "4px solid #ffffff",
              borderRight: "4px solid #ffffff",
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
