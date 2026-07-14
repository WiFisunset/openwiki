import path from "node:path";

import { openWikiHomeDir } from "../openwiki-home.js";

/**
 * Publishable PostHog project key. Safe to ship (client/ingestion key).
 */
export const DEFAULT_POSTHOG_KEY =
  "phc_rCxkpuCsbi4HcQqfg8kmUdmM5XqveB8AvMB2VS4sAULi";
export const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com";

/**
 * Persistent, anonymous per-machine install id.
 */
export const INSTALL_ID_PATH = path.join(openWikiHomeDir, "install-id");

/**
 * Longest we wait for a flush before letting the short-lived CLI exit.
 */
export const FLUSH_TIMEOUT_MS = 2000;

/**
 * The three usage events OpenWiki emits.
 */
export const TELEMETRY_RUN_EVENT = "openwiki_run";
export const TELEMETRY_AUTH_EVENT = "openwiki_auth";
export const TELEMETRY_INGEST_EVENT = "openwiki_ingest";

/**
 * One-time disclosure shown before the first event on a machine.
 */
export const FIRST_RUN_NOTICE = `
──── OpenWiki telemetry ──────────────────────────────────────
OpenWiki collects anonymous, aggregate usage data: which commands you run, the
provider and model, whether runs succeed, how long they take, and which
connectors you have configured. No file contents, repository data, credentials,
prompts, model output, IP address, or personal information are ever collected.

Opt out anytime: set OPENWIKI_TELEMETRY_DISABLED=1 (or DO_NOT_TRACK=1).
Add it to ~/.openwiki/.env to make it permanent.
──────────────────────────────────────────────────────────────
`;
