import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useEffect, useRef } from "react";
import { BsThreeDots } from "react-icons/bs";
import { FaXmark } from "react-icons/fa6";
import { createPortal } from "react-dom";

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

  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [anchorRect, setAnchorRect] = useState(null);
  const anchorRef = useRef(null);
  const editInputRef = useRef(null);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (isMenuOpen && anchorRef.current && containerRef.current) {
      const anchorRect = anchorRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      setAnchorRect({
        top: anchorRect.top - containerRect.top,
        bottom: anchorRect.bottom - containerRect.top,
        left: anchorRect.left - containerRect.left,
        right: anchorRect.right - containerRect.left,
      });
    }
  }, [isMenuOpen, containerRef]);

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [isEditing]);

  const handleButtonMouseEnter = () => {
    setIsMenuOpen(true);
  };

  const handleButtonMouseLeave = () => {
    // 延迟关闭菜单，以便用户可以移动鼠标到菜单上
    setTimeout(() => {
      if (!menuRef.current || !menuRef.current.matches(':hover')) {
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

  const handleEdit = () => {
    setIsEditing(true);
    setIsMenuOpen(false);
  };

  const handleSave = () => {
    if (editTitle.trim()) {
      updateCard(card.id, editTitle);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditTitle(card.title);
    setIsEditing(false);
  };

  return isDragging ? (
    <div
      className="h-24 w-full flex-shrink-0 rounded-xl border-2 border-yellow-500 p-2"
      ref={setNodeRef}
      style={style}
    />
  ) : (
    <div
      className="h-24 w-full flex-shrink-0 rounded-xl bg-stone-300/40 p-2 shadow-sm backdrop-blur-sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div
        className="relative h-full min-h-0 w-full min-w-0 overflow-y-auto"
        ref={anchorRef}
      >
        {isEditing ? (
          <div className="h-full flex flex-col">
            <textarea
              ref={editInputRef}
              className="flex-grow w-full resize-none border-none bg-transparent focus:outline-none"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                } else if (e.key === 'Escape') {
                  handleCancel();
                }
              }}
            />
            <div className="flex items-center justify-end gap-2 mt-1">
              <button
                className="cursor-pointer rounded-full px-3 py-1 text-xs text-stone-700 transition-colors hover:bg-yellow-400 active:scale-95"
                onClick={handleSave}
              >
                Confirm
              </button>
              <button
                className="group flex cursor-pointer items-center justify-center rounded-full px-2 py-1 text-stone-700 transition-colors hover:bg-stone-700 hover:text-red-400 active:scale-95"
                onClick={handleCancel}
              >
                <FaXmark className="text-xs group-hover:text-red-400" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="break-words whitespace-pre-wrap text-stone-700">{card.title}</p>
            {isHovered && (
              <div
                ref={buttonRef}
                className="group absolute top-0 right-0 rounded-xl stroke-white p-1 hover:bg-stone-700"
                onMouseEnter={handleButtonMouseEnter}
                onMouseLeave={handleButtonMouseLeave}
              >
                <BsThreeDots className="text-stone-700 group-hover:text-stone-200" />
              </div>
            )}
            {(isMenuOpen || isMenuClosing) &&
              anchorRect &&
              createPortal(
                <div
                  ref={menuRef}
                  className={`absolute z-10 flex flex-col gap-1 rounded-xl bg-stone-700/70 p-1.5 shadow-lg backdrop-blur-sm transition-all duration-150 ${isMenuClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
                  style={menuStyle}
                  onMouseEnter={handleMenuMouseEnter}
                  onMouseLeave={handleMenuMouseLeave}
                >
                  <button
                    className="rounded-lg px-3 py-1.5 text-left text-sm text-neutral-100 hover:bg-stone-600 transition-colors"
                    onClick={handleEdit}
                  >
                    Edit
                  </button>
                  <button
                    className="rounded-lg px-3 py-1.5 text-left text-sm text-neutral-100 hover:bg-stone-600 hover:text-red-400 transition-colors"
                    onClick={() => {
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
          </>
        )}
      </div>
    </div>
  );
};

export default Card;
