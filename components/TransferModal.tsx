'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2 } from 'lucide-react';
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

interface DirectionOption {
    headsign: string;
    stationId: string;
    stationName: string;
    nextDeparture: StopTime;
    waitMinutes: number;
}

interface GroupedLineOption {
    line: string;
    color: string;
    directions: DirectionOption[];
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
    const [groupedOptions, setGroupedOptions] = useState<GroupedLineOption[]>([]);
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
                const stationIds = new Set<string>();
                stationIds.add(baseStopId);

                // Add transfer stations from the API
                if (stationData.transfers) {
                    stationData.transfers.forEach((transfer: Transfer) => {
                        if (transfer.toStop?.id) {
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

                // Collect all available lines, grouped by route AND direction
                const lineMap = new Map<string, { stationId: string; stationName: string; line: string; headsign: string; departures: StopTime[] }>();

                stationResults.forEach((result) => {
                    if (!result?.data) return;

                    const { stationId, data } = result;

                    data.serviceMaps?.forEach((serviceMap) => {
                        serviceMap.routes?.forEach((route) => {
                            if (route.id === currentRouteId) return;

                            const minTransferTime = 15;
                            const departures = data.stopTimes.filter((st: StopTime) => {
                                const depTime = parseInt(st.departure?.time || st.arrival.time);
                                return st.trip.route.id === route.id && depTime >= arrivalTime + minTransferTime;
                            });

                            // Group departures by headsign (direction)
                            const departuresByHeadsign = new Map<string, StopTime[]>();
                            departures.forEach((dep: StopTime) => {
                                const headsign = dep.headsign || 'Unknown';
                                const existing = departuresByHeadsign.get(headsign) || [];
                                existing.push(dep);
                                departuresByHeadsign.set(headsign, existing);
                            });

                            departuresByHeadsign.forEach((directionDepartures, headsign) => {
                                const key = `${route.id}|${headsign}`;
                                const existing = lineMap.get(key);

                                if (!existing || directionDepartures.length > existing.departures.length) {
                                    lineMap.set(key, {
                                        stationId,
                                        stationName: data.name,
                                        line: route.id,
                                        headsign,
                                        departures: directionDepartures
                                    });
                                }
                            });
                        });
                    });
                });

                // Group by line
                const lineGroups = new Map<string, DirectionOption[]>();

                lineMap.forEach((info) => {
                    const sortedDepartures = info.departures.sort((a, b) =>
                        parseInt(a.arrival.time) - parseInt(b.arrival.time)
                    );

                    const nextDep = sortedDepartures[0];
                    if (!nextDep) return;

                    const depTime = parseInt(nextDep.departure?.time || nextDep.arrival.time);
                    const waitSeconds = depTime - arrivalTime;
                    const waitMinutes = Math.max(0, Math.floor(waitSeconds / 60));

                    const direction: DirectionOption = {
                        headsign: info.headsign,
                        stationId: info.stationId,
                        stationName: info.stationName,
                        nextDeparture: nextDep,
                        waitMinutes
                    };

                    const existing = lineGroups.get(info.line) || [];
                    existing.push(direction);
                    lineGroups.set(info.line, existing);
                });

                // Convert to array and sort
                const grouped: GroupedLineOption[] = Array.from(lineGroups.entries()).map(([line, directions]) => ({
                    line,
                    color: getLineColor(line),
                    directions: directions.sort((a, b) => a.headsign.localeCompare(b.headsign))
                }));

                // Sort lines: numbers first, then letters
                grouped.sort((a, b) => {
                    const aNum = parseInt(a.line);
                    const bNum = parseInt(b.line);
                    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
                    if (!isNaN(aNum)) return -1;
                    if (!isNaN(bNum)) return 1;
                    return a.line.localeCompare(b.line);
                });

                setGroupedOptions(grouped);
            } catch (error) {
                console.error('Failed to load transfer options:', error);
                setGroupedOptions([]);
            } finally {
                setLoading(false);
            }
        };

        loadTransferOptions();
    }, [isOpen, stopId, currentRouteId, arrivalTime]);

    const handleSelectTransfer = (direction: DirectionOption) => {
        const transferTripId = direction.nextDeparture.trip.id;
        const params = new URLSearchParams({
            arrivalStation: stationName,
            departureStation: direction.stationName
        });
        router.push(`/transfer/${currentTripId}/${transferTripId}?${params.toString()}`);
        onClose();
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
            <div className="relative bg-neutral-900 w-full sm:w-[480px] sm:rounded-lg max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="sticky top-0 bg-neutral-900 border-b-2 border-neutral-800 p-4 flex items-center justify-between">
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
                    ) : groupedOptions.length === 0 ? (
                        <p className="text-neutral-500 text-center py-8">
                            No transfer options available at this station.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {groupedOptions.map((group) => (
                                <div
                                    key={group.line}
                                    className="flex items-center gap-3"
                                >
                                    {/* Line badge */}
                                    <div className="flex-shrink-0">
                                        <RouteBadge
                                            routeId={group.line}
                                            color={group.color}
                                            size="small"
                                        />
                                    </div>

                                    {/* Direction buttons - grid ensures equal width columns */}
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                        {group.directions.map((direction) => (
                                            <button
                                                key={direction.headsign}
                                                onClick={() => handleSelectTransfer(direction)}
                                                className="bg-neutral-800 hover:bg-neutral-700 rounded-lg px-3 py-2 text-left transition-colors min-w-0"
                                            >
                                                <div className="text-white text-sm font-medium truncate">
                                                    {direction.headsign}
                                                </div>
                                                <div className="text-neutral-400 text-xs">
                                                    Departs in {direction.waitMinutes < 1 ? '<1' : direction.waitMinutes} min
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
