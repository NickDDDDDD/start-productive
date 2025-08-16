import { useEffect, useRef, useState } from "react";
import { loadState, saveState, subscribeState } from "../utils/storage";
import { FcGoogle } from "react-icons/fc";
import { RiCharacterRecognitionFill } from "react-icons/ri";

const useKanbanState = () => {
  const [columns, setColumns] = useState([]);
  const [cards, setCards] = useState([]);
  const [links, setLinks] = useState([]);
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
    });
    return unsubscribe;
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveState({ columns, cards, links });
    }, 200);
    return () => clearTimeout(saveTimerRef.current);
  }, [columns, cards, links, hydrated]);

  return { columns, setColumns, cards, setCards, links, setLinks };
};

export default useKanbanState;
