import { nanoid } from "nanoid";
import { DEFAULT_CARD_META, WORKLOAD_UNIT_HOURS } from "./cardPriority";

export const DEFAULT_VISIBLE_SECTIONS = {
  links: true,
  taskGenerator: true,
  inbox: true,
};

export const createDefaultState = () => ({
  columns: [
    { id: "todo", title: "Todo" },
    { id: "doing", title: "Doing" },
    { id: "done", title: "Done" },
  ],
  cards: [],
  links: [],
  visibleSections: { ...DEFAULT_VISIBLE_SECTIONS },
});

export function toPlainState(state) {
  return JSON.parse(
    JSON.stringify({
      columns: state.columns,
      cards: state.cards,
      links: state.links,
      visibleSections: state.visibleSections,
    }),
  );
}

function asString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asPositiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

export function normalizeChecklistItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      id: asString(item?.id) || nanoid(),
      text: asString(item?.text).trim(),
      done: Boolean(item?.done),
    }))
    .filter((item) => item.text);
}

export function normalizeComments(comments) {
  if (!Array.isArray(comments)) return [];
  return comments
    .map((comment) => ({
      id: asString(comment?.id) || nanoid(),
      text: asString(comment?.text).trim(),
      createdAt: asString(comment?.createdAt) || new Date().toISOString(),
    }))
    .filter((comment) => comment.text);
}

export function normalizeColumn(column = {}) {
  return {
    id: asString(column.id) || nanoid(),
    title: asString(column.title).trim() || "Untitled",
  };
}

export function normalizeLink(link = {}) {
  return {
    id: asString(link.id) || nanoid(),
    name: asString(link.name).trim() || "Untitled",
    url: asString(link.url).trim(),
  };
}

export function normalizeCard(card = {}) {
  const workloadUnit =
    card.workloadUnit === "days" ? "days" : DEFAULT_CARD_META.workloadUnit;
  const workloadAmount = asPositiveNumber(
    card.workloadAmount,
    DEFAULT_CARD_META.workloadAmount,
  );

  return {
    id: asString(card.id) || nanoid(),
    ...DEFAULT_CARD_META,
    title: asString(card.title).trim() || "Untitled",
    columnId: asString(card.columnId) || "inbox",
    description: asString(card.description, DEFAULT_CARD_META.description),
    checklistItems: normalizeChecklistItems(card.checklistItems),
    comments: normalizeComments(card.comments),
    important: Boolean(card.important),
    dueDate: asString(card.dueDate),
    dueTime: card.dueDate ? asString(card.dueTime) : "",
    workloadAmount,
    workloadUnit,
    workloadHours: workloadAmount * WORKLOAD_UNIT_HOURS[workloadUnit],
    tags: Array.isArray(card.tags)
      ? card.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : undefined,
  };
}

export function normalizeState(state = {}) {
  const defaults = createDefaultState();
  return {
    columns: Array.isArray(state.columns)
      ? state.columns.map(normalizeColumn)
      : defaults.columns,
    cards: Array.isArray(state.cards)
      ? state.cards.map(normalizeCard)
      : defaults.cards,
    links: Array.isArray(state.links)
      ? state.links.map(normalizeLink)
      : defaults.links,
    visibleSections: {
      ...DEFAULT_VISIBLE_SECTIONS,
      ...(state.visibleSections || {}),
    },
  };
}
