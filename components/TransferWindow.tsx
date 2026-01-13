'use client';

import React, { useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { calculateTransferWindow, TransferStatus } from '@/lib/transfer-utils';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface TransferWindowProps {
    arrivalTime: number;
    departureTime: number;
    currentTime: dayjs.Dayjs;
    onTransferMissed: () => void;
    onTightConnection?: () => void;
}

export default function TransferWindow({
    arrivalTime,
    departureTime,
    currentTime,
    onTransferMissed,
    onTightConnection
}: TransferWindowProps) {
    const hasNotifiedMissed = useRef(false);
    const previousStatus = useRef<TransferStatus | null>(null);
    const isInitialLoad = useRef(true);

    const currentTimeUnix = currentTime.unix();
    const result = calculateTransferWindow(arrivalTime, departureTime, currentTimeUnix);

    // Calculate time until arrival and departure for display
    const timeUntilArrival = Math.max(0, arrivalTime - currentTimeUnix);
    const timeUntilDeparture = Math.max(0, departureTime - currentTimeUnix);

    // Check if we've arrived (arrival time has passed)
    const hasArrived = currentTimeUnix >= arrivalTime;

    useEffect(() => {
        // Skip notifications on initial load - user can see the status visually
        if (isInitialLoad.current) {
            isInitialLoad.current = false;
            previousStatus.current = result.status;
            return;
        }

        // Only notify when status transitions to tight (from comfortable)
        if (result.status === 'tight' && previousStatus.current === 'comfortable') {
            onTightConnection?.();
        }

        // Notify when transfer is missed
        if (result.status === 'missed' && !hasNotifiedMissed.current) {
            hasNotifiedMissed.current = true;
            onTransferMissed();
        }

        previousStatus.current = result.status;
    }, [result.status, onTransferMissed, onTightConnection]);

    const formatTime = (seconds: number): string => {
        if (seconds <= 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusColor = (status: TransferStatus): string => {
        switch (status) {
            case 'comfortable':
                return 'text-green-500';
            case 'tight':
                return 'text-orange-500';
            case 'missed':
                return 'text-red-500';
        }
    };

    const getStatusBgColor = (status: TransferStatus): string => {
        switch (status) {
            case 'comfortable':
                return 'bg-green-500/10 border-green-500/30';
            case 'tight':
                return 'bg-orange-500/10 border-orange-500/30';
            case 'missed':
                return 'bg-red-500/10 border-red-500/30';
        }
    };

    const getStatusIcon = (status: TransferStatus) => {
        switch (status) {
            case 'comfortable':
                return <CheckCircle size={20} className="text-green-500" />;
            case 'tight':
                return <AlertTriangle size={20} className="text-orange-500" />;
            case 'missed':
                return <XCircle size={20} className="text-red-500" />;
        }
    };

    const getStatusMessage = (status: TransferStatus): string => {
        switch (status) {
            case 'comfortable':
                return 'Good connection';
            case 'tight':
                return 'Tight connection';
            case 'missed':
                return 'Connection missed';
        }
    };

    return (
        <div className={`rounded-lg border p-4 ${getStatusBgColor(result.status)}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <span className={`font-medium ${getStatusColor(result.status)}`}>
                        {getStatusMessage(result.status)}
                    </span>
                </div>
                <div className={`text-2xl font-mono font-bold ${getStatusColor(result.status)}`}>
                    {result.displayText}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <div className="text-neutral-500">Your arrival</div>
                    <div className="text-white font-mono">
                        {hasArrived ? (
                            <span className="text-green-500">Arrived</span>
                        ) : (
                            formatTime(timeUntilArrival)
                        )}
                    </div>
                </div>
                <div>
                    <div className="text-neutral-500">Transfer departs</div>
                    <div className="text-white font-mono">
                        {timeUntilDeparture > 0 ? formatTime(timeUntilDeparture) : (
                            <span className="text-red-500">Departed</span>
                        )}
                    </div>
                </div>
            </div>

            {result.status === 'tight' && (
                <div className="mt-3 text-xs text-orange-400">
                    Move quickly when you arrive - you have less than 3 minutes to transfer.
                </div>
            )}

            {result.status === 'missed' && (
                <div className="mt-3 text-xs text-red-400">
                    Finding next available train on this line...
                </div>
            )}
        </div>
    );
}
