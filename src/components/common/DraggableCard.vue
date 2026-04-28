<script setup>
defineProps({
  variant: { type: String, default: "" },
  ariaLabel: { type: String, default: undefined },
});
</script>

<template>
  <div
    class="draggable-card"
    :class="variant ? `draggable-card--${variant}` : undefined"
    :aria-label="ariaLabel"
  >
    <slot />
  </div>
</template>

<style scoped lang="less">
.draggable-card {
  position: relative;
  display: grid;
  width: 100%;
  max-width: 100%;
  flex: 0 0 auto;
  overflow: hidden;
  border: 1px solid var(--app-panel-border);
  color: var(--app-text);
  cursor: grab;
  user-select: none;
  transition: background 0.15s ease;

  &:active {
    cursor: grabbing;
  }

  &:hover {
    border-color: var(--app-panel-border-strong);
    background: var(--app-panel-bg-strong);
  }
}

.draggable-card--link {
  min-height: 96px;
  border-radius: var(--app-radius-md);
  background: var(--app-panel-bg);
  box-shadow: 0 8px 18px rgba(41, 37, 36, 0.08);
}

.draggable-card--task {
  min-height: 132px;
  border-radius: var(--app-radius-sm);
  background: rgba(237, 239, 242, 0.08);
  backdrop-filter: blur(10px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.035),
    0 6px 16px rgba(0, 0, 0, 0.14);
}
</style>
