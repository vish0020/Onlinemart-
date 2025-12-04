
export const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjExN2U3ZjBjYzljMzRjYTI4NDFlMTNlY2Q1ZmVjMDJjIiwiaCI6Im11cm11cjY0In0="; 

// Fallback store location (e.g. Center of India or a specific city)
export const DEFAULT_STORE_LOCATION = {
    lat: 23.0225, // Ahmedabad
    lng: 72.5714
};

export const DEFAULT_SETTINGS = {
    baseCharge: 50,
    perKmCharge: 10,
    freeDeliveryAbove: 1000,
    codEnabled: true,
    estimatedDays: "3-5 days",
    serviceablePincodes: [],
    storeLocation: DEFAULT_STORE_LOCATION
};
