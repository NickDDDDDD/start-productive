export const SHEETS = {
  columns: "Columns",
  cards: "Cards",
  checklistItems: "ChecklistItems",
  comments: "Comments",
  links: "Links",
  settings: "Settings",
};

export const EXCEL_COLUMNS = {
  columns: ["id", "title", "isCompletion", "order"],
  cards: [
    "id",
    "columnId",
    "title",
    "description",
    "completed",
    "completedAt",
    "important",
    "dueDate",
    "dueTime",
    "workloadAmount",
    "workloadUnit",
    "workloadHours",
    "order",
  ],
  checklistItems: ["cardId", "id", "text", "done", "order"],
  comments: ["cardId", "id", "text", "createdAt", "order"],
  links: ["id", "name", "url", "order"],
  settings: ["key", "value"],
};
