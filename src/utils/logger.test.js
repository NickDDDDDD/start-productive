import { describe, expect, it, vi } from "vitest";
import { createLogger, shouldLogDebug } from "./logger";

describe("logger", () => {
  it("enables debug output in development or with the debug flag", () => {
    expect(shouldLogDebug({ dev: true, debugFlag: null })).toBe(true);
    expect(shouldLogDebug({ dev: false, debugFlag: "1" })).toBe(true);
    expect(shouldLogDebug({ dev: false, debugFlag: null })).toBe(false);
  });

  it("always writes errors with the namespace prefix", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logger = createLogger("test");

    logger.error("failed");

    expect(spy).toHaveBeenCalledWith("[start-productive:test]", "failed");
    spy.mockRestore();
  });
});
