import { twMerge } from "tailwind-merge";

const LinkCard = ({ name, url, Icon, color = "text-black" }) => {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={name}
      className="flex aspect-square w-full items-center justify-center rounded-lg bg-stone-200 p-4 shadow-xl transition-colors hover:bg-gray-800"
    >
      <Icon className={twMerge("h-full w-full", color)} />
    </a>
  );
};

export default LinkCard;
