import fs from "node:fs/promises";

const BASE_URL = process.env.TRANSITER_URL ?? "http://localhost:8080";
const SYSTEM_ID = "us-ny-subway"; // change if you used a different ID
const PAGE_LIMIT = 100;

// Types are just for your own sanity if you port this to TS.
async function fetchPage(firstId) {
    const url = new URL(
        `${BASE_URL}/systems/${SYSTEM_ID}/stops`
    );

    // ListStopsRequest options
    url.searchParams.set("limit", String(PAGE_LIMIT));
    url.searchParams.set("skip_stop_times", "true");
    url.searchParams.set("skip_alerts", "true");
    url.searchParams.set("skip_transfers", "true");
    if (firstId) url.searchParams.set("first_id", firstId);

    const res = await fetch(url);
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`HTTP ${res.status}: ${body}`);
    }
    return res.json();
}

async function fetchAllStops() {
    const allStops = [];
    let firstId = undefined;

    while (true) {
        const data = await fetchPage(firstId);
        const { stops, nextId } = data; // Transiter uses camelCase in JSON

        allStops.push(...stops);
        if (!nextId) break;
        firstId = nextId;
    }

    return allStops;
}

function toStationEntry(stop) {
    // Only keep actual stops/stations if you want (Stop.Type=0/1)
    // type: 0 = STOP, 1 = STATION, etc. :contentReference[oaicite:2]{index=2}
    if (stop.type !== "STOP" && stop.type !== "STATION" && stop.type !== 0 && stop.type !== 1) {
        return null;
    }

    const lineSet = new Set();

    // serviceMaps: [{ routes: [{ id: "N", ... }, ...] }, ...]
    for (const sm of stop.serviceMaps ?? []) {
        for (const routeRef of sm.routes ?? []) {
            if (routeRef.id) {
                // In NYC subway GTFS, route_id is the line (1,2,3,A,B,GS, etc.) :contentReference[oaicite:3]{index=3}
                lineSet.add(routeRef.id);
            }
        }
    }

    const lines = Array.from(lineSet).sort();
    if (lines.length === 0) return null;

    return {
        id: stop.id,       // e.g. "G20"
        name: stop.name,   // e.g. "36 St"
        lines,             // e.g. ["D", "N", "R"]
    };
}

async function main() {
    console.log("Fetching stops from Transiter…");
    const rawStops = await fetchAllStops();

    console.log(`Got ${rawStops.length} stops, transforming…`);
    const stations = rawStops
        .map(toStationEntry)
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name));

    await fs.mkdir("data", { recursive: true });
    await fs.writeFile(
        "data/stations.json",
        JSON.stringify(stations, null, 2),
        "utf8"
    );

    console.log(`Wrote ${stations.length} stations to data/stations.json`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
