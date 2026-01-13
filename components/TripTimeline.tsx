'use client';

import React from 'react';
import dayjs from 'dayjs';
import { ArrowRightLeft } from 'lucide-react';
import { getCurrentPosition, TripStopTime } from '@/lib/transfer-utils';
import { hasTransfers } from '@/lib/station-lookup';

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
    showTransferIcons?: boolean;
    onTransferClick?: (stationName: string, arrivalTime: number) => void;
}

export default function TripTimeline({
    tripData,
    currentTime,
    activeStation,
    highlightStation,
    compact = false,
    showTransferIcons = false,
    onTransferClick
}: TripTimelineProps) {
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

    // Calculate which stops to show (3 before current position + all future stops)
    const getVisibleStops = () => {
        if (!position || !tripData) return tripData.stopTimes;

        const currentIdx = position.currentStopIndex;
        const startIdx = Math.max(0, currentIdx - 2);

        return tripData.stopTimes.slice(startIdx);
    };

    const visibleStops = getVisibleStops();
    const hiddenStopsCount = tripData.stopTimes.length - visibleStops.length;

    return (
        <div className="relative">
            {/* Indicator for hidden stops */}
            {hiddenStopsCount > 0 && (
                <div className={`mb-4 text-sm text-neutral-500 italic ${compact ? 'text-xs' : ''}`}>
                    {hiddenStopsCount} earlier {hiddenStopsCount === 1 ? 'stop' : 'stops'} hidden
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

                // Check if this station has transfer options
                const showTransfer = showTransferIcons &&
                    !isDeparted &&
                    hasTransfers(stopTime.stop.name, tripData.route.id);

                return (
                    <div key={`${stopTime.stop.id}-${index}`} className="relative">
                        {/* Connecting line from previous stop (static, not animated) */}
                        {showConnectingLine && !showTrainBetweenStops && (
                            <div
                                className="absolute left-2 w-1"
                                style={{
                                    top: compact ? '-48px' : '-64px',
                                    height: compact ? '52px' : '68px',
                                    backgroundColor: isPreviousDeparted ? `#${tripData.route.color}` : '#404040'
                                }}
                            />
                        )}

                        {/* Progress bar and train indicator between stops */}
                        {showTrainBetweenStops && (
                            <>
                                {/* Progress bar */}
                                <div
                                    className="absolute left-2 w-1"
                                    style={{
                                        top: compact ? '-48px' : '-64px',
                                        height: compact ? '48px' : '64px',
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
                                    className="absolute left-0.5 w-4 h-4 rounded-full border-2 border-white z-20"
                                    style={{
                                        top: `${(compact ? -48 : -64) + ((compact ? 48 : 64) * position.progress / 100)}px`,
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

                        <div className={`flex items-start ${visibleIndex === visibleStops.length - 1 ? '' : compact ? 'mb-6' : 'mb-8'} ${isActive || isHighlighted ? '-mx-4 px-4' : ''}`}>
                            {/* Stop indicator */}
                            <div
                                className={`relative z-10 w-5 h-5 mt-1 mr-4 rounded-full border-2 ${
                                    isActive || isHighlighted ? 'border-orange-500' :
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
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className={`font-semibold truncate ${
                                                isActive || isHighlighted ? 'text-orange-500' : 'text-white'
                                            } ${compact ? 'text-sm' : ''}`}>
                                                {stopTime.stop.name}
                                            </h3>
                                            {showTransfer && (
                                                <button
                                                    onClick={() => onTransferClick?.(
                                                        stopTime.stop.name,
                                                        parseInt(stopTime.arrival.time)
                                                    )}
                                                    className="flex-shrink-0 p-1 text-neutral-400 hover:text-orange-500 hover:bg-neutral-800 rounded transition-colors"
                                                    title="View transfer options"
                                                >
                                                    <ArrowRightLeft size={compact ? 14 : 16} />
                                                </button>
                                            )}
                                        </div>
                                        {!compact && (
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
                                        {compact && (
                                            <div className="text-xs text-neutral-400">
                                                {formatTime(stopTime.arrival.time)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        {isDeparted ? (
                                            <span className={`text-neutral-500 ${compact ? 'text-xs' : 'text-sm'}`}>Departed</span>
                                        ) : (
                                            <div>
                                                <div className={`font-mono font-bold text-neutral-300 ${compact ? 'text-sm' : 'text-lg'}`}>
                                                    {formatCountdown(stopTime.arrival.time)}
                                                </div>
                                                {!compact && (
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
