'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dayjs from 'dayjs';
import RouteBadge from '@/components/RouteBadge';
import TripTimeline from '@/components/TripTimeline';
import TransferModal from '@/components/TransferModal';
import OfflineIndicator from '@/components/OfflineIndicator';
import Loading from '@/components/Loading';
import ErrorScreen from '@/components/ErrorScreen';
import { useTrip } from '@/lib/hooks/useTrip';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getTrainCars } from '@/lib/colors';

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
        return <Loading />;
    }

    if (error && !trip) {
        return <ErrorScreen message="Failed to load trip" />;
    }

    if (!trip) {
        return <ErrorScreen message="Trip not found" />;
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
                        <h1 className="text-xl font-bold">{trip.stopTimes.length > 0 && trip.stopTimes[trip.stopTimes.length - 1].stop.name}</h1>
                        <p className="text-sm text-neutral-400">
                            {getTrainCars(trip.route.id)} cars
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
