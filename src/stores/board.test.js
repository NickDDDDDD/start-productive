import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { useBoardStore } from "./board";

beforeEach(() => {
  setActivePinia(createPinia());
});

describe("board store card ordering", () => {
  it("appends manually created inbox cards to the bottom of inbox", () => {
    const board = useBoardStore();
    board.cards = [
      { id: "inbox-1", columnId: "inbox", title: "Existing inbox" },
      { id: "todo-1", columnId: "todo", title: "Existing todo" },
    ];

    board.createCard("inbox", { title: "New inbox" });

    expect(
      board.cards
        .filter((card) => card.columnId === "inbox")
        .map((card) => card.title),
    ).toEqual(["Existing inbox", "New inbox"]);
  });

  it("appends generated inbox cards after existing inbox cards", () => {
    const board = useBoardStore();
    board.cards = [
      { id: "inbox-1", columnId: "inbox", title: "Existing inbox" },
      { id: "todo-1", columnId: "todo", title: "Existing todo" },
    ];

    board.createCardsInInbox(["Generated A", "Generated B"]);

    expect(
      board.cards
        .filter((card) => card.columnId === "inbox")
        .map((card) => card.title),
    ).toEqual(["Existing inbox", "Generated A", "Generated B"]);
  });

  it("preserves the target column position while reordering cards", () => {
    const board = useBoardStore();
    board.cards = [
      { id: "inbox-1", columnId: "inbox", title: "Inbox" },
      { id: "todo-1", columnId: "todo", title: "Todo A" },
      { id: "todo-2", columnId: "todo", title: "Todo B" },
      { id: "done-1", columnId: "done", title: "Done" },
    ];

    board.replaceCardsInColumn("todo", [
      { id: "todo-2", columnId: "todo", title: "Todo B" },
      { id: "todo-1", columnId: "todo", title: "Todo A" },
    ]);

    expect(board.cards.map((card) => card.title)).toEqual([
      "Inbox",
      "Todo B",
      "Todo A",
      "Done",
    ]);
  });
});
