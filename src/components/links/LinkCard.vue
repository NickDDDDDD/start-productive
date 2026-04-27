<script setup>
import { computed, ref, watch } from "vue";
import { IconDelete } from "@arco-design/web-vue/es/icon";
import { useBoardStore } from "../../stores/board";
import DraggableCard from "../common/DraggableCard.vue";
import { getFavicon } from "../../utils/favicon";

const props = defineProps({
  link: { type: Object, required: true },
  isEdit: { type: Boolean, default: false },
});

const board = useBoardStore();
const faviconSrc = ref(null);
const imgOk = ref(true);

function openLink() {
  if (props.isEdit || !props.link.url) return;
  window.open(props.link.url, "_blank", "noopener,noreferrer");
}

const initial = computed(() => {
  const name = props.link.name?.trim();
  return name ? Array.from(name)[0].toUpperCase() : "?";
});

watch(
  () => props.link.url,
  async (url, _oldUrl, onCleanup) => {
    let alive = true;
    onCleanup(() => {
      alive = false;
    });
    faviconSrc.value = null;
    imgOk.value = true;
    try {
      const src = await getFavicon(url);
      if (alive) faviconSrc.value = src;
    } catch {
      if (alive) faviconSrc.value = null;
    }
  },
  { immediate: true },
);
</script>

<template>
  <DraggableCard
    class="link-card"
    variant="link"
    :aria-label="link.name"
  >
    <div
      class="link-card__body"
      role="button"
      :tabindex="isEdit ? -1 : 0"
      @click="openLink"
      @keyup.enter="openLink"
      @keyup.space.prevent="openLink"
    >
      <span class="link-card__icon">
        <img
          v-if="faviconSrc && imgOk"
          :src="faviconSrc"
          alt=""
          draggable="false"
          referrerpolicy="no-referrer"
          @error="imgOk = false"
        />
        <span v-else>{{ initial }}</span>
      </span>
      <strong>{{ link.name }}</strong>
    </div>
    <a-button
      v-if="isEdit"
      class="link-card__delete"
      shape="circle"
      size="mini"
      status="danger"
      @click.prevent.stop="board.deleteLink(link.id)"
    >
      <IconDelete />
    </a-button>
  </DraggableCard>
</template>
