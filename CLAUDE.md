# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
```

## Environment Variables

Set `TRANSITER_URL` in `.env` to configure the Transiter API backend (defaults to `http://localhost:8080`).

## Architecture

This is a Next.js 16 App Router application for NYC subway departure times. It uses React 19, Tailwind CSS 4, and TypeScript.

### Data Flow

1. **API Proxy** (`app/api/transiter/[...path]/route.ts`): Proxies all requests to the Transiter API backend. All frontend API calls go through `/api/transiter/systems/us-ny-subway/...`

2. **API Functions** (`lib/api.ts`): Client-side fetch functions for stations, routes, alerts, and trips. These call the proxy endpoint.

3. **Types** (`lib/types.ts`): TypeScript interfaces for Transiter API responses (StationResponse, StopTime, Trip, Alert, etc.)

### Key Pages

- `/` - Station search using Fuse.js fuzzy search against `data/stations.json`
- `/stations/[id]` - Station departure board with real-time updates (5s polling)
- `/trips/[id]` - Trip detail view with animated train position indicator

### Components

- `StationSearch` - Fuzzy search with keyboard navigation (Arrow keys + Enter)
- `DepartureBoard` - Groups departures by direction (headsign), supports countdown formats
- `RouteBadge` - Subway line indicator circles with MTA colors
- `StationHeader` - Station name with route badges
- `Alerts` - Service alerts for routes at current station

### State Management

- Station pages store `activeStation` in localStorage for navigation back from trip pages
- Real-time updates use `setInterval` for polling (5s for data, 1s for countdown timers)

### Path Aliases

`@/*` maps to the project root (e.g., `@/components/...`, `@/lib/...`)
