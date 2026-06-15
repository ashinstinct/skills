import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Background } from "../Background";
import { bodyFont, colors, displayFont } from "../theme";

export const TitleCard: React.FC<{
  title: string;
  subtitle: string;
  emoji?: string;
}> = ({ title, subtitle, emoji }) => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleScale = interpolate(frame, [0, 18], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.5)),
  });

  const subtitleOpacity = interpolate(frame, [12, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill
        style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px",
          gap: 28,
          textAlign: "center",
        }}
      >
        {emoji && <div style={{ fontSize: 110 }}>{emoji}</div>}
        <div
          style={{
            opacity: titleOpacity,
            transform: `scale(${titleScale})`,
            fontFamily: displayFont,
            fontSize: 92,
            lineHeight: 1.15,
            color: colors.white,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          {title}
        </div>
        <div
          style={{
            opacity: subtitleOpacity,
            fontFamily: bodyFont,
            fontWeight: 600,
            fontSize: 40,
            color: colors.cream,
          }}
        >
          {subtitle}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
