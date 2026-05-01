import { describe, expect, it } from "vitest";
import { buildTaskPrompt, safeParseTaskJSON } from "./taskPrompt";

describe("taskPrompt", () => {
  it("includes the resolved timezone in the task prompt", () => {
    expect(buildTaskPrompt("Buy milk", "Asia/Shanghai")).toContain(
      "YYYY-MM-DD (Asia/Shanghai)",
    );
  });

  it("parses JSON wrapped in markdown fences or prose", () => {
    expect(safeParseTaskJSON('```json\n{"tasks":[]}\n```')).toEqual({
      tasks: [],
    });
    expect(safeParseTaskJSON('Here: {"tasks":[{"title":"A"}]} done')).toEqual({
      tasks: [{ title: "A" }],
    });
  });

  it("returns null for invalid JSON", () => {
    expect(safeParseTaskJSON("not json")).toBeNull();
  });
});
