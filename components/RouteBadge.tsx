import React from 'react';

interface RouteBadgeProps {
    routeId: string;
    color: string;
}

export default function RouteBadge({ routeId, color }: RouteBadgeProps) {
    // Calculate perceived brightness using relative luminance formula
    const getTextColor = (hexColor: string): string => {
        // Convert hex to RGB
        const r = parseInt(hexColor.substr(0, 2), 16);
        const g = parseInt(hexColor.substr(2, 2), 16);
        const b = parseInt(hexColor.substr(4, 2), 16);

        // Calculate relative luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        // Return black for bright colors, white for dark colors
        return luminance > 0.6 ? '#000000' : '#FFFFFF';
    };

    const textColor = getTextColor(color);

    return (
        <div
            className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-xl"
            style={{
                backgroundColor: `#${color}`,
                color: textColor
            }}
        >
            {routeId}
        </div>
    );
}
