import { nanoid } from "nanoid";
import { DEFAULT_VISIBLE_SECTIONS, normalizeState } from "./boardState";
import { SHEETS } from "./excelBoardSchema";
import {
  cellBoolean,
  cellNumber,
  cellText,
  ensureUnique,
  getExcelJS,
  readRows,
  readWorkbookBuffer,
  sortByOrder,
  withoutOrder,
} from "./excelBoardRows";

export async function parseBoardWorkbook(file) {
  const ExcelJS = await getExcelJS();
  const workbook = new ExcelJS.Workbook();
  const buffer = await readWorkbookBuffer(file);
  await workbook.xlsx.load(buffer);

  const errors = [];
  const columnRows = readRows(workbook, SHEETS.columns);
  const cardRows = readRows(workbook, SHEETS.cards);
  const checklistRows = readRows(workbook, SHEETS.checklistItems);
  const commentRows = readRows(workbook, SHEETS.comments);
  const linkRows = readRows(workbook, SHEETS.links);
  const settingsRows = readRows(workbook, SHEETS.settings);

  const columns = sortByOrder(
    columnRows.map((row) => ({
      id: cellText(row.id) || nanoid(),
      title: cellText(row.title) || "Untitled",
      isCompletion: cellBoolean(row.isCompletion),
      order: cellNumber(row.order, row.rowNumber),
    })),
  ).map(withoutOrder);

  const cards = sortByOrder(
    cardRows.map((row) => ({
      id: cellText(row.id) || nanoid(),
      columnId: cellText(row.columnId) || "inbox",
      title: cellText(row.title) || "Untitled",
      description: cellText(row.description),
      completed: cellBoolean(row.completed),
      completedAt: cellText(row.completedAt),
      important: cellBoolean(row.important),
      dueDate: cellText(row.dueDate).slice(0, 10),
      dueTime: cellText(row.dueTime).slice(0, 5),
      workloadAmount: cellNumber(row.workloadAmount, 1),
      workloadUnit: cellText(row.workloadUnit) === "days" ? "days" : "hours",
      workloadHours: cellNumber(row.workloadHours, 0),
      order: cellNumber(row.order, row.rowNumber),
    })),
  );

  const links = sortByOrder(
    linkRows.map((row) => ({
      id: cellText(row.id) || nanoid(),
      name: cellText(row.name) || "Untitled",
      url: cellText(row.url),
      order: cellNumber(row.order, row.rowNumber),
    })),
  ).map(withoutOrder);

  ensureUnique(columns, SHEETS.columns, errors);
  ensureUnique(cards, SHEETS.cards, errors);
  ensureUnique(links, SHEETS.links, errors);

  const cardIds = new Set(cards.map((card) => card.id));
  const columnIds = new Set(columns.map((column) => column.id));
  const checklistByCardId = new Map();
  const commentsByCardId = new Map();

  checklistRows.forEach((row) => {
    const cardId = cellText(row.cardId);
    if (!cardIds.has(cardId)) {
      errors.push(
        `${SHEETS.checklistItems} row ${row.rowNumber} references missing card "${cardId}".`,
      );
      return;
    }
    const items = checklistByCardId.get(cardId) || [];
    items.push({
      id: cellText(row.id) || nanoid(),
      text: cellText(row.text),
      done: cellBoolean(row.done),
      order: cellNumber(row.order, row.rowNumber),
    });
    checklistByCardId.set(cardId, items);
  });

  commentRows.forEach((row) => {
    const cardId = cellText(row.cardId);
    if (!cardIds.has(cardId)) {
      errors.push(
        `${SHEETS.comments} row ${row.rowNumber} references missing card "${cardId}".`,
      );
      return;
    }
    const comments = commentsByCardId.get(cardId) || [];
    comments.push({
      id: cellText(row.id) || nanoid(),
      text: cellText(row.text),
      createdAt: cellText(row.createdAt) || new Date().toISOString(),
      order: cellNumber(row.order, row.rowNumber),
    });
    commentsByCardId.set(cardId, comments);
  });

  cards.forEach((card) => {
    if (card.columnId !== "inbox" && !columnIds.has(card.columnId)) {
      errors.push(
        `${SHEETS.cards} contains card "${card.title}" with missing columnId "${card.columnId}".`,
      );
    }
    card.checklistItems = sortByOrder(
      checklistByCardId.get(card.id) || [],
    ).map(withoutOrder);
    card.comments = sortByOrder(commentsByCardId.get(card.id) || []).map(
      withoutOrder,
    );
  });

  let visibleSections = { ...DEFAULT_VISIBLE_SECTIONS };
  const visibleSectionsRow = settingsRows.find(
    (row) => cellText(row.key) === "visibleSections",
  );
  if (visibleSectionsRow) {
    try {
      visibleSections = {
        ...visibleSections,
        ...JSON.parse(cellText(visibleSectionsRow.value)),
      };
    } catch {
      errors.push(`${SHEETS.settings} visibleSections must be valid JSON.`);
    }
  }

  const state = normalizeState({
    columns,
    cards: cards.map(withoutOrder),
    links,
    visibleSections,
  });

  return {
    state,
    errors,
    summary: {
      columns: state.columns.length,
      cards: state.cards.length,
      checklistItems: state.cards.reduce(
        (total, card) => total + card.checklistItems.length,
        0,
      ),
      comments: state.cards.reduce(
        (total, card) => total + card.comments.length,
        0,
      ),
      links: state.links.length,
    },
  };
}
