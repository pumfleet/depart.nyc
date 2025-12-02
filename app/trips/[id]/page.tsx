'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dayjs from 'dayjs';
import RouteBadge from '@/components/RouteBadge';
import { fetchTrip } from '@/lib/api';

interface TripStopTime {
    stop: {
        id: string;
        name: string;
        resource: { path: string };
        system: { id: string; resource: { path: string } };
    };
    arrival: { time: string };
    departure: { time: string };
    future: boolean;
    stopSequence: number;
    track: string;
}

interface TripData {
    id: string;
    route: {
        id: string;
        color: string;
        resource: { path: string };
        system: { id: string; resource: { path: string } };
    };
    directionId: boolean;
    stopTimes: TripStopTime[];
}

export default function TripPage() {
    const { id } = useParams();
    const [tripData, setTripData] = useState<TripData | null>(null);
    const [activeStation, setActiveStation] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(dayjs());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const getCurrentPosition = (): { currentStopIndex: number; progress: number } | null => {
        if (!tripData || !tripData.stopTimes.length) return null;

        const now = currentTime.unix();
        const stops = tripData.stopTimes;

        // Find the last departed stop and next future stop
        let lastDepartedIndex = -1;
        let nextArrivalIndex = -1;

        for (let i = 0; i < stops.length; i++) {
            const departureTime = parseInt(stops[i].departure?.time || stops[i].arrival.time);
            const arrivalTime = parseInt(stops[i].arrival.time);

            if (departureTime <= now) {
                lastDepartedIndex = i;
            }

            if (arrivalTime > now && nextArrivalIndex === -1) {
                nextArrivalIndex = i;
            }
        }

        // If train hasn't started yet
        if (lastDepartedIndex === -1) {
            return { currentStopIndex: -1, progress: 0 };
        }

        // If train has passed all stops
        if (nextArrivalIndex === -1) {
            return { currentStopIndex: stops.length - 1, progress: 100 };
        }

        // Calculate progress between stops
        if (lastDepartedIndex !== -1 && nextArrivalIndex !== -1 && lastDepartedIndex < nextArrivalIndex) {
            const lastDeparture = parseInt(stops[lastDepartedIndex].departure?.time || stops[lastDepartedIndex].arrival.time);
            const nextArrival = parseInt(stops[nextArrivalIndex].arrival.time);
            const totalJourneyTime = nextArrival - lastDeparture;
            const elapsedTime = now - lastDeparture;
            const progress = Math.min(100, Math.max(0, (elapsedTime / totalJourneyTime) * 100));

            return { currentStopIndex: lastDepartedIndex, progress };
        }

        return { currentStopIndex: lastDepartedIndex, progress: 0 };
    };

    const formatTime = (timestamp: string) => {
        return dayjs.unix(parseInt(timestamp)).format('h:mm A');
    };

    const formatCountdown = (timestamp: string) => {
        const time = dayjs.unix(parseInt(timestamp));
        const totalSeconds = time.diff(currentTime, 'second');

        if (totalSeconds < 0) return 'Departed';

        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

    const position = getCurrentPosition();

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="sticky top-0 bg-black border-b border-neutral-800 p-4 z-10">
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
            </div>

            <div className="p-4">
                <div className="relative">
                    {/* Vertical line for the route */}
                    <div className="absolute left-8 top-0 bottom-0 w-1 bg-neutral-700"></div>

                    {tripData.stopTimes.map((stopTime, index) => {
                        const isDeparted = position && index <= position.currentStopIndex;
                        const isNext = position && index === position.currentStopIndex + 1;
                        const isActive = activeStation &&
                            (stopTime.stop.id === activeStation ||
                             stopTime.stop.id.replace(/[NS]$/, '') === activeStation.replace(/[NS]$/, ''));

                        return (
                            <div key={`${stopTime.stop.id}-${index}`} className="relative">
                                {/* Progress bar between stops */}
                                {position && index === position.currentStopIndex + 1 && position.progress > 0 && (
                                    <div
                                        className="absolute left-8 w-1 bg-gradient-to-b from-blue-500 to-neutral-700"
                                        style={{
                                            top: '-40px',
                                            height: '40px',
                                            background: `linear-gradient(to bottom, #3b82f6 ${position.progress}%, #404040 ${position.progress}%)`
                                        }}
                                    />
                                )}

                                {/* Train position indicator */}
                                {position && index === position.currentStopIndex && position.progress > 0 && position.progress < 100 && (
                                    <div
                                        className="absolute left-5 w-7 h-7 bg-blue-500 rounded-full border-2 border-white z-20 animate-pulse"
                                        style={{
                                            top: `${40 * (position.progress / 100)}px`,
                                            transition: 'top 1s linear'
                                        }}
                                    >
                                        <div className="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-75"></div>
                                    </div>
                                )}

                                <div className={`flex items-start mb-10 ${isActive ? 'bg-neutral-900 -mx-4 px-4 py-2 rounded-lg' : ''}`}>
                                    {/* Stop indicator */}
                                    <div className={`relative z-10 w-5 h-5 mt-1 mr-4 rounded-full border-2 ${
                                        isDeparted ? 'bg-blue-500 border-blue-500' :
                                        isNext ? 'bg-black border-yellow-500 animate-pulse' :
                                        'bg-black border-neutral-600'
                                    }`}>
                                        {isActive && (
                                            <div className="absolute -top-1 -left-1 -right-1 -bottom-1 border-2 border-white rounded-full"></div>
                                        )}
                                    </div>

                                    {/* Stop information */}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className={`font-semibold ${isActive ? 'text-yellow-400' : 'text-white'}`}>
                                                    {stopTime.stop.name}
                                                    {isActive && <span className="ml-2 text-xs bg-yellow-600 px-2 py-1 rounded">Your Station</span>}
                                                </h3>
                                                <div className="flex gap-4 mt-1 text-sm text-neutral-400">
                                                    <span>Track {stopTime.track}</span>
                                                    {stopTime.departure && stopTime.departure.time !== stopTime.arrival.time && (
                                                        <>
                                                            <span>Arr: {formatTime(stopTime.arrival.time)}</span>
                                                            <span>Dep: {formatTime(stopTime.departure.time)}</span>
                                                        </>
                                                    )}
                                                    {(!stopTime.departure || stopTime.departure.time === stopTime.arrival.time) && (
                                                        <span>{formatTime(stopTime.arrival.time)}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {isDeparted ? (
                                                    <span className="text-sm text-neutral-500">Departed</span>
                                                ) : (
                                                    <div>
                                                        <div className="text-lg font-mono font-bold text-yellow-400">
                                                            {formatCountdown(stopTime.arrival.time)}
                                                        </div>
                                                        <div className="text-xs text-neutral-500">until arrival</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}