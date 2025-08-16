import { useSortable } from "@dnd-kit/sortable";
import PropTypes from "prop-types";
import { CSS } from "@dnd-kit/utilities";
import { useState, useEffect, useRef } from "react";
import { BsThreeDots } from "react-icons/bs";
import { createPortal } from "react-dom";

const Card = ({ card, deleteCard, containerRef }) => {
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
  const [anchorRect, setAnchorRect] = useState(null);
  const anchorRef = useRef(null);

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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const menuStyle =
    anchorRect && isMenuOpen
      ? {
          top: anchorRect.bottom,
          left: anchorRect.right,
          maxHeight: isMenuOpen ? "400px" : "0px",
        }
      : {};
  return isDragging ? (
    <div
      className="h-20 w-full flex-shrink-0 rounded-xl border-2 border-yellow-500 p-2"
      ref={setNodeRef}
      style={style}
    />
  ) : (
    <div
      className="h-20 w-full flex-shrink-0 rounded-xl bg-stone-400 p-2"
      onMouseOver={() => setIsMouseOver(true)}
      onMouseLeave={() => setIsMouseOver(false)}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div className="relative" ref={anchorRef}>
        <p>{card.title}</p>
        {isMouseOver && (
          <button
            className="absolute top-0 right-0 rounded-xl stroke-white p-1 hover:bg-stone-700"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <BsThreeDots className="text-stone-900 hover:text-stone-200" />
          </button>
        )}
        {isMenuOpen &&
          anchorRect &&
          createPortal(
            <div
              className="absolute z-10 overflow-clip rounded-xl bg-stone-700 shadow-lg transition-all duration-150"
              style={menuStyle}
            >
              <button
                className="w-full px-4 py-2 text-left text-neutral-100 hover:bg-stone-700"
                onClick={() => {
                  deleteCard(card.id);
                  setIsMenuOpen(false);
                }}
              >
                Delete
              </button>
            </div>,
            containerRef.current,
          )}
      </div>
    </div>
  );
};

Card.propTypes = {
  card: PropTypes.object.isRequired,
  deleteCard: PropTypes.func.isRequired,
  editCard: PropTypes.func.isRequired,
  containerRef: PropTypes.object.isRequired,
};

export default Card;
