import { apiRequest } from './brokerApi';
const options = { rawResponse: true };
export async function getFavorites(expectedSessionToken) {
  const response = await apiRequest('api/favorites', 'get', undefined, true, { ...options, expectedSessionToken });
  return response.favorites || [];
}
export async function addFavorite(projectId, expectedSessionToken) {
  return apiRequest('api/favorites', 'post', { projectId }, true, { ...options, expectedSessionToken });
}
export async function removeFavorite(projectId, expectedSessionToken) {
  return apiRequest(`api/favorites/${encodeURIComponent(projectId)}`, 'delete', undefined, true, { ...options, expectedSessionToken });
}
