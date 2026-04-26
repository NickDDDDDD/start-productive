<script setup>
import { computed, ref } from "vue";
import { IconRefresh, IconRobot } from "@arco-design/web-vue/es/icon";
import { useBoardStore } from "../../stores/board";
import { usePromptSession } from "../../composables/usePromptSession";

const board = useBoardStore();
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

const buildJSONPrompt = (value) =>
  `
You are PersonalKanbanizer. From INPUT extract only actionable personal tasks; be concise but keep facts (links/numbers/names).
Return ONLY JSON (no prose):
{"tasks":[{"title":"","status":"inbox|todo|doing|waiting|done|someday","due_date":null,"tags":[],"note":""}]}
Rules: titles imperative <=80 chars; keep INPUT language; waiting/blocked->waiting, WIP->doing, finished->done, future/nice-to-have->someday, else->todo; explicit dates->YYYY-MM-DD (Australia/Melbourne), relative dates->keep in note; do not invent unknowns. If none, return {"tasks":[]}.

INPUT:
${value}
`.trim();

function safeParseJSON(text) {
  try {
    const cleaned = String(text)
      .replace(/^[\s`]*```(?:json)?/i, "")
      .replace(/```[\s`]*$/i, "")
      .trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    return JSON.parse(start >= 0 && end >= 0 ? cleaned.slice(start, end + 1) : cleaned);
  } catch {
    return null;
  }
}

async function createToInbox() {
  if (!ready.value) return;
  creating.value = true;
  try {
    const aiText = await prompt(buildJSONPrompt(input.value));
    const data = safeParseJSON(aiText);
    const titles = Array.isArray(data?.tasks)
      ? data.tasks.map((task) => task?.title).filter(Boolean)
      : [];
    if (titles.length) board.createCardsInInbox(titles);
  } catch (err) {
    console.error(err);
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
