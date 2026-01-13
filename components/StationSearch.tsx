"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import stationsData from "../data/stations.json";
import RouteBadge from "./RouteBadge";
import { getLineColor } from "@/lib/colors";

type Station = {
    id: string;
    name: string;
    lines: string[];
};

export default function StationSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Station[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const fuse = useMemo(() => {
        return new Fuse(stationsData, {
            keys: ["name", "id", "lines"],
            threshold: 0.3,
        });
    }, []);

    useEffect(() => {
        if (query.trim() === "") {
            setResults([]);
            return;
        }

        const searchResults = fuse.search(query).map((result) => result.item);
        setResults(searchResults.slice(0, 5)); // Limit to top 5 results
        setSelectedIndex(0);
    }, [query, fuse]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (results.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % results.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        } else if (e.key === "Enter") {
            e.preventDefault();
            const selectedStation = results[selectedIndex];
            if (selectedStation) {
                router.push(`/stations/${selectedStation.id}`);
            }
        } else if (e.key === "Escape") {
            setQuery("");
            setResults([]);
        }
    };

    const handleSelect = (stationId: string) => {
        router.push(`/stations/${stationId}`);
    };

    // Scroll selected item into view
    useEffect(() => {
        if (listRef.current && results.length > 0) {
            const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: "nearest" });
            }
        }
    }, [selectedIndex, results]);

    return (
        <div className="relative w-full mt-4">
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="West 4 St"
                    className={`w-full text-4xl pb-2 focus:outline-none border-b-4 tracking-tight ${query ? "border-orange-500" : "border-neutral-700"
                        }`}
                    autoFocus
                />
                {query && (
                    <button
                        onClick={() => {
                            setQuery("");
                            setResults([]);
                            inputRef.current?.focus();
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                )}
            </div>

            {results.length > 0 && (
                <ul
                    ref={listRef}
                    className="absolute z-10 w-full mt-4 max-h-96 overflow-y-auto space-y-2"
                >
                    {results.map((station, index) => (
                        <li
                            key={`${station.id}-${index}`}
                            onClick={() => handleSelect(station.id)}
                            className={`px-4 py-3 cursor-pointer flex justify-between items-center bg-neutral-900 border-2 border-neutral-600 ${index === selectedIndex
                                && "border-orange-500"
                                }`}
                        >
                            <div>
                                <div className="font-medium text-white">
                                    {station.name}
                                </div>
                            </div>
                            <div className="flex gap-1">
                                {station.lines.map((line) => (
                                    <RouteBadge
                                        key={line}
                                        routeId={line}
                                        color={getLineColor(line)}
                                        size="small"
                                    />
                                ))}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
