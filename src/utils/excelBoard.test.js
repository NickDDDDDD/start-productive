import { describe, expect, it } from "vitest";
import {
  createBoardWorkbookBuffer,
  createImportPreview,
  parseBoardWorkbook,
} from "./excelBoard";

const boardState = {
  columns: [{ id: "todo", title: "Todo", isCompletion: true }],
  cards: [
    {
      id: "card-1",
      columnId: "todo",
      title: "Ship import",
      description: "Roundtrip through Excel",
      completed: true,
      completedAt: "2026-05-01T08:00:00.000Z",
      important: true,
      dueDate: "2026-05-01",
      dueTime: "10:15",
      workloadAmount: 1.5,
      workloadUnit: "hours",
      workloadHours: 1.5,
      checklistItems: [{ id: "check-1", text: "Parse workbook", done: true }],
      comments: [
        {
          id: "comment-1",
          text: "Keep the note",
          createdAt: "2026-05-01T00:00:00.000Z",
        },
      ],
    },
  ],
  links: [{ id: "link-1", name: "Start", url: "https://example.com" }],
  visibleSections: { links: true, taskGenerator: false, inbox: true },
};

describe("excelBoard", () => {
  it("roundtrips board state through an xlsx workbook", async () => {
    const buffer = await createBoardWorkbookBuffer(boardState);

    const parsed = await parseBoardWorkbook(buffer);

    expect(parsed.errors).toEqual([]);
    expect(parsed.summary).toEqual({
      columns: 1,
      cards: 1,
      checklistItems: 1,
      comments: 1,
      links: 1,
    });
    expect(parsed.state.columns[0]).toMatchObject({
      id: "todo",
      title: "Todo",
      isCompletion: true,
    });
    expect(parsed.state.cards[0]).toMatchObject({
      id: "card-1",
      columnId: "todo",
      title: "Ship import",
      completed: true,
      completedAt: "2026-05-01T08:00:00.000Z",
      important: true,
      dueDate: "2026-05-01",
      dueTime: "10:15",
      workloadAmount: 1.5,
      workloadUnit: "hours",
    });
    expect(parsed.state.cards[0].checklistItems).toEqual([
      { id: "check-1", text: "Parse workbook", done: true },
    ]);
    expect(parsed.state.cards[0].comments[0]).toMatchObject({
      id: "comment-1",
      text: "Keep the note",
    });
  });

  it("defaults imported columns without isCompletion to normal columns", async () => {
    const module = await import("exceljs");
    const ExcelJS = module.default || module;
    const workbook = new ExcelJS.Workbook();
    const columnsSheet = workbook.addWorksheet("Columns");
    columnsSheet.columns = ["id", "title", "order"].map((key) => ({
      header: key,
      key,
    }));
    columnsSheet.addRow({ id: "todo", title: "Todo", order: 0 });
    const cardsSheet = workbook.addWorksheet("Cards");
    cardsSheet.columns = ["id", "columnId", "title", "order"].map((key) => ({
      header: key,
      key,
    }));

    const parsed = await parseBoardWorkbook(await workbook.xlsx.writeBuffer());

    expect(parsed.errors).toEqual([]);
    expect(parsed.state.columns[0]).toMatchObject({
      id: "todo",
      title: "Todo",
      isCompletion: false,
    });
  });

  it("reports missing column references before import", async () => {
    const buffer = await createBoardWorkbookBuffer({
      ...boardState,
      columns: [],
      cards: [{ ...boardState.cards[0], columnId: "missing-column" }],
    });

    const parsed = await parseBoardWorkbook(buffer);

    expect(parsed.errors).toContain(
      'Cards contains card "Ship import" with missing columnId "missing-column".',
    );
  });

  it("summarizes merge create and update counts", () => {
    const preview = createImportPreview(boardState, {
      columns: [
        { id: "todo", title: "Updated" },
        { id: "done", title: "Done" },
      ],
      cards: [
        { id: "card-1", title: "Updated" },
        { id: "card-2", title: "New" },
      ],
      links: [{ id: "link-2", name: "New", url: "https://new.example" }],
    });

    expect(preview).toEqual({
      columns: { created: 1, updated: 1 },
      cards: { created: 1, updated: 1 },
      links: { created: 1, updated: 0 },
    });
  });
});
