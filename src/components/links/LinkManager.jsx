import LinkCard from "./LinkCard";
import { useState } from "react";
import { FaXmark } from "react-icons/fa6";
import { FaPlus } from "react-icons/fa6";
import { BsThreeDots } from "react-icons/bs";
import { nanoid } from "nanoid";

const LinkManager = ({ links, setLinks }) => {
  const emptyForm = { id: "", name: "", url: "" };

  const [form, setForm] = useState(emptyForm);

  const [isEdit, setIsEdit] = useState(false);

  function deleteLink(id) {
    setLinks((prevLinks) => prevLinks.filter((link) => link.id !== id));
  }
  const [isAddingLink, setIsAddingLink] = useState(false);

  const handleAddLink = () => {
    console.log("Adding new link");
    setIsAddingLink(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newLink = { ...form, id: nanoid() };

    setLinks((prev) => [...prev, newLink]);
    setForm(emptyForm);
    setIsAddingLink(false);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* header */}
      <div className="flex justify-between px-1">
        <p className="text-base font-bold">Links</p>
        <button
          onClick={() => setIsEdit(!isEdit)}
          className="rounded-full px-2 py-1 text-xs hover:bg-stone-200"
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
          className="rounded-full bg-yellow-400 p-1 hover:bg-yellow-300"
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
            id={link.id}
            name={link.name}
            url={link.url}
            key={link.id}
            isEdit={isEdit}
            onDelete={deleteLink}
          />
        ))}
      </div>
    </div>
  );
};

export default LinkManager;
