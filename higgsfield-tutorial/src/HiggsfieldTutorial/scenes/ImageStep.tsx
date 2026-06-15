import { AbsoluteFill, Img, staticFile } from "remotion";
import { Background, fitContain } from "../Background";
import { Caption, StepBadge } from "../Caption";
import { colors } from "../theme";

const MAX_W = 980;
const MAX_H = 1360;

type ImageSpec = {
  src: string;
  width: number;
  height: number;
};

const Frame: React.FC<{ image: ImageSpec; maxH?: number }> = ({
  image,
  maxH = MAX_H,
}) => {
  const { width, height } = fitContain(image.width, image.height, MAX_W, maxH);

  return (
    <Img
      src={staticFile(image.src)}
      style={{
        width,
        height,
        objectFit: "cover",
        borderRadius: 24,
        boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
        border: `4px solid rgba(255,255,255,0.15)`,
      }}
    />
  );
};

export const ImageStep: React.FC<{
  step: string;
  caption: string;
  images: readonly ImageSpec[];
}> = ({ step, caption, images }) => {
  const stacked = images.length > 1;

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill
        style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 60px",
          gap: 60,
        }}
      >
        <StepBadge label={step} />

        {stacked ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 28,
            }}
          >
            <Frame image={images[0]} maxH={620} />
            <div
              style={{
                fontSize: 56,
                color: colors.red,
                fontWeight: 700,
              }}
            >
              ↓
            </div>
            <Frame image={images[1]} maxH={620} />
          </div>
        ) : (
          <Frame image={images[0]} />
        )}

        <Caption text={caption} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
