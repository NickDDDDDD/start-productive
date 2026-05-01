export async function getExcelJS() {
  const module = await import("exceljs");
  return module.default || module;
}

export function addSheet(workbook, name, columns) {
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

export function sortByOrder(items) {
  return [...items].sort((a, b) => {
    const left = Number(a.order);
    const right = Number(b.order);
    if (Number.isFinite(left) && Number.isFinite(right)) return left - right;
    if (Number.isFinite(left)) return -1;
    if (Number.isFinite(right)) return 1;
    return 0;
  });
}

export function withoutOrder(item) {
  const rest = { ...item };
  delete rest.order;
  return rest;
}

export function cellText(value) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && "text" in value) return String(value.text);
  return String(value).trim();
}

export function cellBoolean(value) {
  if (typeof value === "boolean") return value;
  const text = cellText(value).toLowerCase();
  return ["true", "yes", "1", "y"].includes(text);
}

export function cellNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function readRows(workbook, sheetName) {
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

export async function readWorkbookBuffer(file) {
  if (file instanceof ArrayBuffer) return file;
  if (ArrayBuffer.isView(file)) {
    return file.buffer.slice(
      file.byteOffset,
      file.byteOffset + file.byteLength,
    );
  }
  return file.arrayBuffer();
}

export function ensureUnique(items, label, errors) {
  const seen = new Set();
  items.forEach((item) => {
    if (!item.id) return;
    if (seen.has(item.id)) {
      errors.push(`${label} contains duplicate id "${item.id}".`);
    }
    seen.add(item.id);
  });
}
