export interface NeighborhoodInfo {
  name: string;
  centerLat: number;
  centerLng: number;
  description: string;
}

export const COIMBATORE_NEIGHBORHOODS: NeighborhoodInfo[] = [
  {
    name: "Gandhipuram",
    centerLat: 11.0168,
    centerLng: 76.9558,
    description: "Central commercial hub with high daily footfall and mixed commercial waste."
  },
  {
    name: "RS Puram",
    centerLat: 11.0084,
    centerLng: 76.9472,
    description: "Residential & shopping district with significant plastic packaging waste."
  },
  {
    name: "Peelamedu",
    centerLat: 11.0267,
    centerLng: 76.9982,
    description: "Educational & IT corridor generating high paper, electronic, and plastic waste."
  },
  {
    name: "Saibaba Colony",
    centerLat: 11.0315,
    centerLng: 76.9421,
    description: "Dense residential zone with high organic wet waste from households and markets."
  },
  {
    name: "Singanallur",
    centerLat: 10.9982,
    centerLng: 77.0210,
    description: "Industrial & transit terminal area with heavy mixed and recyclable packaging waste."
  },
  {
    name: "Ukkadam",
    centerLat: 10.9931,
    centerLng: 76.9602,
    description: "Major market and bus terminal sector with high organic vegetable & commercial waste."
  }
];

// Distance calculation helper (Haversine formula in KM)
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}
