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
          className="p-2 w-full rounded-md bg-[#393A3E] text-white pl-10"
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
          className="absolute left-3 top-2.5 w-5 h-5"
        />
      </div>

      {/* Dropdown Options */}
      {isDropdownVisible && searchTerm && (
        <ul
          className="absolute z-10 mt-1 w-full bg-[#393A3E] rounded-md max-h-40 overflow-y-auto text-white"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "transparent transparent", // Transparent scrollbar
          }}
        >
          {filteredTracks.map((track) => (
            <li
              key={track}
              className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
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
