'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import StationHeader from '@/components/StationHeader';
import DepartureBoard from '@/components/DepartureBoard';
import Alerts from '@/components/Alerts';
import { fetchStation, fetchRoutes, fetchAlert } from '@/lib/api';
import { StationResponse, Alert, Route } from '@/lib/types';

export default function StationPage() {
    const { id } = useParams();
    const [stationData, setStationData] = useState<StationResponse | null>(null);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                const [station, allRoutes] = await Promise.all([
                    fetchStation(id as string),
                    fetchRoutes()
                ]);
                setStationData(station);

                // Identify active routes at this station
                const activeRouteIds = new Set<string>();
                station.stopTimes.forEach(st => {
                    activeRouteIds.add(st.trip.route.id);
                });

                // Find alerts for active routes
                const relevantAlertIds = new Set<string>();
                allRoutes.forEach(route => {
                    if (activeRouteIds.has(route.id) && route.alerts) {
                        route.alerts.forEach(a => relevantAlertIds.add(a.id));
                    }
                });

                // Fetch alert details
                const alertPromises = Array.from(relevantAlertIds).map(alertId => fetchAlert(alertId));
                const fetchedAlerts = await Promise.all(alertPromises);
                setAlerts(fetchedAlerts);

                setError(null);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch station data');
            } finally {
                setLoading(false);
            }
        };

        // Initial fetch
        fetchData();

        // Poll every 5 seconds
        const intervalId = setInterval(fetchData, 5000);

        return () => clearInterval(intervalId);
    }, [id]);

    if (loading && !stationData) {
        return <div className="p-4 text-white">Loading...</div>;
    }

    if (error) {
        return <div className="p-4 text-red-500">{error}</div>;
    }

    if (!stationData) {
        return <div className="p-4 text-white">Station not found</div>;
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <StationHeader
                name={stationData.name}
                routes={
                    stationData.serviceMaps
                        .find(sm => sm.configId === 'realtime')
                        ?.routes.map(r => ({ id: r.id, color: r.color })) || []
                }
            />
            <Alerts alerts={alerts} />
            <DepartureBoard
                stopTimes={stationData.stopTimes}
                limit={5}
                grouped={true}
                countdownFormat="exact"
            />
        </div>
    );
}
