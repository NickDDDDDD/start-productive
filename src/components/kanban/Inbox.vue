<script setup>
import { computed, ref } from "vue";
import Draggable from "vuedraggable";
import { IconPlus } from "@arco-design/web-vue/es/icon";
import { useBoardStore } from "../../stores/board";
import Card from "./Card.vue";

const board = useBoardStore();
const isAdding = ref(false);
const title = ref("");

const cardsModel = computed({
  get() {
    const source = board.hasSearch ? board.visibleCards : board.cards;
    return source.filter((card) => card.columnId === "inbox");
  },
  set(value) {
    if (!board.hasSearch) board.replaceCardsInColumn("inbox", value);
  },
});

function createCard() {
  if (!isAdding.value) {
    isAdding.value = true;
    return;
  }
  board.createCard("inbox", title.value);
  title.value = "";
  isAdding.value = false;
}
</script>

<template>
  <section class="column column--inbox">
    <header class="column-header">
      <span class="column-count">{{ cardsModel.length }}</span>
      <h2>Inbox</h2>
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
      v-model="title"
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
