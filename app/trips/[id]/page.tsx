'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dayjs from 'dayjs';
import RouteBadge from '@/components/RouteBadge';
import TripTimeline, { TripData } from '@/components/TripTimeline';
import TransferModal from '@/components/TransferModal';
import { fetchTrip } from '@/lib/api';
import Link from 'next/link';

export default function TripPage() {
    const { id } = useParams();
    const [tripData, setTripData] = useState<TripData | null>(null);
    const [activeStation, setActiveStation] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(dayjs());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Transfer modal state
    const [transferModal, setTransferModal] = useState<{
        isOpen: boolean;
        stationName: string;
        stopId: string;
        arrivalTime: number;
    } | null>(null);

    useEffect(() => {
        // Get active station from localStorage
        const station = localStorage.getItem('activeStation');
        if (station) {
            setActiveStation(station);
        }
    }, []);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                const data = await fetchTrip(id as string);
                setTripData(data);
                setError(null);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch trip data');
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

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(dayjs());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleTransferClick = (stationName: string, stopId: string, arrivalTime: number) => {
        setTransferModal({
            isOpen: true,
            stationName,
            stopId,
            arrivalTime
        });
    };

    const handleCloseModal = () => {
        setTransferModal(null);
    };

    if (loading) {
        return <div className="p-4 text-white">Loading...</div>;
    }

    if (error) {
        return <div className="p-4 text-red-500">{error}</div>;
    }

    if (!tripData) {
        return <div className="p-4 text-white">Trip not found</div>;
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="sticky flex top-0 bg-black border-b border-neutral-800 p-4 z-10">
                <div className="flex items-center gap-3">
                    <RouteBadge routeId={tripData.route.id} color={tripData.route.color} />
                    <div>
                        <h1 className="text-xl font-bold">Trip {tripData.id.split('_')[0]}</h1>
                        <p className="text-sm text-neutral-400">
                            {tripData.stopTimes.length > 0 &&
                                `To ${tripData.stopTimes[tripData.stopTimes.length - 1].stop.name}`}
                        </p>
                    </div>
                </div>
                <Link href={`/stations/${activeStation}`} className="ml-auto mt-2.5 mr-2 font-medium text-xl">
                    &lt; Back
                </Link>
            </div>

            <div className="p-4">
                <TripTimeline
                    tripData={tripData}
                    currentTime={currentTime}
                    activeStation={activeStation}
                    showTransferIcons={true}
                    onTransferClick={handleTransferClick}
                />
            </div>

            {transferModal && (
                <TransferModal
                    isOpen={transferModal.isOpen}
                    onClose={handleCloseModal}
                    stationName={transferModal.stationName}
                    stopId={transferModal.stopId}
                    currentRouteId={tripData.route.id}
                    currentTripId={tripData.id}
                    arrivalTime={transferModal.arrivalTime}
                />
            )}
        </div>
    );
}
