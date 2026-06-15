import { Easing, interpolate, useCurrentFrame } from "remotion";
import { bodyFont, colors } from "./theme";

export const StepBadge: React.FC<{ label: string }> = ({ label }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(frame, [0, 10], [-20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        display: "inline-block",
        backgroundColor: colors.red,
        color: colors.white,
        fontFamily: bodyFont,
        fontWeight: 700,
        fontSize: 28,
        letterSpacing: 4,
        textTransform: "uppercase",
        padding: "12px 28px",
        borderRadius: 999,
      }}
    >
      {label}
    </div>
  );
};

export const Caption: React.FC<{ text: string; delay?: number }> = ({
  text,
  delay = 6,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - delay;

  const opacity = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(localFrame, [0, 15], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        fontFamily: bodyFont,
        fontWeight: 600,
        fontSize: 44,
        lineHeight: 1.35,
        color: colors.white,
        textAlign: "center",
        textShadow: "0 2px 20px rgba(0,0,0,0.4)",
      }}
    >
      {text}
    </div>
  );
};
