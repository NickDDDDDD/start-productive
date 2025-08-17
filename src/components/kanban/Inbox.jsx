// src/components/kanban/Inbox.jsx
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState } from "react";
import Card from "./Card";
import { FaXmark } from "react-icons/fa6";
import { FaPlus } from "react-icons/fa6";

import { nanoid } from "nanoid";

const Inbox = ({ cards, setCards, containerRef }) => {
  // 注册成 droppable，但禁用列本身拖拽
  const { setNodeRef, attributes, listeners, transform, transition } =
    useSortable({
      id: "inbox",
      data: { type: "column", column: { id: "inbox", title: "Inbox" } },
      disabled: true, // 👈 列不可拖，但仍是 droppable，空列也能接卡
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cardsIds = useMemo(() => cards.map((card) => card.id), [cards]);

  const [isAddingCard, setIsAddingCard] = useState(false);
  const [cardContent, setCardContent] = useState("");

  function createCard() {
    if (!isAddingCard) {
      setIsAddingCard(true);
    } else {
      const cardToAdd = { id: nanoid(), columnId: "inbox", title: cardContent };
      setCards((prev) => {
        const inboxCards = prev.filter((c) => c.columnId === "inbox");
        const otherCards = prev.filter((c) => c.columnId !== "inbox");
        return [cardToAdd, ...inboxCards, ...otherCards];
      });
      setIsAddingCard(false);
      setCardContent("");
    }
  }

  function deleteCard(id) {
    setCards((prev) => prev.filter((card) => card.id !== id));
  }

  return (
    <div
      className="h-full w-full"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div className="flex h-full max-h-full min-h-0 flex-col gap-2 rounded-xl bg-stone-200 p-4">
        {/* header */}
        <div className="flex items-center justify-between p-2 text-base font-bold">
          <div className="flex flex-1 items-center gap-2">
            <div className="self-center rounded-md bg-stone-700 px-2 py-1 text-xs text-neutral-100">
              {cards.length}
            </div>
            <p>Inbox</p>
          </div>
        </div>

        {/* add card and text area */}
        <div
          className="overflow-clip transition-all duration-150"
          style={{ maxHeight: isAddingCard ? "200px" : "0px" }}
        >
          <textarea
            placeholder="Do something..."
            value={cardContent}
            onChange={(e) => setCardContent(e.target.value)}
            className="h-32 w-full resize-none rounded-xl border-none bg-stone-400 p-2 outline-none"
            wrap="soft"
          />
        </div>
        <div className="flex items-center justify-center gap-2">
          <button
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-yellow-400 p-2 shadow-sm transition duration-150 hover:bg-yellow-300 focus:bg-yellow-500 active:scale-95"
            onClick={(e) => {
              createCard();
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

        {/* cards 容器 */}
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
      </div>
    </div>
  );
};

export default Inbox;
