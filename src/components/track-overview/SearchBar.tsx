"use client";
import React, { useState, useRef, useEffect } from "react";

interface SearchBarProps {
  tracks: string[];
  onTrackSelect: (track: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ tracks, onTrackSelect, searchTerm, setSearchTerm }) => {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);

  // Filter tracks based on search term
  const filteredTracks = tracks.filter((track) =>
    track.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setIsDropdownVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle track selection
  const handleTrackSelect = (track: string) => {
    onTrackSelect(track);
    setSearchTerm(track);
    setIsDropdownVisible(false); // Close dropdown after selecting
  };

  // Handle Enter key press
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && filteredTracks.length > 0) {
      handleTrackSelect(filteredTracks[0]); // Select the first filtered track
    }
  };

  return (
    <div className="relative w-64" ref={searchBarRef}>
      {/* Search Input */}
      <div className="flex items-center relative">
        <input
          type="text"
          placeholder="Search..."
          className="p-2.5 w-full rounded-xl bg-[#1e2128] border border-gray-800/50 text-gray-200 pl-10 focus:outline-none focus:border-cyan-500 transition-colors"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsDropdownVisible(true);
          }}
          onKeyDown={handleKeyPress} // Handle Enter key
        />
        {/* Magnifying Glass Image */}
        <img
          src="/icons/search-icon.png"
          alt="Search"
          className="absolute left-3 top-3 w-5 h-5 opacity-60"
        />
      </div>

      {/* Dropdown Options */}
      {isDropdownVisible && searchTerm && (
        <ul
          className="absolute z-10 mt-1 w-full bg-[#1e2128] border border-gray-800/50 rounded-xl max-h-40 overflow-y-auto text-gray-200 shadow-xl shadow-black/50"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "transparent transparent", // Transparent scrollbar
          }}
        >
          {filteredTracks.map((track) => (
            <li
              key={track}
              className="px-4 py-2 hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors cursor-pointer"
              onClick={() => handleTrackSelect(track)}
            >
              {track}
            </li>
          ))}
          {filteredTracks.length === 0 && (
            <li className="px-4 py-2 text-gray-400">No tracks found</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
