import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useBoardStore } from "./board";

beforeEach(() => {
  setActivePinia(createPinia());
});

afterEach(() => {
  vi.useRealTimers();
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

describe("board store completion", () => {
  it("marks cards complete with a completion timestamp", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T08:00:00.000Z"));
    const board = useBoardStore();
    board.cards = [{ id: "card-1", columnId: "todo", title: "Task" }];

    board.toggleCardCompleted("card-1", true);

    expect(board.cards[0]).toMatchObject({
      completed: true,
      completedAt: "2026-05-01T08:00:00.000Z",
    });
  });

  it("clears completion timestamp when cards are marked incomplete", () => {
    const board = useBoardStore();
    board.cards = [
      {
        id: "card-1",
        columnId: "todo",
        title: "Task",
        completed: true,
        completedAt: "2026-05-01T08:00:00.000Z",
      },
    ];

    board.toggleCardCompleted("card-1", false);

    expect(board.cards[0]).toMatchObject({
      completed: false,
      completedAt: "",
    });
  });

  it("allows multiple completion columns", () => {
    const board = useBoardStore();
    board.columns = [
      { id: "done", title: "Done", isCompletion: true },
      { id: "archive", title: "Archive", isCompletion: false },
    ];

    board.toggleColumnCompletion("archive", true);

    expect(board.columns).toMatchObject([
      { id: "done", isCompletion: true },
      { id: "archive", isCompletion: true },
    ]);
  });

  it("marks cards in a column complete when the column becomes a completion column", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T08:00:00.000Z"));
    const board = useBoardStore();
    board.columns = [{ id: "review", title: "Review", isCompletion: false }];
    board.cards = [{ id: "card-1", columnId: "review", title: "Task" }];

    board.toggleColumnCompletion("review", true);

    expect(board.cards[0]).toMatchObject({
      completed: true,
      completedAt: "2026-05-01T08:00:00.000Z",
    });
  });

  it("marks completed cards incomplete when the column stops being a completion column", () => {
    const board = useBoardStore();
    board.columns = [{ id: "review", title: "Review", isCompletion: true }];
    board.cards = [
      {
        id: "card-1",
        columnId: "review",
        title: "Task",
        completed: true,
        completedAt: "2026-05-01T08:00:00.000Z",
      },
    ];

    board.toggleColumnCompletion("review", false);

    expect(board.cards[0]).toMatchObject({
      completed: false,
      completedAt: "",
    });
  });

  it("marks cards complete when they are moved into a completion column", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T08:00:00.000Z"));
    const board = useBoardStore();
    board.columns = [
      { id: "todo", title: "Todo", isCompletion: false },
      { id: "done", title: "Done", isCompletion: true },
    ];
    board.cards = [{ id: "card-1", columnId: "todo", title: "Task" }];

    board.replaceCardsInColumn("done", [
      { id: "card-1", columnId: "todo", title: "Task" },
    ]);

    expect(board.cards[0]).toMatchObject({
      columnId: "done",
      completed: true,
      completedAt: "2026-05-01T08:00:00.000Z",
    });
  });

  it("marks completed cards incomplete when they are moved into a normal column", () => {
    const board = useBoardStore();
    board.columns = [
      { id: "todo", title: "Todo", isCompletion: false },
      { id: "done", title: "Done", isCompletion: true },
    ];
    board.cards = [
      {
        id: "card-1",
        columnId: "done",
        title: "Task",
        completed: true,
        completedAt: "2026-05-01T08:00:00.000Z",
      },
    ];

    board.replaceCardsInColumn("todo", [
      {
        id: "card-1",
        columnId: "done",
        title: "Task",
        completed: true,
        completedAt: "2026-05-01T08:00:00.000Z",
      },
    ]);

    expect(board.cards[0]).toMatchObject({
      columnId: "todo",
      completed: false,
      completedAt: "",
    });
  });

  it("preserves completion timestamps while reordering a completion column", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T10:00:00.000Z"));
    const board = useBoardStore();
    board.columns = [{ id: "done", title: "Done", isCompletion: true }];
    board.cards = [
      {
        id: "card-1",
        columnId: "done",
        title: "Task A",
        completed: true,
        completedAt: "2026-05-01T08:00:00.000Z",
      },
      {
        id: "card-2",
        columnId: "done",
        title: "Task B",
        completed: true,
        completedAt: "2026-05-01T09:00:00.000Z",
      },
    ];

    board.replaceCardsInColumn("done", [board.cards[1], board.cards[0]]);

    expect(board.cards.map((card) => card.completedAt)).toEqual([
      "2026-05-01T09:00:00.000Z",
      "2026-05-01T08:00:00.000Z",
    ]);
  });
});
