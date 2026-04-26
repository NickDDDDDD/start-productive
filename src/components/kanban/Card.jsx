import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BsCardText, BsChatText, BsCheck2Square, BsThreeDots } from "react-icons/bs";
import { FaPlus, FaXmark } from "react-icons/fa6";
import { nanoid } from "nanoid";
import {
  CARD_PRIORITY_STYLES,
  WORKLOAD_UNIT_HOURS,
  getCardPriority,
  normalizeCardMeta,
} from "../../utils/cardPriority";

function normalizeChecklistItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    id: item?.id || nanoid(),
    text: typeof item?.text === "string" ? item.text : "",
    done: Boolean(item?.done),
  }));
}

function normalizeComments(comments) {
  if (!Array.isArray(comments)) return [];
  return comments.map((comment) => ({
    id: comment?.id || nanoid(),
    text: typeof comment?.text === "string" ? comment.text : "",
    createdAt:
      typeof comment?.createdAt === "string"
        ? comment.createdAt
        : new Date().toISOString(),
  }));
}

function createDraft(card, meta) {
  return {
    title: card.title || "",
    description: typeof card.description === "string" ? card.description : "",
    checklistItems: normalizeChecklistItems(card.checklistItems),
    comments: normalizeComments(card.comments),
    important: meta.important,
    dueDate: meta.dueDate,
    dueTime: meta.dueTime,
    workloadAmount: meta.workloadAmount,
    workloadUnit: meta.workloadUnit,
  };
}

const Card = ({ card, deleteCard, updateCard, containerRef }) => {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: "card",
      card,
    },
  });

  const priority = useMemo(() => getCardPriority(card), [card]);
  const priorityStyle = CARD_PRIORITY_STYLES[priority.key];
  const canManage = Boolean(updateCard && deleteCard && containerRef);
  const meta = useMemo(() => normalizeCardMeta(card), [card]);
  const checklistItems = useMemo(
    () => normalizeChecklistItems(card.checklistItems),
    [card.checklistItems],
  );
  const comments = useMemo(() => normalizeComments(card.comments), [card.comments]);
  const doneChecklistCount = checklistItems.filter((item) => item.done).length;
  const hasDescription = Boolean(card.description?.trim());

  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [draft, setDraft] = useState(() => createDraft(card, meta));
  const [newChecklistText, setNewChecklistText] = useState("");
  const [newCommentText, setNewCommentText] = useState("");
  const [anchorRect, setAnchorRect] = useState(null);
  const anchorRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isDetailOpen) {
      setDraft(createDraft(card, meta));
      setNewChecklistText("");
      setNewCommentText("");
    }
  }, [card, isDetailOpen, meta]);

  useEffect(() => {
    if (isMenuOpen && anchorRef.current && containerRef?.current) {
      const nextAnchorRect = anchorRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      setAnchorRect({
        top: nextAnchorRect.top - containerRect.top,
        bottom: nextAnchorRect.bottom - containerRect.top,
        left: nextAnchorRect.left - containerRect.left,
        right: nextAnchorRect.right - containerRect.left,
      });
    }
  }, [containerRef, isMenuOpen]);

  useEffect(() => {
    if (!isDetailOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const menuStyle =
    anchorRect && isMenuOpen
      ? {
          top: anchorRect.top,
          left: anchorRect.right + 10,
          maxHeight: isMenuOpen ? "400px" : "0px",
        }
      : {};

  const handleButtonMouseEnter = () => {
    setIsMenuOpen(true);
  };

  const handleButtonMouseLeave = () => {
    setTimeout(() => {
      if (!menuRef.current || !menuRef.current.matches(":hover")) {
        setIsMenuClosing(true);
        setTimeout(() => {
          setIsMenuOpen(false);
          setIsMenuClosing(false);
        }, 150);
      }
    }, 200);
  };

  const handleMenuMouseEnter = () => {
    setIsMenuOpen(true);
    setIsMenuClosing(false);
  };

  const handleMenuMouseLeave = () => {
    setIsMenuClosing(true);
    setTimeout(() => {
      setIsMenuOpen(false);
      setIsMenuClosing(false);
    }, 150);
  };

  const openDetail = () => {
    if (!canManage) return;
    setDraft(createDraft(card, meta));
    setNewChecklistText("");
    setNewCommentText("");
    setIsMenuOpen(false);
    setIsMenuClosing(false);
    setIsDetailOpen(true);
  };

  const handleShortcutOpen = (e) => {
    e.preventDefault();
    e.stopPropagation();
    openDetail();
  };

  const handleSave = () => {
    const workloadAmount = Number(draft.workloadAmount);
    const workloadUnit = draft.workloadUnit === "days" ? "days" : "hours";
    const safeWorkloadAmount =
      Number.isFinite(workloadAmount) && workloadAmount > 0
        ? workloadAmount
        : 1;
    const checklistItemsToSave = draft.checklistItems
      .map((item) => ({
        id: item.id || nanoid(),
        text: item.text.trim(),
        done: Boolean(item.done),
      }))
      .filter((item) => item.text);
    const commentsToSave = draft.comments
      .map((comment) => ({
        id: comment.id || nanoid(),
        text: comment.text.trim(),
        createdAt: comment.createdAt || new Date().toISOString(),
      }))
      .filter((comment) => comment.text);

    updateCard(card.id, {
      title: draft.title.trim() || "Untitled",
      description: draft.description,
      checklistItems: checklistItemsToSave,
      comments: commentsToSave,
      important: Boolean(draft.important),
      dueDate: draft.dueDate,
      dueTime: draft.dueDate ? draft.dueTime : "",
      workloadAmount: safeWorkloadAmount,
      workloadUnit,
      workloadHours: safeWorkloadAmount * WORKLOAD_UNIT_HOURS[workloadUnit],
    });
    setIsDetailOpen(false);
  };

  const handleCancel = () => {
    setDraft(createDraft(card, meta));
    setNewChecklistText("");
    setNewCommentText("");
    setIsDetailOpen(false);
  };

  const addChecklistItem = () => {
    const text = newChecklistText.trim();
    if (!text) return;
    setDraft((prev) => ({
      ...prev,
      checklistItems: [
        ...prev.checklistItems,
        { id: nanoid(), text, done: false },
      ],
    }));
    setNewChecklistText("");
  };

  const updateChecklistItem = (id, patch) => {
    setDraft((prev) => ({
      ...prev,
      checklistItems: prev.checklistItems.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  };

  const deleteChecklistItem = (id) => {
    setDraft((prev) => ({
      ...prev,
      checklistItems: prev.checklistItems.filter((item) => item.id !== id),
    }));
  };

  const addComment = () => {
    const text = newCommentText.trim();
    if (!text) return;
    setDraft((prev) => ({
      ...prev,
      comments: [
        ...prev.comments,
        { id: nanoid(), text, createdAt: new Date().toISOString() },
      ],
    }));
    setNewCommentText("");
  };

  const deleteComment = (id) => {
    setDraft((prev) => ({
      ...prev,
      comments: prev.comments.filter((comment) => comment.id !== id),
    }));
  };

  const formatCommentTime = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const dueLabel = priority.dueDate
    ? `Due ${priority.dueDate}${priority.dueTime ? ` ${priority.dueTime}` : ""}`
    : "No date";
  const urgencyLabel =
    priority.key === "unplanned"
      ? "Unplanned"
      : priority.urgent
        ? "Urgent"
        : "Not urgent";
  const importanceLabel = priority.important ? "Important" : "Not important";
  const workloadUnitLabel = priority.workloadUnit === "days" ? "d" : "h";

  if (isDragging) {
    return (
      <div
        className="h-32 w-full flex-shrink-0 rounded-xl border-2 border-yellow-500 p-2"
        ref={setNodeRef}
        style={style}
      />
    );
  }

  return (
    <>
      <div
        className={`relative h-32 w-full flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border p-2 pl-4 shadow-sm backdrop-blur-sm transition-colors ${priorityStyle.card}`}
        onClick={openDetail}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
      >
        <div className={`absolute top-0 left-0 h-full w-1.5 ${priorityStyle.stripe}`} />
        <div
          className="relative flex h-full min-h-0 w-full min-w-0 flex-col gap-2"
          ref={anchorRef}
        >
          <p className="max-h-12 overflow-y-auto pr-6 text-sm leading-snug break-words whitespace-pre-wrap text-stone-800">
            {card.title}
          </p>

          <div className="flex flex-wrap gap-1.5 text-[11px] leading-none">
            <button
              type="button"
              className={`rounded-full px-2 py-1 ring-1 ${priorityStyle.badge} hover:brightness-95`}
              onClick={handleShortcutOpen}
            >
              {importanceLabel}
            </button>
            <button
              type="button"
              className={`rounded-full px-2 py-1 ring-1 ${priorityStyle.badge} hover:brightness-95`}
              onClick={handleShortcutOpen}
            >
              {urgencyLabel}
            </button>
            <button
              type="button"
              className="rounded-full bg-white/70 px-2 py-1 text-stone-700 ring-1 ring-stone-200 hover:bg-white"
              onClick={handleShortcutOpen}
            >
              {dueLabel}
            </button>
            <button
              type="button"
              className="rounded-full bg-white/70 px-2 py-1 text-stone-700 ring-1 ring-stone-200 hover:bg-white"
              onClick={handleShortcutOpen}
            >
              {priority.workloadAmount}
              {workloadUnitLabel}
            </button>
          </div>

          <div className="mt-auto flex items-center gap-2 pr-12 text-xs text-stone-600">
            {hasDescription && (
              <button
                type="button"
                className="flex items-center gap-1 rounded-full bg-white/60 px-2 py-1 hover:bg-white"
                onClick={handleShortcutOpen}
                title="Description"
              >
                <BsCardText />
                <span>Details</span>
              </button>
            )}
            {checklistItems.length > 0 && (
              <button
                type="button"
                className="flex items-center gap-1 rounded-full bg-white/60 px-2 py-1 hover:bg-white"
                onClick={handleShortcutOpen}
                title="Checklist"
              >
                <BsCheck2Square />
                <span>
                  {doneChecklistCount}/{checklistItems.length}
                </span>
              </button>
            )}
          </div>

          <button
            type="button"
            className="absolute right-0 bottom-0 flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 text-xs text-stone-600 ring-1 ring-stone-200 hover:bg-white"
            onClick={handleShortcutOpen}
            title="Comments"
          >
            <BsChatText />
            <span>{comments.length}</span>
          </button>

          {canManage && isHovered && (
            <div
              className="group absolute top-0 right-0 rounded-xl stroke-white p-1 hover:bg-stone-700"
              onMouseEnter={handleButtonMouseEnter}
              onMouseLeave={handleButtonMouseLeave}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <BsThreeDots className="text-stone-700 group-hover:text-stone-200" />
            </div>
          )}

          {canManage &&
            (isMenuOpen || isMenuClosing) &&
            anchorRect &&
            containerRef.current &&
            createPortal(
              <div
                ref={menuRef}
                className={`absolute z-20 flex flex-col gap-1 rounded-xl bg-stone-700/80 p-1.5 shadow-lg backdrop-blur-sm transition-all duration-150 ${isMenuClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"}`}
                style={menuStyle}
                onMouseEnter={handleMenuMouseEnter}
                onMouseLeave={handleMenuMouseLeave}
              >
                <button
                  className="rounded-lg px-3 py-1.5 text-left text-sm text-neutral-100 transition-colors hover:bg-stone-600"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openDetail();
                  }}
                >
                  Edit
                </button>
                <button
                  className="rounded-lg px-3 py-1.5 text-left text-sm text-neutral-100 transition-colors hover:bg-stone-600 hover:text-red-400"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMenuClosing(true);
                    setTimeout(() => {
                      deleteCard(card.id);
                      setIsMenuOpen(false);
                      setIsMenuClosing(false);
                    }, 150);
                  }}
                >
                  Delete
                </button>
              </div>,
              containerRef.current,
            )}
        </div>
      </div>

      {canManage &&
        isDetailOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 p-6 backdrop-blur-sm"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) handleCancel();
            }}
          >
            <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-stone-100 shadow-2xl">
              <div className="flex items-center justify-between border-b border-stone-300 px-5 py-4">
                <input
                  className="min-w-0 flex-1 rounded-lg bg-transparent text-xl font-semibold text-stone-800 outline-none focus:bg-white focus:px-2 focus:py-1"
                  value={draft.title}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, title: e.target.value }))
                  }
                  autoFocus
                />
                <button
                  className="rounded-full p-2 text-stone-600 hover:bg-stone-200 hover:text-red-500"
                  onClick={handleCancel}
                  title="Close"
                >
                  <FaXmark />
                </button>
              </div>

              <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_280px] gap-5 overflow-y-auto p-5">
                <div className="flex min-w-0 flex-col gap-5">
                  <section className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                      <BsCardText />
                      <span>Description</span>
                    </div>
                    <textarea
                      className="min-h-40 w-full resize-y rounded-xl border border-stone-300 bg-white p-3 text-sm text-stone-700 outline-none focus:border-yellow-500"
                      value={draft.description}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Add details, context, links, or notes..."
                    />
                  </section>

                  <section className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                      <BsCheck2Square />
                      <span>Checklist</span>
                      {draft.checklistItems.length > 0 && (
                        <span className="rounded-full bg-stone-200 px-2 py-1 text-xs font-medium text-stone-600">
                          {
                            draft.checklistItems.filter((item) => item.done)
                              .length
                          }
                          /{draft.checklistItems.length}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {draft.checklistItems.map((item) => (
                        <div
                          className="flex items-center gap-2 rounded-xl bg-white p-2"
                          key={item.id}
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={item.done}
                            onChange={(e) =>
                              updateChecklistItem(item.id, {
                                done: e.target.checked,
                              })
                            }
                          />
                          <input
                            className={`min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1 text-sm outline-none focus:bg-stone-100 ${item.done ? "text-stone-400 line-through" : "text-stone-700"}`}
                            value={item.text}
                            onChange={(e) =>
                              updateChecklistItem(item.id, {
                                text: e.target.value,
                              })
                            }
                          />
                          <button
                            className="rounded-full p-2 text-stone-500 hover:bg-stone-700 hover:text-red-400"
                            onClick={() => deleteChecklistItem(item.id)}
                            title="Delete item"
                          >
                            <FaXmark className="text-xs" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        className="min-w-0 flex-1 rounded-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-yellow-500"
                        value={newChecklistText}
                        onChange={(e) => setNewChecklistText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addChecklistItem();
                          }
                        }}
                        placeholder="Add checklist item"
                      />
                      <button
                        className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-yellow-300"
                        onClick={addChecklistItem}
                      >
                        <FaPlus />
                      </button>
                    </div>
                  </section>

                  <section className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                      <BsChatText />
                      <span>Comments</span>
                      {draft.comments.length > 0 && (
                        <span className="rounded-full bg-stone-200 px-2 py-1 text-xs font-medium text-stone-600">
                          {draft.comments.length}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {draft.comments.map((comment) => (
                        <div
                          className="rounded-xl bg-white p-3 text-sm text-stone-700"
                          key={comment.id}
                        >
                          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-stone-500">
                            <span>{formatCommentTime(comment.createdAt)}</span>
                            <button
                              className="rounded-full p-1.5 text-stone-500 hover:bg-stone-700 hover:text-red-400"
                              onClick={() => deleteComment(comment.id)}
                              title="Delete comment"
                            >
                              <FaXmark className="text-xs" />
                            </button>
                          </div>
                          <p className="whitespace-pre-wrap break-words">
                            {comment.text}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2 rounded-xl bg-white p-2">
                      <textarea
                        className="min-h-20 w-full resize-y rounded-xl bg-stone-100 p-2 text-sm outline-none focus:bg-stone-50"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="Add a comment..."
                      />
                      <div className="flex justify-end">
                        <button
                          className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-stone-200"
                          disabled={!newCommentText.trim()}
                          onClick={addComment}
                        >
                          Add comment
                        </button>
                      </div>
                    </div>
                  </section>
                </div>

                <aside className="flex flex-col gap-3 rounded-xl bg-stone-200 p-3">
                  <p className="text-sm font-semibold text-stone-700">Fields</p>

                  <label className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm">
                    <span>Important</span>
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={draft.important}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          important: e.target.checked,
                        }))
                      }
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-xs font-medium text-stone-500">
                      Due date
                    </span>
                    <input
                      type="date"
                      value={draft.dueDate}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          dueDate: e.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-xs font-medium text-stone-500">
                      Due time
                    </span>
                    <input
                      type="time"
                      value={draft.dueTime}
                      disabled={!draft.dueDate}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          dueTime: e.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-xs font-medium text-stone-500">
                      Workload
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0.25"
                        step="0.25"
                        value={draft.workloadAmount}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            workloadAmount: e.target.value,
                          }))
                        }
                      />
                      <select
                        className="rounded-full bg-white px-2 py-1 outline-none"
                        value={draft.workloadUnit}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            workloadUnit: e.target.value,
                          }))
                        }
                      >
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                  </label>

                  <div className="mt-auto flex justify-end gap-2 pt-3">
                    <button
                      className="rounded-full px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-300"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                    <button
                      className="rounded-full bg-yellow-400 px-5 py-2 text-sm font-semibold text-stone-800 hover:bg-yellow-300"
                      onClick={handleSave}
                    >
                      Save
                    </button>
                  </div>
                </aside>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default Card;
