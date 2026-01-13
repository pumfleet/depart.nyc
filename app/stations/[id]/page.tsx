'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import StationHeader from '@/components/StationHeader';
import DepartureBoard from '@/components/DepartureBoard';
import Alerts from '@/components/Alerts';
import OfflineIndicator from '@/components/OfflineIndicator';
import Loading from '@/components/Loading';
import ErrorScreen from '@/components/ErrorScreen';
import { useStation } from '@/lib/hooks/useStation';
import { useRoutes } from '@/lib/hooks/useRoutes';
import { useStationAlerts } from '@/lib/hooks/useStationAlerts';

export default function StationPage() {
    const { id } = useParams();
    const { station, isLoading, error } = useStation(id as string);
    const { routes } = useRoutes();
    const { alerts } = useStationAlerts(station, routes);

    useEffect(() => {
        if (id) {
            // Store active station in localStorage for back navigation
            localStorage.setItem('activeStation', id as string);
        }
    }, [id]);

    if (isLoading && !station) {
        return <Loading />;
    }

    if (error && !station) {
        return <ErrorScreen message="Failed to load station" />;
    }

    if (!station) {
        return <ErrorScreen message="Station not found" />;
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <OfflineIndicator />
            <StationHeader
                name={station.name}
                routes={
                    station.serviceMaps
                        .find(sm => sm.configId === 'realtime')
                        ?.routes.map(r => ({ id: r.id, color: r.color }))
                        .sort((a, b) => a.id.localeCompare(b.id)) || []
                }
            />
            <Alerts alerts={alerts} />
            <DepartureBoard
                stopTimes={station.stopTimes}
                limit={5}
                grouped={true}
                countdownFormat="exact"
            />
        </div>
    );
}
