import { describe, expect, it } from "vitest";
import {
  getCardPriority,
  getCardUrgencyChangeAt,
  getDueAt,
  getNextPriorityChangeAt,
} from "./cardPriority";

const dueCard = {
  id: "card-1",
  title: "Priority card",
  dueDate: "2026-05-01",
  dueTime: "10:00",
  workloadAmount: 2,
  workloadUnit: "hours",
};

describe("cardPriority timing", () => {
  it("parses due date and time into a local Date", () => {
    expect(getDueAt("2026-05-01", "10:00")).toEqual(
      new Date(2026, 4, 1, 10, 0, 0, 0),
    );
  });

  it("computes the urgent threshold from due time and workload", () => {
    expect(
      getCardUrgencyChangeAt(dueCard, new Date(2026, 4, 1, 7, 0)),
    ).toEqual(new Date(2026, 4, 1, 8, 0, 0, 0));
  });

  it("switches from not urgent to urgent after the threshold", () => {
    expect(
      getCardPriority(dueCard, new Date(2026, 4, 1, 7, 59, 59, 999)).urgent,
    ).toBe(false);
    expect(
      getCardPriority(dueCard, new Date(2026, 4, 1, 8, 0)).urgent,
    ).toBe(true);
  });

  it("does not schedule changes for unplanned or already urgent cards", () => {
    expect(getCardUrgencyChangeAt({ title: "No date" })).toBeNull();
    expect(
      getCardUrgencyChangeAt(dueCard, new Date(2026, 4, 1, 8, 0)),
    ).toBeNull();
  });

  it("finds the nearest future priority change", () => {
    const laterCard = {
      ...dueCard,
      id: "card-2",
      dueTime: "12:00",
    };

    expect(
      getNextPriorityChangeAt(
        [laterCard, dueCard],
        new Date(2026, 4, 1, 7, 0),
      ),
    ).toEqual(new Date(2026, 4, 1, 8, 0, 0, 0));
  });
});
