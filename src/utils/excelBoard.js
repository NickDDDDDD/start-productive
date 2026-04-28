import { nanoid } from "nanoid";
import { DEFAULT_VISIBLE_SECTIONS, normalizeState } from "./boardState";

const SHEETS = {
  columns: "Columns",
  cards: "Cards",
  checklistItems: "ChecklistItems",
  comments: "Comments",
  links: "Links",
  settings: "Settings",
};

async function getExcelJS() {
  const module = await import("exceljs");
  return module.default || module;
}

function addSheet(workbook, name, columns) {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = columns.map((key) => ({
    header: key,
    key,
    width: Math.max(12, key.length + 4),
  }));
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.getRow(1).font = { bold: true };
  return sheet;
}

function sortByOrder(items) {
  return [...items].sort((a, b) => {
    const left = Number(a.order);
    const right = Number(b.order);
    if (Number.isFinite(left) && Number.isFinite(right)) return left - right;
    if (Number.isFinite(left)) return -1;
    if (Number.isFinite(right)) return 1;
    return 0;
  });
}

function withoutOrder(item) {
  const rest = { ...item };
  delete rest.order;
  return rest;
}

function cellText(value) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && "text" in value) return String(value.text);
  return String(value).trim();
}

function cellBoolean(value) {
  if (typeof value === "boolean") return value;
  const text = cellText(value).toLowerCase();
  return ["true", "yes", "1", "y"].includes(text);
}

function cellNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function readRows(workbook, sheetName) {
  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) return [];

  const headers = [];
  sheet.getRow(1).eachCell((cell, columnNumber) => {
    headers[columnNumber] = cellText(cell.value);
  });

  const rows = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record = { rowNumber };
    let hasValue = false;
    headers.forEach((header, columnNumber) => {
      if (!header) return;
      const value = row.getCell(columnNumber).value;
      const text = cellText(value);
      if (text) hasValue = true;
      record[header] = value;
    });
    if (hasValue) rows.push(record);
  });

  return rows;
}

function ensureUnique(items, label, errors) {
  const seen = new Set();
  items.forEach((item) => {
    if (!item.id) return;
    if (seen.has(item.id)) {
      errors.push(`${label} contains duplicate id "${item.id}".`);
    }
    seen.add(item.id);
  });
}

export async function createBoardWorkbookBuffer(state) {
  const ExcelJS = await getExcelJS();
  const workbook = new ExcelJS.Workbook();
  const normalized = normalizeState(state);

  workbook.creator = "Start Productive";
  workbook.created = new Date();

  const columnsSheet = addSheet(workbook, SHEETS.columns, [
    "id",
    "title",
    "order",
  ]);
  normalized.columns.forEach((column, order) => {
    columnsSheet.addRow({ ...column, order });
  });

  const cardsSheet = addSheet(workbook, SHEETS.cards, [
    "id",
    "columnId",
    "title",
    "description",
    "important",
    "dueDate",
    "dueTime",
    "workloadAmount",
    "workloadUnit",
    "workloadHours",
    "order",
  ]);
  const checklistSheet = addSheet(workbook, SHEETS.checklistItems, [
    "cardId",
    "id",
    "text",
    "done",
    "order",
  ]);
  const commentsSheet = addSheet(workbook, SHEETS.comments, [
    "cardId",
    "id",
    "text",
    "createdAt",
    "order",
  ]);

  normalized.cards.forEach((card, order) => {
    cardsSheet.addRow({
      id: card.id,
      columnId: card.columnId,
      title: card.title,
      description: card.description,
      important: card.important,
      dueDate: card.dueDate,
      dueTime: card.dueTime,
      workloadAmount: card.workloadAmount,
      workloadUnit: card.workloadUnit,
      workloadHours: card.workloadHours,
      order,
    });
    card.checklistItems.forEach((item, itemOrder) => {
      checklistSheet.addRow({ cardId: card.id, ...item, order: itemOrder });
    });
    card.comments.forEach((comment, commentOrder) => {
      commentsSheet.addRow({
        cardId: card.id,
        ...comment,
        order: commentOrder,
      });
    });
  });

  const linksSheet = addSheet(workbook, SHEETS.links, [
    "id",
    "name",
    "url",
    "order",
  ]);
  normalized.links.forEach((link, order) => {
    linksSheet.addRow({ ...link, order });
  });

  const settingsSheet = addSheet(workbook, SHEETS.settings, ["key", "value"]);
  settingsSheet.addRow({
    key: "visibleSections",
    value: JSON.stringify(normalized.visibleSections),
  });

  return workbook.xlsx.writeBuffer();
}

export async function downloadBoardWorkbook(state) {
  const buffer = await createBoardWorkbookBuffer(state);
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `start-productive-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function parseBoardWorkbook(file) {
  const ExcelJS = await getExcelJS();
  const workbook = new ExcelJS.Workbook();
  const buffer =
    file instanceof ArrayBuffer ? file : await file.arrayBuffer();
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
      order: cellNumber(row.order, row.rowNumber),
    })),
  ).map(withoutOrder);

  const cards = sortByOrder(
    cardRows.map((row) => ({
      id: cellText(row.id) || nanoid(),
      columnId: cellText(row.columnId) || "inbox",
      title: cellText(row.title) || "Untitled",
      description: cellText(row.description),
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

function countMerge(currentItems, importedItems) {
  const currentIds = new Set(currentItems.map((item) => item.id));
  return importedItems.reduce(
    (summary, item) => {
      if (currentIds.has(item.id)) summary.updated += 1;
      else summary.created += 1;
      return summary;
    },
    { created: 0, updated: 0 },
  );
}

export function createImportPreview(currentState, importedState) {
  return {
    columns: countMerge(currentState.columns, importedState.columns),
    cards: countMerge(currentState.cards, importedState.cards),
    links: countMerge(currentState.links, importedState.links),
  };
}
