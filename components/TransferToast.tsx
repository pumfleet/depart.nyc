'use client';

import toast from 'react-hot-toast';
import { AlertTriangle, RefreshCw, Clock } from 'lucide-react';

/**
 * Show a toast when the transfer train has been updated to the next available
 */
export function showTransferUpdatedToast(routeId: string, newTime: string): void {
    toast.custom((t) => (
        <div
            className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-neutral-900 shadow-lg rounded-lg pointer-events-auto flex border border-neutral-700`}
        >
            <div className="flex-1 p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                        <RefreshCw className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-white">
                            Transfer train updated
                        </p>
                        <p className="mt-1 text-sm text-neutral-400">
                            Showing next {routeId} train at {newTime}
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex border-l border-neutral-700">
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-orange-500 hover:text-orange-400 focus:outline-none"
                >
                    OK
                </button>
            </div>
        </div>
    ), {
        duration: 5000,
        position: 'top-center',
    });
}

/**
 * Show a toast warning about a tight connection
 */
export function showTightConnectionToast(minutes: number): void {
    toast.custom((t) => (
        <div
            className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-neutral-900 shadow-lg rounded-lg pointer-events-auto flex border border-orange-500/50`}
        >
            <div className="flex-1 p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-orange-500">
                            Tight connection
                        </p>
                        <p className="mt-1 text-sm text-neutral-400">
                            Only {minutes} minute{minutes !== 1 ? 's' : ''} to make your transfer
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex border-l border-neutral-700">
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-neutral-400 hover:text-white focus:outline-none"
                >
                    OK
                </button>
            </div>
        </div>
    ), {
        duration: 4000,
        position: 'top-center',
    });
}

/**
 * Show a toast when no more trains are available
 */
export function showNoMoreTrainsToast(routeId: string): void {
    toast.custom((t) => (
        <div
            className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-neutral-900 shadow-lg rounded-lg pointer-events-auto flex border border-red-500/50`}
        >
            <div className="flex-1 p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                        <Clock className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-red-500">
                            No more {routeId} trains
                        </p>
                        <p className="mt-1 text-sm text-neutral-400">
                            No more trains available on this line tonight
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex border-l border-neutral-700">
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-neutral-400 hover:text-white focus:outline-none"
                >
                    OK
                </button>
            </div>
        </div>
    ), {
        duration: 5000,
        position: 'top-center',
    });
}
