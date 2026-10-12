import { FAVORITES_API, FAVORITE_API } from "./ApiHelper";
import { apiRequest } from './brokerApi';
const options = { rawResponse: true };
export async function getFavorites(expectedSessionToken) {
  const response = await apiRequest(FAVORITES_API, 'get', undefined, true, { ...options, expectedSessionToken });
  return response.favorites || [];
}
export async function addFavorite(projectId, expectedSessionToken) {
  return apiRequest(FAVORITES_API, 'post', { projectId }, true, { ...options, expectedSessionToken });
}
export async function removeFavorite(projectId, expectedSessionToken) {
  return apiRequest(FAVORITE_API(projectId), 'delete', undefined, true, { ...options, expectedSessionToken });
}
