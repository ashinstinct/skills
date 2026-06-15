import { Video } from "@remotion/media";
import { AbsoluteFill, staticFile } from "remotion";
import { Background, fitContain } from "../Background";
import { StepBadge } from "../Caption";
import { HEIGHT, WIDTH } from "../theme";

export const ResultScene: React.FC<{
  videoWidth: number;
  videoHeight: number;
}> = ({ videoWidth, videoHeight }) => {
  const { width, height } = fitContain(videoWidth, videoHeight, WIDTH, HEIGHT);

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Video
          src={staticFile("video/scoring-a-goal.mp4")}
          style={{
            width,
            height,
            borderRadius: 24,
            boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 70,
        }}
      >
        <StepBadge label="The Result" />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
