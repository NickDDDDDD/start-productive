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
    <div>
      <input
        type="text"
        placeholder="Search cards..."
        value={query}
        onChange={handleQueryChange}
        className="w-full rounded-full border-2 border-stone-200 px-4 py-2 outline-none focus:border-yellow-500"
      />
    </div>
  );
};

export default SearchBar;
