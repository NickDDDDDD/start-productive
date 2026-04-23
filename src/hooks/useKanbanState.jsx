import { useEffect, useRef, useState } from "react";
import { loadState, saveState, subscribeState } from "../utils/storage";
import { FcGoogle } from "react-icons/fc";
import { RiCharacterRecognitionFill } from "react-icons/ri";

const DEFAULT_VISIBLE_SECTIONS = {
  links: true,
  taskGenerator: true,
  inbox: true,
};

const useKanbanState = () => {
  const [columns, setColumns] = useState([]);
  const [cards, setCards] = useState([]);
  const [links, setLinks] = useState([]);
  const [visibleSections, setVisibleSections] = useState(DEFAULT_VISIBLE_SECTIONS);
  const [hydrated, setHydrated] = useState(false);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const s = await loadState();
      if (!mounted) return;
      setColumns(s.columns || []);
      setCards(s.cards || []);
      setLinks(s.links || []);
      setVisibleSections(s.visibleSections || DEFAULT_VISIBLE_SECTIONS);
      setHydrated(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const unsubscribe = subscribeState((s) => {
      if (!s) return;
      setColumns(s.columns || []);
      setCards(s.cards || []);
      setLinks(s.links || []);
      setVisibleSections(s.visibleSections || DEFAULT_VISIBLE_SECTIONS);
    });
    return unsubscribe;
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveState({ columns, cards, links, visibleSections });
    }, 200);
    return () => clearTimeout(saveTimerRef.current);
  }, [columns, cards, links, visibleSections, hydrated]);

  return { columns, setColumns, cards, setCards, links, setLinks, visibleSections, setVisibleSections };
};

export default useKanbanState;
