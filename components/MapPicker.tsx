
import React, { useEffect, useRef, useState } from 'react';
import { Search, Map as MapIcon, Crosshair, Loader, Navigation, Layers } from 'lucide-react';
import { searchPlace } from '../services/mapService';
import { Location } from '../types';

interface MapPickerProps {
    initialLocation?: Location;
    onLocationSelect: (loc: Location) => void;
    height?: string;
    readOnly?: boolean;
}

export const MapPicker: React.FC<MapPickerProps> = ({ initialLocation, onLocationSelect, height = "300px", readOnly = false }) => {
    const mapId = useRef(`map-${Math.random().toString(36).substr(2, 9)}`);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const tileLayerRef = useRef<any>(null);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [locating, setLocating] = useState(false);
    const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');

    useEffect(() => {
        const timer = setTimeout(() => {
            // Check if element exists and L is available
            const L = (window as any).L;
            if (L && !mapRef.current && document.getElementById(mapId.current)) {
                initMap();
            }
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // Update tile layer when mapType changes
    useEffect(() => {
        if (mapRef.current) {
            updateTileLayer(mapRef.current, mapType);
        }
    }, [mapType]);

    const updateTileLayer = (map: any, type: 'standard' | 'satellite') => {
        const L = (window as any).L;
        if (!map || !L) return;

        if (tileLayerRef.current) {
            map.removeLayer(tileLayerRef.current);
        }

        let layer;
        if (type === 'satellite') {
             layer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles © Esri'
            });
        } else {
             layer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: ''
            });
        }
        
        layer.addTo(map);
        tileLayerRef.current = layer;
    };

    const initMap = () => {
        const L = (window as any).L;
        if (!L) return;

        const startLat = initialLocation?.lat || 20.5937;
        const startLng = initialLocation?.lng || 78.9629;
        const zoom = initialLocation ? 16 : 5;

        if (mapRef.current) {
            mapRef.current.remove();
        }

        const map = L.map(mapId.current, { 
            zoomControl: false,
            dragging: !readOnly,
            scrollWheelZoom: !readOnly,
            doubleClickZoom: !readOnly,
            touchZoom: !readOnly
        }).setView([startLat, startLng], zoom);

        // Zoom control bottom-right (only if not readOnly)
        if (!readOnly) {
            L.control.zoom({ position: 'bottomright' }).addTo(map);
        }

        // Set initial tile layer
        updateTileLayer(map, 'standard');

        // Marker
        const marker = L.marker([startLat, startLng], { draggable: !readOnly }).addTo(map);
        
        if (!readOnly) {
            marker.on('dragend', function (event: any) {
                const position = marker.getLatLng();
                onLocationSelect({ lat: position.lat, lng: position.lng });
            });

            map.on('click', function(e: any) {
                marker.setLatLng(e.latlng);
                onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
            });
        }

        mapRef.current = map;
        markerRef.current = marker;

        setTimeout(() => map.invalidateSize(), 200);
    };

    useEffect(() => {
        if (mapRef.current && markerRef.current && initialLocation) {
            const currentPos = markerRef.current.getLatLng();
            if (Math.abs(currentPos.lat - initialLocation.lat) > 0.0001 || Math.abs(currentPos.lng - initialLocation.lng) > 0.0001) {
                markerRef.current.setLatLng([initialLocation.lat, initialLocation.lng]);
                mapRef.current.setView([initialLocation.lat, initialLocation.lng], 16);
            }
        }
    }, [initialLocation]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        setSearching(true);
        const loc = await searchPlace(searchQuery);
        setSearching(false);

        if (loc && mapRef.current) {
            mapRef.current.flyTo([loc.lat, loc.lng], 16, { duration: 1.5 });
            markerRef.current.setLatLng([loc.lat, loc.lng]);
            onLocationSelect(loc);
        } else {
            alert("Location not found");
        }
    };

    const handleCurrentLocation = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        setLocating(true);

        const success = (position: any) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            if (mapRef.current && markerRef.current) {
                mapRef.current.flyTo([lat, lng], 18, {
                    animate: true,
                    duration: 1.5
                });
                markerRef.current.setLatLng([lat, lng]);
                onLocationSelect({ lat, lng });
            }
            setLocating(false);
        };

        const handleError = (error: any) => {
            console.warn("Geolocation Error:", error.message || error);
            setLocating(false);
            
            let msg = "Could not retrieve location.";
            switch(error.code) {
                case 1: msg = "Location permission denied. Please enable it in browser settings."; break;
                case 2: msg = "Location unavailable. Please check your GPS settings."; break;
                case 3: msg = "Location request timed out. Please try again."; break;
                default: msg = "An unknown error occurred getting location.";
            }
            alert(msg);
        };

        const options = { 
            enableHighAccuracy: true, 
            timeout: 10000, 
            maximumAge: 0 
        };

        navigator.geolocation.getCurrentPosition(
            success, 
            (err) => {
                // If high accuracy fails (timeout), try low accuracy
                if (err.code === 3) {
                    console.log("High accuracy timed out, retrying with low accuracy...");
                    navigator.geolocation.getCurrentPosition(
                        success, 
                        handleError, 
                        { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
                    );
                } else {
                    handleError(err);
                }
            }, 
            options
        );
    };

    return (
        <div className="relative w-full h-full bg-gray-100 overflow-hidden">
            {/* Search Bar - Top Right (Hidden in ReadOnly) */}
            {!readOnly && (
                <div className="absolute top-4 right-4 w-[60%] max-w-[280px] z-[1000]">
                    <form onSubmit={handleSearch} className="flex items-center bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 transition-all focus-within:ring-2 focus-within:ring-primary/50">
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search..."
                            className="flex-1 pl-3 pr-2 py-2.5 bg-transparent outline-none text-sm dark:text-white placeholder-gray-400 min-w-0"
                        />
                        {searchQuery && (
                            <button 
                                type="button" 
                                onClick={() => setSearchQuery('')}
                                className="text-gray-400 hover:text-gray-600 px-1"
                            >
                                ×
                            </button>
                        )}
                        <button type="submit" className="px-3 py-2 text-primary hover:text-primary-dark transition-colors border-l dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                            {searching ? <Loader className="animate-spin w-4 h-4"/> : <Search size={18} />}
                        </button>
                    </form>
                </div>
            )}

            {/* Map Type Toggle - Below Search Bar (Hidden in ReadOnly) */}
            {!readOnly && (
                <button 
                    type="button"
                    onClick={() => setMapType(prev => prev === 'standard' ? 'satellite' : 'standard')}
                    className="absolute top-[4.5rem] right-4 z-[1000] bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                    <Layers size={14} className="text-blue-500"/>
                    {mapType === 'standard' ? 'Satellite' : 'Standard'}
                </button>
            )}

            {/* Current Location FAB - Bottom Right (Hidden in ReadOnly) */}
            {!readOnly && (
                <button 
                    type="button"
                    onClick={handleCurrentLocation}
                    className="absolute bottom-24 right-4 z-[1000] bg-white dark:bg-gray-800 p-3 rounded-full shadow-xl text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all border border-gray-100 dark:border-gray-700"
                    title="Use Current Location"
                >
                    {locating ? (
                        <Loader className="animate-spin w-6 h-6 text-primary"/>
                    ) : (
                        <Navigation size={22} className="text-blue-600 fill-blue-50" />
                    )}
                </button>
            )}

            <div id={mapId.current} style={{ height: height, width: "100%", zIndex: 0 }} />
            
            {/* Center Hint (Hidden in ReadOnly) */}
            {!readOnly && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[999] opacity-0">
                     <Crosshair className="text-black/50 w-8 h-8" />
                </div>
            )}

            {/* Instruction Hint (Hidden in ReadOnly) */}
            {!readOnly && (
                <div className="absolute bottom-6 left-0 right-0 z-[1000] flex justify-center pointer-events-none">
                     <div className="bg-white/90 dark:bg-black/70 backdrop-blur text-gray-800 dark:text-white px-4 py-1.5 rounded-full text-xs font-medium shadow-lg border dark:border-gray-600">
                        Tap anywhere to pin location
                     </div>
                </div>
            )}
        </div>
    );
};
