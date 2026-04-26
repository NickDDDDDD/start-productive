<script setup>
import { reactive, ref } from "vue";
import { storeToRefs } from "pinia";
import Draggable from "vuedraggable";
import { IconMore, IconPlus } from "@arco-design/web-vue/es/icon";
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
      <a-dropdown trigger="click" position="rt">
        <a-button class="menu-trigger no-drag" shape="circle" size="small">
          <IconMore />
        </a-button>
        <template #content>
          <a-doption @click="isEdit = !isEdit">
            {{ isEdit ? "Cancel Edit" : "Edit Links" }}
          </a-doption>
        </template>
      </a-dropdown>
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
