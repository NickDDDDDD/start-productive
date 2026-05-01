import { readonly, ref } from "vue";
import { getNextPriorityChangeAt } from "../utils/cardPriority";

const MAX_TIMER_DELAY = 2_147_483_647;

const now = ref(new Date());
let timerId = null;
let scheduledCards = [];
let listenersStarted = false;

function clearTimer() {
  if (timerId === null) return;
  globalThis.clearTimeout(timerId);
  timerId = null;
}

function refresh() {
  now.value = new Date();
}

function schedule(cards = scheduledCards) {
  scheduledCards = Array.isArray(cards) ? cards : [];
  refresh();
  clearTimer();

  const nextChangeAt = getNextPriorityChangeAt(scheduledCards, now.value);
  if (!nextChangeAt || typeof globalThis.setTimeout !== "function") return;

  const delayUntilNextChange = Math.max(
    0,
    nextChangeAt.getTime() - Date.now(),
  );
  const delay = Math.min(
    MAX_TIMER_DELAY,
    delayUntilNextChange,
  );

  timerId = globalThis.setTimeout(() => {
    timerId = null;
    schedule(scheduledCards);
  }, delay);
}

function refreshAndReschedule() {
  schedule(scheduledCards);
}

function startListeners() {
  if (listenersStarted || typeof window === "undefined") return;
  listenersStarted = true;
  window.addEventListener("focus", refreshAndReschedule);

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState !== "hidden") refreshAndReschedule();
    });
  }
}

export function usePriorityClock() {
  startListeners();
  return {
    now: readonly(now),
    refresh,
    schedule,
    stop: clearTimer,
  };
}

export function resetPriorityClockForTests() {
  clearTimer();
  scheduledCards = [];
  now.value = new Date();
}
