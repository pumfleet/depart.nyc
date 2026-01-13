'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import StationHeader from '@/components/StationHeader';
import DepartureBoard from '@/components/DepartureBoard';
import Alerts from '@/components/Alerts';
import OfflineIndicator from '@/components/OfflineIndicator';
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
        return <div className="p-4 text-white">Loading...</div>;
    }

    if (error && !station) {
        return <div className="p-4 text-red-500">Failed to fetch station data</div>;
    }

    if (!station) {
        return <div className="p-4 text-white">Station not found</div>;
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
