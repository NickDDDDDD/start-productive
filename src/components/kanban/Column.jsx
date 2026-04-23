import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { useMemo, useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import Card from "./Card";
import { CSS } from "@dnd-kit/utilities";
import { nanoid } from "nanoid";
import { FaXmark, FaPlus } from "react-icons/fa6";
import { BsThreeDots } from "react-icons/bs";
import { createPortal } from "react-dom";

const Column = ({
  column,
  deleteColumn,
  updateColumn,
  cards,
  setCards,
  updateCard,
  containerRef,
}) => {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: "column",
      column,
    },
  });

  const cardsIds = useMemo(() => cards.map((card) => card.id), [cards]);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [cardContent, setCardContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const anchorRef = useRef(null);
  const menuRef = useRef(null);

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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const menuStyle =
    anchorRect && isMenuOpen
      ? {
          top: anchorRect.top,
          left: anchorRect.right + 10,
        }
      : {};

  function createCard(columnId) {
    if (!isAddingCard) {
      setIsAddingCard(true);
    } else {
      const cardToAdd = {
        id: nanoid(),
        columnId,
        title: cardContent,
      };
      setCards((prev) => [...prev, cardToAdd]);
      setIsAddingCard(false);
      setCardContent("");
    }
  }

  function deleteCard(id) {
    setCards((prev) => prev.filter((card) => card.id !== id));
  }

  return isDragging ? (
    <div
      className="h-full w-64 rounded-xl border-2 border-yellow-500"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    ></div>
  ) : (
    <div
      className="h-full w-64"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div className="flex max-h-full min-h-0 flex-col gap-2 rounded-xl border border-stone-300 p-2 shadow-sm">
        {/* header */}
        <div
          className="flex cursor-grab items-center justify-between p-2 text-base font-medium text-stone-700"
          onClick={() => setIsEditing(true)}
          onMouseEnter={() => setIsHeaderHovered(true)}
          onMouseLeave={() => setIsHeaderHovered(false)}
        >
          <div className="flex flex-1 items-center gap-2">
            <div className="self-center rounded-md bg-stone-700/70 px-2 py-1 text-xs text-neutral-100 backdrop-blur-sm">
              {cards.length}
            </div>
            <div className="flex items-center overflow-x-clip transition-all duration-150">
              {isEditing ? (
                <input
                  type="text"
                  value={column.title}
                  onChange={(e) => updateColumn(column.id, e.target.value)}
                  className="rounded-full border border-yellow-500 px-2 py-1 focus:border-2 transition-all duration-150"
                  onBlur={() => setIsEditing(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setIsEditing(false);
                    }
                  }}
                  autoFocus
                />
              ) : (
                <p className="px-2 py-1">{column.title}</p>
              )}
            </div>
          </div>
          {isHeaderHovered && (
            <div
              ref={anchorRef}
              className="group rounded-xl p-1 transition-colors hover:bg-stone-300"
              onMouseEnter={handleButtonMouseEnter}
              onMouseLeave={handleButtonMouseLeave}
            >
              <BsThreeDots className="text-stone-600 group-hover:text-stone-700" />
            </div>
          )}
        </div>
        {(isMenuOpen || isMenuClosing) &&
          anchorRect &&
          createPortal(
            <div
              ref={menuRef}
              className={`absolute z-10 flex flex-col gap-1 rounded-xl bg-stone-700/70 p-1.5 shadow-lg backdrop-blur-sm transition-all duration-150 ${isMenuClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
              style={menuStyle}
              onMouseEnter={handleMenuMouseEnter}
              onMouseLeave={handleMenuMouseLeave}
            >
              <button
                className="rounded-lg px-3 py-1.5 text-left text-sm text-neutral-100 hover:bg-stone-600 hover:text-red-400 transition-colors"
                onClick={() => {
                  setIsMenuClosing(true);
                  setTimeout(() => {
                    deleteColumn(column.id);
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
        {/* cards container */}
        <div className="flex min-h-0 flex-col gap-2 overflow-y-auto">
          <SortableContext items={cardsIds}>
            {cards.map((card) => (
              <Card
                key={card.id}
                card={card}
                deleteCard={deleteCard}
                updateCard={updateCard}
                containerRef={containerRef}
              />
            ))}
          </SortableContext>
        </div>
        {/* footer */}
        <div
          className="overflow-clip transition-all duration-150"
          style={{ maxHeight: isAddingCard ? "200px" : "0px" }}
        >
          <textarea
            placeholder="Do something..."
            value={cardContent}
            onChange={(e) => setCardContent(e.target.value)}
            className="h-32 w-full resize-none rounded-xl border-none bg-stone-300 p-2 outline-none"
            wrap="soft"
          />
        </div>
        <div className="flex items-center justify-center gap-2">
          <button
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-yellow-400/60 px-4 py-2 font-medium text-stone-700 backdrop-blur-sm transition duration-150 hover:bg-yellow-300 focus:bg-yellow-500 active:scale-95"
            onClick={(e) => {
              createCard(column.id);
              e.currentTarget.blur();
            }}
          >
            {!isAddingCard && <FaPlus />}
            {isAddingCard ? "Confirm" : "Add Card"}
          </button>
          {isAddingCard && (
            <button
              className="group flex cursor-pointer items-center justify-center rounded-full px-3 py-2 text-stone-700 transition-colors hover:bg-stone-300 hover:text-red-400 active:scale-95"
              onClick={() => setIsAddingCard(false)}
            >
              <FaXmark className="group-hover:text-red-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

Column.propTypes = {
  column: PropTypes.object.isRequired,
  deleteColumn: PropTypes.func.isRequired,
  updateColumn: PropTypes.func.isRequired,
  cards: PropTypes.array.isRequired,
  setCards: PropTypes.func.isRequired,
  updateCard: PropTypes.func.isRequired,
  containerRef: PropTypes.object.isRequired,
};

export default Column;
