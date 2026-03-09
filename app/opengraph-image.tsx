import { ImageResponse } from "next/og";

import { siteConfig } from "@/lib/site";

export const alt = `${siteConfig.name} Open Graph image`;
export const size = siteConfig.ogImage;
export const contentType = "image/png";

const mapPins = [
  {
    label: "Cafe",
    value: "4.8",
    top: 94,
    left: 62,
    color: siteConfig.colors.primary,
    tint: siteConfig.colors.primarySoft,
  },
  {
    label: "Gallery",
    value: "82",
    top: 188,
    left: 258,
    color: siteConfig.colors.accent,
    tint: siteConfig.colors.accentSoft,
  },
  {
    label: "Park",
    value: "Open",
    top: 324,
    left: 136,
    color: siteConfig.colors.deep,
    tint: "#dbe7ef",
  },
];

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          position: "relative",
          overflow: "hidden",
          padding: "30px 34px",
          background:
            "radial-gradient(circle at top left, #d6f3ee 0, transparent 34%), radial-gradient(circle at bottom right, #ffe2c2 0, transparent 30%), linear-gradient(135deg, #f7f2e9 0%, #fbf7f0 52%, #f4eee3 100%)",
          color: siteConfig.colors.foreground,
          fontFamily:
            '"Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif',
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-96px",
            right: "-56px",
            height: "320px",
            width: "320px",
            borderRadius: "999px",
            background: "#0f7d7814",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-132px",
            left: "-64px",
            height: "300px",
            width: "300px",
            borderRadius: "999px",
            background: "#ff9b3b18",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "58%",
            padding: "18px 12px 14px 8px",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "48px",
                  minWidth: "48px",
                  borderRadius: "16px",
                  background: siteConfig.colors.primary,
                  color: "#ffffff",
                  fontSize: "24px",
                  fontWeight: 800,
                }}
              >
                M
              </div>
              <div
                style={{
                  display: "flex",
                  padding: "10px 18px",
                  borderRadius: "999px",
                  border: `1px solid ${siteConfig.colors.line}`,
                  background: "#ffffffc8",
                  fontSize: "22px",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                {siteConfig.name}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  maxWidth: "620px",
                  fontSize: "66px",
                  lineHeight: 1.02,
                  fontWeight: 800,
                  letterSpacing: "-0.055em",
                  textWrap: "balance",
                }}
              >
                {siteConfig.title}
              </div>
              <div
                style={{
                  display: "flex",
                  maxWidth: "610px",
                  fontSize: "28px",
                  lineHeight: 1.35,
                  color: siteConfig.colors.muted,
                  letterSpacing: "-0.02em",
                }}
              >
                {siteConfig.description}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "16px 24px",
                  borderRadius: "999px",
                  background: siteConfig.colors.primary,
                  color: "#ffffff",
                  fontSize: "26px",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  boxShadow: "0 18px 36px #0f7d782b",
                }}
              >
                {siteConfig.ctaLabel}
              </div>
            </div>
          </div>
        </div>
        <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "42%",
              paddingTop: "6px",
              zIndex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                position: "relative",
                height: "500px",
                width: "420px",
                overflow: "hidden",
                borderRadius: "36px",
              border: `1px solid ${siteConfig.colors.cardLine}`,
              background:
                "linear-gradient(180deg, #fffdf7 0%, #fcf6ec 100%)",
              boxShadow: "0 26px 70px #16303c24",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "24px",
                left: "24px",
                display: "flex",
                height: "36px",
                width: "136px",
                borderRadius: "999px",
                background: "#ffffff",
                border: `1px solid ${siteConfig.colors.cardLine}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "24px",
                right: "24px",
                display: "flex",
                gap: "10px",
              }}
            >
              {[0, 1, 2].map((dot) => (
                <div
                  key={dot}
                  style={{
                    display: "flex",
                    height: "12px",
                    width: "12px",
                    borderRadius: "999px",
                    background:
                      dot === 0
                        ? siteConfig.colors.primary
                        : dot === 1
                          ? siteConfig.colors.accent
                          : "#d6ddd8",
                  }}
                />
              ))}
            </div>
            <div
              style={{
                display: "flex",
                position: "absolute",
                inset: "78px 24px 32px 24px",
                overflow: "hidden",
                borderRadius: "28px",
                border: `1px solid ${siteConfig.colors.cardLine}`,
                background:
                  "linear-gradient(180deg, #eef8f4 0%, #fff7ea 100%)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage:
                    "linear-gradient(90deg, #ffffff66 1px, transparent 1px), linear-gradient(180deg, #ffffff66 1px, transparent 1px)",
                  backgroundSize: "76px 76px",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "78px",
                  left: "-10px",
                  width: "310px",
                  height: "150px",
                  borderTop: `10px solid ${siteConfig.colors.primary}`,
                  borderRadius: "999px",
                  transform: "rotate(18deg)",
                  opacity: 0.9,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "198px",
                  left: "90px",
                  width: "260px",
                  height: "140px",
                  borderTop: `10px solid ${siteConfig.colors.accent}`,
                  borderRadius: "999px",
                  transform: "rotate(-12deg)",
                  opacity: 0.9,
                }}
              />
              {mapPins.map((pin) => (
                <div
                  key={pin.label}
                  style={{
                    position: "absolute",
                    top: `${pin.top}px`,
                    left: `${pin.left}px`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: "84px",
                      padding: "12px 16px",
                      borderRadius: "18px 18px 18px 8px",
                      border: "2px solid #ffffff",
                      background: pin.color,
                      color: "#ffffff",
                      fontSize: "22px",
                      fontWeight: 800,
                      boxShadow: "0 16px 28px #16303c1f",
                    }}
                  >
                    {pin.value}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      padding: "8px 14px",
                      borderRadius: "999px",
                      background: pin.tint,
                      color: pin.color,
                      fontSize: "18px",
                      fontWeight: 700,
                    }}
                  >
                    {pin.label}
                  </div>
                </div>
              ))}
              <div
                style={{
                  position: "absolute",
                  right: "22px",
                  bottom: "18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  width: "170px",
                  padding: "18px",
                  borderRadius: "22px",
                  background: "#ffffffd9",
                  border: `1px solid ${siteConfig.colors.cardLine}`,
                  boxShadow: "0 18px 40px #16303c18",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: siteConfig.colors.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Live plan
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: "24px",
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                  }}
                >
                  Sort, filter, and share in one map.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
