import { nanoid } from "nanoid";
import { FaPlus } from "react-icons/fa6";
import { useMemo, useState, useRef, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, SortableContext } from "@dnd-kit/sortable";
import Column from "./Column";
import Card from "./Card";
import { twMerge } from "tailwind-merge";
import Inbox from "./Inbox";

const TaskManager = ({
  columns,
  cards,
  visibleCardIds,
  setColumns,
  setCards,
}) => {
  const columnsIds = useMemo(
    () => columns.map((column) => column.id),
    [columns],
  );
  const [activeColumn, setActiveColumn] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 15 } }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,

        tolerance: 5,
      },
    }),
  );

  const visibleCards = useMemo(() => {
    if (!visibleCardIds) return cards;
    return cards.filter((c) => visibleCardIds.has(c.id));
  }, [cards, visibleCardIds]);

  useEffect(() => {
    if (isDragging) {
      console.log("Dragging");
      const originalStyle = window.getComputedStyle(document.body).overflow;

      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isDragging]);

  function createColumn() {
    setColumns((prev) => [
      ...prev,
      { id: nanoid(), title: `Column ${prev.length + 1}` },
    ]);
  }

  function deleteColumn(id) {
    console.log(`Deleting column with id: ${id}`);
    setColumns((prev) => prev.filter((column) => column.id !== id));
    setCards((prev) => prev.filter((card) => card.columnId !== id));
  }

  function updateColumn(id, title) {
    setColumns((prev) =>
      prev.map((column) => (column.id === id ? { ...column, title } : column)),
    );
  }

  function handleDragStart({ active }) {
    setIsDragging(true);

    const column = active.data.current?.column;
    if (active.data.current?.type === "column" && column) {
      setActiveColumn(column);
    }

    const card = active.data.current?.card;
    if (active.data.current?.type === "card" && card) {
      setActiveCard(card);
    }
  }

  function handleDragOver({ active, over }) {
    if (!active || !over) {
      return;
    }

    if (active.data.current.type === "column") {
      return;
    }

    if (active.id === over.id) {
      return;
    }

    if (over.data.current?.type === "card") {
      setCards((prev) => {
        const activeIndex = prev.findIndex((card) => card.id === active.id);
        const overIndex = prev.findIndex((card) => card.id === over.id);

        if (activeIndex === -1 || overIndex === -1) {
          return prev;
        }
        const newCards = prev.map((card, index) => {
          if (index === activeIndex) {
            return { ...card, columnId: prev[overIndex].columnId };
          }
          return card;
        });

        return arrayMove(newCards, activeIndex, overIndex);
      });
    } else if (over.data.current?.type === "column") {
      // change column id of card
      setCards((prev) => {
        const activeIndex = prev.findIndex((card) => card.id === active.id);
        const newCards = prev.map((card) =>
          card.id === active.id ? { ...card, columnId: over.id } : card,
        );
        return arrayMove(newCards, activeIndex, newCards.length - 1);
      });
    }
  }

  function handleDragEnd({ active, over }) {
    setIsDragging(false);

    setActiveColumn(null);
    setActiveCard(null);

    if (active.data.current?.type === "card") {
      return;
    }

    if (active.id === over.id) {
      return;
    }

    setColumns((prev) => {
      const activeIndex = prev.findIndex((column) => column.id === active.id);
      const overIndex = prev.findIndex((column) => column.id === over.id);
      if (activeIndex === -1 || overIndex === -1) {
        return prev;
      }
      return arrayMove(prev, activeIndex, overIndex);
    });
  }

  function handleDragCancel() {
    setIsDragging(false);
    setActiveColumn(null);
    setActiveCard(null);
  }

  return (
    <div className="flex h-full w-full">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div
          className={twMerge(
            "relative grid h-full w-full grid-cols-18 gap-4",
            isDragging ? "touch-none" : "",
          )}
          ref={containerRef}
        >
          <div className="col-span-4 h-full min-h-0">
            <Inbox
              cards={visibleCards.filter((c) => c.columnId === "inbox")}
              setCards={setCards}
              containerRef={containerRef}
            />
          </div>
          {/* kanban area */}
          <div className="col-span-14 flex h-full items-start justify-start gap-4 overflow-x-auto rounded-xl bg-stone-200 p-4">
            <div className="mx-auto flex h-full gap-4">
              <div className="flex h-full items-start justify-start gap-4">
                <SortableContext items={columnsIds}>
                  {columns.map((column) => (
                    <Column
                      key={column.id}
                      column={column}
                      deleteColumn={deleteColumn}
                      updateColumn={updateColumn}
                      cards={visibleCards.filter(
                        (card) => card.columnId === column.id,
                      )}
                      setCards={setCards}
                      containerRef={containerRef}
                    />
                  ))}
                </SortableContext>
              </div>
              <button
                className="flex cursor-pointer items-center justify-center gap-2 self-start rounded-full bg-yellow-400 px-6 py-2 shadow-sm transition duration-150 hover:bg-yellow-300 hover:text-black focus:ring-2 active:scale-95"
                onClick={(e) => {
                  createColumn();
                  e.currentTarget.blur();
                }}
              >
                <FaPlus />
                Add Column
              </button>
            </div>
          </div>
        </div>
        <DragOverlay>
          {activeColumn && (
            <Column
              key={activeColumn.id}
              column={activeColumn}
              deleteColumn={deleteColumn}
              updateColumn={updateColumn}
              cards={visibleCards.filter(
                (card) => card.columnId === activeColumn.id,
              )}
              setCards={setCards}
              containerRef={containerRef}
            />
          )}
          {activeCard && <Card key={activeCard.id} card={activeCard} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default TaskManager;
