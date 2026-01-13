'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import RouteBadge from '@/components/RouteBadge';
import TripTimeline, { TripData } from '@/components/TripTimeline';
import TransferWindow from '@/components/TransferWindow';
import { showTransferUpdatedToast, showNoMoreTrainsToast, showTightConnectionToast } from '@/components/TransferToast';
import { fetchTrip, fetchStation } from '@/lib/api';
import { getStationIdForLine } from '@/lib/station-lookup';
import { getCurrentPosition } from '@/lib/transfer-utils';
import { StopTime } from '@/lib/types';

export default function TransferPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const tripId = params.tripId as string;
    const transferTripId = params.transferTripId as string;
    const transferStation = searchParams.get('station') || '';

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
        const stop = currentTrip.stopTimes.find(st => st.stop.name === transferStation);
        return stop ? parseInt(stop.arrival.time) : null;
    }, [currentTrip, transferStation]);

    // Find departure time from transfer station for transfer trip
    const getDepartureTime = useCallback((): number | null => {
        if (!transferTrip) return null;
        const stop = transferTrip.stopTimes.find(st => st.stop.name === transferStation);
        return stop ? parseInt(stop.departure?.time || stop.arrival.time) : null;
    }, [transferTrip, transferStation]);

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
        if (!currentTrip || !transferStation) return;

        const position = getCurrentPosition(currentTrip.stopTimes, currentTime.unix());
        if (!position) return;

        // Find the transfer station index
        const transferStopIndex = currentTrip.stopTimes.findIndex(
            st => st.stop.name === transferStation
        );

        // If we've passed or are at the transfer station, redirect to station page
        if (transferStopIndex !== -1 && position.currentStopIndex >= transferStopIndex) {
            // Get the station ID for the transfer line
            const stationId = getStationIdForLine(transferStation, transferTrip?.route.id || '');
            if (stationId) {
                // Store the active station for navigation
                localStorage.setItem('activeStation', stationId);
                router.push(`/stations/${stationId}`);
            }
        }
    }, [currentTrip, transferTrip, transferStation, currentTime, router]);

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
        const stationId = getStationIdForLine(transferStation, transferRouteId);

        if (!stationId) {
            isUpdatingTransfer.current = false;
            return;
        }

        try {
            const stationData = await fetchStation(stationId);

            // Find the next train on this route after our arrival
            const nextTrains = stationData.stopTimes
                .filter((st: StopTime) => {
                    const depTime = parseInt(st.departure?.time || st.arrival.time);
                    return st.trip.route.id === transferRouteId &&
                        depTime > arrivalTime &&
                        st.trip.id !== transferTripId; // Exclude current transfer trip
                })
                .sort((a: StopTime, b: StopTime) =>
                    parseInt(a.arrival.time) - parseInt(b.arrival.time)
                );

            if (nextTrains.length > 0) {
                const nextTrain = nextTrains[0];
                const newTime = dayjs.unix(parseInt(nextTrain.departure?.time || nextTrain.arrival.time)).format('h:mm A');

                showTransferUpdatedToast(transferRouteId, newTime);

                // Navigate to the new transfer
                router.replace(`/transfer/${tripId}/${nextTrain.trip.id}?station=${encodeURIComponent(transferStation)}`);
            } else {
                showNoMoreTrainsToast(transferRouteId);
            }
        } catch (err) {
            console.error('Failed to find next train:', err);
        } finally {
            isUpdatingTransfer.current = false;
        }
    }, [transferTrip, currentTrip, transferStation, tripId, transferTripId, router, getArrivalTime]);

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
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-neutral-400">Loading transfer information...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    if (!currentTrip || !transferTrip) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-neutral-400">Trip not found</div>
            </div>
        );
    }

    const arrivalTime = getArrivalTime();
    const departureTime = getDepartureTime();

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <div className="sticky top-0 bg-black border-b border-neutral-800 p-4 z-10">
                <div className="flex items-center justify-between">
                    <Link href={`/trips/${tripId}`} className="flex items-center gap-2 text-neutral-400 hover:text-white">
                        <ArrowLeft size={20} />
                        <span>Back</span>
                    </Link>
                    <div className="text-center">
                        <h1 className="text-lg font-semibold">Transfer</h1>
                        <p className="text-sm text-orange-500">{transferStation}</p>
                    </div>
                    <div className="w-16" /> {/* Spacer for centering */}
                </div>
            </div>

            {/* Transfer Window */}
            {arrivalTime && departureTime && (
                <div className="p-4 border-b border-neutral-800">
                    <TransferWindow
                        arrivalTime={arrivalTime}
                        departureTime={departureTime}
                        currentTime={currentTime}
                        onTransferMissed={handleTransferMissed}
                        onTightConnection={handleTightConnection}
                    />
                </div>
            )}

            {/* Split View */}
            <div className="flex flex-col lg:flex-row">
                {/* Current Trip */}
                <div className="flex-1 border-b lg:border-b-0 lg:border-r border-neutral-800">
                    <div className="sticky top-[73px] bg-black border-b border-neutral-800 p-3">
                        <div className="flex items-center gap-2">
                            <RouteBadge routeId={currentTrip.route.id} color={currentTrip.route.color} size="small" />
                            <span className="text-sm font-medium">Your Train</span>
                            <ArrowRight size={14} className="text-neutral-500 ml-auto" />
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                            To {currentTrip.stopTimes[currentTrip.stopTimes.length - 1]?.stop.name}
                        </p>
                    </div>
                    <div className="p-4">
                        <TripTimeline
                            tripData={currentTrip}
                            currentTime={currentTime}
                            highlightStation={transferStation}
                            compact={true}
                        />
                    </div>
                </div>

                {/* Transfer Trip */}
                <div className="flex-1">
                    <div className="sticky top-[73px] bg-black border-b border-neutral-800 p-3">
                        <div className="flex items-center gap-2">
                            <ArrowRight size={14} className="text-neutral-500" />
                            <RouteBadge routeId={transferTrip.route.id} color={transferTrip.route.color} size="small" />
                            <span className="text-sm font-medium">Transfer Train</span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                            To {transferTrip.stopTimes[transferTrip.stopTimes.length - 1]?.stop.name}
                        </p>
                    </div>
                    <div className="p-4">
                        <TripTimeline
                            tripData={transferTrip}
                            currentTime={currentTime}
                            highlightStation={transferStation}
                            compact={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
