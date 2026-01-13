import { StopTime } from './types';

export interface TripStopTime {
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

export interface TripPosition {
    currentStopIndex: number;
    progress: number;
}

export type TransferStatus = 'comfortable' | 'tight' | 'missed';

export interface TransferWindowResult {
    delta: number;
    status: TransferStatus;
    displayText: string;
}

/**
 * Calculate the current position of a train along its route
 */
export function getCurrentPosition(
    stopTimes: TripStopTime[],
    currentTimeUnix: number
): TripPosition | null {
    if (!stopTimes || !stopTimes.length) return null;

    // Find the last departed stop and next future stop
    let lastDepartedIndex = -1;
    let nextArrivalIndex = -1;

    for (let i = 0; i < stopTimes.length; i++) {
        const departureTime = parseInt(stopTimes[i].departure?.time || stopTimes[i].arrival.time);
        const arrivalTime = parseInt(stopTimes[i].arrival.time);

        if (departureTime <= currentTimeUnix) {
            lastDepartedIndex = i;
        }

        if (arrivalTime > currentTimeUnix && nextArrivalIndex === -1) {
            nextArrivalIndex = i;
        }
    }

    // If train hasn't started yet
    if (lastDepartedIndex === -1) {
        return { currentStopIndex: -1, progress: 0 };
    }

    // If train has passed all stops
    if (nextArrivalIndex === -1) {
        return { currentStopIndex: stopTimes.length - 1, progress: 100 };
    }

    // Calculate progress between stops
    if (lastDepartedIndex !== -1 && nextArrivalIndex !== -1 && lastDepartedIndex < nextArrivalIndex) {
        const lastDeparture = parseInt(stopTimes[lastDepartedIndex].departure?.time || stopTimes[lastDepartedIndex].arrival.time);
        const nextArrival = parseInt(stopTimes[nextArrivalIndex].arrival.time);
        const totalJourneyTime = nextArrival - lastDeparture;
        const elapsedTime = currentTimeUnix - lastDeparture;
        const progress = Math.min(100, Math.max(0, (elapsedTime / totalJourneyTime) * 100));

        return { currentStopIndex: lastDepartedIndex, progress };
    }

    return { currentStopIndex: lastDepartedIndex, progress: 0 };
}

/**
 * Calculate the transfer window between arrival and departure
 */
export function calculateTransferWindow(
    arrivalTime: number,
    departureTime: number,
    currentTime: number
): TransferWindowResult {
    const delta = departureTime - arrivalTime;
    const timeUntilDeparture = departureTime - currentTime;

    let status: TransferStatus;
    if (timeUntilDeparture <= 0) {
        status = 'missed';
    } else if (delta < 60) {
        status = 'missed'; // Less than 1 minute is effectively missed
    } else if (delta < 180) {
        status = 'tight'; // Less than 3 minutes
    } else {
        status = 'comfortable';
    }

    return {
        delta,
        status,
        displayText: formatTransferWindow(delta)
    };
}

/**
 * Format transfer window delta as MM:SS
 */
function formatTransferWindow(seconds: number): string {
    if (seconds < 0) return 'Missed';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get the next train on a specific route departing after a given time
 */
export function getNextTrainOnRoute(
    stopTimes: StopTime[],
    routeId: string,
    afterTime: number
): StopTime | null {
    const validDepartures = stopTimes
        .filter(st => {
            const depTime = parseInt(st.departure?.time || st.arrival.time);
            return st.trip.route.id === routeId && depTime > afterTime;
        })
        .sort((a, b) => parseInt(a.arrival.time) - parseInt(b.arrival.time));

    return validDepartures.length > 0 ? validDepartures[0] : null;
}

/**
 * Format a countdown timer
 */
export function formatCountdown(timestamp: string, currentTimeUnix: number): string {
    const targetTime = parseInt(timestamp);
    const totalSeconds = targetTime - currentTimeUnix;

    if (totalSeconds < 0) return 'Departed';

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
