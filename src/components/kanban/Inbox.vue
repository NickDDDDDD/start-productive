<script setup>
import { computed, ref } from "vue";
import { useBoardStore } from "../../stores/board";
import CardList from "./CardList.vue";
import CardDetail from "./CardDetail.vue";

const board = useBoardStore();
const isAdding = ref(false);

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
  isAdding.value = true;
}

</script>

<template>
  <section class="column column--inbox">
    <header class="column-header">
      <span class="column-count">{{ cardsModel.length }}</span>
      <h2>Inbox</h2>
    </header>

    <CardList
      v-model:cards="cardsModel"
      :disabled="board.hasSearch"
      @create="createCard"
    />

    <CardDetail
      v-model:visible="isAdding"
      column-id="inbox"
    />
  </section>
</template>

<style scoped lang="less">
.column {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
}

.column--inbox {
  border-radius: var(--app-radius-md);
  border: 1px solid var(--app-panel-border);
  background: var(--app-panel-bg);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.035),
    0 16px 36px rgba(0, 0, 0, 0.22);
  padding: 16px;
}

.column-header {
  flex: 0 0 auto;
  padding: 4px;
  user-select: none;
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

</style>
