import { describe, it, expect } from 'vitest';
import { GeoService } from '../server/geo.service';

describe('GeoService', () => {
  describe('roundCoordinates', () => {
    it('should round coordinates to 3 decimal places for privacy', () => {
      const exactLat = 40.712776;
      const exactLng = -74.005974;

      const rounded = GeoService.roundCoordinates(exactLat, exactLng);

      expect(rounded.lat).toBe(40.713);
      expect(rounded.lng).toBe(-74.006);
    });

    it('should handle negative numbers correctly', () => {
      const rounded = GeoService.roundCoordinates(-33.86882, -151.20929);
      
      expect(rounded.lat).toBe(-33.869);
      expect(rounded.lng).toBe(-151.209);
    });

    it('should handle whole numbers without adding decimals', () => {
      const rounded = GeoService.roundCoordinates(40, -74);
      
      expect(rounded.lat).toBe(40);
      expect(rounded.lng).toBe(-74);
    });
  });
});
