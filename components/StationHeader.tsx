import React from 'react';

interface StationHeaderProps {
    name: string;
}

export default function StationHeader({ name }: StationHeaderProps) {
    return (
        <header className="p-4 border-b border-gray-800 bg-black text-white">
            <h1 className="text-2xl font-bold">{name}</h1>
        </header>
    );
}
