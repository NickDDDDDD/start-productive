<script setup>
import { computed } from "vue";
import Draggable from "vuedraggable";
import { IconPlus } from "@arco-design/web-vue/es/icon";
import Card from "./Card.vue";

const props = defineProps({
  cards: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["update:cards", "create"]);

const cardsModel = computed({
  get: () => props.cards,
  set: (value) => emit("update:cards", value),
});
</script>

<template>
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
    :disabled="disabled"
  >
    <template #item="{ element }">
      <Card :card="element" />
    </template>

    <template #footer>
      <div class="card-list__footer no-drag">
        <a-button type="primary" long shape="round" @click="emit('create')">
          <template #icon><IconPlus /></template>
          Add Card
        </a-button>
      </div>
    </template>
  </Draggable>
</template>

<style scoped lang="less">
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
