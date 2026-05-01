import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  resetPriorityClockForTests,
  usePriorityClock,
} from "./usePriorityClock";

const timedCard = {
  id: "card-1",
  dueDate: "2026-05-01",
  dueTime: "10:00",
  workloadAmount: 2,
  workloadUnit: "hours",
};

describe("usePriorityClock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 1, 7, 0));
    resetPriorityClockForTests();
  });

  afterEach(() => {
    resetPriorityClockForTests();
    vi.useRealTimers();
  });

  it("updates now when the next priority change arrives", async () => {
    const clock = usePriorityClock();

    clock.schedule([timedCard]);
    expect(clock.now.value).toEqual(new Date(2026, 4, 1, 7, 0));

    await vi.advanceTimersByTimeAsync(60 * 60 * 1000);

    expect(clock.now.value.getTime()).toBeGreaterThanOrEqual(
      new Date(2026, 4, 1, 8, 0, 0, 0).getTime(),
    );
  });

  it("reschedules when cards change", async () => {
    const clock = usePriorityClock();
    const earlierCard = {
      ...timedCard,
      id: "earlier",
      dueTime: "09:45",
    };

    clock.schedule([timedCard]);
    clock.schedule([earlierCard]);
    await vi.advanceTimersByTimeAsync(45 * 60 * 1000);

    expect(clock.now.value.getTime()).toBeGreaterThanOrEqual(
      new Date(2026, 4, 1, 7, 45, 0, 0).getTime(),
    );
  });
});
