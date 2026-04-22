# Jet Lag Hide and Seek: Agent Overview

This document summarizes the current state, architecture, and recent major changes of this repository to assist LLM agents in understanding the project context.

## Project Purpose
A web-based map generator and game-state management tool for the "Hide and Seek" game mode inspired by Jet Lag: The Game. It allows players to visualize hiding zones, track progress through questions, and manage local game state.

## Core Technology Stack
- **Framework**: [Astro](https://astro.build/) (using React for UI components).
- **Mapping**: [Leaflet](https://leafletjs.org/) via [react-leaflet](https://react-leaflet.js.org/).
- **Geospatial Logic**: [Turf.js](https://turfjs.org/) for polygon math, distance calculations, and buffers.
- **State Management**: [Nanostores](https://github.com/nanostores/nanostores) (atoms and persistent atoms).
- **Styling**: Tailwind CSS and Radix UI (shadcn/ui).

## Key Components & File Structure
- `src/components/Map.tsx`: The heart of the application. Manages the Leaflet map instance, layers, and imperative map logic (GPS tracking, distance tool).
- `src/lib/context.ts`: Central state definition. Defines atoms like `questions`, `hidingZone`, `hiderModeEnabled`, etc.
- `src/maps/questions/`: Contains pure logic for each question type (Radius, Matching, Measuring, Tentacles, Thermometer). These calculate how a question's answer modifies the overall visible map area.
- `src/components/cards/`: React components for each question type's UI. They connect the user input to the logic in `src/maps/questions/`.
- `Resources/`: Local GeoJSON datasets. Recent work has focused on hardcoded Montreal-based datasets (`REM.geojson`, `stm_arrets_sig.json`, `final_landmarks.geojson`).

## Recent Major Rework (Hider Mode & De-cluttering)
As of late April 2026, **Hider Mode** has been transformed into a pure utility tool, and legacy features like **Planning Mode** have been removed to simplify the experience.

### Changes:
1.  **Live GPS Tracking**: Replaced the persistent `hiderMode` lat/lng with a live `navigator.geolocation.watchPosition` loop. 
    - The user's position is rendered as a pulsing blue dot.
    - This position is ephemeral and NOT saved to the game state or shared with other players.
2.  **Distance Measuring Tool**: Added a self-contained "Measure Distance" tool in Hider Mode.
    - Toggling this drops a draggable red pin on the map.
    - A dashed line and a real-time distance label show the distance between the user's **Live GPS Location** and the **Pin**.
3.  **Decoupling**: All "hiderify" logic (which automatically answered questions based on the hider's location) has been **removed**. Hider Mode is now purely a navigation and measurement utility for the hider.
4.  **Montreal Focus**: The map logic has been simplified to focus on the island of Montreal. STATION data is loaded from local filtered GeoJSONs rather than live OSM queries for hiding zones.
5.  **Planning Mode Removal**: The preview-based "Planning Mode" has been completely removed. All questions now apply directly to the map data, reducing UI complexity and state overhead.
6.  **Measurement Tool Refinement**: Visual updates for the distance ruler (lines and labels) are now handled via a high-performance ref-based system instead of re-rendering Leaflet layers on every drag frame.

## Developer Context
- **Fork**: The repository has been forked to `Sebzdead/HideAndSeek`. 
- **Remotes**: `origin` points to the fork; `upstream` points to the original `taibeled/JetLagHideAndSeek`.
- **Hiding Zones**: Hiding zones are now hardcoded as 300m radii around STM and REM stations in Montreal.

## Critical Atoms (`src/lib/context.ts`)
- `hiderModeEnabled`: Toggles the GPS dot and Hider Mode UI.
- `gpsPosition`: Stores the most recent live GPS coordinates.
- `measureDistanceEnabled`: Toggles the ruler/pin tool.
- `measurePin`: Stores the coordinates of the draggable measurement pin.