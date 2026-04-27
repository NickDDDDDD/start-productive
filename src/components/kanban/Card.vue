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
import { CARD_PRIORITY_STYLES, getCardPriority } from "../../utils/cardPriority";
import { useBoardStore } from "../../stores/board";
import DraggableCard from "../common/DraggableCard.vue";
import CardDetail from "./CardDetail.vue";

const props = defineProps({
  card: { type: Object, required: true },
});

const board = useBoardStore();
const detailOpen = ref(false);
const priority = computed(() => getCardPriority(props.card));
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
