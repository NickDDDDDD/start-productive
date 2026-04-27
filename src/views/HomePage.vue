<script setup>
import { computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import Draggable from "vuedraggable";
import { IconThunderbolt } from "@arco-design/web-vue/es/icon";
import { useBoardStore } from "../stores/board";
import SearchBar from "../components/search/SearchBar.vue";
import Links from "../components/links/Links.vue";
import TaskGenerator from "../components/task-generator/TaskGenerator.vue";
import Inbox from "../components/kanban/Inbox.vue";
import Column from "../components/kanban/Column.vue";

const board = useBoardStore();
const { columns, visibleSections } = storeToRefs(board);

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

      <section class="kanban-shell" :style="kanbanStyle">
        <div class="kanban-board">
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
          >
            <template #item="{ element }">
              <Column :column="element" />
            </template>
          </Draggable>

          <a-button type="primary" shape="round" @click="board.createColumn">
            Add Column
          </a-button>
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
