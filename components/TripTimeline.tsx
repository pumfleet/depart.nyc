'use client';

import React from 'react';
import dayjs from 'dayjs';
import { ArrowRightLeft } from 'lucide-react';
import { getCurrentPosition, TripStopTime } from '@/lib/transfer-utils';
import { hasTransfersFromStopId, getCanonicalStationName } from '@/lib/station-lookup';

export interface TripData {
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

interface TripTimelineProps {
    tripData: TripData;
    currentTime: dayjs.Dayjs;
    activeStation?: string | null;
    highlightStation?: string;
    compact?: boolean;
    mini?: boolean; // Even more compact for mobile side-by-side view
    showTransferIcons?: boolean;
    onTransferClick?: (stationName: string, stopId: string, arrivalTime: number) => void;
}

export default function TripTimeline({
    tripData,
    currentTime,
    activeStation,
    highlightStation,
    compact = false,
    mini = false,
    showTransferIcons = false,
    onTransferClick
}: TripTimelineProps) {
    // Mini mode implies compact
    const isCompact = compact || mini;
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

    const position = getCurrentPosition(tripData.stopTimes, currentTime.unix());

    // Calculate which stops to show
    const getVisibleStops = () => {
        if (!position || !tripData) return tripData.stopTimes;

        const currentIdx = position.currentStopIndex;

        // In mini mode, show 1 stop before current + all future stops
        if (mini) {
            const startIdx = Math.max(0, currentIdx - 1);
            return tripData.stopTimes.slice(startIdx);
        }

        // Default: 2 before current position + all future stops
        const startIdx = Math.max(0, currentIdx - 2);
        return tripData.stopTimes.slice(startIdx);
    };

    const visibleStops = getVisibleStops();
    const hiddenStopsCount = tripData.stopTimes.indexOf(visibleStops[0]);

    return (
        <div className="relative">
            {/* Indicator for hidden stops */}
            {hiddenStopsCount > 0 && (
                <div className={`mb-2 text-neutral-500 italic ${mini ? 'text-[10px]' : isCompact ? 'text-xs' : 'text-sm'}`}>
                    {hiddenStopsCount} earlier {hiddenStopsCount === 1 ? 'stop' : 'stops'}
                </div>
            )}

            {visibleStops.map((stopTime, visibleIndex) => {
                // Get the actual index in the full array
                const index = tripData.stopTimes.indexOf(stopTime);
                const isDeparted = position && index <= position.currentStopIndex;
                const isNext = position && index === position.currentStopIndex + 1;
                const isActive = activeStation &&
                    (stopTime.stop.id === activeStation ||
                        stopTime.stop.id.replace(/[NS]$/, '') === activeStation.replace(/[NS]$/, ''));
                const isHighlighted = highlightStation && stopTime.stop.name === highlightStation;

                // Calculate if this is where we show the train between stops
                const showTrainBetweenStops = position &&
                    index === position.currentStopIndex + 1 &&
                    position.progress > 0 &&
                    position.progress < 100;

                // Determine if we need to show a connecting line before this stop
                const showConnectingLine = visibleIndex > 0;
                const isPreviousDeparted = position && (index - 1) <= position.currentStopIndex;

                // Check if this station has transfer options (use stop ID for reliable lookup)
                const showTransfer = showTransferIcons &&
                    !isDeparted &&
                    hasTransfersFromStopId(stopTime.stop.id, tripData.route.id);

                // Get the canonical station name from our data
                const canonicalName = getCanonicalStationName(stopTime.stop.id) || stopTime.stop.name;

                return (
                    <div key={`${stopTime.stop.id}-${index}`} className="relative">
                        {/* Connecting line from previous stop (static, not animated) */}
                        {showConnectingLine && !showTrainBetweenStops && (
                            <div
                                className={`absolute w-1 ${mini ? 'left-1.5' : 'left-2'}`}
                                style={{
                                    top: mini ? '-32px' : isCompact ? '-48px' : '-64px',
                                    height: mini ? '36px' : isCompact ? '52px' : '68px',
                                    backgroundColor: isPreviousDeparted ? `#${tripData.route.color}` : '#404040'
                                }}
                            />
                        )}

                        {/* Progress bar and train indicator between stops */}
                        {showTrainBetweenStops && (
                            <>
                                {/* Progress bar */}
                                <div
                                    className={`absolute w-1 ${mini ? 'left-1.5' : 'left-2'}`}
                                    style={{
                                        top: mini ? '-32px' : isCompact ? '-48px' : '-64px',
                                        height: mini ? '32px' : isCompact ? '48px' : '64px',
                                    }}
                                >
                                    {/* Completed portion (route color) */}
                                    <div
                                        className="absolute top-0 left-0 w-full"
                                        style={{
                                            height: `${position.progress}%`,
                                            backgroundColor: `#${tripData.route.color}`
                                        }}
                                    />
                                    {/* Remaining portion (gray) */}
                                    <div
                                        className="absolute left-0 w-full bg-neutral-700"
                                        style={{
                                            top: `${position.progress}%`,
                                            height: `${107 - position.progress}%`
                                        }}
                                    />
                                </div>

                                {/* Train position indicator - positioned on the progress */}
                                <div
                                    className={`absolute rounded-full border-2 border-white z-20 ${mini ? 'left-0.5 w-3 h-3' : 'left-0.5 w-4 h-4'}`}
                                    style={{
                                        top: `${(mini ? -32 : isCompact ? -48 : -64) + ((mini ? 32 : isCompact ? 48 : 64) * position.progress / 100)}px`,
                                        backgroundColor: `#${tripData.route.color}`
                                    }}
                                >
                                    <div
                                        className="absolute inset-0 rounded-full animate-ping opacity-75"
                                        style={{ backgroundColor: `#${tripData.route.color}` }}
                                    ></div>
                                </div>
                            </>
                        )}

                        <div className={`flex items-start ${visibleIndex === visibleStops.length - 1 ? '' : mini ? 'mb-4' : isCompact ? 'mb-6' : 'mb-8'} ${isActive || isHighlighted ? (mini ? '-mx-1 px-1' : '-mx-4 px-4') : ''}`}>
                            {/* Stop indicator */}
                            <div
                                className={`relative z-10 rounded-full border-2 ${mini ? 'w-4 h-4 mt-0.5 mr-2' : 'w-5 h-5 mt-1 mr-4'} ${
                                    isActive || isHighlighted ? 'border-white' :
                                    isNext ? 'bg-black animate-pulse' :
                                    !isDeparted ? 'bg-black border-neutral-600' : ''
                                }`}
                                style={
                                    isActive || isHighlighted ? {
                                        backgroundColor: isDeparted ? `#${tripData.route.color}` : 'black'
                                    } :
                                    isDeparted ? {
                                        backgroundColor: `#${tripData.route.color}`,
                                        borderColor: `#${tripData.route.color}`
                                    } :
                                    isNext ? {
                                        borderColor: `#${tripData.route.color}`
                                    } : {}
                                }>
                                {(isActive || isHighlighted) && (
                                    <div className="absolute -top-1 -left-1 -right-1 -bottom-1 rounded-full"></div>
                                )}
                            </div>

                            {/* Stop information */}
                            <div className="flex-1 min-w-0">
                                <div className={`flex justify-between items-start ${mini ? 'gap-1' : 'gap-2'}`}>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1">
                                            <h3 className={`font-semibold truncate ${
                                                isActive || isHighlighted ? 'text-orange-500' : 'text-white'
                                            } ${mini ? 'text-xs' : isCompact ? 'text-sm' : ''}`}>
                                                {stopTime.stop.name}
                                            </h3>
                                            {showTransfer && !mini && (
                                                <button
                                                    onClick={() => onTransferClick?.(
                                                        canonicalName,
                                                        stopTime.stop.id,
                                                        parseInt(stopTime.arrival.time)
                                                    )}
                                                    className="flex-shrink-0 p-1 text-neutral-400 hover:text-orange-500 hover:bg-neutral-800 rounded transition-colors"
                                                    title="View transfer options"
                                                >
                                                    <ArrowRightLeft size={isCompact ? 14 : 16} />
                                                </button>
                                            )}
                                        </div>
                                        {!isCompact && (
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
                                        )}
                                        {isCompact && !mini && (
                                            <div className="text-xs text-neutral-400">
                                                {formatTime(stopTime.arrival.time)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        {isDeparted ? (
                                            <span className={`text-neutral-500 ${mini ? 'text-[10px]' : isCompact ? 'text-xs' : 'text-sm'}`}>Departed</span>
                                        ) : (
                                            <div>
                                                <div className={`font-mono font-bold text-neutral-300 ${mini ? 'text-xs' : isCompact ? 'text-sm' : 'text-lg'}`}>
                                                    {formatCountdown(stopTime.arrival.time)}
                                                </div>
                                                {!isCompact && (
                                                    <div className="text-xs text-neutral-500">until arrival</div>
                                                )}
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
    );
}
