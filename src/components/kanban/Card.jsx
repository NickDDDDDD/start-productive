import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useEffect, useRef } from "react";
import { BsThreeDots } from "react-icons/bs";
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

  const [isMouseOver, setIsMouseOver] = useState(false);
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
      className="h-20 w-full flex-shrink-0 rounded-xl border-2 border-yellow-500 p-2"
      ref={setNodeRef}
      style={style}
    />
  ) : (
    <div
      className="h-24 w-full flex-shrink-0 rounded-xl bg-stone-300 p-2 shadow-sm"
      onMouseOver={() => setIsMouseOver(true)}
      onMouseLeave={() => setIsMouseOver(false)}
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
            <div className="flex justify-end gap-2 mt-1">
              <button
                className="px-2 py-1 text-xs bg-stone-200 rounded hover:bg-stone-400"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                className="px-2 py-1 text-xs bg-yellow-400 rounded hover:bg-yellow-300"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="break-words whitespace-pre-wrap">{card.title}</p>
            {isMouseOver && (
              <div
                ref={buttonRef}
                className="absolute top-0 right-0 rounded-xl stroke-white p-1 hover:bg-stone-700"
                onMouseEnter={handleButtonMouseEnter}
                onMouseLeave={handleButtonMouseLeave}
              >
                <BsThreeDots className="text-stone-900 hover:text-stone-200" />
              </div>
            )}
            {(isMenuOpen || isMenuClosing) &&
              anchorRect &&
              createPortal(
                <div
                  ref={menuRef}
                  className={`absolute z-10 overflow-clip rounded-xl bg-stone-700 shadow-lg transition-all duration-150 ${isMenuClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
                  style={menuStyle}
                  onMouseEnter={handleMenuMouseEnter}
                  onMouseLeave={handleMenuMouseLeave}
                >
                  <button
                    className="w-full px-4 py-2 text-left text-neutral-100 hover:bg-stone-700"
                    onClick={handleEdit}
                  >
                    Edit
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left text-neutral-100 hover:bg-stone-700"
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
