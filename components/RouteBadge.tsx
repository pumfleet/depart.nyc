import React from 'react';

interface RouteBadgeProps {
    routeId: string;
    color: string;
    size?: 'default' | 'small' | 'xs';
}

export default function RouteBadge({ routeId, color, size = 'default' }: RouteBadgeProps) {
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

    // Check if route ends with X (express route)
    const isExpress = routeId.endsWith('X');
    const displayId = isExpress ? routeId.slice(0, -1) : routeId;

    // Size variants
    const sizeClasses = size === 'xs'
        ? 'w-4 h-4 text-[10px]'
        : size === 'small'
            ? 'w-6 h-6 text-sm'
            : 'w-7 h-7 text-lg';

    return (
        <div
            className={`flex items-center justify-center font-bold ${sizeClasses} ${isExpress ? '' : 'rounded-full'}`}
            style={{
                backgroundColor: `#${color}`,
                color: textColor,
                transform: isExpress ? 'rotate(45deg) scale(0.707)' : undefined,
            }}
        >
            <span style={{ transform: isExpress ? 'rotate(-45deg)' : undefined }}>
                {displayId}
            </span>
        </div>
    );
}
