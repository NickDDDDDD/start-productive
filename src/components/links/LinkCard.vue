<script setup>
import { computed, ref, watch } from "vue";
import { IconDelete } from "@arco-design/web-vue/es/icon";
import { useBoardStore } from "../../stores/board";
import { getFavicon } from "../../utils/favicon";

const props = defineProps({
  link: { type: Object, required: true },
  isEdit: { type: Boolean, default: false },
});

const board = useBoardStore();
const faviconSrc = ref(null);
const imgOk = ref(true);

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
  <a
    class="link-card"
    :href="link.url"
    target="_blank"
    rel="noopener noreferrer"
    :aria-label="link.name"
  >
    <span class="link-card__icon">
      <img
        v-if="faviconSrc && imgOk"
        :src="faviconSrc"
        alt=""
        referrerpolicy="no-referrer"
        @error="imgOk = false"
      />
      <span v-else>{{ initial }}</span>
    </span>
    <strong>{{ link.name }}</strong>
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
  </a>
</template>
