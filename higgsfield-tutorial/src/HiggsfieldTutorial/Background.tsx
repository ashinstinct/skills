import { AbsoluteFill } from "remotion";
import { colors } from "./theme";

export const Background: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 20%, ${colors.navyLight} 0%, ${colors.navy} 65%)`,
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 2px, transparent 2px, transparent 40px)",
        }}
      />
    </AbsoluteFill>
  );
};

export const fitContain = (
  srcW: number,
  srcH: number,
  maxW: number,
  maxH: number,
) => {
  const scale = Math.min(maxW / srcW, maxH / srcH);
  return { width: srcW * scale, height: srcH * scale };
};
