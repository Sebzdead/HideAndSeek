import * as turf from "@turf/turf";
import type { FeatureCollection } from "geojson";

import type { StationPlace } from "./types";

export const fetchLocalLandmarks = async (category: string) => {
    const baseUrl = import.meta.env.BASE_URL;
    // Ensure we don't end up with double slashes if baseUrl has a trailing slash
    const url = baseUrl.endsWith('/') ? `${baseUrl}final_landmarks.geojson` : `${baseUrl}/final_landmarks.geojson`;
    const res = await fetch(url);
    const json = await res.json();

    let keywords = [category];
    if (category === "airport") keywords = ["Airport"];
    else if (category === "university") keywords = ["University", "College"];
    else if (category === "river") keywords = ["River", "Fleuve"];
    else if (category === "hospital") keywords = ["Hospital"];
    else if (category === "park") keywords = ["Park", "Parc"];

    return json.features
        .filter((f: any) =>
            keywords.some((k) => f.properties.Name?.includes(k)),
        )
        .map((f: any) => turf.point(f.geometry.coordinates, f.properties));
};

export async function loadLocalStations(): Promise<StationPlace[]> {
    const baseUrl = import.meta.env.BASE_URL;

    const [stmData, remData, stmLines] = await Promise.all([
        fetch(`${baseUrl}/metro/stm_arrets_sig.json`).then((r) => r.json()),
        fetch(`${baseUrl}/metro/rem_stations.geojson`).then((r) => r.json()),
        fetch(`${baseUrl}/metro/stm_lignes_sig.json`).then((r) => r.json()),
    ]);

    const routeIdToLine: Record<string, string> = {};
    for (const feature of (stmLines as FeatureCollection).features) {
        const props = (feature as any).properties;
        const rid = String(props?.route_id ?? "");
        const rname: string = props?.route_name ?? "";
        if (rname.includes("Verte") || rid === "1") routeIdToLine[rid] = "green";
        else if (rname.includes("Orange") || rid === "2") routeIdToLine[rid] = "orange";
        else if (rname.includes("Jaune") || rid === "4") routeIdToLine[rid] = "yellow";
        else if (rname.includes("Bleue") || rid === "5") routeIdToLine[rid] = "blue";
    }

    const places: StationPlace[] = [];
    const seen = new Set<string>();

    for (const feature of (stmData as FeatureCollection).features) {
        const props = (feature as any).properties;
        const url: string = props?.stop_url ?? "";
        if (!url.includes("/metro/")) continue;

        const name: string = props?.stop_name ?? "";
        if (seen.has(name)) continue;
        seen.add(name);

        const rawRouteId = String(props?.route_id ?? "");
        const lines = rawRouteId
            .split(",")
            .map((r: string) => r.trim())
            .filter((r: string) => routeIdToLine[r])
            .map((r: string) => routeIdToLine[r]);

        places.push({
            type: "Feature",
            geometry: feature.geometry as any,
            properties: {
                id: `stm-${props.stop_id}`,
                name,
                metroLines: lines.join(","),
            },
        });
    }

    for (const feature of (remData as FeatureCollection).features) {
        const props = (feature as any).properties;
        const name: string = props?.name ?? "";
        const id: string = (feature as any).id ?? `rem-${name}`;
        places.push({
            type: "Feature",
            geometry: feature.geometry as any,
            properties: { id, name, metroLines: "rem" },
        });
    }

    return places;
}
