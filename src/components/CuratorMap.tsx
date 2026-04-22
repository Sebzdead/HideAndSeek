import "leaflet/dist/leaflet.css";

import * as turf from "@turf/turf";
import type { FeatureCollection } from "geojson";
import { useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

type CuratorMapProps = {
    mcdonaldsData: FeatureCollection;
    librariesData: FeatureCollection;
};

export const CuratorMap = ({ mcdonaldsData, librariesData }: CuratorMapProps) => {
    // We'll just track features in state so we can remove them.
    const [mcd, setMcd] = useState<FeatureCollection>(mcdonaldsData);
    const [lib, setLib] = useState<FeatureCollection>(librariesData);
    const [isSaving, setIsSaving] = useState(false);

    // Filter out deleted features
    const removeFeature = (dataset: 'mcdonalds' | 'libraries', featureIndex: number) => {
        if (dataset === 'mcdonalds') {
            const newFeatures = mcd.features.filter((_, i) => i !== featureIndex);
            setMcd({ ...mcd, features: newFeatures });
        } else {
            const newFeatures = lib.features.filter((_, i) => i !== featureIndex);
            setLib({ ...lib, features: newFeatures });
        }
    };

    const saveData = async (dataset: 'mcdonalds' | 'libraries') => {
        setIsSaving(true);
        try {
            const dataToSave = dataset === 'mcdonalds' ? mcd : lib;
            const filename = dataset === 'mcdonalds' ? 'McDonalds_cleaned.geojson' : 'Libraries_cleaned.geojson';
            
            const res = await fetch('/JetLagHideAndSeek/api/save-curated', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename, geojson: dataToSave })
            });
            
            if (!res.ok) throw new Error("Save failed: " + await res.text());
            
            alert(`Saved ${filename} to /public/data/ successfully!`);
        } catch (e: any) {
            alert("Error saving: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Note: react-leaflet components must be rendered client-side
    return (
        <div className="relative w-full h-screen flex flex-col">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex gap-4 bg-white/90 p-4 rounded-lg shadow-lg">
                <div className="text-center">
                    <p className="font-bold mb-2">McDonalds: {mcd.features.length}</p>
                    <button 
                        onClick={() => saveData('mcdonalds')} 
                        className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded font-semibold"
                        disabled={isSaving}
                    >
                        Save Cleaned McDonalds
                    </button>
                </div>
                <div className="text-center">
                    <p className="font-bold mb-2">Libraries: {lib.features.length}</p>
                    <button 
                        onClick={() => saveData('libraries')} 
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold"
                        disabled={isSaving}
                    >
                        Save Cleaned Libraries
                    </button>
                </div>
            </div>
            
            <MapContainer
                center={[45.5017, -73.5673]}
                zoom={11}
                className="w-full flex-grow h-full z-0"
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {mcd.features.map((feature, i) => {
                    let coords: [number, number] | null = null;
                    if (feature.geometry) {
                        if (feature.geometry.type === 'Point') {
                            coords = (feature.geometry as any).coordinates as [number, number];
                        } else {
                            try {
                                const centroid = turf.centroid(feature as any);
                                coords = centroid.geometry.coordinates as [number, number];
                            } catch {
                                // fallback
                            }
                        }
                    }
                    if (!coords) return null;
                    
                    return (
                        <CircleMarker
                            key={`mcd-${i}`}
                            center={[coords[1], coords[0]]}
                            radius={6}
                            color="red"
                            fillColor="yellow"
                            fillOpacity={0.8}
                        >
                            <Popup>
                                <div className="text-center">
                                    <h3 className="font-bold mb-2">{feature.properties?.name || "McDonalds"}</h3>
                                    <p className="text-sm mb-2">{feature.properties?.address || ""}</p>
                                    <button 
                                        onClick={() => removeFeature('mcdonalds', i)}
                                        className="bg-red-500 text-white px-3 py-1 rounded text-sm w-full"
                                    >
                                        Delete Point
                                    </button>
                                </div>
                            </Popup>
                        </CircleMarker>
                    );
                })}

                {lib.features.map((feature, i) => {
                    let coords: [number, number] | null = null;
                    if (feature.geometry) {
                        if (feature.geometry.type === 'Point') {
                            coords = (feature.geometry as any).coordinates as [number, number];
                        } else {
                            try {
                                const centroid = turf.centroid(feature as any);
                                coords = centroid.geometry.coordinates as [number, number];
                            } catch {
                                // fallback
                            }
                        }
                    }
                    if (!coords) return null;
                    
                    return (
                        <CircleMarker
                            key={`lib-${i}`}
                            center={[coords[1], coords[0]]}
                            radius={6}
                            color="darkblue"
                            fillColor="blue"
                            fillOpacity={0.8}
                        >
                            <Popup>
                                <div className="text-center">
                                    <h3 className="font-bold mb-2">{feature.properties?.name || "Library"}</h3>
                                    <p className="text-sm mb-2">{feature.properties?.address || ""}</p>
                                    <button 
                                        onClick={() => removeFeature('libraries', i)}
                                        className="bg-red-500 text-white px-3 py-1 rounded text-sm w-full"
                                    >
                                        Delete Point
                                    </button>
                                </div>
                            </Popup>
                        </CircleMarker>
                    );
                })}
            </MapContainer>
        </div>
    );
};
