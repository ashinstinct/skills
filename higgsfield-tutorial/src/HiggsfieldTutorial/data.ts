import { FPS } from "./theme";

export const steps = [
  {
    step: "Step 1 · 6",
    caption: "It all starts with a character sheet — a clean reference of our hero from every angle.",
    images: [
      { src: "images/01-character-sheet-original.png", width: 2752, height: 1536 },
    ],
    durationInFrames: 5 * FPS,
  },
  {
    step: "Step 2 · 6",
    caption: "Next, grab a reference kit — England's home shirt, shorts and socks.",
    images: [
      { src: "images/02-reference-kit-kane9.jpg", width: 1280, height: 1271 },
    ],
    durationInFrames: 4.5 * FPS,
  },
  {
    step: "Step 3 · 6",
    caption: "Ask Nano Banana Pro to re-letter the kit — number 9 becomes 10, KANE becomes WILLIAMS.",
    images: [
      { src: "images/03-prompt-recolor-kit.jpg", width: 1280, height: 2474 },
    ],
    durationInFrames: 5.5 * FPS,
  },
  {
    step: "Step 4 · 6",
    caption: "Then place that new kit onto the character sheet, keeping the design identical.",
    images: [
      { src: "images/04-prompt-apply-kit.jpg", width: 1280, height: 2474 },
    ],
    durationInFrames: 5 * FPS,
  },
  {
    step: "Step 5 · 6",
    caption: "And just like that — Williams is dressed and ready for kickoff.",
    images: [
      { src: "images/05-character-sheet-final.png", width: 2752, height: 1536 },
    ],
    durationInFrames: 4.5 * FPS,
  },
  {
    step: "Step 6 · 6",
    caption: "Animate it: from watching the match at home... to scoring the winning goal.",
    images: [
      { src: "images/06-video-start-frame.png", width: 864, height: 496 },
      { src: "images/07-video-end-frame.png", width: 864, height: 496 },
    ],
    durationInFrames: 4.5 * FPS,
  },
] as const;
