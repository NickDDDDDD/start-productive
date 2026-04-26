import { defineStore } from "pinia";
import { nanoid } from "nanoid";
import {
  DEFAULT_VISIBLE_SECTIONS,
  createDefaultState,
  loadState,
  saveState,
  subscribeState,
} from "../utils/storage";
import { DEFAULT_CARD_META } from "../utils/cardPriority";

let persistenceStarted = false;
let saveTimer = null;
let applyingExternalState = false;

function normalizeState(state = {}) {
  const defaults = createDefaultState();
  return {
    columns: Array.isArray(state.columns) ? state.columns : defaults.columns,
    cards: Array.isArray(state.cards) ? state.cards : defaults.cards,
    links: Array.isArray(state.links) ? state.links : defaults.links,
    visibleSections: {
      ...DEFAULT_VISIBLE_SECTIONS,
      ...(state.visibleSections || {}),
    },
  };
}

function nextCard(title, columnId) {
  return {
    id: nanoid(),
    columnId,
    title: title?.trim() || "Untitled",
    ...DEFAULT_CARD_META,
  };
}

export const useBoardStore = defineStore("board", {
  state: () => ({
    ...createDefaultState(),
    searchTerm: "",
    hydrated: false,
  }),

  getters: {
    hasSearch: (state) => Boolean(state.searchTerm.trim()),
    visibleCards(state) {
      const query = state.searchTerm.trim().toLowerCase();
      if (!query) return state.cards;

      return state.cards.filter((card) => {
        return (
          card.title?.toLowerCase().includes(query) ||
          card.description?.toLowerCase().includes(query) ||
          card.comments?.some((comment) =>
            comment.text?.toLowerCase().includes(query),
          ) ||
          card.checklistItems?.some((item) =>
            item.text?.toLowerCase().includes(query),
          ) ||
          card.tags?.some((tag) => tag.toLowerCase().includes(query))
        );
      });
    },
    kanbanFlexGrow(state) {
      return (
        24 -
        (state.visibleSections.links ? 2 : 0) -
        (state.visibleSections.taskGenerator ? 4 : 0) -
        (state.visibleSections.inbox ? 4 : 0)
      );
    },
  },

  actions: {
    async hydrate() {
      const loaded = normalizeState(await loadState());
      applyingExternalState = true;
      this.$patch({ ...loaded, hydrated: true });
      applyingExternalState = false;
    },

    async initPersistence() {
      if (persistenceStarted) return;
      persistenceStarted = true;
      await this.hydrate();

      subscribeState((nextState) => {
        if (!nextState) return;
        applyingExternalState = true;
        this.$patch(normalizeState(nextState));
        applyingExternalState = false;
      });

      this.$subscribe(
        (_mutation, state) => {
          if (!state.hydrated || applyingExternalState) return;
          clearTimeout(saveTimer);
          saveTimer = setTimeout(() => {
            saveState({
              columns: state.columns,
              cards: state.cards,
              links: state.links,
              visibleSections: state.visibleSections,
            });
          }, 200);
        },
        { detached: true, deep: true },
      );
    },

    setSearchTerm(value) {
      this.searchTerm = value;
    },

    toggleSection(section) {
      this.visibleSections[section] = !this.visibleSections[section];
    },

    createColumn() {
      this.columns.push({
        id: nanoid(),
        title: `Column ${this.columns.length + 1}`,
      });
    },

    updateColumn(id, title) {
      const column = this.columns.find((item) => item.id === id);
      if (column) column.title = title;
    },

    deleteColumn(id) {
      this.columns = this.columns.filter((column) => column.id !== id);
      this.cards = this.cards.filter((card) => card.columnId !== id);
    },

    createCard(columnId, title) {
      const card = nextCard(title, columnId);
      if (columnId === "inbox") {
        const inboxCards = this.cards.filter((item) => item.columnId === "inbox");
        const otherCards = this.cards.filter((item) => item.columnId !== "inbox");
        this.cards = [card, ...inboxCards, ...otherCards];
        return;
      }
      this.cards.push(card);
    },

    createCardsInInbox(titles) {
      const newCards = titles.map((title) => nextCard(title, "inbox"));
      const inboxCards = this.cards.filter((item) => item.columnId === "inbox");
      const otherCards = this.cards.filter((item) => item.columnId !== "inbox");
      this.cards = [...newCards, ...inboxCards, ...otherCards];
    },

    updateCard(id, patch) {
      const card = this.cards.find((item) => item.id === id);
      if (!card) return;
      Object.assign(card, typeof patch === "string" ? { title: patch } : patch);
    },

    deleteCard(id) {
      this.cards = this.cards.filter((card) => card.id !== id);
    },

    replaceCardsInColumn(columnId, nextCards) {
      const idsInColumn = new Set(nextCards.map((card) => card.id));
      const normalized = nextCards.map((card) => ({ ...card, columnId }));
      const otherCards = this.cards.filter((card) => {
        return card.columnId !== columnId && !idsInColumn.has(card.id);
      });

      if (columnId === "inbox") {
        this.cards = [...normalized, ...otherCards];
        return;
      }

      const before = otherCards.filter((card) => card.columnId === "inbox");
      const after = otherCards.filter((card) => card.columnId !== "inbox");
      this.cards = [...before, ...normalized, ...after];
    },

    createLink(payload) {
      this.links.push({
        id: nanoid(),
        name: payload.name?.trim() || "Untitled",
        url: payload.url?.trim() || "",
      });
    },

    deleteLink(id) {
      this.links = this.links.filter((link) => link.id !== id);
    },
  },
});
