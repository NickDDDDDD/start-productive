import { FaPlus } from "react-icons/fa6";
import { useMemo } from "react";
import { SortableContext } from "@dnd-kit/sortable";
import Column from "./Column";

const Kanban = ({
  columns,
  visibleCards,
  setCards,
  deleteColumn,
  updateColumn,
  updateCard,
  createColumn,
  containerRef,
}) => {
  const columnsIds = useMemo(
    () => columns.map((column) => column.id),
    [columns],
  );

  return (
    <div className="flex h-full w-full items-start justify-start gap-4 overflow-x-auto rounded-xl bg-stone-200 p-4 shadow-md">
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
                updateCard={updateCard}
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
  );
};

export default Kanban;
