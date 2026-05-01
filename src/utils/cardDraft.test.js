import { describe, expect, it } from "vitest";
import { buildCardPayload, createCardDraft } from "./cardDraft";

describe("cardDraft", () => {
  it("creates an editable draft from a card", () => {
    const draft = createCardDraft({
      title: "Task",
      description: "Notes",
      important: true,
      dueDate: "2026-05-01",
      dueTime: "10:00",
      workloadAmount: 2,
      workloadUnit: "days",
      checklistItems: [{ id: "check-1", text: "Read", done: true }],
      comments: [{ id: "comment-1", text: "Ok", createdAt: "now" }],
    });

    expect(draft).toMatchObject({
      title: "Task",
      description: "Notes",
      important: true,
      dueDate: "2026-05-01",
      dueTime: "10:00",
      workloadAmount: 2,
      workloadUnit: "days",
    });
    expect(draft.checklistItems).toHaveLength(1);
    expect(draft.comments).toHaveLength(1);
  });

  it("builds a clean save payload", () => {
    const payload = buildCardPayload({
      ...createCardDraft(),
      title: "  ",
      checklistItems: [{ id: "check-1", text: "  Keep  ", done: true }],
      comments: [{ id: "comment-1", text: "  Note  ", createdAt: "" }],
      completed: true,
      workloadAmount: 1.5,
      workloadUnit: "days",
    });

    expect(payload).toMatchObject({
      title: "Untitled",
      completed: true,
      workloadAmount: 1.5,
      workloadUnit: "days",
      workloadHours: 12,
    });
    expect(payload.completedAt).toBeTruthy();
    expect(payload.checklistItems).toEqual([
      { id: "check-1", text: "Keep", done: true },
    ]);
    expect(payload.comments[0]).toMatchObject({
      id: "comment-1",
      text: "Note",
    });
  });
});
