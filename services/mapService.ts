
import { Location } from '../types';
import { ORS_API_KEY } from '../constants';

// Helper to extract a usable key from the provided token if it's a JWT/Base64 string
const getOrsKey = () => {
    if (ORS_API_KEY.includes("YOUR_ORS_API_KEY")) return null;
    
    // Check if it's the base64 JSON token provided by the user
    if (ORS_API_KEY.startsWith("eyJ")) {
        try {
            const decoded = JSON.parse(atob(ORS_API_KEY));
            if (decoded.org && decoded.id) {
                return decoded.org; 
            }
        } catch (e) {
            // If decode fails, treat the whole string as the key
            return ORS_API_KEY;
        }
    }
    return ORS_API_KEY;
};

// Calculate driving distance using OpenRouteService
export const calculateDrivingDistance = async (start: Location, end: Location) => {
    if (!start || !end) return 0;
    
    const key = getOrsKey();

    if (!key) {
        console.warn("Using Haversine Fallback. Please set valid ORS_API_KEY in constants.ts");
        return calculateHaversineDistance(start, end);
    }

    try {
        const response = await fetch(`https://api.openrouteservice.org/v2/directions/driving-car?api_key=${key}&start=${start.lng},${start.lat}&end=${end.lng},${end.lat}`);
        
        if (!response.ok) {
            throw new Error(`ORS API Error: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.features && data.features.length > 0) {
            const distanceMeters = data.features[0].properties.segments[0].distance;
            return parseFloat((distanceMeters / 1000).toFixed(2)); // Return in KM
        }
        throw new Error("No route found");
    } catch (error) {
        console.error("Distance Calculation Error:", error);
        return calculateHaversineDistance(start, end); // Fallback
    }
};

// Search places using Nominatim (OpenStreetMap) - Free, no key needed
export const searchPlace = async (query: string): Promise<Location | null> => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }
        return null;
    } catch (error) {
        console.error("Geocoding Error:", error);
        return null;
    }
};

interface AddressResult {
    road?: string;
    house_number?: string;
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
    suburb?: string;
    neighbourhood?: string;
    town?: string;
    village?: string;
}

// Reverse Geocode (Get address from Lat/Lng)
export const reverseGeocode = async (lat: number, lng: number): Promise<AddressResult | null> => {
    const key = getOrsKey();
    
    // Try OpenRouteService first if key is available
    if (key) {
        try {
            const response = await fetch(`https://api.openrouteservice.org/geocode/reverse?api_key=${key}&point.lon=${lng}&point.lat=${lat}&size=1`);
            if (response.ok) {
                const data = await response.json();
                if (data.features && data.features.length > 0) {
                    const props = data.features[0].properties;
                    return {
                        road: props.street,
                        house_number: props.housenumber,
                        postcode: props.postalcode,
                        city: props.locality || props.county,
                        state: props.region,
                        country: props.country,
                        suburb: props.neighbourhood,
                        neighbourhood: props.neighbourhood,
                        town: props.locality,
                        village: props.locality
                    };
                }
            }
        } catch (error) {
            console.warn("ORS Reverse Geocode failed, falling back to Nominatim", error);
        }
    }

    // Fallback to Nominatim
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await response.json();
        return data.address; // Returns object with road, city, state, postcode, etc.
    } catch (error) {
        console.error("Nominatim Reverse Geocode Error:", error);
        return null;
    }
};

// Fallback Distance Calculator (Haversine Formula)
export const calculateHaversineDistance = (loc1: Location, loc2: Location): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(loc2.lat - loc1.lat);
    const dLng = deg2rad(loc2.lng - loc1.lng);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(loc1.lat)) * Math.cos(deg2rad(loc2.lat)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return parseFloat(d.toFixed(2));
};

const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
};
