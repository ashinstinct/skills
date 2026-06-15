import "./index.css";
import { linearTiming } from "@remotion/transitions";
import { Composition, staticFile, type CalculateMetadataFunction } from "remotion";
import { getVideoDimensions } from "./get-video-dimensions";
import { getVideoDuration } from "./get-video-duration";
import { steps } from "./HiggsfieldTutorial/data";
import { Tutorial, type TutorialProps } from "./HiggsfieldTutorial/Tutorial";
import { FPS, HEIGHT, TRANSITION_FRAMES, WIDTH } from "./HiggsfieldTutorial/theme";

const INTRO_FRAMES = 3 * FPS;
const OUTRO_FRAMES = 3.5 * FPS;
const NUM_TRANSITIONS = steps.length + 2;

const calculateMetadata: CalculateMetadataFunction<TutorialProps> = async () => {
  const src = staticFile("video/scoring-a-goal.mp4");
  const [durationInSeconds, dimensions] = await Promise.all([
    getVideoDuration(src),
    getVideoDimensions(src),
  ]);

  const videoDurationInFrames = Math.round(durationInSeconds * FPS);

  const stepsDuration = steps.reduce(
    (sum, scene) => sum + scene.durationInFrames,
    0,
  );

  const transitionFrames = linearTiming({
    durationInFrames: TRANSITION_FRAMES,
  }).getDurationInFrames({ fps: FPS });

  const durationInFrames =
    INTRO_FRAMES +
    stepsDuration +
    videoDurationInFrames +
    OUTRO_FRAMES -
    NUM_TRANSITIONS * transitionFrames;

  return {
    durationInFrames,
    props: {
      videoDurationInFrames,
      videoWidth: dimensions.width,
      videoHeight: dimensions.height,
    },
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HiggsfieldTutorial"
        component={Tutorial}
        durationInFrames={1338}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          videoDurationInFrames: 393,
          videoWidth: 496,
          videoHeight: 864,
        }}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};
