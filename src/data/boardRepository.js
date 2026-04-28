import Dexie, { liveQuery } from "dexie";
import { nanoid } from "nanoid";
import {
  createDefaultState,
  normalizeState,
  toPlainState,
} from "../utils/boardState";

const SETTINGS_VISIBLE_SECTIONS = "visibleSections";
const META_INITIALIZED = "initialized";

export const db = new Dexie("start-productive");

db.version(1).stores({
  columns: "id, order",
  cards: "id, columnId, order, dueDate, important",
  links: "id, order",
  settings: "key",
  backups: "id, createdAt",
  meta: "key",
});

function withOrder(items) {
  return items.map((item, order) => ({ ...item, order }));
}

function withoutOrder(item) {
  const rest = { ...item };
  delete rest.order;
  return rest;
}

async function writeBoardState(state) {
  const normalized = normalizeState(state);
  await db.columns.clear();
  await db.cards.clear();
  await db.links.clear();
  await db.settings.clear();
  await db.columns.bulkPut(withOrder(normalized.columns));
  await db.cards.bulkPut(withOrder(normalized.cards));
  await db.links.bulkPut(withOrder(normalized.links));
  await db.settings.put({
    key: SETTINGS_VISIBLE_SECTIONS,
    value: normalized.visibleSections,
  });
  await db.meta.put({
    key: META_INITIALIZED,
    value: true,
    updatedAt: new Date().toISOString(),
  });
}

export async function initializeBoardState() {
  await db.transaction(
    "rw",
    db.columns,
    db.cards,
    db.links,
    db.settings,
    db.meta,
    async () => {
      const initialized = await db.meta.get(META_INITIALIZED);
      if (initialized?.value) return;

      const [columnCount, cardCount, linkCount, settingsCount] =
        await Promise.all([
          db.columns.count(),
          db.cards.count(),
          db.links.count(),
          db.settings.count(),
        ]);

      if (columnCount || cardCount || linkCount || settingsCount) {
        await db.meta.put({
          key: META_INITIALIZED,
          value: true,
          updatedAt: new Date().toISOString(),
        });
        return;
      }

      await writeBoardState(createDefaultState());
    },
  );
}

export async function loadBoardState() {
  const [columns, cards, links, visibleSections] = await Promise.all([
    db.columns.orderBy("order").toArray(),
    db.cards.orderBy("order").toArray(),
    db.links.orderBy("order").toArray(),
    db.settings.get(SETTINGS_VISIBLE_SECTIONS),
  ]);

  return normalizeState({
    columns: columns.map(withoutOrder),
    cards: cards.map(withoutOrder),
    links: links.map(withoutOrder),
    visibleSections: visibleSections?.value,
  });
}

export async function saveBoardState(state) {
  await db.transaction(
    "rw",
    db.columns,
    db.cards,
    db.links,
    db.settings,
    db.meta,
    async () => {
      await writeBoardState(state);
    },
  );
}

export async function createBackup(reason = "manual") {
  const state = await loadBoardState();
  const createdAt = new Date().toISOString();
  const backup = {
    id: nanoid(),
    createdAt,
    reason,
    state: toPlainState(state),
    counts: {
      columns: state.columns.length,
      cards: state.cards.length,
      links: state.links.length,
    },
  };
  await db.backups.put(backup);
  return backup;
}

export async function replaceBoardState(state, { backup = false } = {}) {
  await db.transaction(
    "rw",
    db.columns,
    db.cards,
    db.links,
    db.settings,
    db.backups,
    db.meta,
    async () => {
      if (backup) {
        const current = await loadBoardState();
        await db.backups.put({
          id: nanoid(),
          createdAt: new Date().toISOString(),
          reason: "excel-import-replace",
          state: toPlainState(current),
          counts: {
            columns: current.columns.length,
            cards: current.cards.length,
            links: current.links.length,
          },
        });
      }
      await writeBoardState(state);
    },
  );
}

function mergeById(currentItems, importedItems) {
  const indexById = new Map(currentItems.map((item, index) => [item.id, index]));
  const next = currentItems.map((item) => ({ ...item }));

  importedItems.forEach((item) => {
    const index = indexById.get(item.id);
    if (index === undefined) {
      next.push({ ...item });
      return;
    }
    next[index] = { ...next[index], ...item };
  });

  return next;
}

export async function mergeBoardState(importedState) {
  await db.transaction(
    "rw",
    db.columns,
    db.cards,
    db.links,
    db.settings,
    db.meta,
    async () => {
      const current = await loadBoardState();
      await writeBoardState({
        columns: mergeById(current.columns, importedState.columns),
        cards: mergeById(current.cards, importedState.cards),
        links: mergeById(current.links, importedState.links),
        visibleSections: {
          ...current.visibleSections,
          ...importedState.visibleSections,
        },
      });
    },
  );
}

export function subscribeBoardState(handler) {
  const subscription = liveQuery(loadBoardState).subscribe({
    next: handler,
    error: (error) => console.error("[boardRepository] liveQuery failed", error),
  });

  return () => subscription.unsubscribe();
}
