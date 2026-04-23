import { useMemo, useState, useRef, useEffect } from "react";
import { nanoid } from "nanoid";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { BiBoltCircle } from "react-icons/bi";
import Search from "../search/SearchBar";
import useKanbanState from "../../hooks/useKanbanState";
import Links from "../links/Links";
import LinkCard from "../links/LinkCard";
import TaskGenerator from "../TaskGenerator";
import Inbox from "../kanban/Inbox";
import Kanban from "../kanban/Kanban";
import Column from "../kanban/Column";
import Card from "../kanban/Card";

const HomePage = () => {
  const { columns, setColumns, cards, setCards, links, setLinks, visibleSections, setVisibleSections } =
    useKanbanState();
  const [searchTerm, setSearchTerm] = useState("");

  const kanbanFlexGrow = useMemo(
    () =>
      24 -
      (visibleSections.links ? 2 : 0) -
      (visibleSections.taskGenerator ? 4 : 0) -
      (visibleSections.inbox ? 4 : 0),
    [visibleSections.links, visibleSections.taskGenerator, visibleSections.inbox],
  );

  const [activeColumn, setActiveColumn] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [activeLink, setActiveLink] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 15 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  );

  const toggleSection = (section) => {
    setVisibleSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const onSearch = (query) => {
    setSearchTerm(query);
  };

  const visibleCardIds = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    if (!s) return null;
    return new Set(
      cards
        .filter(
          (c) =>
            c.title?.toLowerCase().includes(s) ||
            c.desc?.toLowerCase().includes(s) ||
            c.tags?.some((t) => t.toLowerCase().includes(s)),
        )
        .map((c) => c.id),
    );
  }, [cards, searchTerm]);

  const visibleCards = useMemo(() => {
    if (!visibleCardIds) return cards;
    return cards.filter((c) => visibleCardIds.has(c.id));
  }, [cards, visibleCardIds]);

  useEffect(() => {
    if (isDragging) {
      const originalStyle =
        window.getComputedStyle(document.body).overflow;
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
    setColumns((prev) => prev.filter((column) => column.id !== id));
    setCards((prev) => prev.filter((card) => card.columnId !== id));
  }

  function updateColumn(id, title) {
    setColumns((prev) =>
      prev.map((column) => (column.id === id ? { ...column, title } : column)),
    );
  }

  function updateCard(id, title) {
    setCards((prev) =>
      prev.map((card) => (card.id === id ? { ...card, title } : card)),
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
    const link = active.data.current?.link;
    if (active.data.current?.type === "link" && link) {
      setActiveLink(link);
    }
  }

  function handleDragOver({ active, over }) {
    if (!active || !over) return;
    if (active.data.current.type === "link") return;
    if (active.data.current.type === "column") return;
    if (active.id === over.id) return;

    if (over.data.current?.type === "card") {
      setCards((prev) => {
        const activeIndex = prev.findIndex((card) => card.id === active.id);
        const overIndex = prev.findIndex((card) => card.id === over.id);
        if (activeIndex === -1 || overIndex === -1) return prev;
        const newCards = prev.map((card, index) => {
          if (index === activeIndex) {
            return { ...card, columnId: prev[overIndex].columnId };
          }
          return card;
        });
        return arrayMove(newCards, activeIndex, overIndex);
      });
    } else if (over.data.current?.type === "column") {
      setCards((prev) => {
        const activeIndex = prev.findIndex((card) => card.id === active.id);
        if (activeIndex === -1) return prev;
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
    setActiveLink(null);

    if (!over) return;

    if (active.data.current?.type === "link" && over.data.current?.type === "link") {
      if (active.id === over.id) return;
      setLinks((prev) => {
        const oldIndex = prev.findIndex((l) => l.id === active.id);
        const newIndex = prev.findIndex((l) => l.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
      return;
    }

    if (active.data.current?.type === "card") return;
    if (active.id === over.id) return;

    setColumns((prev) => {
      const activeIndex = prev.findIndex((column) => column.id === active.id);
      const overIndex = prev.findIndex((column) => column.id === over.id);
      if (activeIndex === -1 || overIndex === -1) return prev;
      return arrayMove(prev, activeIndex, overIndex);
    });
  }

  function handleDragCancel() {
    setIsDragging(false);
    setActiveColumn(null);
    setActiveCard(null);
    setActiveLink(null);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="relative h-dvh w-full bg-stone-100 p-4 text-base">
        <div
          className={`flex h-full w-full flex-col gap-4 ${isDragging ? "touch-none" : ""}`}
        >
          {/* Top Row */}
          <div className="flex gap-4 shrink-0">
            <a
              href="https://portfolio.nixkode.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-xl p-1 transition-colors hover:bg-stone-200"
              style={{ flexGrow: 2, flexShrink: 0, flexBasis: "0%" }}
            >
              <BiBoltCircle className="h-full w-auto text-yellow-400" />
              <span className="ml-2 text-sm font-bold">Nixkode</span>
            </a>
            <div style={{ flexGrow: 22, flexShrink: 0, flexBasis: "0%" }}>
              <Search onSearch={onSearch} />
            </div>
          </div>

          {/* Main Content */}
          <div
            className="relative flex h-full min-h-0"
            ref={containerRef}
          >
            {/* Links */}
            <div
              className="h-full overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                flexGrow: visibleSections.links ? 2 : 0,
                flexShrink: 0,
                flexBasis: "0%",
                opacity: visibleSections.links ? 1 : 0,
                marginRight: visibleSections.links ? 16 : 0,
              }}
            >
              <div className="h-full min-h-0 w-full">
                <Links links={links} setLinks={setLinks} />
              </div>
            </div>
            {/* Task Generator */}
            <div
              className="h-full overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                flexGrow: visibleSections.taskGenerator ? 4 : 0,
                flexShrink: 0,
                flexBasis: "0%",
                opacity: visibleSections.taskGenerator ? 1 : 0,
                marginRight: visibleSections.taskGenerator ? 16 : 0,
              }}
            >
              <div className="h-full w-full">
                <TaskGenerator />
              </div>
            </div>
            {/* Inbox */}
            <div
              className="h-full overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                flexGrow: visibleSections.inbox ? 4 : 0,
                flexShrink: 0,
                flexBasis: "0%",
                opacity: visibleSections.inbox ? 1 : 0,
                marginRight: visibleSections.inbox ? 16 : 0,
              }}
            >
              <div className="h-full min-h-0 w-full">
                <Inbox
                  cards={visibleCards.filter((c) => c.columnId === "inbox")}
                  setCards={setCards}
                  updateCard={updateCard}
                  containerRef={containerRef}
                />
              </div>
            </div>
            {/* Kanban */}
            <div
              className="h-full overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                flexGrow: kanbanFlexGrow,
                flexShrink: 0,
                flexBasis: "0%",
              }}
            >
              <Kanban
                columns={columns}
                visibleCards={visibleCards}
                setCards={setCards}
                deleteColumn={deleteColumn}
                updateColumn={updateColumn}
                updateCard={updateCard}
                createColumn={createColumn}
                containerRef={containerRef}
              />
            </div>
          </div>
        </div>

        {/* 胶囊菜单栏 */}
        <div className="group absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex gap-2 bg-stone-200 p-2 rounded-full shadow-xl transition-all duration-300">
            <button
              className={`rounded-full text-sm font-medium transition-all ${
                visibleSections.links
                  ? "bg-yellow-400 text-stone-700 shadow-md"
                  : "bg-stone-400 text-white"
              } w-2.5 h-2.5 group-hover:w-auto group-hover:h-auto group-hover:px-6 group-hover:py-2 overflow-hidden`}
              onClick={() => toggleSection("links")}
            >
              <span className="hidden group-hover:inline">Links</span>
            </button>
            <button
              className={`rounded-full text-sm font-medium transition-all ${
                visibleSections.taskGenerator
                  ? "bg-yellow-400 text-stone-700 shadow-md"
                  : "bg-stone-400 text-white"
              } w-2.5 h-2.5 group-hover:w-auto group-hover:h-auto group-hover:px-6 group-hover:py-2 overflow-hidden`}
              onClick={() => toggleSection("taskGenerator")}
            >
              <span className="hidden group-hover:inline">Task Generator</span>
            </button>
            <button
              className={`rounded-full text-sm font-medium transition-all ${
                visibleSections.inbox
                  ? "bg-yellow-400 text-stone-700 shadow-md"
                  : "bg-stone-400 text-white"
              } w-2.5 h-2.5 group-hover:w-auto group-hover:h-auto group-hover:px-6 group-hover:py-2 overflow-hidden`}
              onClick={() => toggleSection("inbox")}
            >
              <span className="hidden group-hover:inline">Inbox</span>
            </button>
            <button
              className="rounded-full text-sm font-medium bg-yellow-400 text-stone-700 shadow-md cursor-default w-2.5 h-2.5 group-hover:w-auto group-hover:h-auto group-hover:px-6 group-hover:py-2 overflow-hidden"
            >
              <span className="hidden group-hover:inline">Kanban</span>
            </button>
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
              updateCard={updateCard}
              containerRef={containerRef}
            />
          )}
          {activeCard && <Card key={activeCard.id} card={activeCard} />}
          {activeLink && (
            <LinkCard
              id={activeLink.id}
              name={activeLink.name}
              url={activeLink.url}
              isEdit={false}
              onDelete={() => {}}
            />
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default HomePage;
