<script setup>
import { computed, ref } from "vue";
import Message from "@arco-design/web-vue/es/message";
import {
  IconDownload,
  IconImport,
  IconMore,
  IconUpload,
} from "@arco-design/web-vue/es/icon";
import { useBoardStore } from "../../stores/board";
import {
  createImportPreview,
  downloadBoardWorkbook,
  parseBoardWorkbook,
} from "../../utils/excelBoard";
import { createLogger } from "../../utils/logger";

const board = useBoardStore();
const logger = createLogger("import-export");
const fileInputRef = ref(null);
const parsing = ref(false);
const importing = ref(false);
const exporting = ref(false);
const previewVisible = ref(false);
const parsedImport = ref(null);
const importFileName = ref("");

const hasErrors = computed(() => Boolean(parsedImport.value?.errors.length));
const preview = computed(() => parsedImport.value?.preview);
const summary = computed(() => parsedImport.value?.summary);
const importStrategies = {
  merge: {
    successMessage: "Data merged.",
    apply: (state) => board.mergeImportedState(state),
  },
  replace: {
    successMessage: "Data replaced.",
    apply: (state) => board.replaceImportedState(state),
  },
};

function chooseFile() {
  fileInputRef.value?.click();
}

async function exportExcel() {
  exporting.value = true;
  try {
    await downloadBoardWorkbook(board.toPortableState());
    Message.success("Excel exported.");
  } catch (error) {
    logger.error("export failed", error);
    Message.error("Export failed.");
  } finally {
    exporting.value = false;
  }
}

async function parseExcel(event) {
  const [file] = event.target.files || [];
  event.target.value = "";
  if (!file) return;

  parsing.value = true;
  importFileName.value = file.name;
  try {
    const result = await parseBoardWorkbook(file);
    parsedImport.value = {
      ...result,
      preview: createImportPreview(board.toPortableState(), result.state),
    };
    previewVisible.value = true;
  } catch (error) {
    logger.error("parse failed", error);
    Message.error("Could not read this Excel file.");
  } finally {
    parsing.value = false;
  }
}

async function applyImport(mode) {
  const strategy = importStrategies[mode];
  if (!strategy || !parsedImport.value || hasErrors.value) return;
  importing.value = true;
  try {
    await strategy.apply(parsedImport.value.state);
    previewVisible.value = false;
    parsedImport.value = null;
    Message.success(strategy.successMessage);
  } catch (error) {
    logger.error("import failed", error);
    Message.error("Import failed. No data was changed.");
  } finally {
    importing.value = false;
  }
}
</script>

<template>
  <div class="data-portability">
    <input
      ref="fileInputRef"
      class="data-portability__file"
      type="file"
      accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      @change="parseExcel"
    />

    <a-dropdown trigger="click" position="br">
      <a-button
        class="menu-trigger no-drag"
        shape="circle"
        :loading="parsing || exporting"
        title="Import or export Excel"
      >
        <IconMore />
      </a-button>
      <template #content>
        <a-doption @click="exportExcel">
          <template #icon><IconDownload /></template>
          Export Excel
        </a-doption>
        <a-doption @click="chooseFile">
          <template #icon><IconUpload /></template>
          Import Excel
        </a-doption>
      </template>
    </a-dropdown>

    <a-modal
      v-model:visible="previewVisible"
      class="import-preview-modal"
      width="560px"
      :footer="false"
      unmount-on-close
    >
      <template #title>
        <span class="import-preview-modal__title">
          <IconImport />
          Import Preview
        </span>
      </template>

      <div v-if="parsedImport" class="import-preview">
        <p class="import-preview__file">{{ importFileName }}</p>

        <div class="import-preview__stats">
          <div>
            <strong>{{ summary.columns }}</strong>
            <span>Columns</span>
          </div>
          <div>
            <strong>{{ summary.cards }}</strong>
            <span>Cards</span>
          </div>
          <div>
            <strong>{{ summary.links }}</strong>
            <span>Links</span>
          </div>
          <div>
            <strong>{{ summary.checklistItems + summary.comments }}</strong>
            <span>Details</span>
          </div>
        </div>

        <a-alert v-if="hasErrors" type="error">
          Fix these rows and import again.
        </a-alert>

        <ul v-if="hasErrors" class="import-preview__errors">
          <li v-for="error in parsedImport.errors" :key="error">
            {{ error }}
          </li>
        </ul>

        <div v-else class="import-preview__merge">
          <div>
            <strong>{{ preview.columns.created }}</strong>
            <span>new columns</span>
          </div>
          <div>
            <strong>{{ preview.cards.created }}</strong>
            <span>new cards</span>
          </div>
          <div>
            <strong>{{ preview.links.created }}</strong>
            <span>new links</span>
          </div>
          <div>
            <strong>
              {{ preview.columns.updated + preview.cards.updated + preview.links.updated }}
            </strong>
            <span>updates</span>
          </div>
        </div>

        <footer class="import-preview__actions">
          <a-button @click="previewVisible = false">Cancel</a-button>
          <a-button
            :disabled="hasErrors"
            :loading="importing"
            @click="applyImport('merge')"
          >
            Merge
          </a-button>
          <a-button
            type="primary"
            :disabled="hasErrors"
            :loading="importing"
            @click="applyImport('replace')"
          >
            Replace All
          </a-button>
        </footer>
      </div>
    </a-modal>
  </div>
</template>

<style scoped lang="less">
.data-portability {
  display: inline-flex;
  align-items: center;
}

.data-portability__file {
  display: none;
}

.import-preview-modal__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.import-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.import-preview__file {
  margin: 0;
  overflow: hidden;
  color: var(--app-muted);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.import-preview__stats,
.import-preview__merge {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;

  > div {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 4px;
    border-radius: var(--app-radius-sm);
    background: var(--app-overlay-l1);
    padding: 10px;
  }

  strong {
    color: var(--app-text);
    font-size: 18px;
    line-height: 1;
  }

  span {
    overflow: hidden;
    color: var(--app-muted);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.import-preview__errors {
  display: flex;
  max-height: 180px;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  overflow: auto;
  color: #ff8a8a;
  font-size: 13px;
  padding-left: 18px;
}

.import-preview__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
