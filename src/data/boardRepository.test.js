import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  db,
  initializeBoardState,
  loadBoardState,
  mergeBoardState,
  replaceBoardState,
  saveBoardState,
} from "./boardRepository";

const customState = {
  columns: [
    { id: "todo", title: "Todo", isCompletion: false },
    { id: "doing", title: "Doing", isCompletion: false },
  ],
  cards: [
    {
      id: "card-1",
      columnId: "todo",
      title: "Write tests",
      description: "Cover IndexedDB repository",
      important: true,
      dueDate: "2026-05-01",
      dueTime: "09:30",
      workloadAmount: 2,
      workloadUnit: "hours",
      checklistItems: [{ id: "check-1", text: "Repository", done: false }],
      comments: [{ id: "comment-1", text: "Looks good", createdAt: "2026-05-01T00:00:00.000Z" }],
    },
  ],
  links: [{ id: "link-1", name: "Docs", url: "https://example.com" }],
  visibleSections: { links: true, taskGenerator: false, inbox: true },
};

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe("boardRepository", () => {
  it("initializes an empty database with the default board", async () => {
    await initializeBoardState();

    const state = await loadBoardState();

    expect(state.columns.map((column) => column.id)).toEqual([
      "todo",
      "doing",
      "done",
    ]);
    expect(state.cards).toEqual([]);
    expect(state.links).toEqual([]);
    expect(state.visibleSections).toEqual({
      links: true,
      taskGenerator: true,
      inbox: true,
    });
  });

  it("saves and loads normalized board state in order", async () => {
    await saveBoardState(customState);

    const state = await loadBoardState();

    expect(state.columns.map((column) => column.id)).toEqual(["todo", "doing"]);
    expect(state.cards[0]).toMatchObject({
      id: "card-1",
      columnId: "todo",
      title: "Write tests",
      important: true,
      workloadHours: 2,
    });
    expect(state.cards[0].checklistItems).toHaveLength(1);
    expect(state.cards[0].comments).toHaveLength(1);
    expect(state.links[0]).toEqual({
      id: "link-1",
      name: "Docs",
      url: "https://example.com",
    });
  });

  it("creates a backup before replacing imported state", async () => {
    await saveBoardState(customState);

    await replaceBoardState(
      {
        columns: [{ id: "done", title: "Done", isCompletion: true }],
        cards: [],
        links: [],
        visibleSections: { links: false, taskGenerator: false, inbox: false },
      },
      { backup: true },
    );

    const [state, backups] = await Promise.all([
      loadBoardState(),
      db.backups.toArray(),
    ]);

    expect(state.columns).toEqual([
      { id: "done", title: "Done", isCompletion: true },
    ]);
    expect(backups).toHaveLength(1);
    expect(backups[0].reason).toBe("excel-import-replace");
    expect(backups[0].counts).toEqual({ columns: 2, cards: 1, links: 1 });
  });

  it("merges imported records by id without deleting existing records", async () => {
    await saveBoardState(customState);

    await mergeBoardState({
      columns: [
        { id: "todo", title: "Updated Todo", isCompletion: false },
        { id: "done", title: "Done", isCompletion: true },
      ],
      cards: [
        { id: "card-1", columnId: "todo", title: "Updated card" },
        { id: "card-2", columnId: "done", title: "New card" },
      ],
      links: [{ id: "link-2", name: "New Link", url: "https://new.example" }],
      visibleSections: { taskGenerator: true },
    });

    const state = await loadBoardState();

    expect(state.columns.map((column) => column.title)).toEqual([
      "Updated Todo",
      "Doing",
      "Done",
    ]);
    expect(state.cards.map((card) => card.title)).toEqual([
      "Updated card",
      "New card",
    ]);
    expect(state.links.map((link) => link.id)).toEqual(["link-1", "link-2"]);
    expect(state.visibleSections.taskGenerator).toBe(true);
  });
});
