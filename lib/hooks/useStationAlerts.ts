import useSWR from 'swr';
import { fetchAlert } from '@/lib/api';
import { StationResponse, Alert, Route } from '@/lib/types';

interface UseStationAlertsResult {
    alerts: Alert[];
    isLoading: boolean;
    error: Error | undefined;
}

export function useStationAlerts(
    station: StationResponse | undefined,
    routes: Route[]
): UseStationAlertsResult {
    // Identify active routes at this station
    const activeRouteIds = new Set<string>();
    station?.stopTimes.forEach(st => {
        activeRouteIds.add(st.trip.route.id);
    });

    // Find alerts for active routes
    const relevantAlertIds: string[] = [];
    routes.forEach(route => {
        if (activeRouteIds.has(route.id) && route.alerts) {
            route.alerts.forEach(a => {
                if (!relevantAlertIds.includes(a.id)) {
                    relevantAlertIds.push(a.id);
                }
            });
        }
    });

    // Create a stable key for SWR based on alert IDs
    const alertKey = relevantAlertIds.length > 0
        ? `/alerts/${relevantAlertIds.sort().join(',')}`
        : null;

    const { data, error, isLoading } = useSWR<Alert[]>(
        alertKey,
        async () => {
            const alertPromises = relevantAlertIds.map(alertId => fetchAlert(alertId));
            return Promise.all(alertPromises);
        },
        {
            refreshInterval: 30000, // Alerts don't change frequently
            keepPreviousData: true,
        }
    );

    return {
        alerts: data ?? [],
        isLoading,
        error,
    };
}
