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
