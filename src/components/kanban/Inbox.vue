<script setup>
import { computed, ref } from "vue";
import Draggable from "vuedraggable";
import { IconPlus } from "@arco-design/web-vue/es/icon";
import { useBoardStore } from "../../stores/board";
import Card from "./Card.vue";
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

    <Draggable
      v-model="cardsModel"
      class="card-list"
      :class="{ 'card-list--empty': !cardsModel.length }"
      item-key="id"
      group="cards"
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
      :disabled="board.hasSearch"
    >
      <template #item="{ element }">
        <Card :card="element" />
      </template>

      <template #footer>
        <div class="card-list__footer no-drag">
          <a-button type="primary" long shape="round" @click="createCard">
            <template #icon><IconPlus /></template>
            Add Card
          </a-button>
        </div>
      </template>
    </Draggable>

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

.card-list {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 8px;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;

  > [data-draggable] {
    order: 1;
  }

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }

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

.card-list--empty {
  padding-top: 12px;
}

.card-list__footer {
  position: sticky;
  bottom: 0;
  z-index: 2;
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 8px;
  order: 2;
}

</style>
