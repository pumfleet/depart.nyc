export interface Resource {
    path: string;
}

export interface System {
    id: string;
    resource: Resource;
}

export interface Route {
    id: string;
    resource: Resource;
    system: System;
    color: string;
    alerts: { id: string }[];
}

export interface Stop {
    id: string;
    resource: Resource;
    system: System;
    name: string;
    latitude?: number;
    longitude?: number;
    type?: string;
    childStops?: Stop[];
}

export interface Vehicle {
    id: string;
    resource: Resource;
}

export interface Trip {
    id: string;
    resource: Resource;
    route: Route;
    destination: Stop;
    vehicle?: Vehicle;
    directionId: boolean;
}

export interface StopTime {
    stop: Stop;
    trip: Trip;
    arrival: {
        time: string;
    };
    departure: {
        time: string;
    };
    future: boolean;
    stopSequence: number;
    headsign: string;
    track: string;
}

export interface ServiceMapRoute {
    id: string;
    resource: Resource;
    system: System;
    color: string;
}

export interface ServiceMap {
    configId: string;
    routes: ServiceMapRoute[];
}

export interface HeadsignRule {
    stop: Stop;
    priority: number;
    headsign: string;
}

export interface StationResponse {
    id: string;
    resource: Resource | null;
    system: System | null;
    name: string;
    latitude: number;
    longitude: number;
    type: string;
    childStops: Stop[];
    serviceMaps: ServiceMap[];
    alerts: any[];
    stopTimes: StopTime[];
    transfers: any[];
    headsignRules: HeadsignRule[];
}

export interface AlertHeader {
    text: string;
    language: string;
}

export interface AlertDescription {
    text: string;
    language: string;
}

export interface Alert {
    id: string;
    resource: Resource | null;
    system: System | null;
    cause: string;
    effect: string;
    header: AlertHeader[];
    description: AlertDescription[];
    url: any[];
}
