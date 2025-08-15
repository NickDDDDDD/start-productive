import { twMerge } from "tailwind-merge";

const LinkCard = ({ name, url, Icon, color = "text-black" }) => {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={name}
      className="flex aspect-square w-full items-center justify-center rounded-xl bg-stone-200 p-4 shadow-xl transition-colors hover:bg-stone-700"
    >
      <Icon className={twMerge("h-full w-full", color)} />
    </a>
  );
};

export default LinkCard;
