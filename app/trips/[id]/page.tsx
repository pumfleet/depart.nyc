'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dayjs from 'dayjs';
import RouteBadge from '@/components/RouteBadge';
import TripTimeline from '@/components/TripTimeline';
import TransferModal from '@/components/TransferModal';
import OfflineIndicator from '@/components/OfflineIndicator';
import { useTrip } from '@/lib/hooks/useTrip';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function TripPage() {
    const { id } = useParams();
    const { trip, isLoading, error } = useTrip(id as string);
    const [activeStation, setActiveStation] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(dayjs());

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

    if (isLoading && !trip) {
        return <div className="p-4 text-white">Loading...</div>;
    }

    if (error && !trip) {
        return <div className="p-4 text-red-500">Failed to fetch trip data</div>;
    }

    if (!trip) {
        return <div className="p-4 text-white">Trip not found</div>;
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <OfflineIndicator />
            <div className="sticky flex top-0 bg-black border-b-2 border-neutral-800 p-4 z-50">
                <div className="flex items-center">
                    <Link href={"/stations/" + activeStation} className="flex items-center justify-center w-8 h-8 text-neutral-400 hover:text-white">
                        <ChevronLeft className="w-8 h-8 -ml-4" />
                    </Link>
                    <RouteBadge routeId={trip.route.id} color={trip.route.color} />
                    <div className="ml-4">
                        <h1 className="text-xl font-bold">Trip {trip.id.split('_')[0]}</h1>
                        <p className="text-sm text-neutral-400">
                            {trip.stopTimes.length > 0 &&
                                `To ${trip.stopTimes[trip.stopTimes.length - 1].stop.name}`}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4">
                <TripTimeline
                    tripData={trip}
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
                    currentRouteId={trip.route.id}
                    currentTripId={trip.id}
                    arrivalTime={transferModal.arrivalTime}
                />
            )}
        </div>
    );
}
