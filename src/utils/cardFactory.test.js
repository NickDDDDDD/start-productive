import { describe, expect, it } from "vitest";
import { createCard } from "./cardFactory";

describe("cardFactory", () => {
  it("creates a card from a string title", () => {
    const card = createCard("  Write docs  ", "todo");

    expect(card).toMatchObject({
      columnId: "todo",
      title: "Write docs",
      completed: false,
      workloadAmount: 1,
      workloadUnit: "hours",
    });
    expect(card.id).toBeTruthy();
  });

  it("keeps explicit card metadata from object payloads", () => {
    const card = createCard(
      { title: "Ship", important: true, workloadAmount: 2 },
      "doing",
    );

    expect(card).toMatchObject({
      columnId: "doing",
      title: "Ship",
      important: true,
      workloadAmount: 2,
    });
  });
});
