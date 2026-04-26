<script setup>
import { computed, ref } from "vue";
import Draggable from "vuedraggable";
import {
  IconDelete,
  IconMore,
  IconPlus,
} from "@arco-design/web-vue/es/icon";
import { useBoardStore } from "../../stores/board";
import Card from "./Card.vue";

const props = defineProps({
  column: { type: Object, required: true },
});

const board = useBoardStore();
const isAdding = ref(false);
const isEditing = ref(false);
const draftTitle = ref(props.column.title);
const cardTitle = ref("");

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
  board.updateColumn(props.column.id, draftTitle.value || "Untitled");
  isEditing.value = false;
}

function createCard() {
  if (!isAdding.value) {
    isAdding.value = true;
    return;
  }
  board.createCard(props.column.id, cardTitle.value);
  cardTitle.value = "";
  isAdding.value = false;
}
</script>

<template>
  <section class="column">
    <header class="column-header column-drag-handle">
      <span class="column-count">{{ cardsModel.length }}</span>
      <a-input
        v-if="isEditing"
        v-model="draftTitle"
        size="small"
        auto-focus
        @blur="saveTitle"
        @keyup.enter="saveTitle"
      />
      <h2 v-else @click="isEditing = true">{{ column.title }}</h2>
      <a-dropdown trigger="click" position="rt">
        <a-button class="menu-trigger no-drag" shape="circle" size="mini" @click.stop>
          <IconMore />
        </a-button>
        <template #content>
          <a-doption class="danger-option" @click="board.deleteColumn(column.id)">
            <template #icon><IconDelete /></template>
            Delete
          </a-doption>
        </template>
      </a-dropdown>
    </header>

    <Draggable
      v-model="cardsModel"
      class="card-list"
      item-key="id"
      group="cards"
      :animation="180"
      easing="cubic-bezier(0.2, 0, 0, 1)"
      :empty-insert-threshold="80"
      :force-fallback="true"
      :fallback-on-body="true"
      fallback-class="drag-fallback"
      filter="input,textarea,select,button,.arco-dropdown,.arco-modal,.arco-drawer,.no-drag"
      :prevent-on-filter="false"
      ghost-class="drag-ghost"
      chosen-class="drag-chosen"
      drag-class="drag-active"
      :disabled="board.hasSearch"
    >
      <template #item="{ element }">
        <Card :card="element" />
      </template>
    </Draggable>

    <a-textarea
      v-if="isAdding"
      v-model="cardTitle"
      class="add-card-input"
      placeholder="Do something..."
    />
    <div class="column-actions">
      <a-button type="primary" long shape="round" @click="createCard">
        <template #icon><IconPlus v-if="!isAdding" /></template>
        {{ isAdding ? "Confirm" : "Add Card" }}
      </a-button>
      <a-button v-if="isAdding" shape="round" @click="isAdding = false">
        Cancel
      </a-button>
    </div>
  </section>
</template>
