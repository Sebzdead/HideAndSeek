                onEachFeature: (feature: any, layer: any) => {
                    const name = feature?.properties?.name || "McDonald's";
                    const addr = feature?.properties?.["addr:street"] 
                        ? `${feature.properties["addr:housenumber"] || ""} ${feature.properties["addr:street"]}` 
                        : "";
                    const container = L.DomUtil.create("div");
                    container.className = "min-w-[140px]";
                    container.innerHTML = `
                        <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px; text-align: center;">
                            ${name}
                        </div>
                        ${addr ? `<div style="font-size: 12px; margin-bottom: 8px; text-align: center;">${addr}</div>` : ""}
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <button id="p-btn-tent" class="bg-gray-100 hover:bg-gray-200 text-black font-medium px-2 py-1.5 rounded-sm text-xs shadow-sm transition-colors w-full text-left" type="button">Add Tentacles</button>
                            <button id="p-btn-copy" class="bg-gray-100 hover:bg-gray-200 text-black font-medium px-2 py-1.5 rounded-sm text-xs shadow-sm transition-colors w-full text-left" type="button">Copy Coordinates</button>
                        </div>
                    `;

                    const lng = feature.geometry.coordinates[0];
                    const lat = feature.geometry.coordinates[1];

                    const btnTent = container.querySelector("#p-btn-tent");
                    if (btnTent)
                        btnTent.addEventListener("click", () => {
                            map.closePopup();
                            addQuestion({
                                id: "tentacles",
                                data: { lat, lng, locationType: "mcdonalds" },
                            });
                        });

                    const btnCopy = container.querySelector("#p-btn-copy");
                    if (btnCopy)
                        btnCopy.addEventListener("click", () => {
                            map.closePopup();
                            if (!navigator || !navigator.clipboard) {
                                toast.error(
                                    "Clipboard API not supported in your browser",
                                );
                                return;
                            }
                            toast.promise(
                                navigator.clipboard.writeText(
                                    `${Math.abs(lat)}°${lat > 0 ? "N" : "S"}, ${Math.abs(lng)}°${lng > 0 ? "E" : "W"}`,
                                ),
                                {
                                    pending: "Writing...",
                                    success: "Coordinates copied!",
                                    error: "Error copying",
                                },
                                { autoClose: 1000 },
                            );
                        });

                    layer.bindPopup(container);
                }
