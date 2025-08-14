import Kanban from "../kanban/Kanban";
import LinkCard from "../links/LinkCard";
import { FcGoogle } from "react-icons/fc";
import { RiCharacterRecognitionFill } from "react-icons/ri";
import { BiBoltCircle } from "react-icons/bi";

const HomePage = () => {
  const links = [
    { name: "Google", url: "https://www.google.com", Icon: FcGoogle },
    {
      name: "Ace",
      url: "https://material.aceoffer.cn/recruit",
      Icon: RiCharacterRecognitionFill,
      color: "text-red-600",
    },
    {
      name: "Portfolio",
      url: "https://portfolio.nixkode.com",
      Icon: BiBoltCircle,
      color: "text-yellow-400",
    },
  ];
  return (
    <div className="grid h-dvh w-full grid-cols-24 bg-stone-100">
      <div className="col-span-2 flex h-full flex-col gap-4 p-4 pr-0">
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
      <div className="col-span-22 h-full min-h-0 p-4">
        <Kanban />
      </div>
    </div>
  );
};

export default HomePage;
