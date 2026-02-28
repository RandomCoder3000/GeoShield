import { prisma } from '@/lib/prisma';

// 3 decimal places is roughly 111 meters at the equator
const LOCATION_ROUNDING_FACTOR = 1000; 

export class GeoService {
  /**
   * Rounds coordinates for privacy-safe public broadcasting.
   */
  static roundCoordinates(lat: number, lng: number) {
    return {
      lat: Math.round(lat * LOCATION_ROUNDING_FACTOR) / LOCATION_ROUNDING_FACTOR,
      lng: Math.round(lng * LOCATION_ROUNDING_FACTOR) / LOCATION_ROUNDING_FACTOR,
    };
  }

  /**
   * Checks if a point falls within any active restricted geofences using PostGIS.
   * Returns true if the location is safe (no intersections).
   */
  static async isLocationSafe(lat: number, lng: number): Promise<boolean> {
    // ST_Intersects checks if our Point touches any restricted Polygon in the DB
    const intersections = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "GeofenceRule"
      WHERE "isActive" = true
      AND ST_Intersects(
        boundary, 
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      )
      LIMIT 1;
    `;

    return intersections.length === 0;
  }
}
