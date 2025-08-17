import LinkCard from "./LinkCard";
import { useState } from "react";
import { FaXmark } from "react-icons/fa6";
import { FaPlus } from "react-icons/fa6";
import { BsThreeDots } from "react-icons/bs";

const LinkManager = ({ links, setLinks }) => {
  const [form, setForm] = useState({
    name: "",
    url: "",
    iconId: "",
    color: "#000000",
  });

  const [isEdit, setIsEdit] = useState(false);

  function deleteLink(name) {
    setLinks((prevLinks) => prevLinks.filter((link) => link.name !== name));
  }
  const [isAddingLink, setIsAddingLink] = useState(false);

  const handleAddLink = () => {
    console.log("Adding new link");
    setIsAddingLink(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLinks((prev) => [...prev, form]);
    setIsAddingLink(false);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* header */}
      <div className="flex justify-between px-1">
        <p className="text-base font-bold">Links</p>
        <button
          onClick={() => setIsEdit(!isEdit)}
          className="rounded-xl p-1 text-sm hover:bg-stone-200"
        >
          {isEdit ? (
            "Cancel Edit"
          ) : (
            <BsThreeDots className="inline-block text-lg" />
          )}
        </button>
      </div>
      {/* display when edited */}
      {!isAddingLink && isEdit && (
        <button
          className="rounded-xl bg-yellow-500 p-1 hover:bg-yellow-400"
          onClick={handleAddLink}
        >
          <FaPlus className="mr-1 inline-block" />
          Add Link
        </button>
      )}
      {isAddingLink && (
        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-col gap-2 rounded-xl bg-stone-200 p-2"
        >
          <input
            type="text"
            placeholder="Link Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoFocus
            className="w-full"
          />
          <input
            type="url"
            placeholder="Link URL"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            className="w-full"
          />
          <input
            type="text"
            placeholder="Icon ID"
            value={form.iconId}
            onChange={(e) => setForm({ ...form, iconId: e.target.value })}
            className="w-full"
          />
          <input
            type="color"
            name="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="m-0 h-3 w-full p-0"
          />

          <div className="flex items-center justify-start gap-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-yellow-500 p-1 px-2 hover:bg-yellow-400"
            >
              Confirm
            </button>
            <button
              type="button"
              className="flex-1 rounded-xl p-1 hover:bg-stone-300"
              onClick={() => setIsAddingLink(false)}
            >
              <FaXmark className="inline-block" />
            </button>
          </div>
        </form>
      )}
      {/*  links */}
      <div className="flex min-h-0 flex-col gap-2 overflow-y-auto">
        {links.map((link) => (
          <LinkCard
            name={link.name}
            url={link.url}
            key={link.name}
            iconId={link.iconId}
            color={link.color}
            isEdit={isEdit}
            onDelete={() => deleteLink(link.name)}
          />
        ))}
      </div>
    </div>
  );
};

export default LinkManager;
