import { useEffect, useRef, useState } from "react";
import { loadState, saveState, subscribeState } from "../utils/storage";

const useKanbanState = () => {
  const [columns, setColumns] = useState([]);
  const [cards, setCards] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const s = await loadState();
      if (!mounted) return;
      setColumns(s.columns || []);
      setCards(s.cards || []);
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
    });
    return unsubscribe;
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveState({ columns, cards });
    }, 200);
    return () => clearTimeout(saveTimerRef.current);
  }, [columns, cards, hydrated]);

  return { columns, setColumns, cards, setCards };
};

export default useKanbanState;
