export { recordAuth, recordIngest, recordRun } from "./senders.js";
export { showFirstRunNoticeIfNeeded } from "./install-id.js";
export { classifyError } from "./errors.js";
export { isCiEnvironment, isTelemetryDisabled } from "./gates.js";
export type {
  RunTelemetry,
  TelemetryContext,
  TelemetryErrorClass,
  TelemetryExecution,
  TelemetryMode,
} from "./types.js";
