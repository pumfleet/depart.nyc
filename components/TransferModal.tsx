'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import RouteBadge from '@/components/RouteBadge';
import { fetchStation } from '@/lib/api';
import { StopTime, StationResponse, Transfer } from '@/lib/types';
import { getLineColor } from '@/lib/colors';

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    stationName: string;
    stopId: string;
    currentRouteId: string;
    currentTripId: string;
    arrivalTime: number;
}

interface TransferLineOption {
    line: string;
    stationId: string;
    stationName: string;
    color: string;
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
    const [transferOptions, setTransferOptions] = useState<TransferLineOption[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;

        const loadTransferOptions = async () => {
            setLoading(true);

            try {
                // Strip N/S suffix to get base station ID
                const baseStopId = stopId.replace(/[NS]$/, '');

                // Fetch the current station to get its transfers
                const stationData: StationResponse = await fetchStation(baseStopId);

                // Collect all station IDs to check for transfers
                // 1. The current station itself (for lines at this platform)
                // 2. All connected transfer stations from the API
                const stationIds = new Set<string>();
                stationIds.add(baseStopId);

                // Add transfer stations from the API
                if (stationData.transfers) {
                    stationData.transfers.forEach((transfer: Transfer) => {
                        if (transfer.toStop?.id) {
                            // Strip N/S suffix from transfer station IDs too
                            const transferId = transfer.toStop.id.replace(/[NS]$/, '');
                            stationIds.add(transferId);
                        }
                    });
                }

                // Fetch all connected stations in parallel
                const stationPromises = Array.from(stationIds).map(async (stationId) => {
                    try {
                        const data = await fetchStation(stationId);
                        return { stationId, data };
                    } catch (error) {
                        console.error(`Failed to fetch station ${stationId}:`, error);
                        return null;
                    }
                });

                const stationResults = await Promise.all(stationPromises);

                // Collect all available lines from all stations
                const lineMap = new Map<string, { stationId: string; stationName: string; departures: StopTime[] }>();

                stationResults.forEach((result) => {
                    if (!result?.data) return;

                    const { stationId, data } = result;

                    // Get all lines from service maps
                    data.serviceMaps?.forEach((serviceMap) => {
                        serviceMap.routes?.forEach((route) => {
                            // Skip the current line
                            if (route.id === currentRouteId) return;

                            // Find departures for this line (require at least 15 sec transfer time)
                            const minTransferTime = 15; // 15 seconds minimum for cross-platform
                            const departures = data.stopTimes.filter((st: StopTime) => {
                                const depTime = parseInt(st.departure?.time || st.arrival.time);
                                return st.trip.route.id === route.id && depTime >= arrivalTime + minTransferTime;
                            });

                            // Only add if we have departures, or update if this station has more
                            const existing = lineMap.get(route.id);
                            if (!existing || departures.length > existing.departures.length) {
                                lineMap.set(route.id, {
                                    stationId,
                                    stationName: data.name,
                                    departures
                                });
                            }
                        });
                    });
                });

                // Convert to options array
                const options: TransferLineOption[] = Array.from(lineMap.entries()).map(([line, info]) => {
                    const sortedDepartures = info.departures.sort((a, b) =>
                        parseInt(a.arrival.time) - parseInt(b.arrival.time)
                    );

                    return {
                        line,
                        stationId: info.stationId,
                        stationName: info.stationName,
                        color: getLineColor(line),
                        nextDeparture: sortedDepartures[0] || null,
                        loading: false
                    };
                });

                // Sort by line ID for consistent ordering
                options.sort((a, b) => a.line.localeCompare(b.line));

                setTransferOptions(options);
            } catch (error) {
                console.error('Failed to load transfer options:', error);
                setTransferOptions([]);
            } finally {
                setLoading(false);
            }
        };

        loadTransferOptions();
    }, [isOpen, stopId, currentRouteId, arrivalTime]);

    const handleSelectTransfer = (option: TransferLineOption) => {
        if (!option.nextDeparture) return;

        const transferTripId = option.nextDeparture.trip.id;
        // Pass both station names - arrival (on current trip) and departure (on transfer trip)
        const params = new URLSearchParams({
            arrivalStation: stationName,
            departureStation: option.stationName
        });
        router.push(`/transfer/${currentTripId}/${transferTripId}?${params.toString()}`);
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
                                    disabled={!option.nextDeparture}
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
                                        {option.nextDeparture ? (
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
