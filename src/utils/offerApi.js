import { OFFERS_API, OFFER_DETAIL_API } from "./ApiHelper";
import { apiRequest } from "./brokerApi";
import { resolveMediaUrl } from "./mediaUrl";
import { downloadDocument } from "./documentFiles";

export async function getOffers(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.append("page", String(params.page));
  if (params.limit) query.append("limit", String(params.limit));
  const queryString = query.toString();
  const url = queryString ? `${OFFERS_API}?${queryString}` : OFFERS_API;

  try {
    const res = await apiRequest(url, "get", undefined, true, { rawResponse: true });
    return extractOffersList(res);
  } catch (error) {
    if (
      error?.message?.includes("session has expired") ||
      error?.response?.status === 401
    ) {
      try {
        const res = await apiRequest(url, "get", undefined, false, { rawResponse: true });
        return extractOffersList(res);
      } catch (_fallbackError) {
        throw error;
      }
    }
    throw error;
  }
}

function extractOffersList(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.offers)) return res.data.offers;
  if (Array.isArray(res?.offers)) return res.offers;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  if (Array.isArray(res?.items)) return res.items;
  return [];
}

export function getOfferById(id) {
  return apiRequest(OFFER_DETAIL_API(id), "get", undefined, true);
}

export async function downloadOfferFile(offer) {
  if (!offer?.pdfUrl) {
    throw new Error("No PDF brochure available for this offer.");
  }
  const fullUrl = resolveMediaUrl(offer.pdfUrl);
  return downloadDocument(fullUrl, offer.title || "Offer Brochure");
}
