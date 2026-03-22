"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* Fix default marker icons in bundled environments */
const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

interface LocationPickerProps {
    lat: number | null;
    lng: number | null;
    onChange: (lat: number, lng: number) => void;
}

export default function LocationPicker({
    lat,
    lng,
    onChange,
}: LocationPickerProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: [49.28, -123.12], // Default to Vancouver
            zoom: 11,
            zoomControl: true,
            attributionControl: true,
        });

        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
            subdomains: "abcd",
            maxZoom: 19,
        }).addTo(map);

        // If initial coords provided, place marker
        if (lat !== null && lng !== null) {
            const marker = L.marker([lat, lng], {
                icon: defaultIcon,
                draggable: true,
            }).addTo(map);
            marker.on("dragend", () => {
                const pos = marker.getLatLng();
                onChange(pos.lat, pos.lng);
            });
            markerRef.current = marker;
            map.setView([lat, lng], 14);
        }

        map.on("click", (e: L.LeafletMouseEvent) => {
            const { lat: clickLat, lng: clickLng } = e.latlng;

            if (markerRef.current) {
                markerRef.current.setLatLng([clickLat, clickLng]);
            } else {
                const marker = L.marker([clickLat, clickLng], {
                    icon: defaultIcon,
                    draggable: true,
                }).addTo(map);
                marker.on("dragend", () => {
                    const pos = marker.getLatLng();
                    onChange(pos.lat, pos.lng);
                });
                markerRef.current = marker;
            }

            onChange(clickLat, clickLng);
        });

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            ref={mapContainerRef}
            style={{
                height: 300,
                width: "100%",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.1)",
            }}
        />
    );
}
