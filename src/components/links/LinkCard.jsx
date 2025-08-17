import { useEffect, useState } from "react";
import { loadIconById } from "../../utils/iconLoader"; // 记得换成你实际路径
import { RiDeleteBin2Line } from "react-icons/ri";

const LinkCard = ({
  name,
  url,
  iconId,
  color = "text-black",
  isEdit,
  onDelete,
}) => {
  const [Icon, setIcon] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    setIcon(null);
    setErr("");
    if (!iconId) return;

    loadIconById(iconId)
      .then((C) => alive && setIcon(() => C))
      .catch((e) => alive && setErr(e.message));

    return () => {
      alive = false;
    };
  }, [iconId]);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={name}
      className="relative flex aspect-video w-full items-center justify-center rounded-xl bg-stone-200 p-4 shadow-md transition-colors hover:bg-stone-300"
    >
      {err && <span className="text-xs text-red-500">!</span>}
      {!err && Icon && (
        <div className="flex h-full w-full items-center justify-start gap-2">
          <Icon className="h-full w-fit" style={{ color }} />
          <h3 className="text-base font-semibold capitalize">{name}</h3>
        </div>
      )}
      {isEdit && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(name);
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
