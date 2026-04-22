import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, MultiPolygon, Point, Polygon } from "geojson";
import _ from "lodash";
import osmtogeojson from "osmtogeojson";
import { toast } from "react-toastify";

import {
    mapGeoLocation,
    polyGeoJSON,
} from "@/lib/context";
import {
    fetchLocalLandmarks,
} from "@/maps/api";
import { geoSpatialVoronoi, modifyMapData } from "@/maps/geo-utils";
import type {
    MatchingQuestion,
} from "@/maps/schema";

export const findMatchingPlaces = async (question: MatchingQuestion) => {
    switch (question.type) {
        case "airport": {
            // Hardcoded airports as requested
            return [
                turf.point([-73.7408, 45.4706], { name: "Trudeau International Airport" }),
                turf.point([-73.4169, 45.5175], { name: "Montreal Metropolitan Airport" })
            ];
        }
        case "hospital":
        case "park":
        case "university": {
            return await fetchLocalLandmarks(question.type);
        }
        default:
            return [];
    }
};

export const determineMatchingBoundary = _.memoize(
    async (question: MatchingQuestion) => {
        let boundary;

        switch (question.type) {
            case "metro-line": {
                return false;
            }
            case "district": {
                try {
                    // Fetch the cleaned Montreal geojson to find which district we are in
                    const req = await fetch(`${import.meta.env.BASE_URL}/data/Montreal_cleaned.geojson`);
                    const geojson = await req.json() as FeatureCollection<Polygon | MultiPolygon>;
                    
                    const point = turf.point([question.lng, question.lat]);
                    
                    for (const feature of geojson.features) {
                        if (turf.booleanPointInPolygon(point, feature)) {
                            boundary = feature;
                            break;
                        }
                    }

                    if (!boundary) {
                        toast.error("Point is not within any known Montreal district.");
                        throw new Error("No boundary found");
                    }
                } catch (e) {
                    console.error("Failed to process district boundary", e);
                }
                break;
            }
            case "airport":
            case "hospital":
            case "park":
            case "university": {
                const data = await findMatchingPlaces(question);

                if (!data || data.length === 0) {
                    toast.error(`No ${question.type}s found nearby to match against.`);
                    throw new Error("No places found");
                }

                const voronoi = geoSpatialVoronoi(data);
                const point = turf.point([question.lng, question.lat]);

                for (const feature of voronoi.features) {
                    if (turf.booleanPointInPolygon(point, feature)) {
                        boundary = feature;
                        break;
                    }
                }
                break;
            }
        }

        return boundary;
    },
    (question: MatchingQuestion) =>
        JSON.stringify({
            type: question.type,
            lat: question.lat,
            lng: question.lng,
            entirety: polyGeoJSON.get()
                ? polyGeoJSON.get()
                : mapGeoLocation.get(),
        }),
);

export const adjustPerMatching = async (
    question: MatchingQuestion,
    mapData: any,
) => {
    if (mapData === null) return;

    const boundary = await determineMatchingBoundary(question);

    if (boundary === false) {
        return mapData;
    }

    return modifyMapData(mapData, boundary, question.same);
};
