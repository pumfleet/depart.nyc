import useSWR from 'swr';
import { fetchStation } from '@/lib/api';
import { StationResponse } from '@/lib/types';

interface UseStationResult {
    station: StationResponse | undefined;
    isLoading: boolean;
    isValidating: boolean;
    isOffline: boolean;
    error: Error | undefined;
}

export function useStation(id: string | undefined): UseStationResult {
    const { data, error, isLoading, isValidating } = useSWR<StationResponse>(
        id ? `/station/${id}` : null,
        () => fetchStation(id!),
        {
            refreshInterval: 5000, // Poll every 5 seconds
            keepPreviousData: true,
        }
    );

    return {
        station: data,
        isLoading,
        isValidating,
        // Offline = we have data but current fetch failed
        isOffline: !!data && !!error,
        // Don't show error if we have cached data
        error: data ? undefined : error,
    };
}
