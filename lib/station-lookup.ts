import stationsData from '@/data/stations.json';
import { getLineColor } from './colors';

interface Station {
    id: string;
    name: string;
    lines: string[];
}

export interface TransferOption {
    line: string;
    stationId: string;
    color: string;
}

// Build maps for efficient lookups
const stationsByName = new Map<string, Station[]>();
const stationsById = new Map<string, Station>();

(stationsData as Station[]).forEach(station => {
    // Map by name
    const existing = stationsByName.get(station.name) || [];
    existing.push(station);
    stationsByName.set(station.name, existing);

    // Map by ID
    stationsById.set(station.id, station);
});

/**
 * Get a station by its ID
 */
export function getStationById(id: string): Station | null {
    // Try exact match first
    const exact = stationsById.get(id);
    if (exact) return exact;

    // Strip N/S suffix and try again (Transiter API uses suffixes for direction)
    const baseId = id.replace(/[NS]$/, '');
    return stationsById.get(baseId) || null;
}

/**
 * Get the canonical station name from a stop ID
 * This handles the N/S suffix that Transiter API uses
 */
export function getCanonicalStationName(stopId: string): string | null {
    const station = getStationById(stopId);
    return station?.name || null;
}

/**
 * Find all stations with a matching name
 */
export function getStationsByName(name: string): Station[] {
    return stationsByName.get(name) || [];
}

/**
 * Get the station ID for a specific line at a given station name
 */
export function getStationIdForLine(name: string, line: string): string | null {
    const stations = getStationsByName(name);
    for (const station of stations) {
        if (station.lines.includes(line)) {
            return station.id;
        }
    }
    return null;
}

/**
 * Get available transfer lines at a station, excluding specified lines
 * This finds all stations with the same name and returns their lines
 */
export function getTransferLines(stationName: string, excludeLines: string[]): TransferOption[] {
    const matchingStations = getStationsByName(stationName);
    const transfers: TransferOption[] = [];
    const seenLines = new Set<string>();

    matchingStations.forEach(station => {
        station.lines.forEach(line => {
            if (!excludeLines.includes(line) && !seenLines.has(line)) {
                seenLines.add(line);
                transfers.push({
                    line,
                    stationId: station.id,
                    color: getLineColor(line)
                });
            }
        });
    });

    return transfers;
}

/**
 * Get transfer lines using a stop ID instead of station name
 * This is more reliable as it handles API stop IDs with N/S suffixes
 */
export function getTransferLinesFromStopId(stopId: string, excludeLines: string[]): TransferOption[] {
    const canonicalName = getCanonicalStationName(stopId);
    if (!canonicalName) {
        return [];
    }
    return getTransferLines(canonicalName, excludeLines);
}

/**
 * Check if a station has transfer options (excluding current line)
 */
export function hasTransfers(stationName: string, currentLine: string): boolean {
    return getTransferLines(stationName, [currentLine]).length > 0;
}

/**
 * Check if a stop has transfer options using its ID
 */
export function hasTransfersFromStopId(stopId: string, currentLine: string): boolean {
    return getTransferLinesFromStopId(stopId, [currentLine]).length > 0;
}
