import { Input, ALL_FORMATS, FilePathSource } from "mediabunny";
import { join } from "path";

const path = join(import.meta.dirname, "..", "public", "video", "scoring-a-goal.mp4");

const input = new Input({
  formats: ALL_FORMATS,
  source: new FilePathSource(path),
});

const duration = await input.computeDuration();
const videoTrack = await input.getPrimaryVideoTrack();
console.log("duration (s):", duration);
console.log("dims:", videoTrack.displayWidth, "x", videoTrack.displayHeight);
