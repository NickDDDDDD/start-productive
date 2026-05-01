import { normalizeState } from "./boardState";
import { EXCEL_COLUMNS, SHEETS } from "./excelBoardSchema";
import { addSheet, getExcelJS } from "./excelBoardRows";

export async function createBoardWorkbookBuffer(state) {
  const ExcelJS = await getExcelJS();
  const workbook = new ExcelJS.Workbook();
  const normalized = normalizeState(state);

  workbook.creator = "Start Productive";
  workbook.created = new Date();

  const columnsSheet = addSheet(workbook, SHEETS.columns, EXCEL_COLUMNS.columns);
  normalized.columns.forEach((column, order) => {
    columnsSheet.addRow({ ...column, order });
  });

  const cardsSheet = addSheet(workbook, SHEETS.cards, EXCEL_COLUMNS.cards);
  const checklistSheet = addSheet(
    workbook,
    SHEETS.checklistItems,
    EXCEL_COLUMNS.checklistItems,
  );
  const commentsSheet = addSheet(
    workbook,
    SHEETS.comments,
    EXCEL_COLUMNS.comments,
  );

  normalized.cards.forEach((card, order) => {
    cardsSheet.addRow({
      id: card.id,
      columnId: card.columnId,
      title: card.title,
      description: card.description,
      completed: card.completed,
      completedAt: card.completedAt,
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

  const linksSheet = addSheet(workbook, SHEETS.links, EXCEL_COLUMNS.links);
  normalized.links.forEach((link, order) => {
    linksSheet.addRow({ ...link, order });
  });

  const settingsSheet = addSheet(workbook, SHEETS.settings, EXCEL_COLUMNS.settings);
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
