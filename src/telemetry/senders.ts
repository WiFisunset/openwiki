import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { capture } from "./client.js";
import {
  DEFAULT_POSTHOG_HOST,
  TELEMETRY_AUTH_EVENT,
  TELEMETRY_INGEST_EVENT,
  TELEMETRY_RUN_EVENT,
} from "./config.js";
import { getTelemetryEnv } from "./environment.js";
import { ciSentinelId, isCiEnvironment, isTelemetryDisabled } from "./gates.js";
import { getOrCreateInstallId } from "./install-id.js";
import type {
  AuthTelemetry,
  IngestTelemetry,
  RunTelemetry,
  TelemetryContext,
  TelemetryEvent,
  TelemetryExecution,
} from "./types.js";

/**
 * Records a completed init/update run. Never throws. (Chat is not recorded.)
 */
export async function recordRun(details: RunTelemetry): Promise<void> {
  const env = getTelemetryEnv();

  await send(
    TELEMETRY_RUN_EVENT,
    {
      command: details.command,
      mode: details.mode,
      provider: details.provider,
      model_id: details.modelId,
      base_url_override: details.baseUrlOverride,
      outcome: details.outcome,
      ...(details.errorClass ? { error_class: details.errorClass } : {}),
      duration_ms: details.durationMs,
      connectors_configured: details.connectorsConfigured,
      connectors_used: details.connectorsUsed,
      flags: details.flags,
      app_version: env.appVersion,
      os: env.os,
      arch: env.arch,
      node_version: env.nodeVersion,
    },
    { context: details.context, telemetryFile: details.telemetryFile },
  );
}

/**
 * Records an auth command outcome (configure / oauth / tools / list).
 */
export async function recordAuth(details: AuthTelemetry): Promise<void> {
  const env = getTelemetryEnv();

  await send(TELEMETRY_AUTH_EVENT, {
    provider: details.provider,
    action: details.action,
    outcome: details.outcome,
    ...(details.errorClass ? { error_class: details.errorClass } : {}),
    app_version: env.appVersion,
    os: env.os,
    node_version: env.nodeVersion,
  });
}

/**
 * Records an ingest command outcome. `source` is an enum id, never a name.
 */
export async function recordIngest(details: IngestTelemetry): Promise<void> {
  const env = getTelemetryEnv();

  await send(TELEMETRY_INGEST_EVENT, {
    source: details.source,
    scope: details.scope,
    outcome: details.outcome,
    ...(details.errorClass ? { error_class: details.errorClass } : {}),
    duration_ms: details.durationMs,
    app_version: env.appVersion,
    os: env.os,
    node_version: env.nodeVersion,
  });
}

/**
 * Options every recorder forwards to `send`.
 */
interface SendOptions {
  /**
   * Caller-reported invocation label; overridden to "ci" in CI.
   */
  context?: TelemetryContext;

  /**
   * Tee target from --telemetry-file, if any.
   */
  telemetryFile?: string;
}

/**
 * Shared path for all recorders: gate, resolve id, stamp `execution`, capture,
 * and optionally tee. Explicitly never throws.
 */
async function send(
  eventName: string,
  properties: Record<string, unknown>,
  options: SendOptions = {},
): Promise<void> {
  if (isTelemetryDisabled()) {
    await writeTelemetryFile(options.telemetryFile, {
      disabled: true,
      sent: false,
    });
    return;
  }

  try {
    const ci = isCiEnvironment();
    const distinctId = ci ? ciSentinelId() : (await getOrCreateInstallId()).id;
    // Caller reports interactive/print/cli; the environment overrides to "ci".
    const execution: TelemetryExecution = ci
      ? "ci"
      : (options.context ?? "cli");
    const event: TelemetryEvent = {
      distinctId,
      event: eventName,
      properties: {
        ...properties,
        execution,
        // Human runs are identified (enables retention/lifecycle); CI runs stay
        // anonymous (the sentinel would collapse to one meaningless person, and
        // this keeps the high-volume CI stream on the cheap event tier).
        $process_person_profile: !ci,
      },
    };
    const sent = await capture(event);

    await writeTelemetryFile(options.telemetryFile, {
      disabled: false,
      ci,
      host: DEFAULT_POSTHOG_HOST,
      sent,
      event,
    });
  } catch {
    // Intentionally ignored: telemetry must never break a run.
  }
}

async function writeTelemetryFile(
  filePath: string | undefined,
  record: Record<string, unknown>,
): Promise<void> {
  if (!filePath) {
    return;
  }

  try {
    const resolved = path.resolve(process.cwd(), filePath);
    await mkdir(path.dirname(resolved), { recursive: true });
    await writeFile(resolved, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `OpenWiki: could not write telemetry file "${filePath}": ${message}`,
    );
  }
}
