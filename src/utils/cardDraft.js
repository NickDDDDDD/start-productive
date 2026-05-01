import { nanoid } from "nanoid";
import {
  DEFAULT_CARD_META,
  WORKLOAD_UNIT_HOURS,
  normalizeCardMeta,
} from "./cardPriority";

export const WORKLOAD_STEP = 0.25;
export const MIN_WORKLOAD_AMOUNT = 0.25;

export function createCardDraft(card = null) {
  const source = card || {};
  const meta = normalizeCardMeta(source);

  return {
    title: source.title || "",
    description:
      typeof source.description === "string"
        ? source.description
        : DEFAULT_CARD_META.description,
    checklistItems: normalizeChecklistItems(source.checklistItems),
    comments: normalizeComments(source.comments),
    completed: Boolean(source.completed),
    completedAt:
      source.completed && typeof source.completedAt === "string"
        ? source.completedAt
        : "",
    important: meta.important,
    dueDate: meta.dueDate,
    dueTime: meta.dueTime,
    workloadAmount: meta.workloadAmount,
    workloadUnit: meta.workloadUnit,
  };
}

export function normalizeChecklistItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    id: item?.id || nanoid(),
    text: typeof item?.text === "string" ? item.text : "",
    done: Boolean(item?.done),
  }));
}

export function normalizeComments(comments) {
  if (!Array.isArray(comments)) return [];
  return comments.map((comment) => ({
    id: comment?.id || nanoid(),
    text: typeof comment?.text === "string" ? comment.text : "",
    createdAt:
      typeof comment?.createdAt === "string"
        ? comment.createdAt
        : new Date().toISOString(),
  }));
}

export function buildCardPayload(draft) {
  const workloadAmount = Number(draft.workloadAmount);
  const workloadUnit = draft.workloadUnit === "days" ? "days" : "hours";
  const safeWorkloadAmount =
    Number.isFinite(workloadAmount) && workloadAmount > 0 ? workloadAmount : 1;

  return {
    title: draft.title.trim() || "Untitled",
    description: draft.description,
    checklistItems: draft.checklistItems
      .map((item) => ({
        id: item.id || nanoid(),
        text: item.text.trim(),
        done: Boolean(item.done),
      }))
      .filter((item) => item.text),
    comments: draft.comments
      .map((comment) => ({
        id: comment.id || nanoid(),
        text: comment.text.trim(),
        createdAt: comment.createdAt || new Date().toISOString(),
      }))
      .filter((comment) => comment.text),
    completed: Boolean(draft.completed),
    completedAt: draft.completed
      ? draft.completedAt || new Date().toISOString()
      : "",
    important: Boolean(draft.important),
    dueDate: draft.dueDate || "",
    dueTime: draft.dueDate ? draft.dueTime || "" : "",
    workloadAmount: safeWorkloadAmount,
    workloadUnit,
    workloadHours: safeWorkloadAmount * WORKLOAD_UNIT_HOURS[workloadUnit],
  };
}
