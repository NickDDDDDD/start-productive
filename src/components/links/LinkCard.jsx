import { useEffect, useState, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RiDeleteBin2Line } from "react-icons/ri";
import { getFavicon } from "../../utils/favicon";

const LinkCard = ({ id, name, url, isEdit, onDelete }) => {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { type: "link", link: { id, name, url } },
  });

  const [faviconSrc, setFaviconSrc] = useState(null);
  const [imgOk, setImgOk] = useState(true);

  const initial = useMemo(() => {
    const n = (name || "").trim();
    if (!n) return "?";
    const ch = Array.from(n)[0];
    return ch.toUpperCase?.() ?? ch;
  }, [name]);

  useEffect(() => {
    let alive = true;
    setFaviconSrc(null);
    setImgOk(true);
    getFavicon(url)
      .then((src) => {
        if (!alive) return;
        if (src) setFaviconSrc(src);
        else setFaviconSrc(null);
      })
      .catch(() => {
        if (!alive) return;
        setFaviconSrc(null);
      });
    return () => { alive = false; };
  }, [url]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="aspect-video w-full shrink-0 rounded-xl border-2 border-yellow-500 bg-stone-200 opacity-50"
      />
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={name}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-stone-200 p-4 shadow-md transition-colors hover:bg-stone-300"
    >
      <div className="flex h-full w-full items-center justify-start gap-3">
        <div className="flex items-center justify-center">
          {faviconSrc && imgOk ? (
            <img
              src={faviconSrc}
              alt=""
              className="aspect-square h-10 w-10 flex-none rounded-lg"
              referrerPolicy="no-referrer"
              onError={() => setImgOk(false)}
            />
          ) : (
            <div className="grid aspect-square h-10 w-10 flex-none place-items-center rounded-lg bg-stone-700 font-semibold text-white select-none">
              <span className="text-sm leading-none">{initial}</span>
            </div>
          )}
        </div>
        <h3 className="text-sm font-semibold capitalize">{name}</h3>
      </div>

      {isEdit && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(id);
          }}
          className="group absolute top-2 right-2 transition-colors hover:text-red-400"
        >
          <RiDeleteBin2Line className="group-hover:text-red-400" />
        </button>
      )}
    </a>
  );
};

export default LinkCard;
