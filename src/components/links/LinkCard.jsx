// LinkCard.jsx
import { useEffect, useState, useMemo } from "react";
import { RiDeleteBin2Line } from "react-icons/ri";
import { getFavicon } from "../../utils/favicon";

const LinkCard = ({ id, name, url, isEdit, onDelete }) => {
  const [faviconSrc, setFaviconSrc] = useState(null);
  const [imgOk, setImgOk] = useState(true);

  const initial = useMemo(() => {
    const n = (name || "").trim();
    if (!n) return "?";
    // Array.from 处理 surrogate pair，兼容 emoji/中文
    const ch = Array.from(n)[0];
    return ch.toUpperCase?.() ?? ch;
  }, [name]);

  useEffect(() => {
    let alive = true;

    setFaviconSrc(null);
    setImgOk(true);

    getFavicon(url)
      .then((src) => {
        if (!alive) {
          return;
        }
        if (src) {
          setFaviconSrc(src);
        } else {
          setFaviconSrc(null);
        }
      })
      .catch(() => {
        if (!alive) return;

        setFaviconSrc(null);
      });

    return () => {
      alive = false;
    };
  }, [url]);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={name}
      className="relative flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-stone-200 p-4 shadow-md transition-colors hover:bg-stone-300"
    >
      <div className="flex h-full w-full items-center justify-start gap-2">
        <div className="flex h-full items-center justify-center">
          {faviconSrc && imgOk ? (
            <img
              src={faviconSrc}
              alt=""
              className="aspect-square h-full flex-none"
              referrerPolicy="no-referrer"
              onError={() => setImgOk(false)}
            />
          ) : (
            <div className="grid aspect-square h-full flex-none place-items-center rounded-full bg-stone-900 font-semibold text-white select-none">
              <span className="text-base leading-none">{initial}</span>
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
          className="absolute top-2 right-2 transition-colors hover:text-red-500"
        >
          <RiDeleteBin2Line />
        </button>
      )}
    </a>
  );
};

export default LinkCard;
