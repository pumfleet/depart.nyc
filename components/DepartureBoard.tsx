import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useRouter } from 'next/navigation';
import RouteBadge from './RouteBadge';
import { StopTime } from '@/lib/types';

dayjs.extend(relativeTime);

interface DepartureBoardProps {
    stopTimes: StopTime[];
    limit?: number;
    grouped?: boolean;
    countdownFormat?: 'friendly' | 'exact';
}

export default function DepartureBoard({
    stopTimes,
    limit,
    grouped = true,
    countdownFormat = 'friendly'
}: DepartureBoardProps) {
    // State to track current time for real-time updates
    const [currentTime, setCurrentTime] = React.useState(dayjs());

    // Filter out trains that have already departed
    const upcomingTrains = stopTimes.filter((st) => {
        if (!st.future) return false;
        // Use departure time if available, otherwise fall back to arrival time
        const departureTime = st.departure ? dayjs.unix(parseInt(st.departure.time)) : dayjs.unix(parseInt(st.arrival.time));
        const secondsUntilDeparture = departureTime.diff(currentTime, 'second');
        // Remove trains that have departed
        return secondsUntilDeparture > 0;
    });

    React.useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(dayjs());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Helper to format time
    const formatTime = (arrivalTime: dayjs.Dayjs) => {
        const diffMinutes = arrivalTime.diff(currentTime, 'minute');
        const diffSeconds = arrivalTime.diff(currentTime, 'second') % 60;

        if (countdownFormat === 'exact') {
            const totalSeconds = arrivalTime.diff(currentTime, 'second');
            if (totalSeconds < 0) return "0:00";
            const m = Math.floor(totalSeconds / 60);
            const s = totalSeconds % 60;
            return `${m}:${s.toString().padStart(2, '0')}`;
        }

        // Friendly format
        if (diffMinutes < 0) {
            return "Arriving";
        } else if (diffMinutes === 0 && diffSeconds < 30) {
            return "Arriving";
        } else if (diffMinutes === 0) {
            return "< 1 min";
        }
        else {
            return `${diffMinutes} min`;
        }
    };

    if (!grouped) {
        // Ungrouped: Sort by time and apply limit
        const sortedTrains = [...upcomingTrains].sort((a, b) =>
            parseInt(a.arrival.time) - parseInt(b.arrival.time)
        );

        const displayedTrains = limit ? sortedTrains.slice(0, limit) : sortedTrains;

        return (
            <div className="p-4 text-white">
                <ul className="space-y-2">
                    {displayedTrains.map((train) => (
                        <TrainItem key={train.trip.id} train={train} formatTime={formatTime} />
                    ))}
                </ul>
                {displayedTrains.length === 0 && (
                    <div className="text-center text-gray-500 mt-8">No upcoming trains</div>
                )}
            </div>
        );
    }

    // Grouped by direction
    const groupedTrains = upcomingTrains.reduce((acc, train) => {
        const direction = train.headsign || 'Unknown Direction';
        if (!acc[direction]) {
            acc[direction] = [];
        }
        acc[direction].push(train);
        return acc;
    }, {} as Record<string, StopTime[]>);

    return (
        <div className="p-4 text-white">
            {Object.entries(groupedTrains).map(([direction, trains]) => {
                // Sort and limit per group
                const sortedTrains = [...trains].sort((a, b) =>
                    parseInt(a.arrival.time) - parseInt(b.arrival.time)
                );
                const displayedTrains = limit ? sortedTrains.slice(0, limit) : sortedTrains;

                if (displayedTrains.length === 0) return null;

                return (
                    <div key={direction} className="mb-6">
                        <h2 className="font-bold tracking-tight mb-3 text-neutral-100">
                            {direction}
                        </h2>
                        <ul className="space-y-2">
                            {displayedTrains.map((train) => (
                                <TrainItem key={train.trip.id} train={train} formatTime={formatTime} />
                            ))}
                        </ul>
                    </div>
                );
            })}
            {upcomingTrains.length === 0 && (
                <div className="text-center text-gray-500 mt-8">No upcoming trains</div>
            )}
        </div>
    );
}

function TrainItem({ train, formatTime }: { train: StopTime, formatTime: (t: dayjs.Dayjs) => string }) {
    const router = useRouter();
    const arrivalTime = dayjs.unix(parseInt(train.arrival.time));
    const timeDisplay = formatTime(arrivalTime);

    const handleClick = () => {
        router.push(`/trips/${train.trip.id}`);
    };

    return (
        <li
            className="flex items-center justify-between bg-neutral-900 border-2 border-neutral-600 p-3 cursor-pointer hover:bg-neutral-800 transition-colors"
            onClick={handleClick}>
            <div className="flex items-center space-x-3">
                <RouteBadge routeId={train.trip.route.id} color={train.trip.route.color} />
                <div>
                    <div className="font-medium">{train.trip.destination.name}</div>
                </div>
            </div>
            <div className="text-lg font-bold text-neutral-300 font-mono">
                {timeDisplay}
            </div>
        </li>
    );
}
