'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchStation } from '@/lib/api';
import { StationResponse } from '@/lib/types';
import StationHeader from '@/components/StationHeader';
import DepartureBoard from '@/components/DepartureBoard';

export default function StationPage() {
    const { id } = useParams();
    const [stationData, setStationData] = useState<StationResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                const data = await fetchStation(id as string);
                setStationData(data);
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
            <StationHeader name={stationData.name} />
            <DepartureBoard
                stopTimes={stationData.stopTimes}
                limit={5}
                grouped={true}
                countdownFormat="exact"
            />
        </div>
    );
}
