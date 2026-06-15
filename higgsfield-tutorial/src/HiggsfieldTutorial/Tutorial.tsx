import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { steps } from "./data";
import { ImageStep } from "./scenes/ImageStep";
import { ResultScene } from "./scenes/ResultScene";
import { TitleCard } from "./scenes/TitleCard";
import { FPS, TRANSITION_FRAMES } from "./theme";

export type TutorialProps = {
  videoDurationInFrames: number;
  videoWidth: number;
  videoHeight: number;
};

export const Tutorial: React.FC<TutorialProps> = ({
  videoDurationInFrames,
  videoWidth,
  videoHeight,
}) => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={3 * FPS}>
        <TitleCard
          title="How This Video Was Made"
          subtitle="Higgsfield AI + Remotion"
          emoji="⚽"
        />
      </TransitionSeries.Sequence>

      {steps.flatMap((scene) => [
        <TransitionSeries.Transition
          key={`${scene.step}-transition`}
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />,
        <TransitionSeries.Sequence
          key={scene.step}
          durationInFrames={scene.durationInFrames}
        >
          <ImageStep
            step={scene.step}
            caption={scene.caption}
            images={scene.images}
          />
        </TransitionSeries.Sequence>,
      ])}

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />
      <TransitionSeries.Sequence durationInFrames={videoDurationInFrames}>
        <ResultScene videoWidth={videoWidth} videoHeight={videoHeight} />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />
      <TransitionSeries.Sequence durationInFrames={3.5 * FPS}>
        <TitleCard
          title="Made With Higgsfield AI"
          subtitle="Built and edited with Remotion"
          emoji="🏆"
        />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
