import { describe, expect, it } from "vitest";
import { createDefaultState, normalizeCard, normalizeColumn } from "./boardState";

describe("boardState", () => {
  it("marks the default Done column as a completion column", () => {
    expect(createDefaultState().columns).toContainEqual({
      id: "done",
      title: "Done",
      isCompletion: true,
    });
  });

  it("normalizes current columns with explicit completion state", () => {
    expect(
      normalizeColumn({ id: "todo", title: "Todo", isCompletion: false }),
    ).toEqual({
      id: "todo",
      title: "Todo",
      isCompletion: false,
    });
  });

  it("preserves completion column flags", () => {
    expect(
      normalizeColumn({ id: "done", title: "Done", isCompletion: true }),
    ).toEqual({
      id: "done",
      title: "Done",
      isCompletion: true,
    });
  });

  it("normalizes current cards to safe defaults", () => {
    expect(normalizeCard({ id: "card-1", title: "Task" })).toMatchObject({
      id: "card-1",
      title: "Task",
      completed: false,
      completedAt: "",
    });
  });

  it("preserves completed cards and completion timestamps", () => {
    expect(
      normalizeCard({
        id: "card-1",
        title: "Done card",
        completed: true,
        completedAt: "2026-05-01T08:00:00.000Z",
      }),
    ).toMatchObject({
      completed: true,
      completedAt: "2026-05-01T08:00:00.000Z",
    });
  });
});
