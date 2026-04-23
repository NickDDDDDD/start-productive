import { useMemo, useState } from "react";
import TaskManager from "../kanban/TaskManager";
import { BiBoltCircle } from "react-icons/bi";
import Search from "../search/SearchBar";
import useKanbanState from "../../hooks/useKanbanState";
import LinkManager from "../links/LinkManager";
import TaskGenerator from "../TaskGenerator";

const colSpanMap = {
  18: "col-span-18",
  20: "col-span-20",
  22: "col-span-22",
  24: "col-span-24",
};

const HomePage = () => {
  const { columns, setColumns, cards, setCards, links, setLinks } =
    useKanbanState();
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleSections, setVisibleSections] = useState({
    links: true,
    taskGenerator: true,
    inbox: true,
    kanban: true,
  });

  const toggleSection = (section) => {
    setVisibleSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const taskManagerColSpan = useMemo(() => {
    const used = (visibleSections.links ? 2 : 0) + (visibleSections.taskGenerator ? 4 : 0);
    return 24 - used;
  }, [visibleSections.links, visibleSections.taskGenerator]);

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

  return (
    <div className="relative h-dvh w-full bg-stone-100 p-4 text-base">
      <div className="grid h-full w-full grid-rows-[auto_1fr] gap-4">
        {/* Top Row */}
        <div className="grid grid-cols-24 gap-4">
          <a
            href="https://portfolio.nixkode.com"
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-2 flex items-center justify-center rounded-xl p-1 transition-colors hover:bg-stone-200"
          >
            <BiBoltCircle className="h-full w-auto text-yellow-400" />
            <span className="ml-2 text-sm font-bold">Nixkode</span>
          </a>
          {/*search bar */}
          <div className="col-span-22">
            <Search onSearch={onSearch} />
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-24 gap-4 h-full">
          {/* links manager */}
          {visibleSections.links && (
            <div className="col-span-2 h-full min-h-0">
              <LinkManager links={links} setLinks={setLinks} />
            </div>
          )}
          {/* task generator */}
          {visibleSections.taskGenerator && (
            <div className="col-span-4 h-full">
              <TaskGenerator />
            </div>
          )}
          {/* Task Manager */}
          {visibleSections.inbox || visibleSections.kanban ? (
            <div className={`${colSpanMap[taskManagerColSpan]} h-full min-h-0`}>
              <TaskManager
                columns={columns}
                cards={cards}
                visibleCardIds={visibleCardIds}
                setColumns={setColumns}
                setCards={setCards}
                visibleSections={visibleSections}
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* 胶囊菜单栏 - 底部悬浮 */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex bg-stone-200 p-2 rounded-full shadow-xl">
          <button
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all mr-2 ${
              visibleSections.links
                ? "bg-yellow-400 text-stone-900 shadow-md"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-300"
            }`}
            onClick={() => toggleSection("links")}
          >
            Links
          </button>
          <button
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all mr-2 ${
              visibleSections.taskGenerator
                ? "bg-yellow-400 text-stone-900 shadow-md"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-300"
            }`}
            onClick={() => toggleSection("taskGenerator")}
          >
            Task Generator
          </button>
          <button
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all mr-2 ${
              visibleSections.inbox
                ? "bg-yellow-400 text-stone-900 shadow-md"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-300"
            }`}
            onClick={() => toggleSection("inbox")}
          >
            Inbox
          </button>
          <button
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              visibleSections.kanban
                ? "bg-yellow-400 text-stone-900 shadow-md"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-300"
            }`}
            onClick={() => toggleSection("kanban")}
          >
            Kanban
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
