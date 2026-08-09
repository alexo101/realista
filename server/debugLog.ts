/**
 * Hot-path debug logging.
 * Enabled when LOG_LEVEL=debug or DEBUG_HOT_PATH=true.
 * Off by default in production so search/request paths avoid stdout cost.
 */
export const isHotPathDebugEnabled =
  process.env.LOG_LEVEL === "debug" ||
  process.env.DEBUG_HOT_PATH === "true";

export function debugLog(...args: unknown[]): void {
  if (isHotPathDebugEnabled) {
    console.log(...args);
  }
}
