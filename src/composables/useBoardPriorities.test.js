import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { useBoardStore } from "../stores/board";
import {
  resetBoardPrioritiesForTests,
  useBoardPriorities,
} from "./useBoardPriorities";
import { usePriorityClock } from "./usePriorityClock";

describe("useBoardPriorities", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 1, 7, 0));
    setActivePinia(createPinia());
    resetBoardPrioritiesForTests();
  });

  afterEach(() => {
    resetBoardPrioritiesForTests();
    vi.useRealTimers();
  });

  it("builds a priority map and reacts to clock changes", async () => {
    const board = useBoardStore();
    board.cards = [
      {
        id: "card-1",
        dueDate: "2026-05-01",
        dueTime: "10:00",
        workloadAmount: 2,
        workloadUnit: "hours",
      },
    ];
    const priorities = useBoardPriorities();

    expect(priorities.priorityByCardId.value["card-1"].urgent).toBe(false);

    vi.setSystemTime(new Date(2026, 4, 1, 8, 0));
    usePriorityClock().refresh();
    await nextTick();

    expect(priorities.priorityByCardId.value["card-1"].urgent).toBe(true);
  });

  it("updates the priority map when the scheduled urgency time arrives", async () => {
    const board = useBoardStore();
    board.cards = [
      {
        id: "card-1",
        dueDate: "2026-05-01",
        dueTime: "10:00",
        workloadAmount: 2,
        workloadUnit: "hours",
      },
    ];
    const priorities = useBoardPriorities();

    expect(priorities.priorityByCardId.value["card-1"].urgent).toBe(false);

    await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
    await nextTick();

    expect(priorities.priorityByCardId.value["card-1"].urgent).toBe(true);
  });

  it("adds new cards to the priority map", async () => {
    const board = useBoardStore();
    const priorities = useBoardPriorities();

    board.cards = [
      {
        id: "card-2",
        dueDate: "2026-05-01",
        dueTime: "12:00",
        workloadAmount: 1,
        workloadUnit: "hours",
      },
    ];
    await nextTick();

    expect(priorities.priorityByCardId.value["card-2"]).toMatchObject({
      dueDate: "2026-05-01",
      urgent: false,
    });
  });
});
