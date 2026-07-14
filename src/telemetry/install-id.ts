import { randomUUID } from "node:crypto";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";

import { openWikiHomeDir } from "../openwiki-home.js";
import { INSTALL_ID_PATH, FIRST_RUN_NOTICE } from "./config.js";
import { noticeSuppressed } from "./gates.js";

/**
 * Reads the install id, creating it on first use. `isNew` is true only when the
 * id was just minted which is the signal for the one-time notice. The id is a
 * random UUID with no relationship to the user, machine, or repository.
 */
export async function getOrCreateInstallId(): Promise<{
  id: string;
  isNew: boolean;
}> {
  try {
    const existing = (await readFile(INSTALL_ID_PATH, "utf8")).trim();

    if (existing.length > 0) {
      return { id: existing, isNew: false };
    }
  } catch (error) {
    if (!isFileNotFoundError(error)) {
      throw error;
    }
  }

  const id = randomUUID();
  await mkdir(openWikiHomeDir, { recursive: true, mode: 0o700 });
  await writeFile(INSTALL_ID_PATH, `${id}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  await chmod(INSTALL_ID_PATH, 0o600);

  return { id, isNew: true };
}

/**
 * Shows the one-time notice on the first run on this machine (install id just
 * minted). Suppressed (nothing printed, no id minted) when opted out or in CI.
 * Never throws. Called at the START of a run so the disclosure precedes output.
 */
export async function showFirstRunNoticeIfNeeded(): Promise<void> {
  if (noticeSuppressed()) {
    return;
  }

  try {
    const { isNew } = await getOrCreateInstallId();

    if (isNew) {
      // console.error so Ink's patchConsole renders it above the live TUI.
      console.error(FIRST_RUN_NOTICE);
    }
  } catch {
    // Intentionally ignored: telemetry must never break a run.
  }
}

function isFileNotFoundError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}
