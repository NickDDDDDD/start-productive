<script setup>
import { computed, ref } from "vue";
import { IconRefresh, IconRobot } from "@arco-design/web-vue/es/icon";
import { useBoardStore } from "../../stores/board";
import { usePromptSession } from "../../composables/usePromptSession";
import { createLogger } from "../../utils/logger";
import { buildTaskPrompt, safeParseTaskJSON } from "../../utils/taskPrompt";

const board = useBoardStore();
const logger = createLogger("task-generator");
const input = ref("");
const creating = ref(false);

const {
  supported,
  availability,
  downloading,
  error,
  ready,
  initSession,
  destroySession,
  refreshAvailability,
  prompt,
} = usePromptSession();

const pct = computed(() => Math.round((downloading.value?.loaded || 0) * 100));

const statusType = computed(() => {
  if (availability.value === "available") return "success";
  if (availability.value === "downloading") return "normal";
  if (availability.value === "downloadable") return "warning";
  return "danger";
});

async function createToInbox() {
  if (!ready.value) return;
  creating.value = true;
  try {
    const aiText = await prompt(buildTaskPrompt(input.value));
    const data = safeParseTaskJSON(aiText);
    const titles = Array.isArray(data?.tasks)
      ? data.tasks.map((task) => task?.title).filter(Boolean)
      : [];
    if (titles.length) board.createCardsInInbox(titles);
  } catch (err) {
    logger.error("task generation failed", err);
  } finally {
    creating.value = false;
  }
}
</script>

<template>
  <section class="task-generator">
    <header class="panel-header">
      <h2>Task Generator</h2>
      <a-tag :color="statusType">
        {{ availability === "downloading" ? `downloading ${pct}%` : availability }}
      </a-tag>
      <a-button shape="circle" size="small" @click="refreshAvailability">
        <IconRefresh />
      </a-button>
    </header>

    <a-alert v-if="!supported" type="error">
      Current environment does not support the Chrome Prompt API.
    </a-alert>

    <template v-else>
      <a-button v-if="!ready" type="primary" long shape="round" @click="initSession">
        <template #icon><IconRobot /></template>
        Enable Gemini in browser
      </a-button>
      <a-button v-else long shape="round" @click="destroySession">
        Release Session
      </a-button>

      <a-progress
        v-if="availability === 'downloading'"
        :percent="downloading.loaded || 0"
        size="small"
      />

      <a-alert v-if="error" type="error">
        {{ String(error) }}
      </a-alert>

      <a-textarea
        v-if="ready"
        v-model="input"
        class="task-generator__input"
        placeholder="Paste notes or todos..."
      />

      <a-button
        v-if="ready"
        type="primary"
        long
        shape="round"
        :loading="creating"
        :disabled="!input.trim()"
        @click="createToInbox"
      >
        Create to Inbox
      </a-button>
    </template>
  </section>
</template>

<style scoped lang="less">
.task-generator {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
  border-radius: var(--app-radius-md);
  border: 1px solid var(--app-panel-border);
  background: var(--app-panel-bg);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.035),
    0 16px 36px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(18px);
  padding: 16px;
}

.task-generator__input {
  flex: 1 1 auto;
  min-height: 320px;

  :deep(textarea) {
    resize: none;
  }
}
</style>
