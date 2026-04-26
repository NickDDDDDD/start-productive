export const URGENCY_WORKLOAD_BUFFER = 1.25;

export const DEFAULT_CARD_META = {
  important: false,
  dueDate: "",
  dueTime: "",
  workloadAmount: 1,
  workloadUnit: "hours",
  workloadHours: 1,
  description: "",
  checklistItems: [],
  comments: [],
};

export const WORKLOAD_UNIT_HOURS = {
  hours: 1,
  days: 8,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_HOUR = 60 * 60 * 1000;

export function normalizeCardMeta(card) {
  const workloadUnit =
    card?.workloadUnit === "days" ? "days" : DEFAULT_CARD_META.workloadUnit;
  const rawWorkloadAmount =
    card?.workloadAmount ??
    (workloadUnit === "days" && card?.workloadHours
      ? Number(card.workloadHours) / WORKLOAD_UNIT_HOURS.days
      : card?.workloadHours);
  const workloadAmount = Number(rawWorkloadAmount);
  const safeWorkloadAmount =
    Number.isFinite(workloadAmount) && workloadAmount > 0
      ? workloadAmount
      : DEFAULT_CARD_META.workloadAmount;
  const workloadHours = safeWorkloadAmount * WORKLOAD_UNIT_HOURS[workloadUnit];

  return {
    important: Boolean(card?.important),
    dueDate: typeof card?.dueDate === "string" ? card.dueDate : "",
    dueTime: typeof card?.dueTime === "string" ? card.dueTime : "",
    workloadAmount: safeWorkloadAmount,
    workloadUnit,
    workloadHours,
  };
}

function getDueAt(dueDate, dueTime) {
  if (!dueDate) return null;
  const [year, month, day] = dueDate.split("-").map(Number);
  if (!year || !month || !day) return null;

  const [hours = 23, minutes = 59] = dueTime
    ? dueTime.split(":").map(Number)
    : [];
  const dueAt = new Date(year, month - 1, day, hours, minutes, 59, 999);
  return Number.isNaN(dueAt.getTime()) ? null : dueAt;
}

export function getCardPriority(card, now = new Date()) {
  const meta = normalizeCardMeta(card);
  const dueAt = getDueAt(meta.dueDate, meta.dueTime);

  if (!dueAt) {
    return {
      ...meta,
      key: "unplanned",
      label: "Unplanned",
      urgent: false,
      remainingDays: null,
      remainingHours: null,
    };
  }

  const msRemaining = dueAt.getTime() - now.getTime();
  const isOverdue = msRemaining < 0;
  const remainingDays = isOverdue
    ? 0
    : Math.max(1, Math.ceil(msRemaining / MS_PER_DAY));
  const remainingHours = isOverdue ? 0 : msRemaining / MS_PER_HOUR;
  const urgent =
    isOverdue || meta.workloadHours * URGENCY_WORKLOAD_BUFFER >= remainingHours;

  let key = "notImportantNotUrgent";
  if (meta.important && urgent) key = "importantUrgent";
  else if (meta.important) key = "importantNotUrgent";
  else if (urgent) key = "notImportantUrgent";

  const labels = {
    importantUrgent: "Important / Urgent",
    importantNotUrgent: "Important / Not urgent",
    notImportantUrgent: "Urgent / Not important",
    notImportantNotUrgent: "Not important / Not urgent",
  };

  return {
    ...meta,
    key,
    label: labels[key],
    urgent,
    remainingDays,
    remainingHours,
  };
}

export const CARD_PRIORITY_STYLES = {
  importantUrgent: {
    card: "border-red-200 bg-red-50",
    stripe: "bg-red-500",
    badge: "bg-red-100 text-red-700 ring-red-200",
  },
  importantNotUrgent: {
    card: "border-amber-200 bg-amber-50",
    stripe: "bg-amber-500",
    badge: "bg-amber-100 text-amber-800 ring-amber-200",
  },
  notImportantUrgent: {
    card: "border-blue-200 bg-blue-50",
    stripe: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700 ring-blue-200",
  },
  notImportantNotUrgent: {
    card: "border-emerald-200 bg-emerald-50",
    stripe: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  },
  unplanned: {
    card: "border-stone-300 bg-stone-300/40",
    stripe: "bg-stone-500",
    badge: "bg-stone-200 text-stone-700 ring-stone-300",
  },
};
