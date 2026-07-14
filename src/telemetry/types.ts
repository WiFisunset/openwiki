/**
 * Closed set of failure categories. Raw error strings are never sent.
 */
export type TelemetryErrorClass =
  | "missing_credentials"
  | "missing_config"
  | "invalid_model"
  | "provider_auth"
  | "provider_rate_limit"
  | "provider_timeout"
  | "network"
  | "agent_error"
  | "tool_error"
  | "filesystem"
  | "aborted"
  | "unknown";

/**
 * Which brain a run targeted.
 */
export type TelemetryMode = "code" | "personal";

/**
 * How the CLI was invoked, as reported by the caller.
 */
export type TelemetryContext = "interactive" | "print" | "cli";

/**
 * The `execution` value actually emitted. `send` derives it from the caller's
 * `TelemetryContext`, overriding it to "ci" when running in CI (a fact read from
 * the environment, not supplied by the caller).
 */
export type TelemetryExecution = TelemetryContext | "ci";

/**
 * Everything the run event reports, assembled by the agent run lifecycle.
 */
export interface RunTelemetry {
  /**
   * Which run lifecycle produced this event.
   */
  command: "init" | "update" | "chat";

  /**
   * Which brain the run targeted (code = repository, personal = local wiki).
   */
  mode: TelemetryMode;

  /**
   * LLM provider id used for the run (e.g. "anthropic", "openai").
   */
  provider: string;

  /**
   * Resolved model id for the run.
   */
  modelId: string;

  /**
   * Whether a custom provider base URL is configured. The URL is never sent.
   */
  baseUrlOverride: boolean;

  /**
   * How the run ended. `noop` is an update that short-circuited unchanged.
   */
  outcome: "success" | "failure" | "noop";

  /**
   * Closed-set failure category. Present only when `outcome` is "failure".
   */
  errorClass?: TelemetryErrorClass;

  /**
   * Wall-clock duration of the run, in milliseconds.
   */
  durationMs: number;

  /**
   * Number of tool invocations during the run (a proxy for work done).
   */
  toolCalls: number;

  /**
   * Ids of auth-gated connectors fully configured on this machine.
   */
  connectorsConfigured: string[];

  /**
   * Ids of connectors actually invoked during this run.
   */
  connectorsUsed: string[];

  /**
   * Flag names present on the invocation. Names only, never values.
   */
  flags: string[];

  /**
   * How the CLI was invoked. `send` overrides this to "ci" in CI.
   */
  context: TelemetryContext;

  /**
   * Optional tee target from --telemetry-file.
   */
  telemetryFile?: string;
}

/**
 * What the auth event reports, assembled by the auth command handler.
 */
export interface AuthTelemetry {
  /**
   * Auth provider id (e.g. "slack", "notion", "gmail"), or "list".
   */
  provider: string;

  /**
   * Auth subcommand.
   */
  action: "configure" | "oauth" | "tools" | "list";

  /**
   * Whether the auth command succeeded.
   */
  outcome: "success" | "failure";

  /**
   * Closed-set failure category. Present only when `outcome` is "failure".
   */
  errorClass?: TelemetryErrorClass;
}

/**
 * What the ingest event reports, assembled by the ingest command handler.
 */
export interface IngestTelemetry {
  /**
   * Base source/connector enum id (e.g. "web-search"); never an instance name.
   */
  source: string;

  /**
   * Whether the target was all sources, one source, or one instance.
   */
  scope: "all" | "source" | "instance";

  /**
   * Whether ingestion succeeded.
   */
  outcome: "success" | "failure";

  /**
   * Closed-set failure category. Present only when `outcome` is "failure".
   */
  errorClass?: TelemetryErrorClass;

  /**
   * Wall-clock duration of the ingest, in milliseconds.
   */
  durationMs: number;
}

/**
 * Internal: the fully-assembled event handed to the client and the tee.
 */
export interface TelemetryEvent {
  /**
   * Identity the event is attributed to: install id, or the CI sentinel.
   */
  distinctId: string;

  /**
   * PostHog event name (one of the TELEMETRY_*_EVENT constants).
   */
  event: string;

  /**
   * The property bag sent to PostHog.
   */
  properties: Record<string, unknown>;
}
