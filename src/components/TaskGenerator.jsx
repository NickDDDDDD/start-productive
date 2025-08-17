import { useState, useMemo } from "react";
import { nanoid } from "nanoid";
import { usePromptSession } from "../hooks/usePromptSession";
import useKanbanState from "../hooks/useKanbanState";

// ---- Prompt & 解析工具 ------------------------------------------------
const buildJSONPrompt = (input) =>
  `
You are PersonalKanbanizer. From INPUT extract only actionable personal tasks; be concise but keep facts (links/numbers/names).
Return ONLY JSON (no prose):
{"tasks":[{"title":"","status":"inbox|todo|doing|waiting|done|someday","due_date":null,"tags":[],"note":""}]}
Rules: titles imperative ≤80 chars; keep INPUT language; waiting/blocked→waiting, WIP→doing, finished→done, future/nice-to-have→someday, else→todo; explicit dates→YYYY-MM-DD (Australia/Melbourne), relative dates→keep in note; do not invent unknowns. If none, return {"tasks":[]}.

INPUT:
${input}
`.trim();

function safeParseJSON(text) {
  try {
    const cleaned = String(text)
      .replace(/^[\s`]*```(?:json)?/i, "")
      .replace(/```[\s`]*$/i, "")
      .trim();
    const s = cleaned.indexOf("{");
    const e = cleaned.lastIndexOf("}");
    const slice = s >= 0 && e >= 0 ? cleaned.slice(s, e + 1) : cleaned;
    return JSON.parse(slice);
  } catch {
    return null;
  }
}

export default function TaskGenerator() {
  const {
    supported,
    availability,
    downloading,
    error,
    ready,
    initSession,
    destroySession,
    refreshAvailability,
    prompt,
  } = usePromptSession();

  const { setCards } = useKanbanState();

  const [input, setInput] = useState("");
  const [creating, setCreating] = useState(false);

  const pct = Math.round((downloading?.loaded || 0) * 100);

  const statusStyle = useMemo(() => {
    switch (availability) {
      case "available":
        return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
      case "downloading":
        return "bg-blue-100 text-blue-700 ring-1 ring-blue-200";
      case "downloadable":
        return "bg-amber-100 text-amber-800 ring-1 ring-amber-200";
      default:
        return "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
    }
  }, [availability]);

  // add task to inbox
  const createToInbox = async () => {
    if (!ready) return;
    setCreating(true);
    try {
      const aiText = await prompt(buildJSONPrompt(input));
      const data = safeParseJSON(aiText);
      const tasks = Array.isArray(data?.tasks) ? data.tasks : [];
      const titles = tasks.map((t) => t?.title).filter(Boolean);
      if (titles.length === 0) {
        setCreating(false);
        return;
      }

      const newCards = titles.map((title) => ({
        id: nanoid(),
        columnId: "inbox",
        title: String(title).trim() || "Untitled",
      }));

      setCards((prev) => {
        const inboxCards = prev.filter((c) => c.columnId === "inbox");
        const otherCards = prev.filter((c) => c.columnId !== "inbox");
        // put new cards at the top of Inbox
        return [...newCards, ...inboxCards, ...otherCards];
      });
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto h-full max-w-3xl rounded-xl bg-stone-200 p-4 shadow-md">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold tracking-tight">Task Generator</h2>
        <button
          type="button"
          onClick={refreshAvailability}
          title="Refresh Status"
          className={`group inline-flex items-center rounded-full px-3 py-1 text-xs transition active:scale-95 ${statusStyle}`}
        >
          {/* status: show download progress */}
          <span className="group-hover:hidden">
            {availability === "downloading"
              ? `downloading: ${pct}%`
              : availability}
          </span>
          {/* hover: show refresh button */}
          <span className="hidden text-gray-700 group-hover:inline">
            refresh
          </span>
        </button>
      </div>

      {!supported ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          ❌ Current environment does not support the Chrome Prompt API.
          <code className="font-mono">window.LanguageModel</code>
        </div>
      ) : (
        <div className="mt-4 space-y-4 rounded-xl">
          {/* model status */}
          <div className="flex flex-wrap items-center gap-3">
            {!ready ? (
              <button
                onClick={initSession}
                className="w-full rounded-full bg-yellow-400 px-4 py-2 text-base font-medium shadow-sm hover:bg-yellow-300 active:scale-95"
              >
                Enable Gemini in browser
              </button>
            ) : (
              <button
                onClick={destroySession}
                className="w-full rounded-full border border-gray-300 bg-white px-4 py-2 text-base shadow-sm hover:bg-gray-50 active:scale-95"
              >
                Release Session
              </button>
            )}
          </div>

          {availability === "downloading" && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-2 bg-blue-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Error: {String(error)}
            </div>
          )}

          {/* input */}
          {ready && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Input text to generate tasks:
              </label>
              <textarea
                rows={25}
                className="w-full rounded-xl border border-stone-300 bg-stone-100 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste notes or todos..."
              />
            </div>
          )}

          {/* actions */}
          {ready && (
            <button
              onClick={createToInbox}
              disabled={!ready || creating}
              className="inline-flex w-full items-center rounded-full bg-yellow-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition active:scale-95 disabled:cursor-not-allowed disabled:bg-neutral-200"
            >
              {creating ? "Creating..." : "Create to Inbox"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
