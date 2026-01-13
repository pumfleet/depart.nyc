import useSWR from 'swr';
import { fetchRoutes } from '@/lib/api';
import { Route } from '@/lib/types';

interface UseRoutesResult {
    routes: Route[];
    isLoading: boolean;
    error: Error | undefined;
}

export function useRoutes(): UseRoutesResult {
    const { data, error, isLoading } = useSWR<Route[]>(
        '/routes',
        fetchRoutes,
        {
            refreshInterval: 30000, // Routes change less often, poll every 30s
            revalidateOnFocus: false,
            dedupingInterval: 10000,
            keepPreviousData: true,
        }
    );

    return {
        routes: data ?? [],
        isLoading,
        error,
    };
}
