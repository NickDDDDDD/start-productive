import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";

export function useKanbanLayout() {
  const kanbanShellRef = ref(null);
  const kanbanBoardRef = ref(null);
  const kanbanTrackRef = ref(null);
  const isDraggingColumn = ref(false);
  const isShiftingKanbanLayout = ref(false);
  const closedTrackOffset = ref(0);
  let resizeObserver = null;
  let layoutTimer = null;

  const kanbanTrackStyle = computed(() => ({
    marginLeft: `${closedTrackOffset.value}px`,
  }));

  function updateClosedTrackOffset() {
    const boardWidth = kanbanBoardRef.value?.clientWidth || 0;
    const trackWidth = kanbanTrackRef.value?.scrollWidth || 0;
    closedTrackOffset.value = Math.max(0, (boardWidth - trackWidth) / 2);
  }

  function startKanbanLayoutShift() {
    if (isDraggingColumn.value) return;
    window.clearTimeout(layoutTimer);
    isShiftingKanbanLayout.value = true;
    layoutTimer = window.setTimeout(() => {
      isShiftingKanbanLayout.value = false;
    }, 260);
  }

  function scrollKanbanToEnd() {
    requestAnimationFrame(() => {
      const shell = kanbanShellRef.value;
      if (!shell || shell.scrollWidth <= shell.clientWidth) return;
      shell.scrollTo({
        left: shell.scrollWidth - shell.clientWidth,
        behavior: "smooth",
      });
    });
  }

  onMounted(() => {
    resizeObserver = new ResizeObserver(updateClosedTrackOffset);
    if (kanbanBoardRef.value) resizeObserver.observe(kanbanBoardRef.value);
    if (kanbanTrackRef.value) resizeObserver.observe(kanbanTrackRef.value);
    nextTick(updateClosedTrackOffset);
  });

  onBeforeUnmount(() => {
    resizeObserver?.disconnect();
    window.clearTimeout(layoutTimer);
  });

  return {
    kanbanShellRef,
    kanbanBoardRef,
    kanbanTrackRef,
    isDraggingColumn,
    isShiftingKanbanLayout,
    kanbanTrackStyle,
    updateClosedTrackOffset,
    startKanbanLayoutShift,
    scrollKanbanToEnd,
  };
}
