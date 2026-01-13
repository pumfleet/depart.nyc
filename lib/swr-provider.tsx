'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

interface SWRProviderProps {
    children: ReactNode;
}

export default function SWRProvider({ children }: SWRProviderProps) {
    return (
        <SWRConfig
            value={{
                // Keep stale data on error (critical for offline)
                keepPreviousData: true,

                // Revalidate when browser regains focus
                revalidateOnFocus: true,

                // Revalidate when network comes back online
                revalidateOnReconnect: true,

                // Don't revalidate on mount if data exists
                revalidateIfStale: true,

                // Dedupe requests within 2 seconds
                dedupingInterval: 2000,

                // Custom error retry with exponential backoff
                onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
                    // Don't retry on 404
                    if (error?.status === 404) return;

                    // Only retry 3 times
                    if (retryCount >= 3) return;

                    // Exponential backoff: 1s, 2s, 4s
                    setTimeout(() => revalidate({ retryCount }), 1000 * Math.pow(2, retryCount));
                },
            }}
        >
            {children}
        </SWRConfig>
    );
}
