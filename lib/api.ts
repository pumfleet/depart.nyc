import { StationResponse, Route, Alert } from './types';

const API_BASE_URL = '/api/transiter/systems/us-ny-subway';

export async function fetchStation(id: string): Promise<StationResponse> {
    const response = await fetch(`${API_BASE_URL}/stops/${id}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch station data: ${response.statusText}`);
    }
    return response.json();
}

export async function fetchRoutes(): Promise<Route[]> {
    const response = await fetch(`${API_BASE_URL}/routes?skip_service_maps=true&skip_estimated_headways=true`);
    if (!response.ok) {
        throw new Error(`Failed to fetch routes: ${response.statusText}`);
    }
    const data = await response.json();
    return data.routes;
}

export async function fetchAlert(id: string): Promise<Alert> {
    const response = await fetch(`${API_BASE_URL}/alerts/${id}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch alert ${id}: ${response.statusText}`);
    }
    return response.json();
}
