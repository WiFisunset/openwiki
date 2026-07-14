import { createRequire } from "node:module";

/**
 * Coarse, non-identifying environment attached to every telemetry event.
 */
export interface TelemetryEnv {
  /**
   * OpenWiki package version, e.g. "0.1.2".
   */
  appVersion: string;

  /**
   * Full Node version, e.g. "22.3.1".
   */
  nodeVersion: string;

  /**
   * Platform family: "darwin" | "linux" | "win32" | ...
   */
  os: NodeJS.Platform;

  /**
   * CPU architecture: "arm64" | "x64" | ...
   */
  arch: string;
}

let cached: TelemetryEnv | undefined;

/**
 * Resolves the environment snapshot once and caches it.
 */
export function getTelemetryEnv(): TelemetryEnv {
  if (cached) {
    return cached;
  }

  cached = {
    appVersion: resolveAppVersion(),
    nodeVersion: process.versions.node.split(".").slice(0, 2).join("."),
    os: process.platform,
    arch: process.arch,
  };

  return cached;
}

/**
 * Reads the package version; "unknown" if unresolvable.
 */
function resolveAppVersion(): string {
  try {
    const require = createRequire(import.meta.url);
    const pkg = require("../../package.json") as { version?: string };

    return pkg.version ?? "unknown";
  } catch {
    return "unknown";
  }
}
