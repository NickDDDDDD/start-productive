import { useState, useRef } from "react";

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState("");
  const debounceRef = useRef(null); // 存放定时器 ID

  const handleQueryChange = (e) => {
    const value = e.target.value;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setQuery(value);
    debounceRef.current = setTimeout(() => {
      onSearch?.(value);
    }, 300);
  };

  return (
    <div className="p-4 pb-0">
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={handleQueryChange}
        className="w-full rounded-full border border-stone-400 px-4 py-2"
      />
    </div>
  );
};

export default SearchBar;
