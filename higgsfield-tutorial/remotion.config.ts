/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import { enableTailwind } from '@remotion/tailwind-v4';

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.overrideWebpackConfig(enableTailwind);
Config.setBrowserExecutable("/opt/pw-browsers/chromium-1194/chrome-linux/chrome");
Config.setChromeMode("chrome-for-testing");
Config.setChromiumIgnoreCertificateErrors(true);
