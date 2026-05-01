function resolveTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function buildTaskPrompt(value, timezone = resolveTimezone()) {
  return `
You are PersonalKanbanizer. From INPUT extract only actionable personal tasks; be concise but keep facts (links/numbers/names).
Return ONLY JSON (no prose):
{"tasks":[{"title":"","status":"inbox|todo|doing|waiting|done|someday","due_date":null,"tags":[],"note":""}]}
Rules: titles imperative <=80 chars; keep INPUT language; waiting/blocked->waiting, WIP->doing, finished->done, future/nice-to-have->someday, else->todo; explicit dates->YYYY-MM-DD (${timezone}), relative dates->keep in note; do not invent unknowns. If none, return {"tasks":[]}.

INPUT:
${value}
`.trim();
}

export function safeParseTaskJSON(text) {
  try {
    const cleaned = String(text)
      .replace(/^[\s`]*```(?:json)?/i, "")
      .replace(/```[\s`]*$/i, "")
      .trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    return JSON.parse(start >= 0 && end >= 0 ? cleaned.slice(start, end + 1) : cleaned);
  } catch {
    return null;
  }
}
