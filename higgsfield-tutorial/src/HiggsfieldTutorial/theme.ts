import { loadFont as loadDisplayFont } from "@remotion/google-fonts/Anton";
import { loadFont as loadBodyFont } from "@remotion/google-fonts/Inter";

export const { fontFamily: displayFont } = loadDisplayFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export const { fontFamily: bodyFont } = loadBodyFont("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin"],
});

export const colors = {
  navy: "#0A1F44",
  navyLight: "#1A3D6B",
  red: "#CE1124",
  white: "#FFFFFF",
  cream: "#F5F0E8",
};

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const TRANSITION_FRAMES = 15;
