<script setup>
import { computed, ref } from "vue";
import {
  IconCalendar,
  IconCheckSquare,
  IconDelete,
  IconEdit,
  IconMessage,
  IconMore,
} from "@arco-design/web-vue/es/icon";
import { CARD_PRIORITY_STYLES } from "../../utils/cardPriority";
import { useBoardStore } from "../../stores/board";
import { useBoardPriorities } from "../../composables/useBoardPriorities";
import DraggableCard from "../common/DraggableCard.vue";
import CardDetail from "./CardDetail.vue";

const props = defineProps({
  card: { type: Object, required: true },
});

const board = useBoardStore();
const { getPriority } = useBoardPriorities();
const detailOpen = ref(false);
const priority = computed(() => getPriority(props.card));
const priorityStyle = computed(() => CARD_PRIORITY_STYLES[priority.value.key]);
const checklistItems = computed(() =>
  Array.isArray(props.card.checklistItems) ? props.card.checklistItems : [],
);
const doneChecklistCount = computed(
  () => checklistItems.value.filter((item) => item.done).length,
);
const comments = computed(() =>
  Array.isArray(props.card.comments) ? props.card.comments : [],
);
const dueLabel = computed(() => {
  if (!priority.value.dueDate) return "No date";
  return `Due ${priority.value.dueDate}${
    priority.value.dueTime ? ` ${priority.value.dueTime}` : ""
  }`;
});
const urgencyLabel = computed(() => {
  if (priority.value.key === "unplanned") return "Unplanned";
  return priority.value.urgent ? "Urgent" : "Not urgent";
});
const importanceLabel = computed(() =>
  priority.value.important ? "Important" : "Not important",
);
</script>

<template>
  <DraggableCard
    class="task-card"
    :class="`task-card--${priority.key}`"
    variant="task"
  >
    <div class="task-card__stripe" :class="priorityStyle.stripe" />
    <div
      class="task-card__body"
      role="button"
      tabindex="0"
      @click="detailOpen = true"
      @keyup.enter="detailOpen = true"
      @keyup.space.prevent="detailOpen = true"
    >
      <p>{{ card.title }}</p>
      <div class="task-card__badges">
        <a-tag size="small">{{ importanceLabel }}</a-tag>
        <a-tag size="small">{{ urgencyLabel }}</a-tag>
        <a-tag size="small"><IconCalendar /> {{ dueLabel }}</a-tag>
        <a-tag size="small">
          {{ priority.workloadAmount }}{{ priority.workloadUnit === "days" ? "d" : "h" }}
        </a-tag>
      </div>
      <footer class="task-card__meta">
        <div class="task-card__meta-left">
          <span v-if="card.description">
            <IconEdit />
            Details
          </span>
          <span v-if="checklistItems.length">
            <IconCheckSquare />
            {{ doneChecklistCount }}/{{ checklistItems.length }}
          </span>
        </div>
        <span class="task-card__comments">
          <IconMessage />
          {{ comments.length }}
        </span>
      </footer>
    </div>

    <a-dropdown trigger="click" position="rt">
      <a-button
        class="task-card__menu menu-trigger no-drag"
        shape="circle"
        size="mini"
        @click.stop
      >
        <IconMore />
      </a-button>
      <template #content>
        <a-doption @click="detailOpen = true">
          <template #icon><IconEdit /></template>
          Edit
        </a-doption>
        <a-doption class="danger-option" @click="board.deleteCard(card.id)">
          <template #icon><IconDelete /></template>
          Delete
        </a-doption>
      </template>
    </a-dropdown>

    <CardDetail v-model:visible="detailOpen" :card="card" />
  </DraggableCard>
</template>

<style scoped lang="less">
.task-card {
  &__stripe {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 6px;
  }

  &__body {
    display: flex;
    min-width: 0;
    min-height: 132px;
    flex-direction: column;
    gap: 8px;
    outline: none;
    padding: 10px 10px 10px 14px;
    text-align: left;
    cursor: grab;

    &:active {
      cursor: grabbing;
    }

    &:focus-visible {
      border-radius: var(--app-radius-sm);
      outline: 2px solid var(--app-accent);
      outline-offset: -2px;
    }

    p {
      max-height: 44px;
      margin: 0;
      overflow: auto;
      color: var(--app-text);
      font-size: 14px;
      line-height: 1.35;
      white-space: pre-wrap;
      word-break: break-word;
    }
  }

  &__badges {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    cursor: pointer;
  }

  &__meta {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 8px;
    margin-top: auto;
    color: var(--app-muted);
    cursor: pointer;
    font-size: 12px;

    span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
  }

  &__meta-left {
    display: flex;
    min-width: 0;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__comments {
    margin-left: auto;
    white-space: nowrap;
  }

  &__menu {
    position: absolute;
    top: 8px;
    right: 8px;
    opacity: 0;
    transition:
      opacity 0.14s ease,
      background 0.14s ease,
      border-color 0.14s ease;
  }

  &:hover &__menu,
  &__menu.arco-dropdown-open {
    opacity: 1;
  }
}

.task-card--importantUrgent {
  background: rgba(204, 75, 83, 0.13);
  border-color: rgba(204, 75, 83, 0.32);
}

.task-card--importantNotUrgent {
  background: rgba(50, 240, 140, 0.1);
  border-color: rgba(50, 240, 140, 0.26);
}

.task-card--notImportantUrgent {
  background: rgba(76, 136, 255, 0.12);
  border-color: rgba(76, 136, 255, 0.3);
}

.task-card--notImportantNotUrgent {
  background: rgba(237, 239, 242, 0.055);
  border-color: rgba(237, 239, 242, 0.13);
}

.task-card--unplanned {
  background: rgba(237, 239, 242, 0.04);
  border-color: rgba(237, 239, 242, 0.1);
}
</style>
