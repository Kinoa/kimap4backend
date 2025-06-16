import { geocodePlaceName } from '../functions/geocodePlaceName';
import { findAccessiblePlacesNear } from '../functions/findNear';
import { countAccessiblePlaces } from '../functions/countAccessible';
import { buildAccessibleRoute } from '../functions/buildAccessibleRoute';
import { db } from '../firestore';
import { gemini } from '../gemini';

// Mock node-fetch
jest.mock('node-fetch', () => jest.fn());

// Mock firestore
jest.mock('../firestore', () => ({
  db: {
    collection: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      get: jest.fn()
    }))
  }
}));

// Mock findAccessiblePlacesNear
jest.mock('../functions/findNear', () => ({
  findAccessiblePlacesNear: jest.fn()
}));

// Mock gemini
jest.mock('../gemini', () => ({
  gemini: {
    generateContent: jest.fn()
  }
}));

describe('All Tests Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test per geocodePlaceName
  describe('geocodePlaceName', () => {
    it('should return coordinates for valid place', async () => {
      const mockResponse = {
        status: 'OK',
        results: [{
          geometry: {
            location: {
              lat: 45.4642,
              lng: 9.1900
            }
          },
          formatted_address: 'Milan, Italy'
        }]
      };

      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await geocodePlaceName({ text: 'Milan' });
      expect(result).toEqual({
        lat: 45.4642,
        lng: 9.1900,
        formatted_address: 'Milan, Italy'
      });
    });

    it('should handle invalid place', async () => {
      const mockResponse = {
        status: 'ZERO_RESULTS',
        results: []
      };

      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await geocodePlaceName({ text: 'InvalidPlace123' });
      expect(result).toBeNull();
    });

    it('should handle API errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('API Error'));
      await expect(geocodePlaceName({ text: 'Milan' })).rejects.toThrow('API Error');
    });
  });

  // Test per findAccessiblePlacesNear
  describe('findAccessiblePlacesNear', () => {
    it('should find places within radius', async () => {
      const mockDocs = [
        { data: () => ({ name: 'Place 1', latitude: 45.4642, longitude: 9.1900 }) },
        { data: () => ({ name: 'Place 2', latitude: 45.4643, longitude: 9.1901 }) }
      ];

      db.collection().get.mockResolvedValue({ docs: mockDocs });

      const result = await findAccessiblePlacesNear({
        lat: 45.4642,
        lng: 9.1900,
        radius_km: 0.5
      });

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Place 1');
    });

    it('should filter by category', async () => {
      const mockDocs = [
        { data: () => ({ name: 'Restaurant 1', category: 'restaurant' }) }
      ];

      db.collection().get.mockResolvedValue({ docs: mockDocs });

      await findAccessiblePlacesNear({
        lat: 45.4642,
        lng: 9.1900,
        category: 'restaurant'
      });

      expect(db.collection().where).toHaveBeenCalledWith('category', '==', 'restaurant');
    });

    it('should respect limit parameter', async () => {
      const mockDocs = [
        { data: () => ({ name: 'Place 1' }) }
      ];

      db.collection().get.mockResolvedValue({ docs: mockDocs });

      await findAccessiblePlacesNear({
        lat: 45.4642,
        lng: 9.1900,
        limit: 1
      });

      expect(db.collection().limit).toHaveBeenCalledWith(1);
    });
  });

  // Test per countAccessiblePlaces
  describe('countAccessiblePlaces', () => {
    it('should count places in city', async () => {
      const mockCountResponse = {
        data: () => ({ count: 42 })
      };

      db.collection().get.mockResolvedValue(mockCountResponse);

      const result = await countAccessiblePlaces({
        city: 'Milan'
      });

      expect(result).toEqual({ count: 42 });
    });

    it('should count places with category filter', async () => {
      const mockCountResponse = {
        data: () => ({ count: 15 })
      };

      db.collection().get.mockResolvedValue(mockCountResponse);

      const result = await countAccessiblePlaces({
        city: 'Milan',
        category: 'restaurant'
      });

      expect(result).toEqual({ count: 15 });
    });
  });

  // Test per buildAccessibleRoute
  describe('buildAccessibleRoute', () => {
    it('should build route with nearest places', async () => {
      const mockPlaces = [
        { id: '1', name: 'Place 1', latitude: 45.4642, longitude: 9.1900 },
        { id: '2', name: 'Place 2', latitude: 45.4643, longitude: 9.1901 }
      ];

      findAccessiblePlacesNear.mockResolvedValue(mockPlaces);

      const result = await buildAccessibleRoute({
        start_lat: 45.4641,
        start_lng: 9.1899,
        city: 'Milan',
        category: 'bar',
        stops: 2
      });

      expect(result.route).toHaveLength(2);
      expect(result.route[0].name).toBe('Place 1');
    });

    it('should return empty route when no places found', async () => {
      findAccessiblePlacesNear.mockResolvedValue([]);

      const result = await buildAccessibleRoute({
        start_lat: 45.4641,
        start_lng: 9.1899,
        city: 'Milan'
      });

      expect(result).toEqual({ route: [] });
    });

    it('should respect maximum stops', async () => {
      const mockPlaces = Array(10).fill(null).map((_, i) => ({
        id: String(i + 1),
        name: `Place ${i + 1}`,
        latitude: 45.4642 + i * 0.0001,
        longitude: 9.1900 + i * 0.0001
      }));

      findAccessiblePlacesNear.mockResolvedValue(mockPlaces);

      const result = await buildAccessibleRoute({
        start_lat: 45.4641,
        start_lng: 9.1899,
        city: 'Milan',
        stops: 3
      });

      expect(result.route).toHaveLength(3);
    });
  });

  // Test per Database Operations
  describe('Database Operations', () => {
    it('should read first document', async () => {
      const mockDoc = {
        data: () => ({
          name: 'Test Place',
          city: 'Milan'
        })
      };

      db.collection().get.mockResolvedValue({
        empty: false,
        docs: [mockDoc]
      });

      const firstSnap = await db.collection('places').limit(1).get();
      expect(firstSnap.empty).toBe(false);
      expect(firstSnap.docs[0].data()).toEqual({
        name: 'Test Place',
        city: 'Milan'
      });
    });

    it('should handle empty collection', async () => {
      db.collection().get.mockResolvedValue({
        empty: true,
        docs: []
      });

      const firstSnap = await db.collection('places').limit(1).get();
      expect(firstSnap.empty).toBe(true);
    });

    it('should count documents', async () => {
      const mockCountResponse = {
        data: () => ({ count: 100 })
      };

      db.collection().get.mockResolvedValue(mockCountResponse);

      const countSnap = await db.collection('places').count().get();
      expect(countSnap.data().count).toBe(100);
    });
  });

  // Test per Gemini AI
  describe('Gemini AI Integration', () => {
    it('should generate content successfully', async () => {
      const mockResponse = {
        response: {
          candidates: [{
            content: {
              parts: [{
                text: 'La Primavera è stata dipinta da Sandro Botticelli.'
              }]
            }
          }]
        }
      };

      gemini.generateContent.mockResolvedValue(mockResponse);

      const request = {
        contents: [{
          role: 'user',
          parts: [{ text: 'Chi ha dipinto la Primavera di Botticelli? Rispondi in italiano.' }]
        }]
      };

      const result = await gemini.generateContent(request);
      expect(result.response.candidates[0].content.parts[0].text)
        .toBe('La Primavera è stata dipinta da Sandro Botticelli.');
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        response: {
          candidates: []
        }
      };

      gemini.generateContent.mockResolvedValue(mockResponse);

      const request = {
        contents: [{
          role: 'user',
          parts: [{ text: 'Test question' }]
        }]
      };

      const result = await gemini.generateContent(request);
      expect(result.response.candidates).toHaveLength(0);
    });

    it('should handle error response', async () => {
      gemini.generateContent.mockRejectedValue(new Error('API Error'));

      const request = {
        contents: [{
          role: 'user',
          parts: [{ text: 'Test question' }]
        }]
      };

      await expect(gemini.generateContent(request)).rejects.toThrow('API Error');
    });

    it('should handle malformed response', async () => {
      const mockResponse = {
        response: {
          candidates: [{
            content: {
              parts: []
            }
          }]
        }
      };

      gemini.generateContent.mockResolvedValue(mockResponse);

      const request = {
        contents: [{
          role: 'user',
          parts: [{ text: 'Test question' }]
        }]
      };

      const result = await gemini.generateContent(request);
      expect(result.response.candidates[0].content.parts).toHaveLength(0);
    });
  });
}); 