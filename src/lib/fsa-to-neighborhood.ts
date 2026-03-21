/**
 * Maps each Vancouver FSA to its City of Vancouver local area (neighbourhood) name.
 *
 * Derived via point-in-polygon intersection of FSA centroids against the official
 * City of Vancouver local-area-boundary GeoJSON (opendata.vancouver.ca).
 *
 * FSAs outside city limits (V6G, V6R, V6T) are assigned to the nearest area.
 */
export const FSA_TO_NEIGHBORHOOD: Record<string, string> = {
  V5K: 'Hastings-Sunrise',
  V5L: 'Hastings-Sunrise',
  V5M: 'Hastings-Sunrise',
  V5N: 'Kensington-Cedar Cottage',
  V5P: 'Victoria-Fraserview',
  V5R: 'Killarney',
  V5S: 'Killarney',
  V5T: 'Riley Park',
  V5V: 'Riley Park',
  V5W: 'Sunset',
  V5X: 'Sunset',
  V5Y: 'South Cambie',
  V5Z: 'Fairview',
  V6A: 'Strathcona',
  V6B: 'Downtown',
  V6C: 'Downtown',
  V6E: 'West End',
  V6G: 'West End',
  V6H: 'Shaughnessy',
  V6J: 'Shaughnessy',
  V6K: 'Kitsilano',
  V6L: 'Arbutus Ridge',
  V6M: 'Arbutus Ridge',
  V6N: 'Kerrisdale',
  V6P: 'Marpole',
  V6R: 'Kitsilano',
  V6S: 'Kitsilano',
  V6T: 'West Point Grey',
};
