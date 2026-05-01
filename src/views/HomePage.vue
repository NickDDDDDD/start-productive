<script setup>
import { computed, nextTick, onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import Draggable from "vuedraggable";
import { IconPlus, IconThunderbolt } from "@arco-design/web-vue/es/icon";
import { useBoardStore } from "../stores/board";
import { useKanbanLayout } from "../composables/useKanbanLayout";
import SearchBar from "../components/search/SearchBar.vue";
import DataPortability from "../components/data/DataPortability.vue";
import Links from "../components/links/Links.vue";
import TaskGenerator from "../components/task-generator/TaskGenerator.vue";
import Inbox from "../components/kanban/Inbox.vue";
import Column from "../components/kanban/Column.vue";

const board = useBoardStore();
const { columns, visibleSections } = storeToRefs(board);
const {
  kanbanShellRef,
  kanbanBoardRef,
  kanbanTrackRef,
  isDraggingColumn,
  isShiftingKanbanLayout,
  kanbanTrackStyle,
  updateClosedTrackOffset,
  startKanbanLayoutShift,
  scrollKanbanToEnd,
} = useKanbanLayout();

onMounted(() => {
  board.initPersistence();
});

const kanbanStyle = computed(() => ({
  flexGrow: board.kanbanFlexGrow,
  flexShrink: 0,
  flexBasis: "0%",
}));

const panelStyle = (section, grow) => ({
  flexGrow: visibleSections.value[section] ? grow : 0,
  flexShrink: 0,
  flexBasis: "0%",
  opacity: visibleSections.value[section] ? 1 : 0,
  marginRight: visibleSections.value[section] ? "16px" : 0,
});

const inboxStyle = computed(() => ({
  flexGrow: 0,
  flexShrink: 0,
  flexBasis: visibleSections.value.inbox ? "264px" : "0px",
  width: visibleSections.value.inbox ? "264px" : "0px",
  opacity: visibleSections.value.inbox ? 1 : 0,
  marginRight: visibleSections.value.inbox ? "16px" : 0,
}));

const searchStyle = computed(() => ({
  flexGrow: board.kanbanFlexGrow + (visibleSections.value.taskGenerator ? 4 : 0),
  flexShrink: 0,
  flexBasis: `${(visibleSections.value.taskGenerator ? 16 : 0) + (visibleSections.value.inbox ? 280 : 0)}px`,
}));

const visibleKanbanTrackStyle = computed(() =>
  board.cardDrawerOpen ? { marginLeft: "0px" } : kanbanTrackStyle.value,
);

function createColumn() {
  startKanbanLayoutShift();
  board.createColumn();
  nextTick(() => {
    updateClosedTrackOffset();
    scrollKanbanToEnd();
  });
}

watch(
  [columns, visibleSections],
  () => {
    nextTick(updateClosedTrackOffset);
  },
  { deep: true },
);

watch(
  () => board.cardDrawerOpen,
  () => {
    startKanbanLayoutShift();
    nextTick(updateClosedTrackOffset);
  },
);
</script>

<template>
  <main class="home-page">
    <header class="top-bar">
      <a
        class="brand-link"
        :style="panelStyle('links', 2)"
        href="https://portfolio.nixkode.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        <IconThunderbolt class="brand-link__icon" />
        <span>Nixkode</span>
      </a>
      <div class="top-bar__search" :style="searchStyle">
        <SearchBar />
      </div>
      <div class="top-bar__tools">
        <DataPortability />
      </div>
    </header>

    <section class="workspace">
      <aside class="workspace-panel" :style="panelStyle('links', 2)">
        <Links />
      </aside>

      <aside class="workspace-panel" :style="panelStyle('taskGenerator', 4)">
        <TaskGenerator />
      </aside>

      <aside class="workspace-panel workspace-panel--inbox" :style="inboxStyle">
        <Inbox />
      </aside>

      <section ref="kanbanShellRef" class="kanban-shell" :style="kanbanStyle">
        <div
          ref="kanbanBoardRef"
          class="kanban-board"
        >
          <div
            ref="kanbanTrackRef"
            class="kanban-track"
            :class="{
              'kanban-track--layout-shifting': isShiftingKanbanLayout,
              'kanban-track--dragging': isDraggingColumn,
            }"
            :style="visibleKanbanTrackStyle"
          >
            <Draggable
              v-model="columns"
              class="kanban-columns"
              item-key="id"
              direction="horizontal"
              :animation="180"
              easing="cubic-bezier(0.2, 0, 0, 1)"
              :force-fallback="true"
              :fallback-on-body="true"
              fallback-class="drag-fallback"
              filter="input,textarea,select,button,.arco-dropdown,.arco-modal,.arco-drawer,.no-drag"
              :prevent-on-filter="false"
              ghost-class="drag-ghost"
              chosen-class="drag-chosen"
              drag-class="drag-active"
              @start="isDraggingColumn = true"
              @end="isDraggingColumn = false"
            >
              <template #item="{ element }">
                <Column :column="element" />
              </template>
            </Draggable>

            <a-button type="primary" shape="round" @click="createColumn">
              <template #icon><IconPlus /></template>
              Add Column
            </a-button>
          </div>
        </div>
      </section>
    </section>

    <nav class="section-toggle" aria-label="Visible sections">
      <button
        class="section-toggle__item"
        :class="{ 'section-toggle__item--active': visibleSections.links }"
        type="button"
        @click="board.toggleSection('links')"
      >
        <span>Links</span>
      </button>
      <button
        class="section-toggle__item"
        :class="{ 'section-toggle__item--active': visibleSections.taskGenerator }"
        type="button"
        @click="board.toggleSection('taskGenerator')"
      >
        <span>Task Generator</span>
      </button>
      <button
        class="section-toggle__item"
        :class="{ 'section-toggle__item--active': visibleSections.inbox }"
        type="button"
        @click="board.toggleSection('inbox')"
      >
        <span>Inbox</span>
      </button>
      <button
        class="section-toggle__item section-toggle__item--active"
        type="button"
        disabled
      >
        <span>Kanban</span>
      </button>
    </nav>
  </main>
</template>

<style scoped lang="less">
.home-page {
  position: relative;
  display: flex;
  width: 100%;
  height: 100dvh;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  overflow: hidden;
  isolation: isolate;
}

.top-bar {
  display: flex;
  gap: 8px;
  flex: 0 0 auto;

  &__search {
    min-width: 0;

    .search-bar {
      width: 100%;
    }
  }

  &__tools {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
  }
}

.brand-link {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
  border-radius: var(--app-radius-sm);
  color: var(--app-text);
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.15s ease;

  &:hover {
    color: var(--app-accent);
  }

  &__icon {
    color: var(--app-accent-strong);
    font-size: 28px;
    transition: color 0.15s ease;
  }

  &:hover &__icon {
    color: var(--app-accent);
  }
}

.workspace {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}

.workspace-panel,
.kanban-shell {
  min-width: 0;
  height: 100%;
  overflow: hidden;
  transition:
    flex-grow 0.25s ease,
    opacity 0.2s ease,
    margin 0.25s ease;
}

.kanban-shell {
  border-radius: var(--app-radius-md);
  border: 1px solid var(--app-panel-border);
  background: var(--app-panel-bg);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.035),
    0 16px 36px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(18px);
  padding: 16px;
  overflow-x: auto;
}

.kanban-board {
  display: flex;
  width: max-content;
  min-width: 100%;
  height: 100%;
  align-items: flex-start;
  justify-content: flex-start;
}

.kanban-track {
  display: flex;
  height: 100%;
  align-items: flex-start;
  gap: 16px;
  will-change: margin-left;
}

.kanban-track--layout-shifting {
  transition: margin-left 0.24s ease;
}

.kanban-track--dragging {
  transition: none;
}

.kanban-columns {
  display: flex;
  width: max-content;
  height: 100%;
  gap: 16px;

  > .drag-ghost {
    border-color: transparent;
    background: transparent;
    outline: 2px solid var(--app-accent-strong);
    outline-offset: -2px;
    box-shadow: none;

    > * {
      visibility: hidden;
    }
  }
}

.section-toggle {
  position: absolute;
  bottom: 20px;
  left: 50%;
  display: flex;
  gap: 6px;
  border-radius: var(--app-radius-md);
  border: 1px solid var(--app-panel-border);
  background: rgba(12, 12, 13, 0.86);
  padding: 6px;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.34);
  backdrop-filter: blur(18px);
  transform: translateX(-50%);

  &__item {
    width: 10px;
    min-width: 10px;
    height: 10px;
    overflow: hidden;
    border: 1px solid transparent;
    border-radius: var(--app-radius-xs);
    background: var(--app-overlay-l2);
    color: var(--app-text);
    cursor: pointer;
    padding: 0;
    font-size: 13px;
    font-weight: 500;
    line-height: 1;
    white-space: nowrap;
    transition:
      width 0.18s ease,
      min-width 0.18s ease,
      height 0.18s ease,
      padding 0.18s ease,
      background 0.18s ease,
      border-color 0.18s ease;

    span {
      opacity: 0;
      transition: opacity 0.12s ease;
    }

    &:hover {
      background: var(--app-overlay-l2);
      border-color: var(--app-panel-border-strong);
      color: var(--app-text);
    }

    &:disabled {
      cursor: default;
    }
  }

  &__item--active {
    background: var(--app-accent);
    border-color: var(--app-accent);
    color: #04130b;

    &:hover {
      background: var(--app-accent-strong);
      border-color: var(--app-accent-strong);
      color: #04130b;
    }
  }

  &:hover &__item,
  &:focus-within &__item {
    width: auto;
    min-width: 72px;
    height: 30px;
    padding: 0 12px;

    span {
      opacity: 1;
    }
  }
}
</style>
