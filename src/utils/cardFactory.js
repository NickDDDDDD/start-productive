import { nanoid } from "nanoid";
import { DEFAULT_CARD_META } from "./cardPriority";

function normalizeCreatePayload(payload) {
  if (typeof payload === "string") return { title: payload };
  if (payload && typeof payload === "object") return payload;
  return {};
}

export function createCard(payload, columnId) {
  const patch = normalizeCreatePayload(payload);
  const title = typeof patch.title === "string" ? patch.title.trim() : "";

  return {
    id: nanoid(),
    ...DEFAULT_CARD_META,
    ...patch,
    columnId,
    title: title || "Untitled",
  };
}
