<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import {
  IconCheckSquare,
  IconDelete,
  IconEdit,
  IconMessage,
  IconPlus,
} from "@arco-design/web-vue/es/icon";
import { nanoid } from "nanoid";
import { useBoardStore } from "../../stores/board";
import {
  MIN_WORKLOAD_AMOUNT,
  WORKLOAD_STEP,
  buildCardPayload,
  createCardDraft,
} from "../../utils/cardDraft";

const props = defineProps({
  card: { type: Object, default: null },
  columnId: { type: String, default: "" },
  visible: { type: Boolean, default: false },
});

const emit = defineEmits(["update:visible"]);
const board = useBoardStore();

const draft = reactive(createCardDraft());
const newChecklistText = ref("");
const newCommentText = ref("");
const workloadMotion = ref("");
let workloadMotionTimer = null;

const isOpen = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});
const isCreating = computed(() => !props.card);
const drawerTitle = computed(() =>
  isCreating.value ? "Create Card" : "Card Details",
);

function resetDraft() {
  Object.assign(draft, createCardDraft(props.card));
  newChecklistText.value = "";
  newCommentText.value = "";
}

function close() {
  isOpen.value = false;
}

function save() {
  const payload = buildCardPayload(draft);
  if (props.card?.id) {
    board.updateCard(props.card.id, payload);
  } else {
    board.createCard(props.columnId || "inbox", payload);
  }
  close();
}

function handleWorkloadWheel(event) {
  const current = Number(draft.workloadAmount);
  const base = Number.isFinite(current) ? current : 1;
  const direction = event.deltaY < 0 ? 1 : -1;
  const nextValue = Math.max(
    MIN_WORKLOAD_AMOUNT,
    base + direction * WORKLOAD_STEP,
  );
  draft.workloadAmount = Number(nextValue.toFixed(2));
  triggerWorkloadMotion(direction > 0 ? "up" : "down");
}

function triggerWorkloadMotion(direction) {
  window.clearTimeout(workloadMotionTimer);
  workloadMotion.value = "";
  requestAnimationFrame(() => {
    workloadMotion.value = `workload-amount--${direction}`;
    workloadMotionTimer = window.setTimeout(() => {
      workloadMotion.value = "";
    }, 220);
  });
}

function deleteCard() {
  if (!props.card?.id) return;
  board.deleteCard(props.card.id);
  close();
}

function addChecklistItem() {
  const text = newChecklistText.value.trim();
  if (!text) return;
  draft.checklistItems.push({ id: nanoid(), text, done: false });
  newChecklistText.value = "";
}

function addComment() {
  const text = newCommentText.value.trim();
  if (!text) return;
  draft.comments.push({ id: nanoid(), text, createdAt: new Date().toISOString() });
  newCommentText.value = "";
}

function formatCommentTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCompletedTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

watch(
  () => draft.completed,
  (completed) => {
    if (completed && !draft.completedAt) {
      draft.completedAt = new Date().toISOString();
      return;
    }
    if (!completed) draft.completedAt = "";
  },
);

watch(
  () => props.visible,
  (visible, previousVisible) => {
    if (visible) {
      resetDraft();
      board.setCardDrawerOpen(true);
      return;
    }
    if (previousVisible) board.setCardDrawerOpen(false);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  window.clearTimeout(workloadMotionTimer);
  if (props.visible) board.setCardDrawerOpen(false);
});
</script>

<template>
  <a-drawer
    v-model:visible="isOpen"
    class="card-detail-drawer"
    body-class="card-detail-drawer__body"
    placement="right"
    width="560px"
    :title="drawerTitle"
    unmount-on-close
    @cancel="resetDraft"
  >
    <div class="card-detail">
      <a-input v-model="draft.title" size="large" placeholder="Card title" />

      <section class="detail-section detail-completion">
        <a-checkbox v-model="draft.completed">Completed</a-checkbox>
        <span v-if="draft.completedAt">
          {{ formatCompletedTime(draft.completedAt) }}
        </span>
      </section>

      <section class="detail-section">
        <h3><IconEdit /> Description</h3>
        <a-textarea
          v-model="draft.description"
          class="detail-textarea"
          placeholder="Add details, context, links, or notes..."
        />
      </section>

      <section class="detail-section detail-fields">
        <h3>Eisenhower Matrix</h3>
        <div class="detail-fields__grid">
          <div class="detail-fields__control detail-fields__important">
            <span class="detail-fields__label">Priority</span>
            <a-checkbox v-model="draft.important">Important</a-checkbox>
          </div>
          <div class="detail-fields__control detail-fields__schedule">
            <span class="detail-fields__label">Due date and time</span>
            <a-date-picker
              v-model="draft.dueDate"
              value-format="YYYY-MM-DD"
              placeholder="Due date"
            />
            <a-time-picker
              v-model="draft.dueTime"
              format="HH:mm"
              value-format="HH:mm"
              placeholder="Due time"
              :disabled="!draft.dueDate"
            />
          </div>
          <div class="detail-fields__control detail-fields__workload">
            <span class="detail-fields__label">Workload remaining</span>
            <div class="workload-row">
              <div
                class="workload-amount"
                :class="workloadMotion"
                @wheel.prevent="handleWorkloadWheel"
              >
                <a-input-number
                  v-model="draft.workloadAmount"
                  :min="MIN_WORKLOAD_AMOUNT"
                  :step="WORKLOAD_STEP"
                />
              </div>
              <a-select v-model="draft.workloadUnit">
                <a-option value="hours">Hours</a-option>
                <a-option value="days">Days</a-option>
              </a-select>
            </div>
          </div>
        </div>
      </section>

      <section class="detail-section">
        <h3><IconCheckSquare /> Checklist</h3>
        <div class="checklist">
          <div
            v-for="item in draft.checklistItems"
            :key="item.id"
            class="checklist-item"
          >
            <a-checkbox v-model="item.done" />
            <a-input v-model="item.text" />
            <a-button
              shape="circle"
              size="small"
              status="danger"
              @click="
                draft.checklistItems = draft.checklistItems.filter(
                  (entry) => entry.id !== item.id,
                )
              "
            >
              <IconDelete />
            </a-button>
          </div>
        </div>
        <div class="inline-create">
          <a-input
            v-model="newChecklistText"
            placeholder="Add checklist item"
            @keyup.enter="addChecklistItem"
          />
          <a-button type="primary" shape="circle" @click="addChecklistItem">
            <IconPlus />
          </a-button>
        </div>
      </section>

      <section class="detail-section">
        <h3><IconMessage /> Comments</h3>
        <div class="comments-list">
          <article v-for="comment in draft.comments" :key="comment.id">
            <header>
              <span>{{ formatCommentTime(comment.createdAt) }}</span>
              <a-button
                shape="circle"
                size="mini"
                status="danger"
                @click="
                  draft.comments = draft.comments.filter(
                    (entry) => entry.id !== comment.id,
                  )
                "
              >
                <IconDelete />
              </a-button>
            </header>
            <p>{{ comment.text }}</p>
          </article>
        </div>
        <a-textarea
          v-model="newCommentText"
          class="comment-input"
          placeholder="Add a comment..."
        />
        <a-button
          type="primary"
          shape="round"
          :disabled="!newCommentText.trim()"
          @click="addComment"
        >
          Add Comment
        </a-button>
      </section>
    </div>

    <template #footer>
      <div class="card-detail__footer">
        <a-button
          v-if="!isCreating"
          class="danger-button"
          type="text"
          @click="deleteCard"
        >
          Delete
        </a-button>
        <div class="card-detail__footer-actions">
          <a-button @click="close">Cancel</a-button>
          <a-button type="primary" @click="save">
            {{ isCreating ? "Create" : "Save" }}
          </a-button>
        </div>
      </div>
    </template>
  </a-drawer>
</template>

<style scoped lang="less">
.card-detail {
  display: flex;
  height: 100%;
  max-height: none;
  flex-direction: column;
  gap: 18px;
  overflow-y: auto;
  color: var(--app-text);
  padding-right: 4px;
}

:global(.card-detail-drawer .arco-drawer) {
  max-width: calc(100vw - 32px);
  border-left: 1px solid var(--app-panel-border);
  background: var(--app-surface);
  color: var(--app-text);
}

:global(.card-detail-drawer .arco-drawer-header),
:global(.card-detail-drawer .arco-drawer-footer) {
  border-color: var(--app-panel-border);
}

:global(.card-detail-drawer .arco-drawer-title) {
  color: var(--app-text);
}

:global(.card-detail-drawer__body) {
  overflow: hidden;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 10px;

  h3 {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    color: var(--app-text-soft);
    font-size: 14px;
    font-weight: 600;

    svg {
      color: var(--app-muted);
    }
  }
}

.detail-textarea {
  min-height: 140px;

  :deep(textarea) {
    resize: none;
  }
}

.checklist,
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checklist-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
}

.comments-list article {
  border-radius: var(--app-radius-sm);
  border: 1px solid var(--app-panel-border);
  background: rgba(237, 239, 242, 0.05);
  padding: 10px;

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--app-muted);
    font-size: 12px;
  }

  p {
    margin: 8px 0 0;
    white-space: pre-wrap;
  }
}

.detail-fields {
  width: 100%;

  :deep(.arco-checkbox),
  :deep(.arco-checkbox-label) {
    color: var(--app-text-soft);
  }
}

.detail-fields__grid {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 16px;
}

.detail-fields__control {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
}

.detail-fields__label {
  color: var(--app-muted);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.detail-fields__important {
  grid-column: 1 / -1;
}

.detail-fields__schedule {
  grid-column: 1;
}

.detail-fields__workload {
  grid-column: 2;
}

.detail-fields__schedule > :not(.detail-fields__label) {
  width: 100%;
  min-width: 0;
}

.workload-row {
  display: flex;
  gap: 8px;
}

.workload-amount {
  min-width: 0;
  flex: 1 1 0;

  :deep(.arco-input-number) {
    transition:
      border-color 0.16s ease,
      background-color 0.16s ease,
      box-shadow 0.16s ease,
      transform 0.16s ease;
  }
}

.workload-amount--up :deep(.arco-input-number) {
  animation: workload-step-up 0.22s ease-out;
}

.workload-amount--down :deep(.arco-input-number) {
  animation: workload-step-down 0.22s ease-out;
}

.detail-fields__workload .workload-row > * {
  min-width: 0;
  flex: 1 1 0;
}

@keyframes workload-step-up {
  0% {
    transform: translateY(0);
    box-shadow: 0 0 0 0 rgba(50, 240, 140, 0);
  }

  35% {
    transform: translateY(-2px);
    border-color: var(--app-accent-strong);
    background-color: var(--app-overlay-l2);
    box-shadow: 0 0 0 3px rgba(50, 240, 140, 0.12);
  }

  100% {
    transform: translateY(0);
    box-shadow: 0 0 0 0 rgba(50, 240, 140, 0);
  }
}

@keyframes workload-step-down {
  0% {
    transform: translateY(0);
    box-shadow: 0 0 0 0 rgba(50, 240, 140, 0);
  }

  35% {
    transform: translateY(2px);
    border-color: var(--app-accent-strong);
    background-color: var(--app-overlay-l2);
    box-shadow: 0 0 0 3px rgba(50, 240, 140, 0.12);
  }

  100% {
    transform: translateY(0);
    box-shadow: 0 0 0 0 rgba(50, 240, 140, 0);
  }
}

:deep(.arco-checkbox-icon-hover::before),
:deep(.arco-checkbox:hover .arco-checkbox-icon-hover::before),
:deep(.arco-checkbox > input[type="checkbox"]:focus-visible + .arco-checkbox-icon-hover::before) {
  background-color: transparent;
}

:deep(.arco-checkbox-icon) {
  border-color: var(--app-panel-border-strong);
  border-radius: var(--app-radius-xs);
  background-color: var(--app-overlay-l1);
}

:deep(.arco-checkbox:hover .arco-checkbox-icon) {
  border-color: var(--app-accent);
}

:deep(.arco-checkbox-checked .arco-checkbox-icon),
:deep(.arco-checkbox-indeterminate .arco-checkbox-icon) {
  border-color: var(--app-accent);
  background-color: var(--app-accent);
}

:deep(.arco-checkbox-checked .arco-checkbox-icon-check),
:deep(.arco-checkbox-indeterminate .arco-checkbox-icon-check) {
  color: #04130b;
}

.inline-create {
  display: flex;
  gap: 8px;
}

.comment-input {
  :deep(textarea) {
    resize: none;
  }
}

.card-detail__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  width: 100%;
}

.card-detail__footer-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
</style>
