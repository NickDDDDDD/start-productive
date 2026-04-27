<script setup>
import { computed, reactive, ref, watch } from "vue";
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
  DEFAULT_CARD_META,
  WORKLOAD_UNIT_HOURS,
  normalizeCardMeta,
} from "../../utils/cardPriority";

const props = defineProps({
  card: { type: Object, required: true },
  visible: { type: Boolean, default: false },
});

const emit = defineEmits(["update:visible"]);
const board = useBoardStore();

const draft = reactive({
  title: "",
  description: "",
  checklistItems: [],
  comments: [],
  important: false,
  dueDate: "",
  dueTime: "",
  workloadAmount: 1,
  workloadUnit: "hours",
});
const newChecklistText = ref("");
const newCommentText = ref("");

const isOpen = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

function normalizeChecklistItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    id: item?.id || nanoid(),
    text: typeof item?.text === "string" ? item.text : "",
    done: Boolean(item?.done),
  }));
}

function normalizeComments(comments) {
  if (!Array.isArray(comments)) return [];
  return comments.map((comment) => ({
    id: comment?.id || nanoid(),
    text: typeof comment?.text === "string" ? comment.text : "",
    createdAt:
      typeof comment?.createdAt === "string"
        ? comment.createdAt
        : new Date().toISOString(),
  }));
}

function resetDraft() {
  const meta = normalizeCardMeta(props.card);
  draft.title = props.card.title || "";
  draft.description =
    typeof props.card.description === "string"
      ? props.card.description
      : DEFAULT_CARD_META.description;
  draft.checklistItems = normalizeChecklistItems(props.card.checklistItems);
  draft.comments = normalizeComments(props.card.comments);
  draft.important = meta.important;
  draft.dueDate = meta.dueDate;
  draft.dueTime = meta.dueTime;
  draft.workloadAmount = meta.workloadAmount;
  draft.workloadUnit = meta.workloadUnit;
  newChecklistText.value = "";
  newCommentText.value = "";
}

function close() {
  isOpen.value = false;
}

function save() {
  const workloadAmount = Number(draft.workloadAmount);
  const workloadUnit = draft.workloadUnit === "days" ? "days" : "hours";
  const safeWorkloadAmount =
    Number.isFinite(workloadAmount) && workloadAmount > 0 ? workloadAmount : 1;
  board.updateCard(props.card.id, {
    title: draft.title.trim() || "Untitled",
    description: draft.description,
    checklistItems: draft.checklistItems
      .map((item) => ({
        id: item.id || nanoid(),
        text: item.text.trim(),
        done: Boolean(item.done),
      }))
      .filter((item) => item.text),
    comments: draft.comments
      .map((comment) => ({
        id: comment.id || nanoid(),
        text: comment.text.trim(),
        createdAt: comment.createdAt || new Date().toISOString(),
      }))
      .filter((comment) => comment.text),
    important: Boolean(draft.important),
    dueDate: draft.dueDate || "",
    dueTime: draft.dueDate ? draft.dueTime || "" : "",
    workloadAmount: safeWorkloadAmount,
    workloadUnit,
    workloadHours: safeWorkloadAmount * WORKLOAD_UNIT_HOURS[workloadUnit],
  });
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

watch(
  () => props.visible,
  (visible) => {
    if (visible) resetDraft();
  },
  { immediate: true },
);
</script>

<template>
  <a-modal
    v-model:visible="isOpen"
    width="920px"
    title="Card Details"
    unmount-on-close
    modal-class="card-detail-modal"
    @cancel="resetDraft"
  >
    <div class="card-detail">
      <a-input v-model="draft.title" size="large" placeholder="Card title" />

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
            <span class="detail-fields__label">Workload</span>
            <div class="workload-row">
              <a-input-number
                v-model="draft.workloadAmount"
                :min="0.25"
                :step="0.25"
              />
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
          class="danger-button"
          type="text"
          @click="board.deleteCard(card.id); close()"
        >
          Delete
        </a-button>
        <div class="card-detail__footer-actions">
          <a-button @click="close">Cancel</a-button>
          <a-button type="primary" @click="save">Save</a-button>
        </div>
      </div>
    </template>
  </a-modal>
</template>
