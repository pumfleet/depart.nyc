'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import RouteBadge from '@/components/RouteBadge';
import { getTransferLinesFromStopId, TransferOption } from '@/lib/station-lookup';
import { fetchStation } from '@/lib/api';
import { StopTime } from '@/lib/types';

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    stationName: string;
    stopId: string;
    currentRouteId: string;
    currentTripId: string;
    arrivalTime: number;
}

interface TransferLineWithDeparture extends TransferOption {
    nextDeparture: StopTime | null;
    loading: boolean;
}

export default function TransferModal({
    isOpen,
    onClose,
    stationName,
    stopId,
    currentRouteId,
    currentTripId,
    arrivalTime
}: TransferModalProps) {
    const router = useRouter();
    const [transferOptions, setTransferOptions] = useState<TransferLineWithDeparture[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;

        const loadTransferOptions = async () => {
            setLoading(true);

            // Get all transfer lines at this station using the stop ID for reliable lookup
            const lines = getTransferLinesFromStopId(stopId, [currentRouteId]);

            // Initialize with loading state
            const optionsWithLoading: TransferLineWithDeparture[] = lines.map(line => ({
                ...line,
                nextDeparture: null,
                loading: true
            }));
            setTransferOptions(optionsWithLoading);
            setLoading(false);

            // Fetch station data for each transfer option
            const updatedOptions = await Promise.all(
                lines.map(async (line) => {
                    try {
                        const stationData = await fetchStation(line.stationId);

                        // Find the next departure on this line after our arrival time
                        const nextDeparture = stationData.stopTimes
                            .filter((st: StopTime) => {
                                const depTime = parseInt(st.departure?.time || st.arrival.time);
                                return st.trip.route.id === line.line && depTime > arrivalTime;
                            })
                            .sort((a: StopTime, b: StopTime) =>
                                parseInt(a.arrival.time) - parseInt(b.arrival.time)
                            )[0] || null;

                        return {
                            ...line,
                            nextDeparture,
                            loading: false
                        };
                    } catch (error) {
                        console.error(`Failed to fetch station ${line.stationId}:`, error);
                        return {
                            ...line,
                            nextDeparture: null,
                            loading: false
                        };
                    }
                })
            );

            setTransferOptions(updatedOptions);
        };

        loadTransferOptions();
    }, [isOpen, stopId, currentRouteId, arrivalTime]);

    const handleSelectTransfer = (option: TransferLineWithDeparture) => {
        if (!option.nextDeparture) return;

        const transferTripId = option.nextDeparture.trip.id;
        router.push(`/transfer/${currentTripId}/${transferTripId}?station=${encodeURIComponent(stationName)}`);
        onClose();
    };

    const formatDepartureTime = (timestamp: string) => {
        return dayjs.unix(parseInt(timestamp)).format('h:mm A');
    };

    const formatWaitTime = (departureTime: string) => {
        const depTime = parseInt(departureTime);
        const waitSeconds = depTime - arrivalTime;

        if (waitSeconds < 60) return '< 1 min wait';
        const waitMinutes = Math.floor(waitSeconds / 60);
        return `${waitMinutes} min wait`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-neutral-900 w-full sm:w-96 sm:rounded-lg max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 p-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Transfer at</h2>
                        <p className="text-orange-500 font-medium">{stationName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="animate-spin text-neutral-400" size={24} />
                        </div>
                    ) : transferOptions.length === 0 ? (
                        <p className="text-neutral-500 text-center py-8">
                            No transfer options available at this station.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-sm text-neutral-500 mb-4">
                                Select a line to see connection timing
                            </p>

                            {transferOptions.map((option) => (
                                <button
                                    key={option.line}
                                    onClick={() => handleSelectTransfer(option)}
                                    disabled={option.loading || !option.nextDeparture}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                        option.nextDeparture
                                            ? 'bg-neutral-800 hover:bg-neutral-700'
                                            : 'bg-neutral-800/50 cursor-not-allowed'
                                    }`}
                                >
                                    <RouteBadge
                                        routeId={option.line}
                                        color={option.color}
                                        size="small"
                                    />

                                    <div className="flex-1 text-left">
                                        {option.loading ? (
                                            <div className="flex items-center gap-2 text-neutral-400">
                                                <Loader2 className="animate-spin" size={14} />
                                                <span className="text-sm">Loading...</span>
                                            </div>
                                        ) : option.nextDeparture ? (
                                            <>
                                                <div className="text-white text-sm font-medium">
                                                    {option.nextDeparture.headsign || 'Unknown destination'}
                                                </div>
                                                <div className="text-neutral-400 text-xs">
                                                    Departs {formatDepartureTime(option.nextDeparture.departure?.time || option.nextDeparture.arrival.time)}
                                                    {' · '}
                                                    {formatWaitTime(option.nextDeparture.departure?.time || option.nextDeparture.arrival.time)}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-neutral-500 text-sm">
                                                No upcoming trains
                                            </div>
                                        )}
                                    </div>

                                    {option.nextDeparture && (
                                        <div className="text-neutral-400 text-xs">
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
