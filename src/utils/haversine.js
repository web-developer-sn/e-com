/**
 * Calculate the distance between two points on Earth using the Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};

const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Generate Haversine SQL for finding nearby locations
 * @param {string} tableName - Name of the table
 * @param {string} latColumn - Name of latitude column
 * @param {string} lonColumn - Name of longitude column
 * @returns {string} SQL fragment for distance calculation
 */
const getHaversineSQL = (tableName = 's', latColumn = 'latitude', lonColumn = 'longitude') => {
  return `(6371 * acos(
    cos(radians(?)) * cos(radians(${tableName}.${latColumn})) *
    cos(radians(${tableName}.${lonColumn}) - radians(?)) +
    sin(radians(?)) * sin(radians(${tableName}.${latColumn}))
  ))`;
};

/**
 * Build a query to find nearby locations using Haversine formula
 * @param {Object} knex - Knex query builder
 * @param {string} tableName - Name of the table
 * @param {number} lat - User's latitude
 * @param {number} lng - User's longitude
 * @param {number} radius - Search radius in kilometers
 * @param {Object} options - Additional options
 * @returns {Object} Knex query
 */
const buildNearbyQuery = (knex, tableName, lat, lng, radius, options = {}) => {
  const {
    latColumn = 'latitude',
    lonColumn = 'longitude',
    selectColumns = ['*'],
    additionalFilters = {}
  } = options;
  
  const distanceSQL = getHaversineSQL(tableName, latColumn, lonColumn);
  
  let query = knex(tableName)
    .select([
      ...selectColumns.map(col => `${tableName}.${col}`),
      knex.raw(`${distanceSQL} as distance_km`, [lat, lng, lat])
    ]);
  

  Object.entries(additionalFilters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query = query.where(`${tableName}.${key}`, value);
    }
  });
  

  query = query
    .havingRaw('distance_km <= ?', [radius])
    .orderBy('distance_km', 'asc');
  
  return query;
};

module.exports = {
  calculateDistance,
  getHaversineSQL,
  buildNearbyQuery
};

