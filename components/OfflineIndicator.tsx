'use client';

import { AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        // Check initial state
        setIsOffline(!navigator.onLine);

        const handleOffline = () => setIsOffline(true);
        const handleOnline = () => setIsOffline(false);

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="bg-yellow-500 border-b border-yellow-800 px-4 py-2 text-sm text-center font-medium text-yellow-900 flex">
            <AlertTriangle className="w-4 h-4 mr-2 mt-0.5" />
            <span>Offline - showing cached data</span>
        </div>
    );
}
