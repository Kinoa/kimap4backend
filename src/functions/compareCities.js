// src/functions/compareCities.js
import { countAccessiblePlaces } from './countAccessible.js';

export async function compareCityCounts({ cityA, cityB }) {
  const [a,b] = await Promise.all([
    countAccessiblePlaces({ city: cityA }),
    countAccessiblePlaces({ city: cityB })
  ]);
  return { [cityA]: a.count, [cityB]: b.count };
}
