<script setup>
import { reactive, ref } from "vue";
import { storeToRefs } from "pinia";
import Draggable from "vuedraggable";
import { IconClose, IconEdit, IconPlus } from "@arco-design/web-vue/es/icon";
import { useBoardStore } from "../../stores/board";
import LinkCard from "./LinkCard.vue";

const board = useBoardStore();
const { links } = storeToRefs(board);
const isEdit = ref(false);
const isAdding = ref(false);
const form = reactive({ name: "", url: "" });

function resetForm() {
  form.name = "";
  form.url = "";
}

function addLink() {
  board.createLink(form);
  resetForm();
  isAdding.value = false;
}
</script>

<template>
  <section class="links-panel">
    <header class="panel-header">
      <h2>Links</h2>
      <a-button
        class="menu-trigger no-drag"
        shape="circle"
        size="small"
        :title="isEdit ? 'Cancel Edit' : 'Edit Links'"
        @click="isEdit = !isEdit"
      >
        <IconClose v-if="isEdit" />
        <IconEdit v-else />
      </a-button>
    </header>

    <a-button
      v-if="isEdit && !isAdding"
      type="primary"
      long
      @click="isAdding = true"
    >
      <template #icon><IconPlus /></template>
      Add Link
    </a-button>

    <a-modal
      v-model:visible="isAdding"
      title="Add Link"
      width="420px"
      modal-class="link-modal"
      @cancel="resetForm"
    >
      <a-form class="link-form" layout="vertical" :model="form">
        <a-form-item field="name" label="Name">
          <a-input v-model="form.name" placeholder="Link name" />
        </a-form-item>
        <a-form-item field="url" label="URL">
          <a-input v-model="form.url" placeholder="https://example.com" />
        </a-form-item>
      </a-form>
      <template #footer>
        <div class="link-modal__footer">
          <a-button @click="isAdding = false; resetForm()">Cancel</a-button>
          <a-button type="primary" @click="addLink">Confirm</a-button>
        </div>
      </template>
    </a-modal>

    <Draggable
      v-model="links"
      class="links-list"
      item-key="id"
      :animation="180"
      easing="cubic-bezier(0.2, 0, 0, 1)"
      :force-fallback="true"
      :fallback-on-body="true"
      fallback-class="drag-fallback"
      filter="input,textarea,select,button,.no-drag"
      :prevent-on-filter="false"
      ghost-class="drag-ghost"
      chosen-class="drag-chosen"
      drag-class="drag-active"
    >
      <template #item="{ element }">
        <LinkCard :link="element" :is-edit="isEdit" />
      </template>
    </Draggable>
  </section>
</template>

<style scoped lang="less">
.links-panel {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
}

.link-form {
  border: 1px solid var(--app-panel-border);
  border-radius: var(--app-radius-sm);
  background: transparent;
  padding: 0;
}

.link-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  width: 100%;
}

.links-list {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 8px;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;

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
</style>
