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

// Build a map for efficient lookups
const stationsByName = new Map<string, Station[]>();
(stationsData as Station[]).forEach(station => {
    const existing = stationsByName.get(station.name) || [];
    existing.push(station);
    stationsByName.set(station.name, existing);
});

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
 * Check if a station has transfer options (excluding current line)
 */
export function hasTransfers(stationName: string, currentLine: string): boolean {
    return getTransferLines(stationName, [currentLine]).length > 0;
}
