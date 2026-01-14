'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { ChevronLeft } from 'lucide-react';
import Loading from '@/components/Loading';
import ErrorScreen from '@/components/ErrorScreen';
import Link from 'next/link';
import RouteBadge from '@/components/RouteBadge';
import TripTimeline, { TripData } from '@/components/TripTimeline';
import TransferWindow from '@/components/TransferWindow';
import { showTransferUpdatedToast, showNoMoreTrainsToast, showTightConnectionToast, showArrivedAtStationToast } from '@/components/TransferToast';
import { fetchTrip, fetchStation } from '@/lib/api';
import { getStationIdForLine } from '@/lib/station-lookup';
import { getCurrentPosition } from '@/lib/transfer-utils';
import { StopTime } from '@/lib/types';
import { getTrainCars } from '@/lib/colors';

export default function TransferPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const tripId = params.tripId as string;
    const transferTripId = params.transferTripId as string;
    // Support both old format (station) and new format (arrivalStation/departureStation)
    const arrivalStation = searchParams.get('arrivalStation') || searchParams.get('station') || '';
    const departureStation = searchParams.get('departureStation') || searchParams.get('station') || '';

    const [currentTrip, setCurrentTrip] = useState<TripData | null>(null);
    const [transferTrip, setTransferTrip] = useState<TripData | null>(null);
    const [currentTime, setCurrentTime] = useState(dayjs());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const hasShownTightToast = useRef(false);
    const isUpdatingTransfer = useRef(false);

    // Find arrival time at transfer station for current trip
    const getArrivalTime = useCallback((): number | null => {
        if (!currentTrip) return null;
        const stop = currentTrip.stopTimes.find(st => st.stop.name === arrivalStation);
        return stop ? parseInt(stop.arrival.time) : null;
    }, [currentTrip, arrivalStation]);

    // Find departure time from transfer station for transfer trip
    const getDepartureTime = useCallback((): number | null => {
        if (!transferTrip) return null;
        const stop = transferTrip.stopTimes.find(st => st.stop.name === departureStation);
        return stop ? parseInt(stop.departure?.time || stop.arrival.time) : null;
    }, [transferTrip, departureStation]);

    // Fetch trip data
    useEffect(() => {
        if (!tripId || !transferTripId) return;

        const fetchData = async () => {
            try {
                const [currentData, transferData] = await Promise.all([
                    fetchTrip(tripId),
                    fetchTrip(transferTripId)
                ]);

                setCurrentTrip(currentData);
                setTransferTrip(transferData);
                setError(null);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch trip data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Poll every 5 seconds
        const intervalId = setInterval(fetchData, 5000);

        return () => clearInterval(intervalId);
    }, [tripId, transferTripId]);

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(dayjs());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Check if we've arrived at the transfer station
    useEffect(() => {
        if (!currentTrip || !arrivalStation) return;

        const position = getCurrentPosition(currentTrip.stopTimes, currentTime.unix());
        if (!position) return;

        // Find the transfer station index (using arrival station name from current trip)
        const transferStopIndex = currentTrip.stopTimes.findIndex(
            st => st.stop.name === arrivalStation
        );

        // If we've passed or are at the transfer station, redirect to station page
        if (transferStopIndex !== -1 && position.currentStopIndex >= transferStopIndex) {
            // Get the station ID for the transfer line (using departure station name)
            const transferRouteId = transferTrip?.route.id || '';
            const stationId = getStationIdForLine(departureStation, transferRouteId);
            if (stationId) {
                // Show toast with arrival notification
                showArrivedAtStationToast(arrivalStation, transferRouteId);
                // Store the active station for navigation
                localStorage.setItem('activeStation', stationId);
                router.push(`/stations/${stationId}`);
            }
        }
    }, [currentTrip, transferTrip, arrivalStation, departureStation, currentTime, router]);

    // Handle transfer missed - find next train
    const handleTransferMissed = useCallback(async () => {
        if (isUpdatingTransfer.current || !transferTrip || !currentTrip) return;
        isUpdatingTransfer.current = true;

        const arrivalTime = getArrivalTime();
        if (!arrivalTime) {
            isUpdatingTransfer.current = false;
            return;
        }

        const transferRouteId = transferTrip.route.id;
        const stationId = getStationIdForLine(departureStation, transferRouteId);

        if (!stationId) {
            isUpdatingTransfer.current = false;
            return;
        }

        try {
            const stationData = await fetchStation(stationId);

            // Find the next train on this route after our arrival (require at least 15 sec)
            const minTransferTime = 15; // 15 seconds minimum for cross-platform
            const nextTrains = stationData.stopTimes
                .filter((st: StopTime) => {
                    const depTime = parseInt(st.departure?.time || st.arrival.time);
                    return st.trip.route.id === transferRouteId &&
                        depTime >= arrivalTime + minTransferTime &&
                        st.trip.id !== transferTripId; // Exclude current transfer trip
                })
                .sort((a: StopTime, b: StopTime) =>
                    parseInt(a.arrival.time) - parseInt(b.arrival.time)
                );

            if (nextTrains.length > 0) {
                const nextTrain = nextTrains[0];
                const newTime = dayjs.unix(parseInt(nextTrain.departure?.time || nextTrain.arrival.time)).format('h:mm A');

                showTransferUpdatedToast(transferRouteId, newTime);

                // Navigate to the new transfer (keep same station names)
                const params = new URLSearchParams({
                    arrivalStation,
                    departureStation
                });
                router.replace(`/transfer/${tripId}/${nextTrain.trip.id}?${params.toString()}`);
            } else {
                showNoMoreTrainsToast(transferRouteId);
            }
        } catch (err) {
            console.error('Failed to find next train:', err);
        } finally {
            isUpdatingTransfer.current = false;
        }
    }, [transferTrip, currentTrip, arrivalStation, departureStation, tripId, transferTripId, router, getArrivalTime]);

    // Handle tight connection warning
    const handleTightConnection = useCallback(() => {
        if (hasShownTightToast.current) return;
        hasShownTightToast.current = true;

        const arrivalTime = getArrivalTime();
        const departureTime = getDepartureTime();

        if (arrivalTime && departureTime) {
            const minutes = Math.floor((departureTime - arrivalTime) / 60);
            showTightConnectionToast(minutes);
        }
    }, [getArrivalTime, getDepartureTime]);

    if (loading) {
        return <Loading />;
    }

    if (error) {
        return <ErrorScreen message="Failed to load transfer" />;
    }

    if (!currentTrip || !transferTrip) {
        return <ErrorScreen message="Trip not found" />;
    }

    const arrivalTime = getArrivalTime();
    const departureTime = getDepartureTime();

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-black border-b-2 border-neutral-800 p-4 z-10">
                <div className="flex items-center justify-between">
                    <Link href={`/trips/${tripId}`} className="flex items-center text-neutral-400 hover:text-white">
                        <ChevronLeft className="w-8 h-8 mr-8" />
                    </Link>
                    <div className="text-center">
                        <h1 className="text-lg font-semibold">Transfer</h1>
                        <p className="text-sm text-orange-500">{arrivalStation}</p>
                    </div>
                    <div className="w-16" /> {/* Spacer for centering */}
                </div>
            </div>

            {/* Transfer Window */}
            {arrivalTime && departureTime && (
                <div className="p-4 border-b-2 border-neutral-800">
                    <TransferWindow
                        arrivalTime={arrivalTime}
                        departureTime={departureTime}
                        currentTime={currentTime}
                        onTransferMissed={handleTransferMissed}
                        onTightConnection={handleTightConnection}
                    />
                </div>
            )}

            {/* Split View - Always side by side */}
            <div className="flex flex-1">
                {/* Current Trip */}
                <div className="flex-1 border-r-2 border-neutral-800 min-w-0">
                    <div className="sticky top-[73px] bg-black border-b-2 border-neutral-800 p-2">
                        <div className="flex items-center gap-1.5">
                            <RouteBadge routeId={currentTrip.route.id} color={currentTrip.route.color} size="small" />
                            <span className="text-xs font-medium">Your Train</span>
                            <span className="text-xs text-neutral-500">{getTrainCars(currentTrip.route.id)} cars</span>
                        </div>
                        <p className="text-xs text-neutral-500 ml-7 truncate">
                            To {currentTrip.stopTimes[currentTrip.stopTimes.length - 1]?.stop.name}
                        </p>
                    </div>
                    <div className="p-2">
                        <TripTimeline
                            tripData={currentTrip}
                            currentTime={currentTime}
                            highlightStation={arrivalStation}
                            mini={true}
                        />
                    </div>
                </div>

                {/* Transfer Trip */}
                <div className="flex-1 min-w-0">
                    <div className="sticky top-[73px] bg-black border-b-2 border-neutral-800 p-2">
                        <div className="flex items-center gap-1.5">
                            <RouteBadge routeId={transferTrip.route.id} color={transferTrip.route.color} size="small" />
                            <span className="text-xs font-medium">Transfer</span>
                            <span className="text-xs text-neutral-500">{getTrainCars(transferTrip.route.id)} cars</span>
                        </div>
                        <p className="text-xs text-neutral-500 ml-7 truncate">
                            To {transferTrip.stopTimes[transferTrip.stopTimes.length - 1]?.stop.name}
                        </p>
                    </div>
                    <div className="p-2">
                        <TripTimeline
                            tripData={transferTrip}
                            currentTime={currentTime}
                            highlightStation={departureStation}
                            mini={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
