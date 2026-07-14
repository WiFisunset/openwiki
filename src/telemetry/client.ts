import { PostHog } from "posthog-node";

import {
  DEFAULT_POSTHOG_HOST,
  DEFAULT_POSTHOG_KEY,
  FLUSH_TIMEOUT_MS,
} from "./config.js";
import type { TelemetryEvent } from "./types.js";

/**
 * Sends one event with all minimal-collection flags set, and flushes before
 * returning. Returns whether it actually sent (false when no key is configured).
 * shutdown() is awaited (bounded by a timeout) because the CLI is short-lived.
 */
export async function capture(event: TelemetryEvent): Promise<boolean> {
  if (!DEFAULT_POSTHOG_KEY) {
    return false;
  }

  const client = new PostHog(DEFAULT_POSTHOG_KEY, {
    host: DEFAULT_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
    // Drop the $is_server envelope property: this is a CLI, not a server.
    isServer: false,
  });

  client.capture({
    distinctId: event.distinctId,
    event: event.event,
    properties: {
      ...event.properties,
      // Anonymous events: no PostHog person profile.
      $process_person_profile: false,
    },
    // No server-side geoip enrichment (no $geoip_* location). The raw client IP
    // is dropped by the project's "Discard client IP data" setting, not here:
    // it is added server-side, so no client-side option can strip it.
    disableGeoip: true,
  });

  await withTimeout(client.shutdown(), FLUSH_TIMEOUT_MS);

  return true;
}

/**
 * Resolves when `promise` settles or `ms` elapses, whichever comes first.
 */
async function withTimeout(
  promise: Promise<unknown>,
  ms: number,
): Promise<void> {
  await Promise.race([
    promise.catch(() => undefined),
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms).unref();
    }),
  ]);
}
