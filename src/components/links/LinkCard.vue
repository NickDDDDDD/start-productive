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

<style scoped lang="less">
.link-card {
  &__body {
    display: grid;
    width: 100%;
    height: 100%;
    grid-template-columns: 42px minmax(0, 1fr);
    align-items: center;
    gap: 10px;
    color: inherit;
    outline: none;
    padding: 14px;
    text-align: left;

    &:focus-visible {
      border-radius: var(--app-radius-md);
      outline: 2px solid var(--app-accent);
      outline-offset: -2px;
    }
  }

  strong {
    min-width: 0;
    overflow: hidden;
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__icon {
    display: grid;
    width: 40px;
    height: 40px;
    place-items: center;
    border-radius: var(--app-radius-sm);
    color: #05110b;
    font-weight: 700;

    img {
      width: 100%;
      height: 100%;
      border-radius: var(--app-radius-sm);
      object-fit: cover;
    }

    span {
      display: grid;
      width: 100%;
      height: 100%;
      place-items: center;
      border-radius: var(--app-radius-sm);
      background: linear-gradient(135deg, var(--app-accent-deep), var(--app-accent));
    }
  }

  &__delete {
    position: absolute;
    top: 8px;
    right: 8px;
  }
}
</style>
