import { StationResponse } from './types';

const API_BASE_URL = '/api/transiter/systems/us-ny-subway';

export async function fetchStation(id: string): Promise<StationResponse> {
    const response = await fetch(`${API_BASE_URL}/stops/${id}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch station data: ${response.statusText}`);
    }
    return response.json();
}
