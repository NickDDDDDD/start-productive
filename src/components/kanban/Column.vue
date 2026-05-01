<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import {
  IconCheckSquare,
  IconDelete,
  IconMore,
} from "@arco-design/web-vue/es/icon";
import { useBoardStore } from "../../stores/board";
import CardList from "./CardList.vue";
import CardDetail from "./CardDetail.vue";

const props = defineProps({
  column: { type: Object, required: true },
});

const board = useBoardStore();
const isAdding = ref(false);
const isEditing = ref(false);
const draftTitle = ref(props.column.title);
const titleInputRef = ref(null);

const cardsModel = computed({
  get() {
    const source = board.hasSearch ? board.visibleCards : board.cards;
    return source.filter((card) => card.columnId === props.column.id);
  },
  set(value) {
    if (!board.hasSearch) board.replaceCardsInColumn(props.column.id, value);
  },
});

function saveTitle() {
  if (!isEditing.value) return;
  board.updateColumn(props.column.id, draftTitle.value || "Untitled");
  isEditing.value = false;
}

function startTitleEdit() {
  draftTitle.value = props.column.title;
  isEditing.value = true;
}

function cancelTitleEdit() {
  draftTitle.value = props.column.title;
  isEditing.value = false;
}

function handleDocumentPointerDown(event) {
  if (!isEditing.value) return;
  const inputElement = titleInputRef.value?.$el;
  if (inputElement?.contains(event.target)) return;
  saveTitle();
}

onMounted(() => {
  document.addEventListener("pointerdown", handleDocumentPointerDown, true);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", handleDocumentPointerDown, true);
});

function createCard() {
  isAdding.value = true;
}

</script>

<template>
  <section class="column">
    <header class="column-header column-drag-handle">
      <span class="column-count">{{ cardsModel.length }}</span>
      <a-input
        v-if="isEditing"
        ref="titleInputRef"
        v-model="draftTitle"
        class="no-drag"
        size="small"
        auto-focus
        @blur="saveTitle"
        @keyup.enter="saveTitle"
        @keyup.esc="cancelTitleEdit"
      />
      <h2 v-else class="no-drag" @click="startTitleEdit">{{ column.title }}</h2>
      <span v-if="column.isCompletion" class="completion-badge no-drag">
        <IconCheckSquare />
        Completed
      </span>
      <a-dropdown trigger="click" position="rt">
        <a-button class="menu-trigger no-drag" shape="circle" size="mini" @click.stop>
          <IconMore />
        </a-button>
        <template #content>
          <a-doption @click="board.toggleColumnCompletion(column.id)">
            <template #icon><IconCheckSquare /></template>
            {{
              column.isCompletion
                ? "Unmark completion column"
                : "Mark completion column"
            }}
          </a-doption>
          <a-doption class="danger-option" @click="board.deleteColumn(column.id)">
            <template #icon><IconDelete /></template>
            Delete
          </a-doption>
        </template>
      </a-dropdown>
    </header>

    <CardList
      v-model:cards="cardsModel"
      :disabled="board.hasSearch"
      @create="createCard"
    />

    <CardDetail
      v-model:visible="isAdding"
      :column-id="column.id"
    />
  </section>
</template>

<style scoped lang="less">
.column {
  display: flex;
  width: 264px;
  max-height: 100%;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: var(--app-radius-md);
  overflow: hidden;
  background: rgba(237, 239, 242, 0.055);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
  padding: 10px;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.column-header {
  flex: 0 0 auto;
  padding: 4px;
  user-select: none;

  > h2 {
    flex: 1 1 auto;
    cursor: text;
  }

  :deep(.arco-input),
  :deep(.arco-input-wrapper) {
    user-select: text;
  }
}

.column-count {
  display: inline-flex;
  min-width: 28px;
  height: 24px;
  align-items: center;
  justify-content: center;
  border-radius: var(--app-radius-xs);
  background: rgba(50, 240, 140, 0.13);
  color: var(--app-accent);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.completion-badge {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 4px;
  border: 1px solid rgba(50, 240, 140, 0.26);
  border-radius: var(--app-radius-xs);
  background: rgba(50, 240, 140, 0.1);
  color: var(--app-accent);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  padding: 4px 6px;

  svg {
    font-size: 12px;
  }
}

</style>
