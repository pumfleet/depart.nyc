import useSWR from 'swr';
import { fetchTrip } from '@/lib/api';
import { TripData } from '@/components/TripTimeline';

interface UseTripResult {
    trip: TripData | undefined;
    isLoading: boolean;
    isValidating: boolean;
    isOffline: boolean;
    error: Error | undefined;
}

export function useTrip(id: string | undefined): UseTripResult {
    const { data, error, isLoading, isValidating } = useSWR<TripData>(
        id ? `/trip/${id}` : null,
        () => fetchTrip(id!),
        {
            refreshInterval: 5000, // Poll every 5 seconds
            keepPreviousData: true,
        }
    );

    return {
        trip: data,
        isLoading,
        isValidating,
        // Offline = we have data but current fetch failed
        isOffline: !!data && !!error,
        // Don't show error if we have cached data
        error: data ? undefined : error,
    };
}
