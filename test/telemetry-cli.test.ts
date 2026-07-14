import { describe, expect, test } from "vitest";

import { commandEmitsTelemetry, parseCommand } from "../src/commands.ts";
import { describeIngestTarget } from "../src/ingestion.ts";

describe("describeIngestTarget", () => {
  test("'all' reduces to the all scope", () => {
    expect(describeIngestTarget("all")).toEqual({
      source: "all",
      scope: "all",
    });
  });

  test("a connector id is source scope, sent as-is", () => {
    expect(describeIngestTarget("web-search")).toEqual({
      source: "web-search",
      scope: "source",
    });
  });

  test("a source-instance never emits its user-chosen id", () => {
    const result = describeIngestTarget({
      kind: "source-instance",
      id: "web-search-2",
    });

    expect(result.scope).toBe("instance");
    expect(result.source).toBe("unknown");
    // The user-chosen instance id must not leak anywhere in the output.
    expect(JSON.stringify(result)).not.toContain("web-search-2");
  });
});

describe("commandEmitsTelemetry", () => {
  const emits = (argv: string[]): boolean =>
    commandEmitsTelemetry(parseCommand(argv));

  test("true only for init/update runs, auth, and ingest", () => {
    expect(emits(["personal", "--init"])).toBe(true);
    expect(emits(["personal", "--update"])).toBe(true);
    expect(emits(["auth", "notion"])).toBe(true);
    expect(emits(["ingest", "all"])).toBe(true);
  });

  test("false for chat, help, error, cron, ngrok", () => {
    expect(emits(["personal"])).toBe(false); // chat (no init/update)
    expect(emits(["--help"])).toBe(false); // help
    expect(emits(["personal", "--nope"])).toBe(false); // error: unknown option
    expect(emits(["cron", "list"])).toBe(false);
    expect(emits(["ngrok", "start"])).toBe(false);
  });

  test("false for a dry-run", () => {
    process.env.OPENWIKI_DEV = "1";
    try {
      expect(emits(["personal", "--init", "--dry-run"])).toBe(false);
    } finally {
      delete process.env.OPENWIKI_DEV;
    }
  });
});
