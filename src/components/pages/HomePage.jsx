import { useMemo, useState } from "react";
import TaskManager from "../kanban/TaskManager";
import { BiBoltCircle } from "react-icons/bi";
import Search from "../search/SearchBar";
import useKanbanState from "../../hooks/useKanbanState";
import LinkManager from "../links/LinkManager";

const HomePage = () => {
  const { columns, setColumns, cards, setCards, links, setLinks } =
    useKanbanState();
  const [searchTerm, setSearchTerm] = useState("");

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
    <div className="grid h-dvh w-full grid-cols-24 grid-rows-[auto_1fr] gap-4 bg-stone-100 p-4 text-base">
      <a
        href="https://portfolio.nixkode.com"
        target="_blank"
        rel="noopener noreferrer"
        className="col-span-2 flex items-center justify-center rounded-xl p-1 transition-colors hover:bg-stone-200"
      >
        <BiBoltCircle className="h-full w-auto text-yellow-400" />
        <span className="ml-2 text-sm font-bold">Nixkode</span>
      </a>
      <div className="col-span-22">
        <Search onSearch={onSearch} />
      </div>
      <div className="col-span-2 h-full min-w-24">
        <LinkManager links={links} setLinks={setLinks} />
      </div>
      <div className="col-span-22 h-full min-h-0">
        <TaskManager
          columns={columns}
          cards={cards}
          visibleCardIds={visibleCardIds}
          setColumns={setColumns}
          setCards={setCards}
        />
      </div>
    </div>
  );
};

export default HomePage;
