"use client";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { SubdivisionSummary } from "@/types/task";

interface SearchBarProps {
  subdivisions: SubdivisionSummary[];
  onSelectSubdivision: (subdivision: SubdivisionSummary) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  subdivisions,
  onSelectSubdivision,
  searchTerm,
  setSearchTerm,
}) => {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return subdivisions.slice(0, 12);
    return subdivisions
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.operator.toLowerCase().includes(q) ||
          s.trackId.toLowerCase().includes(q)
      )
      .slice(0, 18);
  }, [subdivisions, searchTerm]);

  useEffect(() => {
    if (!isDropdownVisible) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchBarRef.current &&
        !searchBarRef.current.contains(event.target as Node)
      ) {
        setIsDropdownVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownVisible]);

  const handleSelect = (sub: SubdivisionSummary) => {
    onSelectSubdivision(sub);
    setSearchTerm(sub.name);
    setIsDropdownVisible(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && filtered.length > 0) {
      event.preventDefault();
      handleSelect(filtered[0]);
    } else if (event.key === "Escape") {
      setIsDropdownVisible(false);
    }
  };

  return (
    <div className="relative w-full sm:w-80" ref={searchBarRef}>
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-gray-500 absolute left-3 pointer-events-none" />
        <input
          type="search"
          aria-label="Search Alberta railway subdivisions or track IDs"
          placeholder="Search subdivision or way ID..."
          className="w-full rounded-lg bg-[#0d1015] border border-[#242a36] pl-9 pr-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-cyan-500 transition-colors"
          value={searchTerm}
          onFocus={() => setIsDropdownVisible(true)}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsDropdownVisible(true);
          }}
          onKeyDown={handleKeyDown}
        />
      </div>

      {isDropdownVisible && filtered.length > 0 && (
        <ul
          role="listbox"
          aria-label="Matching railway subdivisions"
          className="absolute z-30 mt-1 w-full bg-[#151921] border border-[#2d3546] rounded-xl max-h-60 overflow-y-auto scrollbar-custom shadow-2xl"
        >
          {filtered.map((sub) => (
            <li key={`${sub.trackId}-${sub.name}`}>
              <button
                type="button"
                onClick={() => handleSelect(sub)}
                className="w-full text-left px-3 py-2 hover:bg-[#1e2430] border-b border-[#242a36]/50 last:border-b-0 flex items-center justify-between gap-2 text-xs"
              >
                <span className="min-w-0">
                  <span className="font-medium text-gray-100 block truncate">
                    {sub.name}
                  </span>
                  <span className="text-[11px] text-gray-400 block truncate">
                    {sub.operator || "Alberta Rail"} · {sub.count} segments
                  </span>
                </span>
                <span className="font-mono text-[11px] text-cyan-400 flex-shrink-0">
                  {sub.trackId}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default memo(SearchBar);
