import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";
import { DOMParser } from "@xmldom/xmldom";
import { kml } from "@tmcw/togeojson";
import proj4 from "proj4";

const RESOURCES_DIR = path.resolve("./Resources");
const PUBLIC_DIR = path.resolve("./public");

// Ensure public directories exist
const METRO_DIR = path.join(PUBLIC_DIR, "metro");
if (!fs.existsSync(METRO_DIR)) {
    fs.mkdirSync(METRO_DIR, { recursive: true });
}

// EPSG:2950 definition
proj4.defs(
    "EPSG:2950",
    "+proj=tmerc +lat_0=0 +lon_0=-73.5 +k=0.9999 +x_0=304800 +y_0=0 +ellps=GRS80 +datum=NAD83 +units=m +no_defs",
);

const reprojectGeoJSON = (geoJSON) => {
    // Project all coordinates from EPSG:2950 to WGS84
    const newGeo = JSON.parse(JSON.stringify(geoJSON));
    newGeo.features.forEach((feature) => {
        if (feature.geometry.type === "LineString") {
            feature.geometry.coordinates = feature.geometry.coordinates.map(
                (coord) => proj4("EPSG:2950", "WGS84", coord),
            );
        } else if (feature.geometry.type === "Point") {
            feature.geometry.coordinates = proj4(
                "EPSG:2950",
                "WGS84",
                feature.geometry.coordinates,
            );
        } else if (feature.geometry.type === "Polygon") {
            feature.geometry.coordinates = feature.geometry.coordinates.map(
                (ring) =>
                    ring.map((coord) => proj4("EPSG:2950", "WGS84", coord)),
            );
        }
    });
    return newGeo;
};

/** Keep only STM métro lines 1, 2, 4, 5 (orange, green, yellow, blue). Drops bus and other modes. */
const filterStmMetroArrets = (geoJSON) => {
    const allowedRouteIds = new Set(["1", "2", "4", "5"]);
    const hasMetroRoute = (routeId) =>
        String(routeId ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .some((part) => allowedRouteIds.has(part));
    return {
        ...geoJSON,
        features: (geoJSON.features ?? []).filter((f) =>
            hasMetroRoute(f?.properties?.route_id),
        ),
    };
};

console.log("Processing and copying metro lines...");

const stm_lignes_path = path.join(
    RESOURCES_DIR,
    "STM lines",
    "stm_lignes_sig.json",
);
if (fs.existsSync(stm_lignes_path)) {
    const data = JSON.parse(fs.readFileSync(stm_lignes_path, "utf-8"));
    const reprojected = reprojectGeoJSON(data);
    fs.writeFileSync(
        path.join(METRO_DIR, "stm_lignes_sig.json"),
        JSON.stringify(reprojected),
    );
}

const stm_arrets_path = path.join(
    RESOURCES_DIR,
    "STM lines",
    "stm_arrets_sig.json",
);
if (fs.existsSync(stm_arrets_path)) {
    const data = JSON.parse(fs.readFileSync(stm_arrets_path, "utf-8"));
    const reprojected = reprojectGeoJSON(data);
    const metroOnly = filterStmMetroArrets(reprojected);
    fs.writeFileSync(
        path.join(METRO_DIR, "stm_arrets_sig.json"),
        JSON.stringify(metroOnly, null, 2),
    );
}

if (fs.existsSync(path.join(RESOURCES_DIR, "REM_lines.geojson"))) {
    fs.copyFileSync(
        path.join(RESOURCES_DIR, "REM_lines.geojson"),
        path.join(METRO_DIR, "REM_lines.geojson"),
    );
}
console.log("Metro files copied.");

console.log("Processing final_landmarks.geojson...");
const landmarksPath = path.join(RESOURCES_DIR, "final_landmarks.geojson");
if (fs.existsSync(landmarksPath)) {
    fs.copyFileSync(
        landmarksPath,
        path.join(PUBLIC_DIR, "final_landmarks.geojson"),
    );
    console.log("final_landmarks.geojson successfully copied to public/");
} else {
    console.warn("final_landmarks.geojson not found.");
}
