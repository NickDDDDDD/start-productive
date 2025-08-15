import { useMemo, useState } from "react";
import TaskManager from "../kanban/TaskManager";
import LinkCard from "../links/LinkCard";
import { FcGoogle } from "react-icons/fc";
import { RiCharacterRecognitionFill } from "react-icons/ri";
import { BiBoltCircle } from "react-icons/bi";
import Search from "../search/SearchBar";
import useKanbanState from "../../hooks/useKanbanState";

const HomePage = () => {
  const { columns, setColumns, cards, setCards } = useKanbanState();
  const [searchTerm, setSearchTerm] = useState("");

  const links = [
    { name: "Google", url: "https://www.google.com", Icon: FcGoogle },
    {
      name: "Ace",
      url: "https://material.aceoffer.cn/recruit",
      Icon: RiCharacterRecognitionFill,
      color: "text-red-600",
    },
  ];

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
    <div className="grid h-dvh w-full grid-cols-24 grid-rows-[auto_1fr] gap-4 bg-stone-100 p-4">
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
      <div className="col-span-2 flex h-full min-w-24 flex-col gap-4">
        {links.map((link) => (
          <LinkCard
            name={link.name}
            url={link.url}
            key={link.name}
            Icon={link.Icon}
            color={link.color}
          />
        ))}
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
