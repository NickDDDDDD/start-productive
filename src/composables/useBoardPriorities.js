import { computed, watch } from "vue";
import { useBoardStore } from "../stores/board";
import { getCardPriority } from "../utils/cardPriority";
import {
  resetPriorityClockForTests,
  usePriorityClock,
} from "./usePriorityClock";

let priorityContext = null;
let stopCardsWatch = null;

export function useBoardPriorities() {
  if (priorityContext) return priorityContext;

  const board = useBoardStore();
  const priorityClock = usePriorityClock();

  const priorityByCardId = computed(() => {
    return Object.fromEntries(
      board.cards.map((card) => [
        card.id,
        getCardPriority(card, priorityClock.now.value),
      ]),
    );
  });

  function getPriority(card) {
    return (
      priorityByCardId.value[card.id] ||
      getCardPriority(card, priorityClock.now.value)
    );
  }

  stopCardsWatch = watch(
    () => board.cards,
    (cards) => priorityClock.schedule(cards),
    { deep: true, immediate: true },
  );

  priorityContext = {
    now: priorityClock.now,
    priorityByCardId,
    getPriority,
  };

  return priorityContext;
}

export function resetBoardPrioritiesForTests() {
  stopCardsWatch?.();
  stopCardsWatch = null;
  priorityContext = null;
  resetPriorityClockForTests();
}
