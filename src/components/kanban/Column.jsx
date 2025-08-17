import { FaTrashCan } from "react-icons/fa6";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import Card from "./Card";
import { CSS } from "@dnd-kit/utilities";
import { nanoid } from "nanoid";
import { FaXmark } from "react-icons/fa6";
import { FaPlus } from "react-icons/fa6";

const Column = ({
  column,
  deleteColumn,
  updateColumn,
  cards,
  setCards,
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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
          className="flex cursor-grab items-center justify-between p-2 text-base font-bold"
          onClick={() => setIsEditing(true)}
        >
          <div className="flex flex-1 items-center gap-2">
            {/* chip for cards num in column */}
            <div className="self-center rounded-md bg-stone-700 px-2 py-1 text-xs text-neutral-100">
              {cards.length}
            </div>
            <div className="flex items-center overflow-x-clip">
              {isEditing ? (
                <input
                  type="text"
                  value={column.title}
                  onChange={(e) => updateColumn(column.id, e.target.value)}
                  className="rounded-full border-yellow-500 px-2 py-1 focus:border-2"
                  onBlur={() => setIsEditing(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setIsEditing(false);
                    }
                  }}
                  wrap="soft"
                  autoFocus
                />
              ) : (
                <p>{column.title}</p>
              )}
            </div>
          </div>
          <button
            className="rounded-xl stroke-gray-500 p-1 transition duration-150 hover:bg-stone-800 hover:stroke-white"
            onClick={(e) => {
              e.stopPropagation();
              deleteColumn(column.id);
            }}
          >
            <FaTrashCan className="size-5 text-stone-400 hover:text-stone-200" />
          </button>
        </div>
        {/* cards container */}
        <div className="flex min-h-0 flex-col gap-2 overflow-y-auto">
          <SortableContext items={cardsIds}>
            {cards.map((card) => (
              <Card
                key={card.id}
                card={card}
                deleteCard={deleteCard}
                setCards={setCards}
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
            className="h-32 w-full resize-none rounded-xl border-none bg-stone-200 p-2 outline-none"
            wrap="soft"
          />
        </div>
        <div className="flex items-center justify-center gap-2">
          <button
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-2 transition duration-150 hover:bg-yellow-400 focus:bg-yellow-500 active:scale-95"
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
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl stroke-stone-700 p-1 transition duration-150 hover:bg-stone-400 hover:stroke-white active:scale-95"
              onClick={() => setIsAddingCard(false)}
            >
              <FaXmark />
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
  containerRef: PropTypes.object.isRequired,
};

export default Column;
