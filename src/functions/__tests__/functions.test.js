import { geocodePlaceName } from '../geocodePlaceName';
import { findAccessiblePlacesNear } from '../findNear';
import { countAccessiblePlaces } from '../countAccessible';
import { buildAccessibleRoute } from '../buildAccessibleRoute';
import { db } from '../../firestore';
import { gemini } from '../../gemini';

// Mock node-fetch
jest.mock('node-fetch', () => jest.fn());

// Mock firestore
jest.mock('../../firestore', () => ({
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
jest.mock('../findNear', () => ({
  findAccessiblePlacesNear: jest.fn()
}));

// Mock gemini
jest.mock('../../gemini', () => ({
  gemini: {
    generateContent: jest.fn()
  }
}));

describe('Geocoding Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('geocodePlaceName', () => {
    it('should return coordinates and formatted address for valid place', async () => {
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

    it('should return null for invalid place', async () => {
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
  });

  describe('findAccessiblePlacesNear', () => {
    it('should find accessible places within radius', async () => {
      const mockDocs = [
        { data: () => ({ name: 'Place 1', latitude: 45.4642, longitude: 9.1900 }) },
        { data: () => ({ name: 'Place 2', latitude: 45.4643, longitude: 9.1901 }) }
      ];

      const mockQuerySnapshot = {
        docs: mockDocs
      };

      db.collection().get.mockResolvedValue(mockQuerySnapshot);

      const result = await findAccessiblePlacesNear({
        lat: 45.4642,
        lng: 9.1900,
        radius_km: 0.5,
        category: 'restaurant'
      });

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Place 1');
      expect(result[1].name).toBe('Place 2');
    });

    it('should apply category filter when provided', async () => {
      const mockDocs = [
        { data: () => ({ name: 'Restaurant 1', category: 'restaurant' }) }
      ];

      const mockQuerySnapshot = {
        docs: mockDocs
      };

      db.collection().get.mockResolvedValue(mockQuerySnapshot);

      await findAccessiblePlacesNear({
        lat: 45.4642,
        lng: 9.1900,
        category: 'restaurant'
      });

      const whereCalls = db.collection().where.mock.calls;
      expect(whereCalls).toContainEqual(['category', '==', 'restaurant']);
    });

    it('should apply limit when provided', async () => {
      const mockDocs = [
        { data: () => ({ name: 'Place 1' }) }
      ];

      const mockQuerySnapshot = {
        docs: mockDocs
      };

      db.collection().get.mockResolvedValue(mockQuerySnapshot);

      await findAccessiblePlacesNear({
        lat: 45.4642,
        lng: 9.1900,
        limit: 1
      });

      expect(db.collection().limit).toHaveBeenCalledWith(1);
    });
  });
});

describe('Count Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('countAccessiblePlaces', () => {
    it('should count accessible places in a city', async () => {
      const mockCountResponse = {
        data: () => ({ count: 42 })
      };

      db.collection().get.mockResolvedValue(mockCountResponse);

      const result = await countAccessiblePlaces({
        city: 'Milan'
      });

      expect(result).toEqual({ count: 42 });
      expect(db.collection().where).toHaveBeenCalledWith('city', '==', 'Milan');
      expect(db.collection().where).toHaveBeenCalledWith('wheelchair', '==', 'yes');
    });

    it('should count accessible places in a city with category filter', async () => {
      const mockCountResponse = {
        data: () => ({ count: 15 })
      };

      db.collection().get.mockResolvedValue(mockCountResponse);

      const result = await countAccessiblePlaces({
        city: 'Milan',
        category: 'restaurant'
      });

      expect(result).toEqual({ count: 15 });
      expect(db.collection().where).toHaveBeenCalledWith('category', '==', 'restaurant');
    });

    it('should handle empty results', async () => {
      const mockCountResponse = {
        data: () => ({ count: 0 })
      };

      db.collection().get.mockResolvedValue(mockCountResponse);

      const result = await countAccessiblePlaces({
        city: 'SmallTown'
      });

      expect(result).toEqual({ count: 0 });
    });
  });
});

describe('Route Building Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildAccessibleRoute', () => {
    it('should build a route with nearest places', async () => {
      const mockPlaces = [
        { id: '1', name: 'Place 1', latitude: 45.4642, longitude: 9.1900 },
        { id: '2', name: 'Place 2', latitude: 45.4643, longitude: 9.1901 },
        { id: '3', name: 'Place 3', latitude: 45.4644, longitude: 9.1902 }
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
      expect(result.route[1].name).toBe('Place 2');
      expect(findAccessiblePlacesNear).toHaveBeenCalledWith({
        category: 'bar',
        lat: 45.4641,
        lng: 9.1899,
        radius_km: 1,
        limit: 20
      });
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

    it('should respect the maximum number of stops', async () => {
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
});

describe('Database Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('testDB functionality', () => {
    it('should read first document from places collection', async () => {
      const mockDoc = {
        data: () => ({
          name: 'Test Place',
          city: 'Milan'
        })
      };

      const mockQuerySnapshot = {
        empty: false,
        docs: [mockDoc]
      };

      db.collection().get.mockResolvedValue(mockQuerySnapshot);

      const firstSnap = await db.collection('places').limit(1).get();
      
      expect(firstSnap.empty).toBe(false);
      expect(firstSnap.docs[0].data()).toEqual({
        name: 'Test Place',
        city: 'Milan'
      });
    });

    it('should handle empty places collection', async () => {
      const mockQuerySnapshot = {
        empty: true,
        docs: []
      };

      db.collection().get.mockResolvedValue(mockQuerySnapshot);

      const firstSnap = await db.collection('places').limit(1).get();
      
      expect(firstSnap.empty).toBe(true);
    });

    it('should count total documents in places collection', async () => {
      const mockCountResponse = {
        data: () => ({ count: 100 })
      };

      db.collection().get.mockResolvedValue(mockCountResponse);

      const countSnap = await db.collection('places').count().get();
      
      expect(countSnap.data().count).toBe(100);
    });
  });
});

describe('Gemini Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('testGemini functionality', () => {
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
      const response = result.response;

      expect(response.candidates[0].content.parts[0].text)
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
      const response = result.response;

      expect(response.candidates).toHaveLength(0);
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
  });
}); 